import { motion } from 'framer-motion';
import { Globe, Database, MessageSquare, Trash2, ExternalLink, Bot, Zap, FileText, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/useAppStore';
import { formatDate, truncate } from '@/lib/utils';
import type { Assistant, SourceType } from '@/types';

interface Props {
  assistant: Assistant;
  index: number;
}

const STATUS_CONFIG = {
  ready: { variant: 'ready' as const, label: 'Listo', dot: 'bg-emerald-400' },
  processing: { variant: 'processing' as const, label: 'Procesando', dot: 'bg-blue-400 animate-pulse' },
  creating: { variant: 'creating' as const, label: 'Creando', dot: 'bg-violet-400 animate-pulse' },
  error: { variant: 'error' as const, label: 'Error', dot: 'bg-red-400' },
};

const SOURCE_META: Record<SourceType, { icon: React.ElementType; label: string; color: string }> = {
  url: { icon: Globe, label: 'Web', color: 'text-violet-400' },
  database: { icon: Database, label: 'Database', color: 'text-blue-400' },
  supabase: { icon: Zap, label: 'Supabase', color: 'text-emerald-400' },
  documents: { icon: FileText, label: 'Documentos', color: 'text-amber-400' },
};

export function AssistantCard({ assistant, index }: Props) {
  const navigate = useNavigate();
  const removeAssistant = useAppStore((s) => s.removeAssistant);
  const statusConfig = STATUS_CONFIG[assistant.status] ?? STATUS_CONFIG.ready;
  const sourceMeta = SOURCE_META[assistant.sourceType] ?? SOURCE_META.url;
  const SourceIcon = sourceMeta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      whileHover={{ y: -2 }}
      className="group glass rounded-2xl p-6 border border-border hover:border-violet-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 flex items-center justify-center border border-violet-500/20">
            <Bot className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h3 className="font-semibold text-sm leading-tight">{truncate(assistant.name, 26)}</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <SourceIcon className={`w-3 h-3 ${sourceMeta.color}`} />
              <span className="text-xs text-muted-foreground">
                {assistant.sourceType === 'database' && assistant.databaseType
                  ? assistant.databaseType
                  : sourceMeta.label}
              </span>
            </div>
          </div>
        </div>

        <Badge variant={statusConfig.variant} className="shrink-0">
          <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Source preview */}
      {assistant.url && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground">
          <ExternalLink className="w-3 h-3 shrink-0" />
          <span className="truncate">{assistant.url}</span>
        </div>
      )}

      {assistant.sourceType === 'documents' && assistant.fileNames && assistant.fileNames.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {assistant.fileNames.slice(0, 3).map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/60 text-xs text-muted-foreground"
            >
              <File className="w-2.5 h-2.5" />
              {truncate(name, 18)}
            </span>
          ))}
          {assistant.fileNames.length > 3 && (
            <span className="px-2 py-0.5 rounded-md bg-secondary/60 text-xs text-muted-foreground">
              +{assistant.fileNames.length - 3} más
            </span>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5" />
          {assistant.messageCount ?? 0} mensajes
        </span>
        <span className="text-border">·</span>
        <span>{formatDate(assistant.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1 border-t border-border/50">
        <Button
          variant="gradient"
          size="sm"
          className="flex-1 text-xs h-8"
          disabled={assistant.status !== 'ready'}
          onClick={() => navigate(`/assistant/${assistant.id}`)}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Probar asistente
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-400/10 shrink-0"
          onClick={() => removeAssistant(assistant.id)}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  );
}
