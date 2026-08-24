import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import FilterBar from "@/components/ui/FilterBar";
import { ValidationStatusBadge } from "@/components/ui/Badge";
import MapView from "@/components/map/MapView";
import { getFilterOptions } from "@/lib/queries/dashboard";
import { interventionsToFeatureCollection } from "@/lib/geo";
import ExportMenu from "@/components/ui/ExportMenu";

export default async function InterventionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("interventions_geo").select("*").order("date", { ascending: false });
  if (sp.project) query = query.eq("project_id", sp.project);
  if (sp.sector) query = query.eq("sector_id", sp.sector);
  if (sp.zone) query = query.eq("admin_zone_id", sp.zone);
  if (sp.status) query = query.eq("validation_status", sp.status);
  if (sp.q) query = query.ilike("name", `%${sp.q}%`);

  const [{ data: interventions }, options] = await Promise.all([query, getFilterOptions()]);
  const rows = interventions ?? [];
  const features = interventionsToFeatureCollection(rows as never[]);
  const cleanParams = Object.fromEntries(Object.entries(sp).filter(([, v]) => v !== undefined)) as Record<string, string>;

  return (
    <div>
      <PageHeader
        title="Interventions"
        description="Réalisations géolocalisées : infrastructures, activités et interventions."
        actions={
          <>
            <ExportMenu
              baseUrl={`/api/export/interventions?${new URLSearchParams(cleanParams).toString()}`}
              formats={[
                { format: "csv", label: "CSV" },
                { format: "excel", label: "Excel" },
                { format: "geojson", label: "GeoJSON" },
              ]}
            />
            {canWriteOperationalData(profile.role) && (
              <Link href="/interventions/new" className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                Nouvelle réalisation
              </Link>
            )}
          </>
        }
      />

      <FilterBar
        filters={[
          { key: "project", label: "Tous les projets", options: options.projects.map((p) => ({ value: p.id, label: p.name })) },
          { key: "sector", label: "Tous les secteurs", options: options.sectors.map((s) => ({ value: s.id, label: s.name })) },
          { key: "zone", label: "Toutes les zones", options: options.zones.map((z) => ({ value: z.id, label: z.name })) },
          {
            key: "status",
            label: "Tous les statuts",
            options: [
              { value: "imported", label: "Importé" },
              { value: "to_verify", label: "À vérifier" },
              { value: "validated", label: "Validé" },
              { value: "published", label: "Publié" },
              { value: "rejected", label: "Rejeté" },
            ],
          },
        ]}
      />

      <div className="mb-4" style={{ height: 360 }}>
        <MapView points={features} />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="Aucune réalisation trouvée" description="Ajustez les filtres ou créez une nouvelle réalisation." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Nom</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Projet</th>
                <th className="px-4 py-2.5 font-medium">Zone</th>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {(rows as unknown as { id: string; name: string; type: string; project_name: string; admin_zone_name: string; date: string; validation_status: import("@/lib/types").ValidationStatus }[]).map((i) => (
                <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <Link href={`/interventions/${i.id}`} className="font-medium text-slate-800 hover:text-emerald-600 dark:text-slate-100">
                      {i.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{i.type}</td>
                  <td className="px-4 py-3 text-slate-500">{i.project_name}</td>
                  <td className="px-4 py-3 text-slate-500">{i.admin_zone_name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500">{i.date ?? "—"}</td>
                  <td className="px-4 py-3">
                    <ValidationStatusBadge status={i.validation_status} />
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
