"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Trash2 } from "lucide-react";
import { restoreProject, deleteProjectPermanently } from "@/lib/actions/projects";

// Actions de la corbeille : restaurer, ou supprimer définitivement (administrateurs).
export default function TrashRowActions({
  projectId,
  projectName,
  canDelete,
}: {
  projectId: string;
  projectName: string;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function restore() {
    startTransition(async () => {
      const res = await restoreProject(projectId);
      if (res?.error) alert(res.error);
      else router.refresh();
    });
  }

  function destroy() {
    if (
      !confirm(
        `Supprimer définitivement « ${projectName} » ?\n\nCette action est irréversible et supprime aussi les interventions, indicateurs et documents rattachés.`
      )
    )
      return;
    startTransition(async () => {
      const res = await deleteProjectPermanently(projectId);
      if (res?.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        onClick={restore}
        disabled={pending}
        className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <RotateCcw size={13} /> Restaurer
      </button>
      {canDelete && (
        <button
          onClick={destroy}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
        >
          <Trash2 size={13} /> Supprimer définitivement
        </button>
      )}
    </div>
  );
}
