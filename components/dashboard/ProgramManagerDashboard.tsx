import Link from "next/link";
import { KpiCard, Card } from "@/components/ui/Card";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import FilterBar from "@/components/ui/FilterBar";
import EChart from "@/components/charts/EChart";
import { FolderKanban, MapPinned, Users, Gauge, ArrowRight } from "lucide-react";
import {
  getDashboardKpis,
  getFilterOptions,
  getInterventionsBySector,
  getIndicatorPerformance,
  getMyProjectsSummary,
  type DashboardFilters,
} from "@/lib/queries/dashboard";
import { EmptyState } from "@/components/ui/PageHeader";

// Vue Responsable Programme : scope automatique (RLS) sur les projets attribués — pas besoin de
// filtrer manuellement pour retrouver "ses" données, elles sont déjà les seules visibles.
export default async function ProgramManagerDashboard({ filters }: { filters: DashboardFilters }) {
  const [kpis, options, bySector, indicatorPerf, myProjects] = await Promise.all([
    getDashboardKpis(filters),
    getFilterOptions(),
    getInterventionsBySector(filters),
    getIndicatorPerformance(),
    getMyProjectsSummary(),
  ]);

  if (myProjects.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Aucun projet ne vous est attribué"
        description="Contactez un administrateur pour qu'il vous rattache à un ou plusieurs projets."
      />
    );
  }

  return (
    <div>
      <Card className="mb-6">
        <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <FolderKanban size={16} className="text-slate-400" /> Vos projets ({myProjects.length})
        </h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {myProjects.map((p) => (
            <Link
              key={p.id}
              href={`/projects/${p.id}`}
              className="flex flex-col gap-1.5 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-300 hover:shadow-sm dark:border-slate-800 dark:hover:border-emerald-800"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{p.name}</span>
                <ProjectStatusBadge status={p.status as never} />
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <MapPinned size={12} /> {p.interventions_count}
                </span>
                <span className="flex items-center gap-1">
                  <Users size={12} /> {p.beneficiaries.toLocaleString("fr-FR")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </Card>

      {myProjects.length > 1 && (
        <FilterBar
          filters={[
            { key: "project", label: "Tous vos projets", options: options.projects.map((p) => ({ value: p.id, label: p.name })) },
            { key: "sector", label: "Tous les secteurs", options: options.sectors.map((s) => ({ value: s.id, label: s.name })) },
          ]}
        />
      )}

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={FolderKanban} label="Vos projets actifs" value={myProjects.filter((p) => p.status === "active").length} hint={`sur ${myProjects.length} au total`} />
        <KpiCard icon={MapPinned} color="blue" label="Réalisations" value={kpis?.interventions_count ?? "–"} hint="validées / publiées" />
        <KpiCard icon={Users} color="violet" label="Bénéficiaires (agrégés)" value={(kpis?.beneficiaries_total ?? 0).toLocaleString("fr-FR")} />
        <KpiCard icon={Gauge} color="amber" label="Communes couvertes" value={kpis?.communes_covered ?? "–"} hint={`${kpis?.localities_covered ?? 0} localités`} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Vos interventions par secteur</h2>
          {bySector.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          ) : (
            <EChart
              option={{
                tooltip: { trigger: "item" },
                series: [
                  {
                    type: "pie",
                    radius: ["45%", "75%"],
                    itemStyle: { borderColor: "#fff", borderWidth: 2 },
                    label: { formatter: "{b}: {c}" },
                    data: bySector.map((s) => ({ name: s.name, value: s.count, itemStyle: { color: s.color } })),
                  },
                ],
              }}
            />
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Cible vs Réalisé</h2>
            <Link href="/indicators" className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
              Voir tous les indicateurs <ArrowRight size={12} />
            </Link>
          </div>
          {indicatorPerf.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucun résultat renseigné</p>
          ) : (
            <EChart
              option={{
                tooltip: { trigger: "axis" },
                legend: { data: ["Cible", "Réalisé"] },
                grid: { left: 40, right: 20, top: 40, bottom: 60 },
                xAxis: { type: "category", data: indicatorPerf.map((i) => i.indicators?.code ?? "?"), axisLabel: { rotate: 30 } },
                yAxis: { type: "value" },
                series: [
                  { name: "Cible", type: "bar", data: indicatorPerf.map((i) => i.target_value ?? 0), itemStyle: { color: "#94a3b8" } },
                  { name: "Réalisé", type: "bar", data: indicatorPerf.map((i) => i.actual_value ?? 0), itemStyle: { color: "#2563eb" } },
                ],
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
}
