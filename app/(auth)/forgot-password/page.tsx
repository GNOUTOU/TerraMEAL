"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Si un compte existe pour cet e-mail, un lien de récupération vient d&apos;être envoyé.
        </p>
        <Link href="/login" className="text-sm text-emerald-600 hover:underline">
          Retour à la connexion
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Renseignez votre e-mail pour recevoir un lien de réinitialisation.
      </p>
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Adresse e-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
        />
      </div>
      {state?.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Envoyer le lien"}
      </button>
      <Link href="/login" className="block text-center text-sm text-emerald-600 hover:underline">
        Retour à la connexion
      </Link>
    </form>
  );
}
