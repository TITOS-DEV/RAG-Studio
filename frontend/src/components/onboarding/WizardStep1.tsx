import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ParticleCanvas } from '@/components/effects/ParticleCanvas';

interface Props {
  onNext: () => void;
}

export function WizardStep1({ onNext }: Props) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <ParticleCanvas />

      {/* Background mesh */}
      <div className="absolute inset-0 bg-mesh" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-violet-600/5 blur-3xl" />
      <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] rounded-full bg-blue-600/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-violet-500/20 text-violet-400 text-sm font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            Powered by RAG + n8n
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          Crea un asistente IA
          <br />
          <span className="text-gradient">con tus propios datos</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl text-muted-foreground max-w-xl mb-12 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
        >
          Conecta tu web o base de datos y obtén un asistente inteligente
          listo en minutos. Sin código, sin complicaciones.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="flex flex-col sm:flex-row gap-4 items-center"
        >
          <Button
            variant="gradient"
            size="xl"
            onClick={onNext}
            className="group relative overflow-hidden"
          >
            <span className="relative z-10 flex items-center gap-2">
              Crear mi asistente
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </span>
          </Button>
          <span className="text-sm text-muted-foreground">Sin tarjeta de crédito</span>
        </motion.div>

        {/* Stats */}
        <motion.div
          className="mt-16 grid grid-cols-3 gap-8 border-t border-border/50 pt-10 w-full max-w-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.6 }}
        >
          {[
            { value: '<5min', label: 'Configuración' },
            { value: '99.9%', label: 'Uptime' },
            { value: '∞', label: 'Fuentes de datos' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-gradient">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
