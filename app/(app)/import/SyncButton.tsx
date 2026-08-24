"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { syncKoboSource, syncMwaterSource } from "@/lib/actions/import";

export default function SyncButton({ sourceId, type }: { sourceId: string; type: "kobo" | "mwater" }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSync() {
    setMessage(null);
    startTransition(async () => {
      const result = type === "kobo" ? await syncKoboSource(sourceId) : await syncMwaterSource(sourceId);
      if ("error" in result && result.error) setMessage(`Erreur : ${result.error}`);
      else if ("success" in result) setMessage(`${result.success} enregistrement(s) importé(s).`);
      router.refresh();
    });
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={pending}
        className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        <RefreshCw size={13} className={pending ? "animate-spin" : ""} /> {pending ? "Synchronisation..." : "Synchroniser"}
      </button>
      {message && <p className="mt-1 text-xs text-slate-500">{message}</p>}
    </div>
  );
}
