"use client";

import Link from "next/link";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Eye, EyeOff, Trash2 } from "lucide-react";
import { setProjectHidden, trashProject } from "@/lib/actions/projects";

// Colonne « Actions » du tableau des projets : modifier, masquer/afficher, supprimer
// (vers la corbeille). Rendu client car chaque bouton déclenche une action serveur.
export default function ProjectRowActions({
  projectId,
  projectName,
  isHidden,
}: {
  projectId: string;
  projectName: string;
  isHidden: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function toggleHidden() {
    startTransition(async () => {
      const res = await setProjectHidden(projectId, !isHidden);
      if (res?.error) alert(res.error);
      else router.refresh();
    });
  }

  function moveToTrash() {
    if (!confirm(`Envoyer « ${projectName} » dans la corbeille ?\n\nLe projet sera masqué partout mais pourra être restauré depuis la corbeille.`)) return;
    startTransition(async () => {
      const res = await trashProject(projectId);
      if (res?.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        href={`/projects/${projectId}#modifier`}
        aria-label={`Modifier — ${projectName}`}
        title="Modifier"
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
      >
        <Pencil size={15} aria-hidden="true" />
      </Link>
      <button
        onClick={toggleHidden}
        disabled={pending}
        aria-label={isHidden ? `Afficher — ${projectName}` : `Masquer — ${projectName}`}
        title={isHidden ? "Afficher" : "Masquer"}
        className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50 dark:hover:bg-slate-700"
      >
        {isHidden ? <Eye size={15} aria-hidden="true" /> : <EyeOff size={15} aria-hidden="true" />}
      </button>
      <button
        onClick={moveToTrash}
        disabled={pending}
        aria-label={`Supprimer — ${projectName}`}
        title="Supprimer (corbeille)"
        className="rounded p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/40"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
