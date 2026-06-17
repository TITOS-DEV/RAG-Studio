import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Assistant, WizardStep } from '@/types';

interface AppState {
  assistants: Assistant[];
  wizardStep: WizardStep;
  onboardingDone: boolean;

  addAssistant: (assistant: Assistant) => void;
  updateAssistant: (id: string, updates: Partial<Assistant>) => void;
  removeAssistant: (id: string) => void;
  setWizardStep: (step: WizardStep) => void;
  finishOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      assistants: [],
      wizardStep: 1,
      onboardingDone: false,

      addAssistant: (assistant) =>
        set((state) => ({ assistants: [assistant, ...state.assistants] })),

      updateAssistant: (id, updates) =>
        set((state) => ({
          assistants: state.assistants.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      removeAssistant: (id) =>
        set((state) => ({
          assistants: state.assistants.filter((a) => a.id !== id),
        })),

      setWizardStep: (step) => set({ wizardStep: step }),

      finishOnboarding: () => set({ onboardingDone: true, wizardStep: 1 }),

      resetOnboarding: () => set({ onboardingDone: false, wizardStep: 1 }),
    }),
    {
      name: 'rag-studio-store',
      partialize: (state) => ({
        assistants: state.assistants,
        onboardingDone: state.onboardingDone,
      }),
    }
  )
);
