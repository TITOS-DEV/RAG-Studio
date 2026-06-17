import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import dotenv from 'dotenv';
import axios from 'axios';
import { extractPostgres, extractMySQL, extractMongoDB, extractSupabase } from './dbExtractor';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  'http://localhost:5173',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((s) => s.trim()).filter(Boolean)
    : []),
];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
};

// CORS must be registered before helmet so preflight OPTIONS requests
// get the Access-Control-Allow-Origin header before any other middleware runs.
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/csv',
      'application/json',
    ];
    const extAllowed = /\.(pdf|txt|md|docx|csv|json)$/i.test(file.originalname);
    if (allowed.includes(file.mimetype) || extAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.originalname}`));
    }
  },
});

function demoRagId() {
  return `rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// ─── Health ────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mode: process.env.N8N_CREATE_RAG_WEBHOOK ? 'production' : 'demo',
  });
});

// ─── Create RAG (URL / Database / Supabase) ────────────────────────────────

app.post('/api/create-rag', async (req, res) => {
  const { name, sourceType, url, databaseType, credentials, supabaseUrl, supabaseKey, tableName, columns } = req.body;

  if (!name || !sourceType) {
    return res.status(400).json({ error: 'name y sourceType son requeridos' });
  }

  const webhookUrl = process.env.N8N_CREATE_RAG_WEBHOOK;

  if (!webhookUrl) {
    return res.json({
      success: true,
      ragId: demoRagId(),
      name,
      sourceType,
      status: 'ready',
      message: 'Asistente creado en modo demo',
      createdAt: new Date().toISOString(),
    });
  }

  try {
    // Normalize supabase → database so n8n router handles both with one branch
    const n8nSourceType = sourceType === 'supabase' ? 'database' : sourceType;
    const payload: Record<string, unknown> = { name, sourceType: n8nSourceType };

    if (sourceType === 'url') {
      payload.url = url;
    }

    if (sourceType === 'database') {
      if (!credentials?.host) {
        return res.status(400).json({ error: 'Credenciales de base de datos incompletas' });
      }
      console.log(`[create-rag] Extrayendo datos de ${databaseType}...`);
      let records;
      if (databaseType === 'postgresql') records = await extractPostgres(credentials);
      else if (databaseType === 'mysql') records = await extractMySQL(credentials);
      else if (databaseType === 'mongodb') records = await extractMongoDB(credentials);
      else return res.status(400).json({ error: `Motor no soportado: ${databaseType}` });

      payload.databaseType = databaseType;
      payload.records = records;
      payload.recordCount = records.length;
      console.log(`[create-rag] ${records.length} registros extraídos`);
    }

    if (sourceType === 'supabase') {
      if (!supabaseUrl || !supabaseKey) {
        return res.status(400).json({ error: 'supabaseUrl y supabaseKey son requeridos' });
      }
      console.log('[create-rag] Extrayendo datos de Supabase...');
      const records = await extractSupabase(supabaseUrl, supabaseKey, tableName, columns);
      payload.records = records;
      payload.recordCount = records.length;
      payload.tableName = tableName;
      console.log(`[create-rag] ${records.length} registros extraídos de Supabase`);
    }

    const response = await axios.post(webhookUrl, payload, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });

    return res.json(response.data);
  } catch (error: any) {
    console.error('[create-rag] error:', error?.message || error);
    const isDbError = error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT' || error?.errno;
    return res.status(isDbError ? 400 : 502).json({
      error: isDbError
        ? `No se pudo conectar a la base de datos: ${error.message}`
        : 'Error conectando con el servicio de procesamiento',
    });
  }
});

// ─── Upload RAG (Documentos) ───────────────────────────────────────────────

