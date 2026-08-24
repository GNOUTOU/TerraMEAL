"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { addBeneficiaryBreakdown } from "@/lib/actions/interventions";

export default function BeneficiaryForm({ interventionId }: { interventionId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await addBeneficiaryBreakdown(interventionId, formData);
      (e.target as HTMLFormElement).reset();
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-[11px] text-slate-500">Sexe</label>
        <select name="sex" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
          <option value="">—</option>
          <option value="male">Homme</option>
          <option value="female">Femme</option>
          <option value="other">Autre</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-slate-500">Tranche d&apos;âge</label>
        <input name="age_bracket" placeholder="0-5, adulte..." className="w-28 rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800" />
      </div>
      <div>
        <label className="mb-1 block text-[11px] text-slate-500">Nombre</label>
        <input name="count" type="number" required className="w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800" />
      </div>
      <button type="submit" disabled={pending} className="rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-700">
        {pending ? "..." : "Ajouter"}
      </button>
    </form>
  );
}
