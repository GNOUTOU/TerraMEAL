"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Globe2, XCircle, Archive, Check } from "lucide-react";
import { setValidationStatus } from "@/lib/actions/interventions";

export default function ValidationActions({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  function transition(status: string, rejectionReason?: string) {
    startTransition(async () => {
      await setValidationStatus(id, status, rejectionReason);
      router.refresh();
      setShowReject(false);
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {current !== "validated" && current !== "published" && (
        <button
          disabled={pending}
          onClick={() => transition("validated")}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <ShieldCheck size={14} /> Valider
        </button>
      )}
      {current === "validated" && (
        <button
          disabled={pending}
          onClick={() => transition("published")}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          <Globe2 size={14} /> Publier
        </button>
      )}
      {current !== "rejected" && (
        <button
          disabled={pending}
          onClick={() => setShowReject((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300"
        >
          <XCircle size={14} /> Rejeter
        </button>
      )}
      {current !== "archived" && (
        <button
          disabled={pending}
          onClick={() => transition("archived")}
          className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
        >
          <Archive size={14} /> Archiver
        </button>
      )}
      {showReject && (
        <div className="mt-2 flex w-full items-center gap-2">
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du rejet (RG12 : conservé pour traçabilité)"
            className="flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800"
          />
          <button
            disabled={pending || !reason}
            onClick={() => transition("rejected", reason)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            <Check size={14} /> Confirmer
          </button>
        </div>
      )}
    </div>
  );
}
