import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Card, KpiCard } from "@/components/ui/Card";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import MapView from "@/components/map/MapView";
import ExportMenu from "@/components/ui/ExportMenu";
import { interventionsToFeatureCollection } from "@/lib/geo";
import Link from "next/link";
import DonorSelect from "./DonorSelect";
import SectionTitle from "@/components/ui/SectionTitle";
import { HandCoins, FolderKanban, MapPinned, Users, Wallet, Map, Gauge } from "lucide-react";

export default async function DonorViewPage({
  searchParams,
}: {
  searchParams: Promise<{ donor?: string }>;
}) {
  const { profile } = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();

  let donorId = profile.role === "donor" ? profile.donor_id : sp.donor;

  const { data: donors } =
    profile.role === "admin" || profile.role === "meal_sig" ? await supabase.from("donors").select("id, name").order("name") : { data: null };

  if (!donorId && donors && donors.length > 0) donorId = donors[0].id;

  if (!donorId) {
    return <EmptyState icon={HandCoins} title="Aucun bailleur associé" description="Ce compte n'est associé à aucun bailleur. Contactez un administrateur." />;
  }

  const { data: donor } = await supabase.from("donors").select("*").eq("id", donorId).single();
  const { data: projectLinks } = await supabase.from("project_donors").select("project_id, amount, currency, projects(*)").eq("donor_id", donorId);
  const projectIds = (projectLinks ?? []).map((l) => l.project_id);

  const { data: interventions } =
    projectIds.length > 0
      ? await supabase.from("interventions_geo").select("*").in("project_id", projectIds).in("validation_status", ["validated", "published"])
      : { data: [] };

  const { data: indicatorResults } =
    projectIds.length > 0
      ? await supabase.from("indicator_results_with_rate").select("*, indicators(code, label)").in("project_id", projectIds).order("period", { ascending: false }).limit(10)
      : { data: [] };

  const beneficiariesTotal = (interventions ?? []).reduce((s, i) => s + (i.beneficiaries_total ?? 0), 0);
  const features = interventionsToFeatureCollection((interventions ?? []) as never[]);

  return (
    <div>
      <PageHeader
        title={`Vue Bailleur — ${donor?.name ?? ""}`}
        description="Portefeuille de projets financés, réalisations et indicateurs."
        icon={HandCoins}
        actions={
          <div className="flex items-center gap-2">
            {donors && donors.length > 1 && <DonorSelect donors={donors} current={donorId} />}
            <ExportMenu baseUrl="/api/export/interventions" formats={[{ format: "csv", label: "CSV" }, { format: "geojson", label: "GeoJSON" }]} />
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={FolderKanban} label="Projets financés" value={projectLinks?.length ?? 0} />
        <KpiCard icon={MapPinned} color="blue" label="Réalisations" value={interventions?.length ?? 0} />
        <KpiCard icon={Users} color="violet" label="Bénéficiaires (agrégés)" value={beneficiariesTotal.toLocaleString("fr-FR")} />
        <KpiCard
          icon={Wallet}
          color="amber"
          label="Montant engagé"
          value={(projectLinks ?? []).reduce((s, l) => s + (l.amount ?? 0), 0).toLocaleString("fr-FR")}
        />
      </div>

      <Card className="mb-4">
        <SectionTitle icon={Map} className="mb-3">Carte des réalisations</SectionTitle>
        <div style={{ height: 320 }}>
          <MapView points={features} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={FolderKanban} className="mb-3">Projets financés</SectionTitle>
          <div className="space-y-2">
            {(projectLinks ?? []).map((l) => {
              const p = (l as unknown as { projects: { id: string; name: string; code: string; status: string } }).projects;
              return (
                <Link key={l.project_id} href={`/projects/${p.id}`} className="flex items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <span className="text-sm text-slate-700 dark:text-slate-200">{p.name}</span>
                  <ProjectStatusBadge status={p.status as never} />
                </Link>
              );
            })}
            {(projectLinks?.length ?? 0) === 0 && <p className="text-sm text-slate-400">Aucun projet financé.</p>}
          </div>
        </Card>

        <Card>
          <SectionTitle icon={Gauge} className="mb-3">Indicateurs récents</SectionTitle>
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400">
              <tr>
                <th className="py-1">Indicateur</th>
                <th className="py-1">Période</th>
                <th className="py-1">Taux</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {((indicatorResults as unknown as { id: string; period: string; achievement_rate: number | null; indicators: { code: string; label: string } }[]) ?? []).map((r) => (
                <tr key={r.id}>
                  <td className="py-1.5">{r.indicators?.code}</td>
                  <td className="py-1.5 text-slate-500">{r.period}</td>
                  <td className="py-1.5 font-medium text-emerald-600">{r.achievement_rate != null ? `${r.achievement_rate}%` : "—"}</td>
                </tr>
              ))}
              {(indicatorResults?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">
                    Aucun résultat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}
