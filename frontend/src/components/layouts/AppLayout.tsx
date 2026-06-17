import { motion } from 'framer-motion';
import { Bot, Plus, LayoutDashboard, Settings, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
];

interface Props {
  children: React.ReactNode;
}

export function AppLayout({ children }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { resetOnboarding, assistants } = useAppStore();

  const handleCreateNew = () => {
    resetOnboarding();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-60 border-r border-border flex flex-col h-screen sticky top-0 glass">
        {/* Logo */}
        <div className="p-5 border-b border-border">
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight">RAG Studio</span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link key={item.to} to={item.to}>
                <div className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                  active
                    ? 'bg-violet-500/15 text-violet-300 font-medium'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Create button */}
        <div className="p-3 border-t border-border space-y-3">
          <Button
            variant="gradient"
            className="w-full gap-2 text-xs"
            size="sm"
            onClick={handleCreateNew}
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo asistente
          </Button>

          {/* Assistants count */}
          <div className="px-3 py-2 rounded-lg bg-secondary/50 text-xs text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" />
              Asistentes
            </span>
            <span className="font-semibold text-foreground">{assistants.length}</span>
          </div>

          {/* Settings */}
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-200">
            <Settings className="w-4 h-4" />
            Configuración
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto scrollbar-thin">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
