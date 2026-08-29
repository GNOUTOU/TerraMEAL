import Link from "next/link";
import { KpiCard, Card } from "@/components/ui/Card";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import FilterBar from "@/components/ui/FilterBar";
import EChart from "@/components/charts/EChart";
import { FolderKanban, MapPinned, Users, Landmark, TrendingUp, Trophy, MapPin } from "lucide-react";
import {
  getDashboardKpis,
  getFilterOptions,
  getInterventionsBySector,
  getInterventionsByStatusAndYear,
  getPortfolioByStatus,
  getTopProjects,
  getZoneCoverage,
  type DashboardFilters,
} from "@/lib/queries/dashboard";
import { PROJECT_STATUS_LABELS } from "@/lib/types";

const STATUS_COLORS: Record<string, string> = {
  preparation: "#2563eb",
  active: "#059669",
  suspended: "#f59e0b",
  closed: "#64748b",
  archived: "#94a3b8",
};

// Vue exécutive (Direction) : lecture large du portefeuille, pas de détail opérationnel
// (pas d'alertes qualité, pas de workflow) — comparatif et tendances plutôt que gestion.
export default async function ExecutiveDashboard({ filters }: { filters: DashboardFilters }) {
  const [kpis, options, bySector, byStatusYear, portfolio, topProjects, coverage] = await Promise.all([
    getDashboardKpis(filters),
    getFilterOptions(),
    getInterventionsBySector(filters),
    getInterventionsByStatusAndYear(filters),
    getPortfolioByStatus(),
    getTopProjects(6),
    getZoneCoverage(8),
  ]);

  return (
    <div>
      <FilterBar
        filters={[
          { key: "sector", label: "Tous les secteurs", options: options.sectors.map((s) => ({ value: s.id, label: s.name })) },
          { key: "donor", label: "Tous les bailleurs", options: options.donors.map((d) => ({ value: d.id, label: d.name })) },
          { key: "zone", label: "Toutes les zones", options: options.zones.map((z) => ({ value: z.id, label: z.name })) },
        ]}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={FolderKanban} label="Projets actifs" value={kpis?.projects_active ?? "–"} hint={`sur ${kpis?.projects_total ?? 0} au total`} />
        <KpiCard icon={MapPinned} color="blue" label="Réalisations" value={kpis?.interventions_count ?? "–"} hint="validées / publiées" />
        <KpiCard icon={Users} color="violet" label="Bénéficiaires (agrégés)" value={(kpis?.beneficiaries_total ?? 0).toLocaleString("fr-FR")} />
        <KpiCard icon={Landmark} color="amber" label="Communes couvertes" value={kpis?.communes_covered ?? "–"} hint={`${kpis?.localities_covered ?? 0} localités`} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <TrendingUp size={16} className="text-slate-400" /> Santé du portefeuille
          </h2>
          {portfolio.length === 0 ? (
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
                    data: portfolio.map((p) => ({
                      name: PROJECT_STATUS_LABELS[p.status as keyof typeof PROJECT_STATUS_LABELS] ?? p.status,
                      value: p.count,
                      itemStyle: { color: STATUS_COLORS[p.status] ?? "#94a3b8" },
                    })),
                  },
                ],
              }}
            />
          )}
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Trophy size={16} className="text-slate-400" /> Projets par bénéficiaires atteints
          </h2>
          {topProjects.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          ) : (
            <div className="space-y-2.5">
              {topProjects.map((p, i) => {
                const max = topProjects[0]?.beneficiaries || 1;
                return (
                  <Link key={p.id} href={`/projects/${p.id}`} className="block">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-200">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-100 text-[10px] text-slate-500 dark:bg-slate-800">
                          {i + 1}
                        </span>
                        {p.name}
                      </span>
                      <span className="text-slate-400">{p.beneficiaries.toLocaleString("fr-FR")}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(4, (p.beneficiaries / max) * 100)}%` }} />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Interventions par secteur</h2>
          {bySector.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          ) : (
            <EChart
              option={{
                tooltip: { trigger: "item" },
                series: [
                  {
                    type: "pie",
                    radius: "70%",
                    label: { formatter: "{b}: {c}" },
                    data: bySector.map((s) => ({ name: s.name, value: s.count, itemStyle: { color: s.color } })),
                  },
                ],
              }}
            />
          )}
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Évolution des réalisations</h2>
          {byStatusYear.byYear.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          ) : (
            <EChart
              option={{
                tooltip: { trigger: "axis" },
                xAxis: { type: "category", data: byStatusYear.byYear.map((y) => y.year) },
                yAxis: { type: "value" },
                grid: { left: 40, right: 20, top: 20, bottom: 30 },
                series: [{ type: "line", smooth: true, areaStyle: { opacity: 0.15 }, data: byStatusYear.byYear.map((y) => y.count), itemStyle: { color: "#0B4F6C" } }],
              }}
            />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Portefeuille par statut</h2>
          <div className="flex flex-wrap gap-2">
            {portfolio.map((p) => (
              <div key={p.status} className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-slate-800">
                <ProjectStatusBadge status={p.status as never} />
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{p.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <MapPin size={16} className="text-slate-400" /> Communes les moins couvertes
          </h2>
          {coverage.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          ) : (
            <ul className="space-y-1.5">
              {coverage.map((z) => (
                <li key={z.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-200">{z.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      z.count === 0
                        ? "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    {z.count} réalisation(s)
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
