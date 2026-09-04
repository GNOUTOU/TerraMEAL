import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import FilterBar from "@/components/ui/FilterBar";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { getFilterOptions } from "@/lib/queries/dashboard";
import ExportMenu from "@/components/ui/ExportMenu";
import Pagination from "@/components/ui/Pagination";
import ProjectRowActions from "./ProjectRowActions";
import { FolderKanban, Plus, Trash2 } from "lucide-react";
import type { Project } from "@/lib/types";
import { yearOptions } from "@/lib/utils";

const PAGE_SIZE = 20;

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();
  const currentPage = Math.max(1, Number(sp.page) || 1);
  const canWrite = canWriteOperationalData(profile.role);
  const view = canWrite && sp.vue === "masques" ? "masques" : "actifs";

  let query = supabase
    .from("projects")
    .select("*", { count: "exact" })
    .is("deleted_at", null)
    .eq("is_hidden", view === "masques")
    .order("created_at", { ascending: false });
  if (sp.status) query = query.eq("status", sp.status);
  if (sp.donor) {
    const { data: linked } = await supabase.from("project_donors").select("project_id").eq("donor_id", sp.donor);
    query = query.in("id", (linked ?? []).map((l) => l.project_id).concat("00000000-0000-0000-0000-000000000000"));
  }
  if (sp.sector) {
    const { data: linked } = await supabase.from("project_sectors").select("project_id").eq("sector_id", sp.sector);
    query = query.in("id", (linked ?? []).map((l) => l.project_id).concat("00000000-0000-0000-0000-000000000000"));
  }
  if (sp.partner) {
    const { data: linked } = await supabase.from("project_partners").select("project_id").eq("partner_id", sp.partner);
    query = query.in("id", (linked ?? []).map((l) => l.project_id).concat("00000000-0000-0000-0000-000000000000"));
  }
  if (sp.year) query = query.eq("year", Number(sp.year));
  if (sp.q) query = query.or(`name.ilike.%${sp.q}%,code.ilike.%${sp.q}%`);
  query = query.range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

  const [{ data: projects, count }, options, { count: hiddenCount }, { count: trashCount }] = await Promise.all([
    query,
    getFilterOptions(),
    supabase.from("projects").select("id", { count: "exact", head: true }).is("deleted_at", null).eq("is_hidden", true),
    supabase.from("projects").select("id", { count: "exact", head: true }).not("deleted_at", "is", null),
  ]);
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  // Bailleurs et zones d'intervention pour la page courante (≤ 20 projets) — requêtes
  // séparées plutôt qu'un embed, comme sur la fiche projet.
  const projectIds = ((projects as Project[]) ?? []).map((p) => p.id).concat("00000000-0000-0000-0000-000000000000");
  const [{ data: donorRows }, { data: zoneRows }] = await Promise.all([
    supabase.from("project_donors").select("project_id, is_principal, donors(name)").in("project_id", projectIds),
    supabase.from("project_zones").select("project_id, admin_zones(name)").in("project_id", projectIds),
  ]);

  const donorsByProject = new Map<string, { name: string; isPrincipal: boolean }[]>();
  for (const row of (donorRows as unknown as { project_id: string; is_principal: boolean; donors: { name: string } | null }[]) ?? []) {
    if (!row.donors) continue;
    const list = donorsByProject.get(row.project_id) ?? [];
    list.push({ name: row.donors.name, isPrincipal: row.is_principal });
    donorsByProject.set(row.project_id, list);
  }
  const zonesByProject = new Map<string, string[]>();
  for (const row of (zoneRows as unknown as { project_id: string; admin_zones: { name: string } | null }[]) ?? []) {
    if (!row.admin_zones) continue;
    const list = zonesByProject.get(row.project_id) ?? [];
    list.push(row.admin_zones.name);
    zonesByProject.set(row.project_id, list);
  }

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium ${
      active
        ? "bg-emerald-600 text-white"
        : "border border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <div>
      <PageHeader
        title="Projets"
        description="Portefeuille de projets et programmes."
        icon={FolderKanban}
        actions={
          <>
            <ExportMenu baseUrl="/api/export/projects" formats={[{ format: "csv", label: "CSV" }, { format: "excel", label: "Excel" }]} />
            {canWrite && (
              <Link href="/projects/new" className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                <Plus size={15} /> Nouveau projet
              </Link>
            )}
          </>
        }
      />

      {canWrite && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Link href="/projects" className={tabClass(view === "actifs")}>
            Actifs
          </Link>
          <Link href="/projects?vue=masques" className={tabClass(view === "masques")}>
            Masqués{hiddenCount ? ` (${hiddenCount})` : ""}
          </Link>
          <Link
            href="/projects/corbeille"
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Trash2 size={14} /> Corbeille{trashCount ? ` (${trashCount})` : ""}
          </Link>
        </div>
      )}

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
          { key: "partner", label: "Tous les partenaires", options: options.partners.map((p) => ({ value: p.id, label: p.name })) },
          { key: "year", label: "Toutes les années", options: yearOptions() },
        ]}
      />

      {!projects || projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title={view === "masques" ? "Aucun projet masqué" : "Aucun projet trouvé"}
          description={view === "masques" ? "Les projets masqués depuis la liste apparaîtront ici." : "Ajustez les filtres ou créez un nouveau projet."}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Code</th>
                <th className="px-4 py-2.5 font-medium">Nom</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5 font-medium">Bailleur</th>
                <th className="px-4 py-2.5 font-medium">Zone d&apos;intervention</th>
                <th className="px-4 py-2.5 font-medium">Période</th>
                <th className="px-4 py-2.5 font-medium">Budget</th>
                {canWrite && <th className="px-4 py-2.5 text-right font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(projects as Project[]).map((p) => {
                const donorList = donorsByProject.get(p.id) ?? [];
                const principal = donorList.find((d) => d.isPrincipal) ?? donorList[0];
                const extraDonors = donorList.length - (principal ? 1 : 0);
                const zones = zonesByProject.get(p.id) ?? [];
                return (
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
                      {principal ? (
                        <>
                          {principal.name}
                          {extraDonors > 0 && <span className="text-slate-400"> +{extraDonors}</span>}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {zones.length === 0 ? "—" : zones.length <= 2 ? zones.join(", ") : `${zones.slice(0, 2).join(", ")} +${zones.length - 2}`}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.start_date ?? "?"} → {p.end_date ?? "?"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {p.budget ? `${p.budget.toLocaleString("fr-FR")} ${p.currency ?? ""}` : "—"}
                    </td>
                    {canWrite && (
                      <td className="px-4 py-3">
                        <ProjectRowActions projectId={p.id} projectName={p.name} isHidden={p.is_hidden} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={count ?? 0}
        pageSize={PAGE_SIZE}
        basePath="/projects"
        searchParams={sp}
      />
    </div>
  );
}
