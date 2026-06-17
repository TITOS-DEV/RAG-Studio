import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, MessageSquare, Clock } from 'lucide-react';
import { useChatStore, type ChatSession } from '@/store/useChatStore';
import { cn } from '@/lib/utils';

interface Props {
  assistantId: string;
  onNewChat: () => void;
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function SessionItem({ session, active, onSelect, onDelete }: {
  session: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      className={cn(
        'group flex items-start gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150',
        active ? 'bg-white/[0.08] border border-white/[0.1]' : 'hover:bg-white/[0.04]'
      )}
      onClick={onSelect}
    >
      <MessageSquare className={cn('w-3.5 h-3.5 mt-0.5 shrink-0 transition-colors', active ? 'text-violet-400' : 'text-white/30')} />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-white/75 truncate leading-snug">{session.title}</p>
        <div className="flex items-center gap-1 mt-0.5">
          <Clock className="w-2.5 h-2.5 text-white/25" />
          <span className="text-[10px] text-white/25">{relativeTime(session.updatedAt)}</span>
          <span className="text-[10px] text-white/20">· {session.messages.length} msgs</span>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-400 text-white/30"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </motion.div>
  );
}

export function ChatHistorySidebar({ assistantId, onNewChat }: Props) {
  const { sessions, activeSessionId, setActiveSession, deleteSession } = useChatStore();
  const mySessions = sessions.filter((s) => s.assistantId === assistantId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/[0.06]">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] hover:border-violet-500/30 hover:bg-violet-500/5 text-white/60 hover:text-white/90 text-xs font-medium transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva conversación
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
        {mySessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-6 h-6 text-white/15 mx-auto mb-2" />
            <p className="text-[11px] text-white/25">Sin conversaciones aún</p>
          </div>
        ) : (
          <AnimatePresence>
            {mySessions.map((s) => (
              <SessionItem
                key={s.id}
                session={s}
                active={s.id === activeSessionId}
                onSelect={() => setActiveSession(s.id)}
                onDelete={() => deleteSession(s.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
