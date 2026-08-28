import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import FilterBar from "@/components/ui/FilterBar";
import { ValidationStatusBadge } from "@/components/ui/Badge";
import MapView from "@/components/map/MapView";
import Pagination from "@/components/ui/Pagination";
import { getFilterOptions } from "@/lib/queries/dashboard";
import { interventionsToFeatureCollection } from "@/lib/geo";
import ExportMenu from "@/components/ui/ExportMenu";
import { MapPinned, Plus } from "lucide-react";
import type { ValidationStatus } from "@/lib/types";

const PAGE_SIZE = 20;
// Filet de sécurité réseau : la carte affiche tous les points correspondant aux filtres (c'est
// l'objet même du WebGIS), mais on plafonne pour éviter de charger un payload démesuré si les
// filtres sont trop larges sur un très gros volume.
const MAP_ROWS_CAP = 3000;

// Colonnes minimales pour la carte — le tableau (paginé, select("*")) porte le détail complet.
const MAP_COLUMNS = "id, name, type, status, validation_status, sector_name, sector_color, project_name, admin_zone_name, geom_json";

export default async function InterventionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { profile } = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();
  const currentPage = Math.max(1, Number(sp.page) || 1);

  let mapQuery = supabase.from("interventions_geo").select(MAP_COLUMNS);
  let tableQuery = supabase.from("interventions_geo").select("*", { count: "exact" });
  if (sp.project) {
    mapQuery = mapQuery.eq("project_id", sp.project);
    tableQuery = tableQuery.eq("project_id", sp.project);
  }
  if (sp.sector) {
    mapQuery = mapQuery.eq("sector_id", sp.sector);
    tableQuery = tableQuery.eq("sector_id", sp.sector);
  }
  if (sp.zone) {
    mapQuery = mapQuery.eq("admin_zone_id", sp.zone);
    tableQuery = tableQuery.eq("admin_zone_id", sp.zone);
  }
  if (sp.status) {
    mapQuery = mapQuery.eq("validation_status", sp.status);
    tableQuery = tableQuery.eq("validation_status", sp.status);
  }
  if (sp.q) {
    mapQuery = mapQuery.ilike("name", `%${sp.q}%`);
    tableQuery = tableQuery.ilike("name", `%${sp.q}%`);
  }
  const mapQueryFinal = mapQuery.limit(MAP_ROWS_CAP);
  const tableQueryFinal = tableQuery.order("date", { ascending: false }).range((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE - 1);

  const [{ data: mapRows }, { data: rows, count }, options] = await Promise.all([mapQueryFinal, tableQueryFinal, getFilterOptions()]);
  const features = interventionsToFeatureCollection((mapRows ?? []) as never[]);
  const legend = options.sectors.map((s) => ({ id: s.id, label: s.name, color: (s as { color?: string }).color ?? "#2563eb" }));
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const cleanParams = Object.fromEntries(Object.entries(sp).filter(([, v]) => v !== undefined)) as Record<string, string>;

  return (
    <div>
      <PageHeader
        title="Interventions"
        description="Réalisations géolocalisées : infrastructures, activités et interventions."
        icon={MapPinned}
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
              <Link href="/interventions/new" className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700">
                <Plus size={15} /> Nouvelle réalisation
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
        <MapView points={features} legend={legend} />
      </div>

      {!rows || rows.length === 0 ? (
        <EmptyState icon={MapPinned} title="Aucune réalisation trouvée" description="Ajustez les filtres ou créez une nouvelle réalisation." />
      ) : (
        <>
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
                {(rows as unknown as { id: string; name: string; type: string; project_name: string; admin_zone_name: string; date: string; validation_status: ValidationStatus }[]).map((i) => (
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

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={count ?? 0}
            pageSize={PAGE_SIZE}
            basePath="/interventions"
            searchParams={sp}
          />
        </>
      )}
    </div>
  );
}