app.post('/api/upload-rag', upload.array('files', 10), async (req, res) => {
  const { name } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!name) return res.status(400).json({ error: 'name es requerido' });
  if (!files || files.length === 0) return res.status(400).json({ error: 'Se requiere al menos un archivo' });

  const webhookUrl = process.env.N8N_UPLOAD_RAG_WEBHOOK || process.env.N8N_CREATE_RAG_WEBHOOK;
  const sharedRagId = demoRagId();

  if (!webhookUrl) {
    return res.json({
      success: true,
      ragId: sharedRagId,
      name,
      sourceType: 'documents',
      status: 'ready',
      message: `${files.length} documento(s) procesados en modo demo`,
      createdAt: new Date().toISOString(),
    });
  }

  // Respond immediately — PDF processing in n8n can take several minutes.
  // Fire-and-forget so the client never times out waiting for n8n.
  res.json({
    success: true,
    ragId: sharedRagId,
    name,
    sourceType: 'documents',
    status: 'processing',
    message: `${files.length} documento(s) enviados para indexación`,
    createdAt: new Date().toISOString(),
  });

  // Process in background after the response is already sent
  (async () => {
    for (const file of files) {
      const ext = file.originalname.split('.').pop()?.toLowerCase() ?? '';
      const fileType = ext === 'pdf' ? 'pdf' : 'text';

      const payload = {
        name,
        sourceType: 'file',
        fileType,
        ragId: sharedRagId,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileData: file.buffer.toString('base64'),
      };

      console.log(`[upload-rag] Background: enviando ${file.originalname} (${fileType}) a n8n...`);

      try {
        await axios.post(webhookUrl, payload, {
          timeout: 300000,
          headers: { 'Content-Type': 'application/json' },
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });
        console.log(`[upload-rag] Background: ${file.originalname} procesado correctamente`);
      } catch (error: any) {
        console.error(`[upload-rag] Background error (${file.originalname}):`, error?.message);
        console.error('[upload-rag] n8n status:', error?.response?.status);
        console.error('[upload-rag] n8n response:', JSON.stringify(error?.response?.data, null, 2));
      }
    }
  })();
});

// ─── Chat ──────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { ragId, question, conversationHistory } = req.body;

  if (!ragId || !question) {
    return res.status(400).json({ error: 'ragId y question son requeridos' });
  }

  const webhookUrl = process.env.N8N_QUERY_RAG_WEBHOOK;

  if (!webhookUrl) {
    const demoResponses = [
      'Basándome en la información disponible, puedo ayudarte con esa consulta. Esta respuesta es generada en modo demo para mostrar las capacidades del sistema RAG.',
      'Excelente pregunta. Según los datos procesados, el sistema puede proporcionar información relevante y contextualizada sobre este tema.',
      'He analizado tu consulta y encontré información relevante en la base de conocimiento. En producción, esta respuesta vendría directamente de tus documentos indexados.',
    ];
    return res.json({
      answer: demoResponses[Math.floor(Math.random() * demoResponses.length)],
      sources: ['demo-document-1.pdf', 'demo-page.html'],
      confidence: 0.92,
      ragId,
    });
  }

  try {
    const payload = {
      ragId,
      question,
      conversationHistory: conversationHistory || [],
    };
    console.log('[chat] sending to n8n:', JSON.stringify(payload));

    const response = await axios.post(webhookUrl, payload, {
      timeout: 60000,
      headers: { 'Content-Type': 'application/json' },
    });

    return res.json(response.data);
  } catch (error: any) {
    console.error('[chat] n8n status:', error?.response?.status);
    console.error('[chat] n8n response:', JSON.stringify(error?.response?.data));
    return res.status(502).json({
      error: 'Error consultando el asistente',
      n8nError: error?.response?.data,
    });
  }
});

// ─── 404 ───────────────────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  console.log(`\n🚀 RAG Studio API  →  http://localhost:${PORT}`);
  console.log(`Mode: ${process.env.N8N_CREATE_RAG_WEBHOOK ? '✅ n8n conectado' : '🟡 Demo (sin webhooks)'}`);
  console.log(`Upload webhook: ${process.env.N8N_UPLOAD_RAG_WEBHOOK ? '✅' : process.env.N8N_CREATE_RAG_WEBHOOK ? '↩️  usando create-rag' : '🟡 demo'}\n`);
});
