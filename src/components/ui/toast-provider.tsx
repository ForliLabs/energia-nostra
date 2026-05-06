"use client";

import { X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (input: { title: string; description?: string; variant?: ToastVariant }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantClasses: Record<ToastVariant, string> = {
  success: "border-lime-200 bg-lime-50 text-lime-950",
  error: "border-red-200 bg-red-50 text-red-950",
  info: "border-amber-200 bg-white text-zinc-900",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, description, variant = "info" }: { title: string; description?: string; variant?: ToastVariant }) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current, { id, title, description, variant }]);
      window.setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed inset-x-0 top-4 z-[100] mx-auto flex max-w-md flex-col gap-3 px-4"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "pointer-events-auto rounded-2xl border px-4 py-3 shadow-xl shadow-zinc-200/50 backdrop-blur",
              variantClasses[toast.variant]
            )}
            role="status"
          >
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? <p className="mt-1 text-sm opacity-80">{toast.description}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded-full p-1 opacity-70 transition hover:bg-white/70 hover:opacity-100"
                aria-label="Chiudi notifica"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
