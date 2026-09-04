import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import EChart from "@/components/charts/EChart";
import { Gauge } from "lucide-react";
import type { IndicatorResult } from "@/lib/types";
import ResultsTable from "./ResultsTable";

export default async function IndicatorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data: indicator } = await supabase.from("indicators").select("*, sectors(name)").eq("id", id).single();
  if (!indicator) notFound();

  const [{ data: results }, { data: projects }, { data: zones }] = await Promise.all([
    supabase.from("indicator_results_with_rate").select("*").eq("indicator_id", id).order("period"),
    supabase.from("projects").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("admin_zones").select("id, name").order("name"),
  ]);

  const rows = (results as IndicatorResult[]) ?? [];
  const canWrite = canWriteOperationalData(profile.role);

  return (
    <div>
      <PageHeader icon={Gauge} title={indicator.label} description={`${indicator.code} · ${(indicator as unknown as { sectors: { name: string } | null }).sectors?.name ?? ""}`} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Définition</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-xs text-slate-400">Définition</dt>
              <dd className="text-slate-600 dark:text-slate-300">{indicator.definition || "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-slate-400">Méthode de calcul</dt>
              <dd className="text-slate-600 dark:text-slate-300">{indicator.calculation_method || "—"}</dd>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-xs text-slate-400">Numérateur</dt>
                <dd className="text-slate-600 dark:text-slate-300">{indicator.numerator || "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-400">Dénominateur</dt>
                <dd className="text-slate-600 dark:text-slate-300">{indicator.denominator || "—"}</dd>
              </div>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Évolution cible vs réalisé</h2>
          {rows.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">Aucun résultat renseigné.</p>
          ) : (
            <EChart
              option={{
                tooltip: { trigger: "axis" },
                legend: { data: ["Cible", "Réalisé"] },
                grid: { left: 40, right: 20, top: 40, bottom: 30 },
                xAxis: { type: "category", data: rows.map((r) => r.period) },
                yAxis: { type: "value" },
                series: [
                  { name: "Cible", type: "line", data: rows.map((r) => r.target_value ?? null) },
                  { name: "Réalisé", type: "line", data: rows.map((r) => r.actual_value ?? null) },
                ],
              }}
            />
          )}
        </Card>
      </div>

      <Card className="mt-4">
        <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Résultats par période</h2>
        <ResultsTable
          indicatorId={id}
          rows={rows as (IndicatorResult & Record<string, unknown>)[]}
          projects={projects ?? []}
          zones={zones ?? []}
          canWrite={canWrite}
        />
      </Card>
    </div>
  );
}
