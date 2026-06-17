import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Sparkles, LayoutDashboard, ChevronRight,
  Loader2, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatHistorySidebar } from '@/components/chat/ChatHistorySidebar';
import { useAppStore } from '@/store/useAppStore';
import { useChatStore } from '@/store/useChatStore';
import { chat } from '@/lib/api';
import { generateId } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import type { Message } from '@/types';

const SUGGESTIONS = [
  { icon: '🔍', text: '¿Qué información tienes disponible?' },
  { icon: '📋', text: '¿Cuáles son los temas principales?' },
  { icon: '🚀', text: 'Dame un resumen general' },
  { icon: '💡', text: '¿Qué casos de uso puedes resolver?' },
];

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { assistants, updateAssistant } = useAppStore();
  const assistant = assistants.find((a) => a.id === id);

  const {
    sessions, activeSessionId, createSession,
    addMessage, setActiveSession, getActiveSession,
  } = useChatStore();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [latestAiId, setLatestAiId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = getActiveSession();
  const messages: Message[] = activeSession?.messages ?? [];

  // Redirect if assistant not found
  useEffect(() => {
    if (!assistant) navigate('/dashboard');
  }, [assistant, navigate]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Focus textarea on session change
  useEffect(() => {
    textareaRef.current?.focus();
  }, [activeSessionId]);

  const ensureSession = useCallback((firstMsg?: string) => {
    if (activeSessionId && sessions.find((s) => s.id === activeSessionId && s.assistantId === id)) {
      return activeSessionId;
    }
    return createSession(id!, firstMsg);
  }, [activeSessionId, sessions, id, createSession]);

  const mutation = useMutation({
    mutationFn: (question: string) =>
      chat({
        ragId: id!,
        question,
        conversationHistory: messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    onSuccess: (data, question) => {
      const sessionId = ensureSession(question);
      const aiMsg: Message = {
        id: generateId(),
        role: 'assistant',
        content: data.answer ?? 'Sin respuesta del asistente.',
        timestamp: new Date().toISOString(),
        sources: data.sources,
      };
      addMessage(sessionId, aiMsg);
      setLatestAiId(aiMsg.id);
      updateAssistant(id!, { messageCount: (assistant?.messageCount ?? 0) + 1 });
    },
    onError: () => {
      toast({ title: 'Error al consultar', description: 'Intenta de nuevo', variant: 'destructive' });
    },
  });

  const sendMessage = (text: string) => {
    if (!text.trim() || mutation.isPending) return;
    const sessionId = ensureSession(text.trim());
    const userMsg: Message = {
      id: generateId(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    addMessage(sessionId, userMsg);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = '44px';
    }
    mutation.mutate(text.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleNewChat = () => {
    setActiveSession(null);
    setLatestAiId(null);
    setInput('');
    textareaRef.current?.focus();
  };

  if (!assistant) return null;

  return (
    <div className="flex h-screen bg-[#0a0a0f] overflow-hidden">

      {/* ── History sidebar ─────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            key="sidebar"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 240, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="shrink-0 border-r border-white/[0.06] overflow-hidden h-full"
          >
            <div className="w-[240px] h-full flex flex-col">
              {/* Sidebar header */}
              <div className="flex items-center gap-2 px-4 py-4 border-b border-white/[0.06]">
                <button onClick={() => navigate('/dashboard')} className="text-white/40 hover:text-white/80 transition-colors">
                  <LayoutDashboard className="w-4 h-4" />
                </button>
                <ChevronRight className="w-3 h-3 text-white/20" />
                <span className="text-xs text-white/50 truncate flex-1">{assistant.name}</span>
              </div>
              <ChatHistorySidebar assistantId={id!} onNewChat={handleNewChat} />
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Main chat area ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 h-full">

        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06] shrink-0">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="text-white/40 hover:text-white/80 transition-colors p-1"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {!sidebarOpen && (
            <button onClick={() => navigate('/dashboard')} className="text-white/40 hover:text-white/80 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-medium text-white/70 truncate">{assistant.name}</span>
            <span className="text-xs text-emerald-400/80 shrink-0">● activo</span>
          </div>

          <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-xs text-white/40 hover:text-white/80 h-7 px-2">
            + Nuevo
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-2xl mx-auto px-4 py-8">

            {/* Welcome screen */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-10"
              >
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center mx-auto mb-6"
                  animate={{ boxShadow: ['0 0 20px rgba(139,92,246,0.1)', '0 0 40px rgba(139,92,246,0.25)', '0 0 20px rgba(139,92,246,0.1)'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="w-7 h-7 text-violet-400" />
                </motion.div>
                <h2 className="text-2xl font-semibold text-white/90 mb-2">
                  Hola, soy <span className="text-gradient">{assistant.name}</span>
                </h2>
                <p className="text-white/40 text-sm mb-10 max-w-xs mx-auto leading-relaxed">
                  Pregúntame lo que quieras sobre los datos con los que fui entrenado.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-w-md mx-auto">
                  {SUGGESTIONS.map((s) => (
                    <motion.button
                      key={s.text}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendMessage(s.text)}
                      className="flex items-center gap-3 p-3.5 rounded-xl bg-white/[0.04] border border-white/[0.07] hover:border-violet-500/30 hover:bg-violet-500/5 text-left transition-all"
                    >
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-xs text-white/60 leading-snug">{s.text}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages list */}
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isLatest={msg.id === latestAiId}
                assistantName={assistant.name}
              />
            ))}

            {/* Thinking indicator */}
            <AnimatePresence>
              {mutation.isPending && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 mb-8 pl-0"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shrink-0">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.07]">
                    <Loader2 className="w-3.5 h-3.5 text-violet-400 animate-spin" />
                    <span className="text-xs text-white/40">Pensando…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input bar */}
        <div className="shrink-0 px-4 py-4 border-t border-white/[0.06]">
          <div className="max-w-2xl mx-auto">
            <div className="relative flex items-end gap-0 rounded-2xl border border-white/[0.1] bg-white/[0.04] hover:border-white/[0.15] focus-within:border-violet-500/40 transition-colors duration-200">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu mensaje…"
                rows={1}
                disabled={mutation.isPending}
                className="flex-1 resize-none bg-transparent px-4 py-3.5 text-sm text-white/85 placeholder:text-white/25 focus:outline-none disabled:opacity-50 max-h-36 overflow-y-auto scrollbar-thin"
                style={{ minHeight: '44px' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = 'auto';
                  t.style.height = Math.min(t.scrollHeight, 144) + 'px';
                }}
              />
              <div className="flex items-center px-3 pb-3 pt-3 shrink-0">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || mutation.isPending}
                  className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-violet-500/20"
                >
                  <Send className="w-3.5 h-3.5 text-white" />
                </motion.button>
              </div>
            </div>
            <p className="text-center text-[11px] text-white/20 mt-2">
              Enter para enviar · Shift+Enter nueva línea
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
