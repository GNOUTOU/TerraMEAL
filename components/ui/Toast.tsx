"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert, X } from "lucide-react";

type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: ToastVariant;
  /** ms avant disparition auto. 0 = persistant (fermeture manuelle). */
  duration?: number;
}

interface ToastItem extends Required<Omit<ToastOptions, "duration">> {
  id: number;
  duration: number;
  leaving: boolean;
}

interface ToastApi {
  toast: (opts: ToastOptions) => number;
  success: (msg: string, title?: string) => number;
  error: (msg: string, title?: string) => number;
  warning: (msg: string, title?: string) => number;
  info: (msg: string, title?: string) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const VARIANT_STYLE: Record<ToastVariant, { ring: string; icon: string; Icon: typeof CheckCircle2 }> = {
  success: { ring: "ring-emerald-200 dark:ring-emerald-900", icon: "text-emerald-500", Icon: CheckCircle2 },
  error: { ring: "ring-red-200 dark:ring-red-900", icon: "text-red-500", Icon: CircleAlert },
  warning: { ring: "ring-amber-200 dark:ring-amber-900", icon: "text-amber-500", Icon: TriangleAlert },
  info: { ring: "ring-slate-200 dark:ring-slate-700", icon: "text-slate-400", Icon: Info },
};

const DEFAULT_DURATION: Record<ToastVariant, number> = {
  success: 4000,
  info: 4500,
  warning: 6000,
  error: 8000,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const seq = useRef(0);

  const remove = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) {
      clearTimeout(tm);
      timers.current.delete(id);
    }
  }, []);

  const dismiss = useCallback(
    (id: number) => {
      setItems((list) => list.map((t) => (t.id === id ? { ...t, leaving: true } : t)));
      setTimeout(() => remove(id), 180);
    },
    [remove]
  );

  const toast = useCallback(
    (opts: ToastOptions) => {
      const variant = opts.variant ?? "info";
      const id = ++seq.current;
      const duration = opts.duration ?? DEFAULT_DURATION[variant];
      const item: ToastItem = {
        id,
        title: opts.title ?? "",
        description: opts.description ?? "",
        variant,
        duration,
        leaving: false,
      };
      setItems((list) => [...list.slice(-3), item]);
      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((tm) => clearTimeout(tm));
  }, []);

  const api: ToastApi = {
    toast,
    dismiss,
    success: (msg, title) => toast({ description: msg, title, variant: "success" }),
    error: (msg, title) => toast({ description: msg, title, variant: "error" }),
    warning: (msg, title) => toast({ description: msg, title, variant: "warning" }),
    info: (msg, title) => toast({ description: msg, title, variant: "info" }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3 sm:top-4"
      >
        {items.map((t) => {
          const s = VARIANT_STYLE[t.variant];
          return (
            <div
              key={t.id}
              role={t.variant === "error" ? "alert" : "status"}
              className={`toast-in ${t.leaving ? "toast-out" : ""} pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-lg ring-1 ${s.ring} dark:border-slate-800 dark:bg-slate-900`}
            >
              <s.Icon size={17} className={`mt-0.5 shrink-0 ${s.icon}`} />
              <div className="min-w-0 flex-1">
                {t.title && <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{t.title}</p>}
                {t.description && (
                  <p className={`text-slate-600 dark:text-slate-300 ${t.title ? "text-xs" : "text-sm"}`}>{t.description}</p>
                )}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Fermer"
                className="-mr-1 shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast doit être utilisé dans <ToastProvider>.");
  return ctx;
}
