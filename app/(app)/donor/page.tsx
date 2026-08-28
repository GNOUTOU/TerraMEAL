import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import { Card, KpiCard } from "@/components/ui/Card";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import MapView from "@/components/map/MapView";
import ExportMenu from "@/components/ui/ExportMenu";
import { interventionsToFeatureCollection } from "@/lib/geo";
import Link from "next/link";
import PartnerOrgSelect from "./PartnerOrgSelect";
import SectionTitle from "@/components/ui/SectionTitle";
import { HandCoins, Handshake, FolderKanban, MapPinned, Users, Wallet, Map, Gauge, Download } from "lucide-react";

export default async function DonorPartnerViewPage({
  searchParams,
}: {
  searchParams: Promise<{ donor?: string; partner?: string }>;
}) {
  const { profile } = await requireUser();
  const sp = await searchParams;
  const supabase = await createClient();

  const isPartnerRole = profile.role === "partner";
  const scopeType: "donor" | "partner" = isPartnerRole ? "partner" : profile.role === "donor" ? "donor" : sp.partner ? "partner" : "donor";

  let orgId = isPartnerRole ? profile.partner_id : profile.role === "donor" ? profile.donor_id : scopeType === "partner" ? sp.partner : sp.donor;

  const canPreview = profile.role === "admin" || profile.role === "meal_sig";
  const { data: donorList } = canPreview ? await supabase.from("donors").select("id, name").order("name") : { data: null };
  const { data: partnerList } = canPreview ? await supabase.from("partners").select("id, name").order("name") : { data: null };

  if (!orgId && canPreview) {
    const list = scopeType === "partner" ? partnerList : donorList;
    if (list && list.length > 0) orgId = list[0].id;
  }

  const icon = scopeType === "partner" ? Handshake : HandCoins;
  const label = scopeType === "partner" ? "Partenaire" : "Bailleur";

  if (!orgId) {
    return (
      <EmptyState
        icon={icon}
        title={`Aucun ${label.toLowerCase()} associé`}
        description={`Ce compte n'est associé à aucun ${label.toLowerCase()}. Contactez un administrateur.`}
      />
    );
  }

  const { data: org } = await supabase.from(scopeType === "partner" ? "partners" : "donors").select("*").eq("id", orgId).single();

  const { data: projectLinks } =
    scopeType === "partner"
      ? await supabase.from("project_partners").select("project_id, role, projects(*)").eq("partner_id", orgId)
      : await supabase.from("project_donors").select("project_id, amount, currency, projects(*)").eq("donor_id", orgId);
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
  const amountTotal = scopeType === "donor" ? (projectLinks ?? []).reduce((s, l) => s + ((l as { amount?: number }).amount ?? 0), 0) : null;

  return (
    <div>
      <PageHeader
        title={`Vue ${label} — ${org?.name ?? ""}`}
        description={`Portefeuille de projets ${scopeType === "partner" ? "en mise en œuvre" : "financés"}, réalisations et indicateurs.`}
        icon={icon}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {canPreview && scopeType === "donor" && donorList && donorList.length > 1 && (
              <PartnerOrgSelect items={donorList} current={orgId} paramName="donor" />
            )}
            {canPreview && scopeType === "partner" && partnerList && partnerList.length > 1 && (
              <PartnerOrgSelect items={partnerList} current={orgId} paramName="partner" />
            )}
          </div>
        }
      />

      {/* Export mis en avant : c'est l'action principale pour ce rôle (reporting vers ses propres
          parties prenantes), pas une fonction secondaire noyée dans un menu. */}
      <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 border-emerald-200 bg-emerald-50/60 dark:border-emerald-900 dark:bg-emerald-950/30">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600 text-white">
            <Download size={18} />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Exporter vos données</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Uniquement les données validées et publiées vous concernant.</p>
          </div>
        </div>
        <ExportMenu
          baseUrl="/api/export/interventions"
          formats={[
            { format: "csv", label: "CSV" },
            { format: "excel", label: "Excel" },
            { format: "geojson", label: "GeoJSON" },
          ]}
        />
      </Card>

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={FolderKanban} label={scopeType === "partner" ? "Projets liés" : "Projets financés"} value={projectLinks?.length ?? 0} />
        <KpiCard icon={MapPinned} color="blue" label="Réalisations" value={interventions?.length ?? 0} />
        <KpiCard icon={Users} color="violet" label="Bénéficiaires (agrégés)" value={beneficiariesTotal.toLocaleString("fr-FR")} />
        {scopeType === "donor" ? (
          <KpiCard icon={Wallet} color="amber" label="Montant engagé" value={(amountTotal ?? 0).toLocaleString("fr-FR")} />
        ) : (
          <KpiCard icon={Gauge} color="amber" label="Indicateurs suivis" value={indicatorResults?.length ?? 0} />
        )}
      </div>

      <Card className="mb-4">
        <SectionTitle icon={Map} className="mb-3">Carte des réalisations</SectionTitle>
        <div style={{ height: 320 }}>
          <MapView points={features} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle icon={FolderKanban} className="mb-3">{scopeType === "partner" ? "Projets liés" : "Projets financés"}</SectionTitle>
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
            {(projectLinks?.length ?? 0) === 0 && <p className="text-sm text-slate-400">Aucun projet.</p>}
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
