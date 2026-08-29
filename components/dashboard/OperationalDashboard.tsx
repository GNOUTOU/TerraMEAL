import Link from "next/link";
import { KpiCard, Card } from "@/components/ui/Card";
import FilterBar from "@/components/ui/FilterBar";
import EChart from "@/components/charts/EChart";
import { FolderKanban, MapPinned, Users, Landmark, ShieldAlert, PartyPopper, ArrowRight, Clock, RefreshCw } from "lucide-react";
import {
  getDashboardKpis,
  getFilterOptions,
  getInterventionsBySector,
  getInterventionsByStatusAndYear,
  getIndicatorPerformance,
  getQualityAlertsSummary,
  getDataFreshnessSummary,
  type DashboardFilters,
} from "@/lib/queries/dashboard";
import { ANOMALY_TYPE_LABELS, VALIDATION_STATUS_LABELS } from "@/lib/types";

export default async function OperationalDashboard({ filters }: { filters: DashboardFilters }) {
  const [kpis, options, bySector, byStatusYear, indicatorPerf, quality, freshness] = await Promise.all([
    getDashboardKpis(filters),
    getFilterOptions(),
    getInterventionsBySector(filters),
    getInterventionsByStatusAndYear(filters),
    getIndicatorPerformance(),
    getQualityAlertsSummary(),
    getDataFreshnessSummary(),
  ]);

  return (
    <div>
      <FilterBar
        filters={[
          { key: "project", label: "Tous les projets", options: options.projects.map((p) => ({ value: p.id, label: p.name })) },
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
        <Card className="lg:col-span-1">
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

        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Réalisations par année</h2>
          {byStatusYear.byYear.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucune donnée</p>
          ) : (
            <EChart
              option={{
                tooltip: { trigger: "axis" },
                xAxis: { type: "category", data: byStatusYear.byYear.map((y) => y.year) },
                yAxis: { type: "value" },
                grid: { left: 40, right: 20, top: 20, bottom: 30 },
                series: [{ type: "bar", data: byStatusYear.byYear.map((y) => y.count), itemStyle: { color: "#059669" }, barMaxWidth: 40 }],
              }}
            />
          )}
        </Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Statut de validation des données</h2>
          <EChart
            option={{
              tooltip: { trigger: "item" },
              series: [
                {
                  type: "pie",
                  radius: "70%",
                  data: byStatusYear.byStatus.map((s) => ({
                    name: VALIDATION_STATUS_LABELS[s.status as keyof typeof VALIDATION_STATUS_LABELS] ?? s.status,
                    value: s.count,
                  })),
                },
              ],
            }}
          />
        </Card>

        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Cible vs Réalisé — indicateurs récents</h2>
          {indicatorPerf.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucun résultat renseigné</p>
          ) : (
            <EChart
              option={{
                tooltip: { trigger: "axis" },
                legend: { data: ["Cible", "Réalisé"] },
                grid: { left: 40, right: 20, top: 40, bottom: 60 },
                xAxis: {
                  type: "category",
                  data: indicatorPerf.map((i) => i.indicators?.code ?? "?"),
                  axisLabel: { rotate: 30 },
                },
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

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <ShieldAlert size={16} className="text-slate-400" /> Alertes qualité (18.4)
          </h2>
          <Link href="/quality" className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
            Voir le module Qualité <ArrowRight size={12} />
          </Link>
        </div>
        {quality.open === 0 ? (
          <p className="flex items-center gap-1.5 text-sm text-slate-400">
            <PartyPopper size={15} className="text-emerald-500" /> Aucune anomalie ouverte.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            <span className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
              {quality.blocking} bloquante(s)
            </span>
            {quality.byType.map((t) => (
              <span key={t.type} className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {ANOMALY_TYPE_LABELS[t.type as keyof typeof ANOMALY_TYPE_LABELS] ?? t.type}: {t.count}
              </span>
            ))}
          </div>
        )}
      </Card>

      {(freshness.stale > 0 || freshness.failedSyncs.length > 0) && (
        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {freshness.stale > 0 && (
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
                  <Clock size={16} /> Données anciennes
                </h2>
                <Link href="/quality" className="flex items-center gap-1 text-xs text-amber-700 hover:underline dark:text-amber-300">
                  Voir <ArrowRight size={12} />
                </Link>
              </div>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                {freshness.stale} réalisation(s) validée(s)/publiée(s) n&apos;ont pas été rafraîchies depuis le seuil de fraîcheur configuré.
              </p>
            </Card>
          )}

          {freshness.failedSyncs.length > 0 && (
            <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-red-800 dark:text-red-300">
                  <RefreshCw size={16} /> Synchronisations en échec
                </h2>
                <Link href="/admin/sources" className="flex items-center gap-1 text-xs text-red-700 hover:underline dark:text-red-300">
                  Voir <ArrowRight size={12} />
                </Link>
              </div>
              <ul className="space-y-1 text-sm text-red-700 dark:text-red-300">
                {freshness.failedSyncs.map((s) => (
                  <li key={s.id}>
                    <span className="font-medium">{s.name}</span> — {s.last_sync_status}
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
