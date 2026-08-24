import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, KpiCard } from "@/components/ui/Card";
import { ProjectStatusBadge, ValidationStatusBadge } from "@/components/ui/Badge";
import { getReferenceData } from "@/lib/queries/reference";
import { interventionsToFeatureCollection } from "@/lib/geo";
import DocumentsPanel from "@/components/documents/DocumentsPanel";
import ProjectForm from "../ProjectForm";
import MapView from "@/components/map/MapView";
import type { DocumentRecord, IndicatorResult, Intervention, Project } from "@/lib/types";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data: project } = await supabase.from("projects").select("*").eq("id", id).single();
  if (!project) notFound();

  const [
    { data: sectorLinks },
    { data: zoneLinks },
    { data: partnerLinks },
    { data: donorLinks },
    { data: interventionsGeo },
    { data: indicatorResults },
    { data: documents },
    ref,
  ] = await Promise.all([
    supabase.from("project_sectors").select("sector_id, sectors(name, color)").eq("project_id", id),
    supabase.from("project_zones").select("admin_zone_id, admin_zones(name, level)").eq("project_id", id),
    supabase.from("project_partners").select("partner_id, partners(name)").eq("project_id", id),
    supabase.from("project_donors").select("donor_id, amount, currency, is_principal, donors(name)").eq("project_id", id),
    supabase.from("interventions_geo").select("*").eq("project_id", id),
    supabase
      .from("indicator_results_with_rate")
      .select("*, indicators(code, label, unit)")
      .eq("project_id", id)
      .order("period", { ascending: false }),
    supabase.from("documents").select("*").eq("entity_table", "projects").eq("entity_id", id).order("uploaded_at", { ascending: false }),
    getReferenceData(),
  ]);

  const canWrite = canWriteOperationalData(profile.role);
  const beneficiariesTotal = ((interventionsGeo as Intervention[]) ?? []).reduce((sum, i) => sum + (i.beneficiaries_total ?? 0), 0);
  const featureCollection = interventionsToFeatureCollection((interventionsGeo as never[]) ?? []);

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.code}
        actions={<ProjectStatusBadge status={project.status} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard label="Réalisations" value={interventionsGeo?.length ?? 0} />
        <KpiCard label="Bénéficiaires (agrégés)" value={beneficiariesTotal.toLocaleString("fr-FR")} />
        <KpiCard label="Secteurs" value={sectorLinks?.length ?? 0} />
        <KpiCard label="Zones couvertes" value={zoneLinks?.length ?? 0} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Description</h2>
            <p className="text-sm text-slate-600 dark:text-slate-300">{project.description || "Aucune description."}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Période" value={`${project.start_date ?? "?"} → ${project.end_date ?? "?"}`} />
              <Info label="Année" value={project.year ?? "—"} />
              <Info label="Reporting" value={project.reporting_period ?? "—"} />
              <Info label="Budget" value={project.budget ? `${project.budget.toLocaleString("fr-FR")} ${project.currency}` : "—"} />
            </dl>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Carte des réalisations</h2>
            <div style={{ height: 320 }}>
              <MapView points={featureCollection} />
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Réalisations ({interventionsGeo?.length ?? 0})</h2>
              <Link href={`/interventions?project=${id}`} className="text-xs text-emerald-600 hover:underline">
                Voir tout →
              </Link>
            </div>
            <div className="space-y-1.5">
              {((interventionsGeo as Intervention[]) ?? []).slice(0, 8).map((i) => (
                <Link
                  key={i.id}
                  href={`/interventions/${i.id}`}
                  className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="text-slate-700 dark:text-slate-200">{i.name}</span>
                  <ValidationStatusBadge status={i.validation_status} />
                </Link>
              ))}
              {(interventionsGeo?.length ?? 0) === 0 && <p className="text-sm text-slate-400">Aucune réalisation enregistrée.</p>}
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Indicateurs</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-slate-400">
                  <tr>
                    <th className="py-1.5 pr-3">Indicateur</th>
                    <th className="py-1.5 pr-3">Période</th>
                    <th className="py-1.5 pr-3">Cible</th>
                    <th className="py-1.5 pr-3">Réalisé</th>
                    <th className="py-1.5 pr-3">Taux</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {((indicatorResults as unknown as (IndicatorResult & { indicators: { code: string; label: string } })[]) ?? []).map((r) => (
                    <tr key={r.id}>
                      <td className="py-1.5 pr-3">{r.indicators?.code} — {r.indicators?.label}</td>
                      <td className="py-1.5 pr-3 text-slate-500">{r.period}</td>
                      <td className="py-1.5 pr-3 text-slate-500">{r.target_value ?? "—"}</td>
                      <td className="py-1.5 pr-3 text-slate-500">{r.actual_value ?? "—"}</td>
                      <td className="py-1.5 pr-3 font-medium text-emerald-600">{r.achievement_rate != null ? `${r.achievement_rate}%` : "—"}</td>
                    </tr>
                  ))}
                  {(indicatorResults?.length ?? 0) === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-slate-400">
                        Aucun résultat renseigné.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Bailleurs</h2>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {(donorLinks ?? []).map((d) => (
                <li key={d.donor_id} className="flex justify-between">
                  <span>{(d as unknown as { donors: { name: string } }).donors?.name} {d.is_principal && "★"}</span>
                  {d.amount && <span className="text-slate-400">{d.amount.toLocaleString("fr-FR")} {d.currency}</span>}
                </li>
              ))}
              {(donorLinks?.length ?? 0) === 0 && <p className="text-slate-400">Aucun</p>}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Partenaires</h2>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {(partnerLinks ?? []).map((p) => (
                <li key={p.partner_id}>{(p as unknown as { partners: { name: string } }).partners?.name}</li>
              ))}
              {(partnerLinks?.length ?? 0) === 0 && <p className="text-slate-400">Aucun</p>}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Secteurs</h2>
            <div className="flex flex-wrap gap-1.5">
              {(sectorLinks ?? []).map((s) => (
                <span
                  key={s.sector_id}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: (s as unknown as { sectors: { color: string } }).sectors?.color ?? "#64748b" }}
                >
                  {(s as unknown as { sectors: { name: string } }).sectors?.name}
                </span>
              ))}
            </div>
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Zones de couverture</h2>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {(zoneLinks ?? []).map((z) => (
                <li key={z.admin_zone_id}>{(z as unknown as { admin_zones: { name: string } }).admin_zones?.name}</li>
              ))}
              {(zoneLinks?.length ?? 0) === 0 && <p className="text-slate-400">Aucune</p>}
            </ul>
          </Card>
          <Card>
            <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Documents</h2>
            <DocumentsPanel
              entityTable="projects"
              entityId={id}
              documents={(documents as DocumentRecord[]) ?? []}
              canWrite={canWrite}
              revalidate={`/projects/${id}`}
            />
          </Card>
        </div>
      </div>

      {canWrite && (
        <Card className="mt-6">
          <h2 className="mb-4 text-sm font-semibold text-slate-700 dark:text-slate-200">Modifier le projet</h2>
          <ProjectForm
            project={project as Project}
            sectors={ref.sectors}
            zones={ref.zones}
            partners={ref.partners}
            donors={ref.donors}
            managers={ref.managers}
            selected={{
              sector_ids: (sectorLinks ?? []).map((s) => s.sector_id),
              zone_ids: (zoneLinks ?? []).map((z) => z.admin_zone_id),
              partner_ids: (partnerLinks ?? []).map((p) => p.partner_id),
              donor_ids: (donorLinks ?? []).map((d) => d.donor_id),
            }}
          />
        </Card>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="text-slate-700 dark:text-slate-200">{value}</dd>
    </div>
  );
}
