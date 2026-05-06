import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { clsx } from 'clsx';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (type: ToastType, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error:   <XCircle size={16} />,
  warning: <AlertCircle size={16} />,
  info:    <Info size={16} />,
};

const colors: Record<ToastType, { bg: string; icon: string; border: string }> = {
  success: { bg: 'var(--success-bg)',  icon: 'var(--success)', border: 'rgba(16,201,160,0.2)' },
  error:   { bg: 'var(--danger-bg)',   icon: 'var(--danger)',  border: 'rgba(240,80,110,0.2)' },
  warning: { bg: 'var(--warning-bg)',  icon: 'var(--warning)', border: 'rgba(245,158,11,0.2)' },
  info:    { bg: 'var(--brand-glow-xs)', icon: 'var(--brand-primary)', border: 'var(--border-brand)' },
};

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const c = colors[toast.type];
  return (
    <div
      className="animate-slide-left flex items-start gap-3 p-4 rounded-2xl pointer-events-auto"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--neu-shadow-lg)',
        border: `1px solid ${c.border}`,
        minWidth: 280,
        maxWidth: 380,
      }}
    >
      <span
        className="flex-shrink-0 mt-0.5 p-1.5 rounded-lg"
        style={{ background: c.bg, color: c.icon }}
      >
        {icons[toast.type]}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
          {toast.title}
        </p>
        {toast.message && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="flex-shrink-0 p-1 rounded-lg transition-all"
        style={{ color: 'var(--text-muted)' }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => dismiss(id), 4500);
  }, [dismiss]);

  const ctx: ToastContextType = {
    toast,
    success: (t, m) => toast('success', t, m),
    error:   (t, m) => toast('error', t, m),
    warning: (t, m) => toast('warning', t, m),
    info:    (t, m) => toast('info', t, m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      <div
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
      >
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be inside ToastProvider');
  return ctx;
}
