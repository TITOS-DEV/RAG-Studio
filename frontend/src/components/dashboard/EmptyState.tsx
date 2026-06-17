import { motion } from 'framer-motion';
import { Bot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onCreateNew: () => void;
}

export function EmptyState({ onCreateNew }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <motion.div
        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 flex items-center justify-center border border-violet-500/20 mb-6"
        animate={{
          boxShadow: [
            '0 0 20px rgba(139,92,246,0.1)',
            '0 0 40px rgba(139,92,246,0.2)',
            '0 0 20px rgba(139,92,246,0.1)',
          ],
        }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Bot className="w-9 h-9 text-violet-400" />
      </motion.div>

      <h3 className="text-xl font-semibold mb-2">Sin asistentes aún</h3>
      <p className="text-muted-foreground text-sm max-w-xs mb-8">
        Crea tu primer asistente IA conectando una página web o base de datos.
      </p>

      <Button variant="gradient" onClick={onCreateNew} className="gap-2">
        <Plus className="w-4 h-4" />
        Crear asistente
      </Button>
    </motion.div>
  );
}
