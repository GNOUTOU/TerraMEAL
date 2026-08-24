"use client";

import { useActionState } from "react";
import { updatePassword } from "@/lib/actions/auth";

export default function UpdatePasswordInline() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Nouveau mot de passe</label>
        <input name="password" type="password" required minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Confirmer</label>
        <input name="confirm" type="password" required minLength={8} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800" />
      </div>
      {state?.error && <p className="text-xs text-red-600">{state.error}</p>}
      {state?.success && <p className="text-xs text-emerald-600">Mot de passe mis à jour.</p>}
      <button type="submit" disabled={pending} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
        {pending ? "..." : "Mettre à jour"}
      </button>
    </form>
  );
}
