"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Mail, Lock, LogIn, CircleAlert } from "lucide-react";
import { signIn } from "@/lib/actions/auth";

export default function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
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
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="vous@organisation.org"
          />
        </div>
      </div>
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Mot de passe
          </label>
          <Link href="/forgot-password" className="text-xs text-emerald-600 hover:underline">
            Mot de passe oublié ?
          </Link>
        </div>
        <div className="relative">
          <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
            placeholder="••••••••"
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
        <LogIn size={16} /> {pending ? "Connexion en cours..." : "Se connecter"}
      </button>
    </form>
  );
}
