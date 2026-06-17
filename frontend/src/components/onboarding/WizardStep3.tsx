import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Globe, Database, Loader2, CheckCircle2, XCircle,
  Server, Lock, User, Hash, Zap, FileText, Upload, X, File,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { createRag, uploadRag } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { toast } from '@/hooks/useToast';
import type { SourceType, DatabaseType, DatabaseCredentials, SupabaseCredentials } from '@/types';

interface Props {
  onBack: () => void;
  onDone: () => void;
}

type CreationPhase = 'idle' | 'uploading' | 'analyzing' | 'embedding' | 'done' | 'error';

const DB_OPTIONS: { value: DatabaseType; label: string; icon: string }[] = [
  { value: 'postgresql', label: 'PostgreSQL', icon: '🐘' },
  { value: 'mysql', label: 'MySQL', icon: '🐬' },
  { value: 'mongodb', label: 'MongoDB', icon: '🍃' },
];

const ACCEPTED_TYPES = '.pdf,.txt,.md,.docx,.csv,.json';
const MAX_FILE_SIZE_MB = 20;
const MAX_FILES = 10;

const SOURCE_CARDS: {
  value: SourceType;
  icon: React.ElementType;
  label: string;
  desc: string;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    value: 'url',
    icon: Globe,
    label: 'Sitio Web',
    desc: 'URL / Docs',
    color: 'text-violet-300',
    border: 'border-violet-500/50 bg-violet-500/10',
    bg: 'hover:border-violet-500/30 hover:bg-violet-500/5',
  },
  {
    value: 'database',
    icon: Database,
    label: 'Database',
    desc: 'SQL / NoSQL',
    color: 'text-blue-300',
    border: 'border-blue-500/50 bg-blue-500/10',
    bg: 'hover:border-blue-500/30 hover:bg-blue-500/5',
  },
  {
    value: 'supabase',
    icon: Zap,
    label: 'Supabase',
    desc: 'PostgreSQL cloud',
    color: 'text-emerald-300',
    border: 'border-emerald-500/50 bg-emerald-500/10',
    bg: 'hover:border-emerald-500/30 hover:bg-emerald-500/5',
  },
  {
    value: 'documents',
    icon: FileText,
    label: 'Documentos',
    desc: 'PDF, TXT, DOCX…',
    color: 'text-amber-300',
    border: 'border-amber-500/50 bg-amber-500/10',
    bg: 'hover:border-amber-500/30 hover:bg-amber-500/5',
  },
];

const PHASES: { key: CreationPhase; label: string; color: string; progress: number }[] = [
  { key: 'uploading', label: 'Subiendo archivos...', color: 'text-amber-400', progress: 25 },
  { key: 'analyzing', label: 'Analizando información...', color: 'text-blue-400', progress: 55 },
  { key: 'embedding', label: 'Creando embeddings...', color: 'text-violet-400', progress: 80 },
  { key: 'done', label: '¡Asistente listo!', color: 'text-emerald-400', progress: 100 },
];

