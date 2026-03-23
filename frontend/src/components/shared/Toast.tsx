"use client";
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let nextId = 0;

const TYPE_STYLES: Record<ToastType, string> = {
  success: "bg-success text-white border-success",
  error: "bg-danger text-white border-danger",
  info: "bg-accent text-background border-accent",
  warning: "bg-accent/80 text-background border-accent",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = nextId++;
      setToasts((prev) => {
        const updated = [...prev, { id, message, type }];
        // Keep max 3 visible
        if (updated.length > 3) {
          const removed = updated[0];
          const timer = timersRef.current.get(removed.id);
          if (timer) {
            clearTimeout(timer);
            timersRef.current.delete(removed.id);
          }
          return updated.slice(-3);
        }
        return updated;
      });

      const timer = setTimeout(() => {
        removeToast(id);
      }, 4000);
      timersRef.current.set(id, timer);
    },
    [removeToast]
  );

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => clearTimeout(timer));
    };
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none w-full max-w-sm px-4">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto w-full rounded-xl border px-4 py-3 text-sm font-medium shadow-lg animate-slide-in-down flex items-center justify-between gap-2 ${TYPE_STYLES[toast.type]}`}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity cursor-pointer text-inherit text-lg leading-none"
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
