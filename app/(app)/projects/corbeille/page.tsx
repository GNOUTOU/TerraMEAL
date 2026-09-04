import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import TrashRowActions from "./TrashRowActions";
import { Trash2, ArrowLeft } from "lucide-react";
import type { Project } from "@/lib/types";

export default async function ProjectsTrashPage() {
  const { profile } = await requireRole(["admin", "meal_sig"]);
  const supabase = await createClient();
  const isAdmin = profile.role === "admin";

  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .not("deleted_at", "is", null)
    .order("deleted_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Corbeille — Projets"
        description="Projets supprimés. Ils n'apparaissent nulle part ailleurs et peuvent être restaurés."
        icon={Trash2}
        actions={
          <Link
            href="/projects"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <ArrowLeft size={15} /> Retour aux projets
          </Link>
        }
      />

      {!projects || projects.length === 0 ? (
        <EmptyState icon={Trash2} title="La corbeille est vide" description="Les projets supprimés depuis la liste apparaîtront ici." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Nom</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5 font-medium">Supprimé le</th>
                <th className="px-4 py-2.5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(projects as Project[]).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.code}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{p.name}</td>
                  <td className="px-4 py-3">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.deleted_at ? new Date(p.deleted_at).toLocaleString("fr-FR") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <TrashRowActions projectId={p.id} projectName={p.name} canDelete={isAdmin} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
