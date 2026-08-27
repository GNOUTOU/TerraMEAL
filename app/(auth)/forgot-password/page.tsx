"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Send, CircleAlert, MailCheck, ArrowLeft } from "lucide-react";
import { requestPasswordReset } from "@/lib/actions/auth";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  if (state?.success) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
          <MailCheck size={22} strokeWidth={1.75} />
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Si un compte existe pour cet e-mail, un lien de récupération vient d&apos;être envoyé.
        </p>
        <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 hover:underline">
          <ArrowLeft size={14} /> Retour à la connexion
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
        <div className="relative">
          <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="email"
            name="email"
            type="email"
            required
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
        <Send size={15} /> {pending ? "Envoi..." : "Envoyer le lien"}
      </button>
      <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-emerald-600 hover:underline">
        <ArrowLeft size={14} /> Retour à la connexion
      </Link>
    </form>
  );
}
