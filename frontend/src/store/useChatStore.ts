import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Message } from '@/types';
import { generateId } from '@/lib/utils';

export interface ChatSession {
  id: string;
  assistantId: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string | null;

  createSession: (assistantId: string, firstMessage?: string) => string;
  addMessage: (sessionId: string, message: Message) => void;
  setActiveSession: (id: string | null) => void;
  deleteSession: (id: string) => void;
  clearSessions: (assistantId: string) => void;
  getSessionsByAssistant: (assistantId: string) => ChatSession[];
  getActiveSession: () => ChatSession | null;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,

      createSession: (assistantId, firstMessage) => {
        const id = generateId();
        const now = new Date().toISOString();
        const session: ChatSession = {
          id,
          assistantId,
          title: firstMessage ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? '…' : '') : 'Nueva conversación',
          messages: [],
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({ sessions: [session, ...s.sessions], activeSessionId: id }));
        return id;
      },

      addMessage: (sessionId, message) =>
        set((s) => ({
          sessions: s.sessions.map((sess) =>
            sess.id === sessionId
              ? {
                  ...sess,
                  messages: [...sess.messages, message],
                  updatedAt: new Date().toISOString(),
                  title: sess.messages.length === 0 && message.role === 'user'
                    ? message.content.slice(0, 40) + (message.content.length > 40 ? '…' : '')
                    : sess.title,
                }
              : sess
          ),
        })),

      setActiveSession: (id) => set({ activeSessionId: id }),

      deleteSession: (id) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.id !== id),
          activeSessionId: s.activeSessionId === id ? null : s.activeSessionId,
        })),

      clearSessions: (assistantId) =>
        set((s) => ({
          sessions: s.sessions.filter((sess) => sess.assistantId !== assistantId),
          activeSessionId: null,
        })),

      getSessionsByAssistant: (assistantId) =>
        get().sessions.filter((s) => s.assistantId === assistantId),

      getActiveSession: () => {
        const { sessions, activeSessionId } = get();
        return sessions.find((s) => s.id === activeSessionId) ?? null;
      },
    }),
    {
      name: 'rag-studio-chat',
      partialize: (s) => ({ sessions: s.sessions.slice(0, 50) }),
    }
  )
);
