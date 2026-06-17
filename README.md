# RAG Studio

> Plataforma SaaS para crear asistentes IA con tus propios datos.

## Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Framer Motion + Zustand
- **Backend**: Node.js + TypeScript + Express (API Gateway)
- **IA/RAG**: n8n (procesamiento externo via webhooks)
- **PWA**: Instalable como app móvil/escritorio

## Inicio rápido

### 1. Setup inicial

Doble click en `setup.bat` o desde terminal:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar n8n (opcional — funciona en modo demo sin esto)

Edita `backend/.env`:

```env
N8N_CREATE_RAG_WEBHOOK=https://tu-n8n.com/webhook/create-rag
N8N_QUERY_RAG_WEBHOOK=https://tu-n8n.com/webhook/query-rag
```

### 3. Iniciar

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

O doble click en `start-dev.bat` para abrir ambos en ventanas separadas.

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## Estructura del proyecto

```
rag-studio/
├── backend/src/index.ts        # API Gateway Express
├── frontend/src/
│   ├── pages/                  # OnboardingPage, DashboardPage, ChatPage
│   ├── components/onboarding/  # Wizard 3 pasos animado
│   ├── components/dashboard/   # Cards de asistentes
│   ├── components/chat/        # Interfaz de chat
│   ├── components/effects/     # Partículas y diagrama de flujo
│   ├── store/                  # Zustand con persistencia
│   └── lib/api.ts              # Cliente HTTP
└── setup.bat / start-dev.bat   # Scripts de inicio
```

## API

| Endpoint | Payload |
|----------|---------|
| `POST /api/create-rag` | `{ name, sourceType, url?, databaseType?, credentials? }` |
| `POST /api/chat` | `{ ragId, question, conversationHistory? }` |

**Modo demo**: sin variables de entorno configuradas, el backend simula respuestas realistas.
