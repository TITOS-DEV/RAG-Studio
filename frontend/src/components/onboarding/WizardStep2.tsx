import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataFlowDiagram } from '@/components/effects/DataFlowDiagram';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const features = [
  {
    emoji: '🔌',
    title: 'Conecta cualquier fuente',
    desc: 'Páginas web, documentación, bases de datos SQL y NoSQL.',
  },
  {
    emoji: '⚡',
    title: 'Procesamiento automático',
    desc: 'n8n extrae, limpia y transforma tus datos sin configuración.',
  },
  {
    emoji: '🧠',
    title: 'IA que entiende contexto',
    desc: 'Embeddings vectoriales para respuestas precisas y relevantes.',
  },
];

export function WizardStep2({ onNext, onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12 bg-mesh">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-blue-600/5 blur-3xl" />

      <div className="relative z-10 w-full max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
            Cómo funciona
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Tu IA lista en{' '}
            <span className="text-gradient">4 pasos</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            La tecnología RAG conecta tus datos con la inteligencia de los LLMs.
          </p>
        </motion.div>

        {/* Flow diagram */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="glass rounded-2xl p-8 mb-10 gradient-border"
        >
          <DataFlowDiagram />
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-10">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="glass rounded-xl p-5 hover:border-violet-500/20 transition-colors"
            >
              <div className="text-2xl mb-3">{f.emoji}</div>
              <h3 className="font-semibold text-sm mb-1">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex justify-between items-center"
        >
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Atrás
          </Button>
          <Button variant="gradient" size="lg" onClick={onNext} className="group gap-2">
            Crear mi asistente
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
