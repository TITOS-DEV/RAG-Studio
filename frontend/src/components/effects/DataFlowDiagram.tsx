import { motion } from 'framer-motion';
import { Globe, Database, Brain, Zap, MessageSquare } from 'lucide-react';

const steps = [
  { icon: Globe, label: 'Tus datos', color: '#60a5fa', delay: 0 },
  { icon: Database, label: 'n8n procesa', color: '#8b5cf6', delay: 0.15 },
  { icon: Brain, label: 'IA aprende', color: '#a78bfa', delay: 0.3 },
  { icon: Zap, label: 'Embeddings', color: '#34d399', delay: 0.45 },
  { icon: MessageSquare, label: 'Asistente listo', color: '#38bdf8', delay: 0.6 },
];

function Connector({ delay }: { delay: number }) {
  return (
    <div className="flex items-center">
      <motion.div
        className="h-px bg-gradient-to-r from-violet-500/50 to-blue-500/50"
        initial={{ width: 0 }}
        animate={{ width: 40 }}
        transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      />
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.3, duration: 0.3 }}
        className="w-1.5 h-1.5 rounded-full bg-violet-500/70"
      />
    </div>
  );
}

export function DataFlowDiagram() {
  return (
    <div className="flex items-center justify-center gap-0 flex-wrap gap-y-6 px-4">
      {steps.map((step, i) => (
        <div key={step.label} className="flex items-center">
          <motion.div
            className="flex flex-col items-center gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: step.delay, duration: 0.5, ease: 'easeOut' }}
          >
            <motion.div
              className="w-14 h-14 rounded-2xl flex items-center justify-center glass-strong"
              style={{ boxShadow: `0 0 20px ${step.color}20` }}
              whileHover={{ scale: 1.1, boxShadow: `0 0 30px ${step.color}40` }}
              animate={{
                boxShadow: [
                  `0 0 15px ${step.color}15`,
                  `0 0 25px ${step.color}30`,
                  `0 0 15px ${step.color}15`,
                ],
              }}
              transition={{
                boxShadow: {
                  duration: 2,
                  repeat: Infinity,
                  delay: step.delay,
                },
              }}
            >
              <step.icon className="w-6 h-6" style={{ color: step.color }} />
            </motion.div>
            <span className="text-xs text-muted-foreground text-center max-w-[80px]">
              {step.label}
            </span>
          </motion.div>
          {i < steps.length - 1 && <Connector delay={step.delay + 0.5} />}
        </div>
      ))}
    </div>
  );
}
