"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center dark:bg-slate-950">
      <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950 dark:text-red-400">
        <AlertTriangle size={26} strokeWidth={1.75} />
      </div>
      <p className="text-lg font-semibold text-red-600">Une erreur est survenue</p>
      <p className="max-w-md text-sm text-slate-500">{error.message || "Erreur inattendue."}</p>
      <button onClick={() => reset()} className="mt-2 flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
        <RotateCcw size={15} /> Réessayer
      </button>
    </div>
  );
}
