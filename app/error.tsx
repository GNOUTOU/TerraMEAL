"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 text-center dark:bg-slate-950">
      <p className="text-lg font-semibold text-red-600">Une erreur est survenue</p>
      <p className="max-w-md text-sm text-slate-500">{error.message || "Erreur inattendue."}</p>
      <button onClick={() => reset()} className="mt-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
        Réessayer
      </button>
    </div>
  );
}
