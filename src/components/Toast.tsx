import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, XCircle, X, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let toastIdCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4000);
    },
    [removeToast],
  );

  const styles: Record<ToastType, { icon: typeof CheckCircle2; bar: string; bg: string; text: string }> = {
    success: {
      icon: CheckCircle2,
      bar: 'bg-green-500',
      bg: 'bg-white',
      text: 'text-green-600',
    },
    error: {
      icon: XCircle,
      bar: 'bg-red-500',
      bg: 'bg-white',
      text: 'text-red-600',
    },
    info: {
      icon: Info,
      bar: 'bg-blue-500',
      bg: 'bg-white',
      text: 'text-blue-600',
    },
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 sm:bottom-8 sm:right-8">
        {toasts.map((toast) => {
          const s = styles[toast.type];
          const Icon = s.icon;
          return (
            <div
              key={toast.id}
              className={`flex items-center gap-3 rounded-xl border border-slate-200 ${s.bg} py-3.5 pl-4 pr-3 shadow-lg shadow-slate-900/10 animate-[slideIn_0.3s_ease-out]`}
              style={{
                animation: 'slideIn 0.3s ease-out',
                minWidth: '280px',
                maxWidth: '380px',
              }}
            >
              <div className={`absolute left-0 top-0 h-full w-1 rounded-l-xl ${s.bar}`} />
              <Icon className={`h-5 w-5 flex-shrink-0 ${s.text}`} />
              <p className="flex-1 text-sm font-medium text-slate-700">
                {toast.message}
              </p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
