import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import FilterBar from "@/components/ui/FilterBar";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { getFilterOptions } from "@/lib/queries/dashboard";
import ExportMenu from "@/components/ui/ExportMenu";
import type { Project } from "@/lib/types";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("projects").select("*").order("created_at", { ascending: false });
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.donor) {
    const { data: linked } = await supabase.from("project_donors").select("project_id").eq("donor_id", sp.donor);
    query = query.in("id", (linked ?? []).map((l) => l.project_id).concat("00000000-0000-0000-0000-000000000000"));
  }
  if (sp.sector) {
    const { data: linked } = await supabase.from("project_sectors").select("project_id").eq("sector_id", sp.sector);
    query = query.in("id", (linked ?? []).map((l) => l.project_id).concat("00000000-0000-0000-0000-000000000000"));
  }
  if (sp.q) query = query.or(`name.ilike.%${sp.q}%,code.ilike.%${sp.q}%`);

  const [{ data: projects }, options] = await Promise.all([query, getFilterOptions()]);

  return (
    <div>
      <PageHeader
        title="Projets"
        description="Portefeuille de projets et programmes."
        actions={
          <>
            <ExportMenu baseUrl="/api/export/projects" formats={[{ format: "csv", label: "CSV" }, { format: "excel", label: "Excel" }]} />
            {canWriteOperationalData(profile.role) && (
              <Link href="/projects/new" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                Nouveau projet
              </Link>
            )}
          </>
        }
      />

      <FilterBar
        filters={[
          {
            key: "status",
            label: "Tous les statuts",
            options: [
              { value: "preparation", label: "En préparation" },
              { value: "active", label: "Actif" },
              { value: "suspended", label: "Suspendu" },
              { value: "closed", label: "Clôturé" },
              { value: "archived", label: "Archivé" },
            ],
          },
          { key: "sector", label: "Tous les secteurs", options: options.sectors.map((s) => ({ value: s.id, label: s.name })) },
          { key: "donor", label: "Tous les bailleurs", options: options.donors.map((d) => ({ value: d.id, label: d.name })) },
        ]}
      />

      {!projects || projects.length === 0 ? (
        <EmptyState title="Aucun projet trouvé" description="Ajustez les filtres ou créez un nouveau projet." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Nom</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5 font-medium">Période</th>
                <th className="px-4 py-2.5 font-medium">Budget</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(projects as Project[]).map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.code}</td>
                  <td className="px-4 py-3">
                    <Link href={`/projects/${p.id}`} className="font-medium text-slate-800 hover:text-emerald-600 dark:text-slate-100">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <ProjectStatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.start_date ?? "?"} → {p.end_date ?? "?"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {p.budget ? `${p.budget.toLocaleString("fr-FR")} ${p.currency ?? ""}` : "—"}
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
