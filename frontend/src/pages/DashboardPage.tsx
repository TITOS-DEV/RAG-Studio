import { motion } from 'framer-motion';
import { Plus, Bot, TrendingUp, MessageSquare, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layouts/AppLayout';
import { AssistantCard } from '@/components/dashboard/AssistantCard';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';

export function DashboardPage() {
  const navigate = useNavigate();
  const { assistants, resetOnboarding } = useAppStore();

  const readyCount = assistants.filter((a) => a.status === 'ready').length;
  const totalMessages = assistants.reduce((sum, a) => sum + (a.messageCount ?? 0), 0);

  const handleCreateNew = () => {
    resetOnboarding();
    navigate('/');
  };

  return (
    <AppLayout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Gestiona y prueba tus asistentes IA
            </p>
          </div>
          <Button variant="gradient" onClick={handleCreateNew} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo asistente
          </Button>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            {
              icon: Bot,
              label: 'Asistentes',
              value: assistants.length,
              color: 'text-violet-400',
              bg: 'bg-violet-500/10',
            },
            {
              icon: TrendingUp,
              label: 'Listos',
              value: readyCount,
              color: 'text-emerald-400',
              bg: 'bg-emerald-500/10',
            },
            {
              icon: MessageSquare,
              label: 'Conversaciones',
              value: totalMessages,
              color: 'text-blue-400',
              bg: 'bg-blue-500/10',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-2xl p-6 flex items-center gap-4"
            >
              <div className={`w-11 h-11 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Assistants grid */}
        {assistants.length === 0 ? (
          <EmptyState onCreateNew={handleCreateNew} />
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-violet-400" />
              <h2 className="font-semibold text-sm">Tus asistentes</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {assistants.map((assistant, i) => (
                <AssistantCard key={assistant.id} assistant={assistant} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
