"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { KeyRound, CircleAlert, CheckCircle2 } from "lucide-react";
import { updatePassword } from "@/lib/actions/auth";

export default function UpdatePasswordPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => router.push("/dashboard"), 1500);
      return () => clearTimeout(t);
    }
  }, [state?.success, router]);

  if (state?.success) {
    return (
      <div className="space-y-3 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <CheckCircle2 size={22} strokeWidth={1.75} />
        </div>
        <p className="text-sm text-emerald-700 dark:text-emerald-400">Mot de passe mis à jour. Redirection...</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">Choisissez un nouveau mot de passe.</p>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Nouveau mot de passe
        </label>
        <div className="relative">
          <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>
      <div>
        <label htmlFor="confirm" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Confirmer le mot de passe
        </label>
        <div className="relative">
          <KeyRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="confirm"
            name="confirm"
            type="password"
            required
            minLength={8}
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>
      {state?.error && (
        <p className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          <CircleAlert size={15} className="mt-0.5 shrink-0" /> {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        <KeyRound size={15} /> {pending ? "Mise à jour..." : "Mettre à jour"}
      </button>
    </form>
  );
}
