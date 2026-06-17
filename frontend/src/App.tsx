import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ChatPage } from '@/pages/ChatPage';
import { Toaster } from '@/components/ui/toaster';
import { useAppStore } from '@/store/useAppStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 1000 * 60 * 5 },
    mutations: { retry: 0 },
  },
});

function AppRoutes() {
  const onboardingDone = useAppStore((s) => s.onboardingDone);

  return (
    <Routes>
      <Route
        path="/"
        element={
          onboardingDone ? <Navigate to="/dashboard" replace /> : <OnboardingPage />
        }
      />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/assistant/:id" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppRoutes />
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