function formatBytes(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export function WizardStep3({ onBack, onDone }: Props) {
  const [name, setName] = useState('');
  const [sourceType, setSourceType] = useState<SourceType>('url');
  const [url, setUrl] = useState('');
  const [dbType, setDbType] = useState<DatabaseType>('postgresql');
  const [credentials, setCredentials] = useState<DatabaseCredentials>({
    host: '', database: '', user: '', password: '', port: '',
  });
  const [supabase, setSupabase] = useState<SupabaseCredentials>({
    supabaseUrl: '', supabaseKey: '', tableName: '', columns: '',
  });
  const [files, setFiles] = useState<File[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [phase, setPhase] = useState<CreationPhase>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { addAssistant } = useAppStore();

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return;
    const valid = Array.from(incoming).filter((f) => {
      if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
        toast({ title: `${f.name} supera ${MAX_FILE_SIZE_MB}MB`, variant: 'destructive' });
        return false;
      }
      return true;
    });
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      if (combined.length > MAX_FILES) {
        toast({ title: `Máximo ${MAX_FILES} archivos`, variant: 'destructive' });
        return combined.slice(0, MAX_FILES);
      }
      return combined;
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const startPhases = (isDocuments: boolean) => {
    if (isDocuments) {
      setPhase('uploading');
      setTimeout(() => setPhase('analyzing'), 1500);
      setTimeout(() => setPhase('embedding'), 3500);
    } else {
      setPhase('analyzing');
      setTimeout(() => setPhase('embedding'), 2000);
    }
  };

  const onSuccess = (data: any) => {
    // Always use local form values — n8n may return different/missing fields
    const ragId = data?.ragId || `rag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setTimeout(() => {
      setPhase('done');
      addAssistant({
        id: ragId,
        name: name.trim(),
        sourceType,                                              // local value, always correct
        url: sourceType === 'url' ? url : undefined,
        databaseType: sourceType === 'database' ? dbType : undefined,
        fileNames: sourceType === 'documents' ? files.map((f) => f.name) : undefined,
        status: 'ready',
        createdAt: data?.createdAt || new Date().toISOString(),
        messageCount: 0,
      });
      setTimeout(onDone, 1500);
    }, 1500);
  };

  const onError = () => {
    setPhase('error');
    toast({ title: 'Error al crear asistente', description: 'Verifica los datos e intenta de nuevo', variant: 'destructive' });
  };

  const jsonMutation = useMutation({
    mutationFn: createRag,
    onMutate: () => startPhases(false),
    onSuccess,
    onError,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ name, files }: { name: string; files: File[] }) => uploadRag(name, files),
    onMutate: () => startPhases(true),
    onSuccess,
    onError,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'Nombre requerido', description: 'Ingresa un nombre para el asistente' });
      return;
    }

    if (sourceType === 'documents') {
      if (files.length === 0) {
        toast({ title: 'Sin archivos', description: 'Agrega al menos un documento' });
        return;
      }
      uploadMutation.mutate({ name: name.trim(), files });
      return;
    }

    if (sourceType === 'url' && !url.trim()) {
      toast({ title: 'URL requerida', description: 'Ingresa la URL del sitio web' });
      return;
    }

    if (sourceType === 'supabase') {
      if (!supabase.supabaseUrl.trim()) {
        toast({ title: 'URL de Supabase requerida' });
        return;
      }
      if (!supabase.tableName.trim()) {
        toast({ title: 'Nombre de tabla requerido', description: 'Ingresa el nombre de la tabla a indexar' });
        return;
      }
    }

    jsonMutation.mutate({
      name: name.trim(),
      sourceType,
      url: sourceType === 'url' ? url : undefined,
      databaseType: sourceType === 'database' ? dbType : undefined,
      credentials: sourceType === 'database' ? credentials : undefined,
      supabaseUrl: sourceType === 'supabase' ? supabase.supabaseUrl : undefined,
      supabaseKey: sourceType === 'supabase' ? supabase.supabaseKey : undefined,
      tableName: sourceType === 'supabase' ? supabase.tableName : undefined,
      columns: sourceType === 'supabase' ? supabase.columns : undefined,
    });
  };

  const isLoading = ['uploading', 'analyzing', 'embedding'].includes(phase);
  const visiblePhases = sourceType === 'documents' ? PHASES : PHASES.filter((p) => p.key !== 'uploading');
  const currentPhaseIndex = visiblePhases.findIndex((p) => p.key === phase);
  const progress = phase === 'done' ? 100 : visiblePhases[currentPhaseIndex]?.progress ?? 0;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-mesh overflow-y-auto">
      <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h2 className="text-4xl font-bold mb-2">
            Configura tu <span className="text-gradient">asistente</span>
          </h2>
          <p className="text-muted-foreground text-sm">Elige la fuente de datos y empieza</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {phase === 'idle' && (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* Name */}
              <div className="glass rounded-2xl p-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del asistente</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Soporte Técnico Pro"
                    className="h-11"
                  />
                </div>

                {/* Source type grid */}
                <div className="space-y-2">
                  <Label>Fuente de datos</Label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {SOURCE_CARDS.map((card) => {
                      const active = sourceType === card.value;
                      return (
                        <button
                          key={card.value}
                          type="button"
                          onClick={() => setSourceType(card.value)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 text-left ${
                            active ? `${card.border} ${card.color}` : `border-border ${card.bg} text-muted-foreground`
                          }`}
                        >
                          <card.icon className="w-4 h-4 shrink-0" />
                          <div>
                            <div className="font-medium text-sm">{card.label}</div>
                            <div className="text-xs opacity-70">{card.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* — URL form — */}
              <AnimatePresence mode="wait">
                {sourceType === 'url' && (
                  <motion.div
                    key="url"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="glass rounded-2xl p-5 space-y-3"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-violet-400" />
                      <Label>URL del sitio web</Label>
                    </div>
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://docs.miempresa.com"
                      type="url"
                      className="h-11"
                    />
                    <p className="text-xs text-muted-foreground">
                      Procesaremos esta URL y sus páginas internas para entrenar el asistente.
                    </p>
                  </motion.div>
                )}

                {/* — Database form — */}
                {sourceType === 'database' && (
                  <motion.div
                    key="database"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="glass rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <Label>Configuración de base de datos</Label>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {DB_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setDbType(opt.value)}
                          className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border text-xs font-medium transition-all ${
                            dbType === opt.value
                              ? 'border-blue-500/50 bg-blue-500/10 text-blue-300'
                              : 'border-border hover:border-blue-500/30 text-muted-foreground'
                          }`}
                        >
                          <span className="text-base">{opt.icon}</span>
                          {opt.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs"><Server className="w-3 h-3" />Host</Label>
                        <Input value={credentials.host} onChange={(e) => setCredentials((c) => ({ ...c, host: e.target.value }))} placeholder="localhost" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs"><Hash className="w-3 h-3" />Puerto</Label>
                        <Input value={credentials.port} onChange={(e) => setCredentials((c) => ({ ...c, port: e.target.value }))} placeholder="5432" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs"><Database className="w-3 h-3" />Base de datos</Label>
                        <Input value={credentials.database} onChange={(e) => setCredentials((c) => ({ ...c, database: e.target.value }))} placeholder="mydb" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs"><User className="w-3 h-3" />Usuario</Label>
                        <Input value={credentials.user} onChange={(e) => setCredentials((c) => ({ ...c, user: e.target.value }))} placeholder="admin" />
                      </div>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="flex items-center gap-1.5 text-xs"><Lock className="w-3 h-3" />Contraseña</Label>
                        <Input value={credentials.password} onChange={(e) => setCredentials((c) => ({ ...c, password: e.target.value }))} type="password" placeholder="••••••••" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* — Supabase form — */}
                {sourceType === 'supabase' && (
                  <motion.div
                    key="supabase"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="glass rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" />
                      <Label>Conexión Supabase</Label>
                    </div>

                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Project URL</Label>
                        <Input
                          value={supabase.supabaseUrl}
                          onChange={(e) => setSupabase((s) => ({ ...s, supabaseUrl: e.target.value }))}
                          placeholder="https://xxxxxxxxxxxx.supabase.co"
                          className="h-10 font-mono text-xs"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Lock className="w-3 h-3" />
                          Service Role Key
                        </Label>
                        <Input
                          value={supabase.supabaseKey}
                          onChange={(e) => setSupabase((s) => ({ ...s, supabaseKey: e.target.value }))}
                          type="password"
                          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                          className="h-10 font-mono text-xs"
                        />
                        <p className="text-xs text-muted-foreground">
                          Encuéntrala en Settings → API → service_role key
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Tabla <span className="text-red-400">*</span></Label>
                          <Input
                            value={supabase.tableName}
                            onChange={(e) => setSupabase((s) => ({ ...s, tableName: e.target.value }))}
                            placeholder="documents"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Columnas (opcional)</Label>
                          <Input
                            value={supabase.columns}
                            onChange={(e) => setSupabase((s) => ({ ...s, columns: e.target.value }))}
                            placeholder="title, content"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <Zap className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-emerald-300/80">
                        n8n se conecta directamente a tu proyecto Supabase para indexar los datos.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* — Documents form — */}
                {sourceType === 'documents' && (
                  <motion.div
                    key="documents"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="glass rounded-2xl p-5 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-amber-400" />
                        <Label>Documentos</Label>
                      </div>
                      <span className="text-xs text-muted-foreground">{files.length}/{MAX_FILES} archivos</span>
                    </div>

                    {/* Drag & drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative rounded-xl border-2 border-dashed transition-all duration-200 p-8 text-center cursor-pointer ${
                        dragOver
                          ? 'border-amber-500/60 bg-amber-500/10'
                          : 'border-border hover:border-amber-500/30 hover:bg-amber-500/5'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept={ACCEPTED_TYPES}
                        className="hidden"
                        onChange={(e) => addFiles(e.target.files)}
                      />
                      <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${dragOver ? 'text-amber-400' : 'text-muted-foreground'}`} />
                      <p className="text-sm font-medium mb-1">
                        {dragOver ? 'Suelta los archivos aquí' : 'Arrastra archivos o haz clic'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF · TXT · DOCX · CSV · JSON · MD · Máx {MAX_FILE_SIZE_MB}MB por archivo
                      </p>
                    </div>

                    {/* File list */}
                    <AnimatePresence>
                      {files.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin"
                        >
                          {files.map((file, i) => (
                            <motion.div
                              key={`${file.name}-${i}`}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: 10 }}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/60 text-xs group"
                            >
                              <File className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="flex-1 truncate text-foreground">{file.name}</span>
                              <span className="text-muted-foreground shrink-0">{formatBytes(file.size)}</span>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); setFiles((f) => f.filter((_, fi) => fi !== i)); }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex justify-between items-center pt-1">
                <Button type="button" variant="ghost" onClick={onBack} className="gap-2">
                  <ArrowLeft className="w-4 h-4" /> Atrás
                </Button>
                <Button type="submit" variant="gradient" size="lg" className="gap-2 min-w-[180px]">
                  Crear asistente
                </Button>
              </div>
            </motion.form>
          )}

          {/* Loading / done states */}
          {(isLoading || phase === 'done' || phase === 'error') && (
            <motion.div
              key="loading"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass rounded-2xl p-10 text-center"
            >
              <div className="mb-8">
                {phase === 'done' ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                  </motion.div>
                ) : phase === 'error' ? (
                  <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                ) : (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                    <Loader2 className="w-16 h-16 text-violet-400 mx-auto" />
                  </motion.div>
                )}
              </div>

              <h3 className="font-semibold text-lg mb-6">
                {phase === 'done' ? '¡Tu asistente está listo!' : phase === 'error' ? 'Algo salió mal' : 'Procesando…'}
              </h3>

              <div className="space-y-4 text-left mb-8">
                {visiblePhases.map((p, i) => {
                  const pastIdx = visiblePhases.findIndex((ph) => ph.key === phase);
                  const done = phase === 'done' || i < pastIdx;
                  const current = p.key === phase;
                  return (
                    <div key={p.key} className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full shrink-0 transition-all duration-500 ${
                        done ? 'bg-emerald-400' : current ? 'bg-current animate-pulse' : 'bg-border'
                      } ${current ? p.color : ''}`} />
                      <span className={`text-sm transition-colors duration-300 ${
                        current ? p.color : done ? 'text-emerald-400/70' : 'text-muted-foreground'
                      }`}>
                        {p.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Progress value={progress} className="h-1" />

              {isLoading && sourceType === 'documents' && (
                <p className="text-xs text-muted-foreground mt-4">
                  El procesamiento de PDFs puede tardar 2–3 minutos. Por favor no cierres esta ventana.
                </p>
              )}

              {phase === 'error' && (
                <Button variant="outline" className="mt-6" onClick={() => setPhase('idle')}>
                  Intentar de nuevo
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
