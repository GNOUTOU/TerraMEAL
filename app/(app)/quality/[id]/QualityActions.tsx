"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { UserCheck, CheckCircle2, XCircle, Archive } from "lucide-react";
import { updateAnomalyStatus } from "@/lib/actions/anomalies";

export default function QualityActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  function apply(newStatus: string) {
    startTransition(async () => {
      await updateAnomalyStatus(id, newStatus, comment || undefined);
      setComment("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Ajouter un commentaire..."
        rows={2}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      />
      <div className="flex flex-wrap gap-2">
        {status !== "in_review" && (
          <button
            disabled={pending}
            onClick={() => apply("in_review")}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-950 dark:text-blue-300 disabled:opacity-60"
          >
            <UserCheck size={14} /> Prendre en charge
          </button>
        )}
        {status !== "corrected" && (
          <button
            disabled={pending}
            onClick={() => apply("corrected")}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            <CheckCircle2 size={14} /> Marquer comme corrigée
          </button>
        )}
        {status !== "rejected" && (
          <button
            disabled={pending}
            onClick={() => apply("rejected")}
            className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 disabled:opacity-60"
          >
            <XCircle size={14} /> Rejeter (faux positif)
          </button>
        )}
        {status !== "closed" && (
          <button
            disabled={pending}
            onClick={() => apply("closed")}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 disabled:opacity-60"
          >
            <Archive size={14} /> Clôturer
          </button>
        )}
      </div>
    </div>
  );
}
