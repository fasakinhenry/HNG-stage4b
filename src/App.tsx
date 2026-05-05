import { Navigate, Route, Routes } from 'react-router-dom';
import { AppPreviewPage } from './pages/AppPreviewPage';
import { AuthPage } from './pages/AuthPage';
import { LandingPage } from './pages/LandingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--app-bg)] px-4 text-[var(--text)]">
        <div className="card flex items-center gap-3 rounded-3xl px-5 py-4 text-sm text-[var(--text-secondary)] shadow-[0_20px_80px_rgba(0,132,208,0.10)]">
          <span className="pulse-dot" />
          Restoring your secure session...
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route
        path="/app"
        element={isAuthenticated ? <AppPreviewPage /> : <Navigate to="/auth" replace />}
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
