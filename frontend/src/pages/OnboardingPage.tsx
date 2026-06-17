import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from '@/store/useAppStore';
import { WizardStep1 } from '@/components/onboarding/WizardStep1';
import { WizardStep2 } from '@/components/onboarding/WizardStep2';
import { WizardStep3 } from '@/components/onboarding/WizardStep3';
import { useNavigate } from 'react-router-dom';

const STEP_COUNT = 3;

export function OnboardingPage() {
  const { wizardStep, setWizardStep, finishOnboarding } = useAppStore();
  const navigate = useNavigate();

  const goNext = () => setWizardStep((wizardStep + 1) as 1 | 2 | 3);
  const goBack = () => setWizardStep((wizardStep - 1) as 1 | 2 | 3);

  const handleDone = () => {
    finishOnboarding();
    navigate('/dashboard');
  };

  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      {/* Step indicator */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <motion.div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i + 1 === wizardStep
                ? 'w-6 h-1.5 bg-violet-500'
                : i + 1 < wizardStep
                ? 'w-1.5 h-1.5 bg-violet-500/60'
                : 'w-1.5 h-1.5 bg-border'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {wizardStep === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <WizardStep1 onNext={goNext} />
          </motion.div>
        )}
        {wizardStep === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <WizardStep2 onNext={goNext} onBack={goBack} />
          </motion.div>
        )}
        {wizardStep === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <WizardStep3 onBack={goBack} onDone={handleDone} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
