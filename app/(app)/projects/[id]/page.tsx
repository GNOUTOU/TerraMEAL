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
import { FolderKanban, MapPinned, Users, Layers, MapPin, HandCoins, Handshake, FileText, Map, Gauge, AlignLeft, Pencil, ArrowRight, Star, Target, TrendingUp } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";
import PrintButton from "./PrintButton";

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

  // "Progression" (29) : taux d'atteinte moyen des indicateurs du projet, l'indicateur de
  // progression le plus parlant pour un outil MEAL — à défaut de résultats, non calculable.
  const ratesWithValue = ((indicatorResults as unknown as IndicatorResult[]) ?? []).filter((r) => r.achievement_rate != null);
  const avgProgress =
    ratesWithValue.length > 0 ? Math.round(ratesWithValue.reduce((s, r) => s + (r.achievement_rate ?? 0), 0) / ratesWithValue.length) : null;

  return (
    <div>
      <PageHeader
        title={project.name}
        description={project.code}
        icon={FolderKanban}
        actions={
          <div className="flex items-center gap-2">
            <ProjectStatusBadge status={project.status} />
            <PrintButton />
          </div>
        }
      />

      {project.deleted_at && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          Ce projet est dans la corbeille (supprimé le {new Date(project.deleted_at).toLocaleString("fr-FR")}). Il n&apos;apparaît plus dans les listes. Restaurez-le depuis{" "}
          <Link href="/projects/corbeille" className="font-medium underline">
            la corbeille
          </Link>
          .
        </div>
      )}

      <div id="project-print-area">
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
          <KpiCard icon={MapPinned} color="blue" label="Réalisations" value={interventionsGeo?.length ?? 0} />
          <KpiCard icon={Users} color="violet" label="Bénéficiaires (agrégés)" value={beneficiariesTotal.toLocaleString("fr-FR")} />
          <KpiCard icon={Layers} color="amber" label="Secteurs" value={sectorLinks?.length ?? 0} />
          <KpiCard icon={MapPin} label="Zones couvertes" value={zoneLinks?.length ?? 0} />
          <KpiCard icon={TrendingUp} color="emerald" label="Progression" value={avgProgress != null ? `${avgProgress}%` : "—"} hint="taux d'atteinte moyen" />
        </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <SectionTitle icon={AlignLeft}>Description</SectionTitle>
            <p className="text-sm text-slate-600 dark:text-slate-300">{project.description || "Aucune description."}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Période" value={`${project.start_date ?? "?"} → ${project.end_date ?? "?"}`} />
              <Info label="Année" value={project.year ?? "—"} />
              <Info label="Reporting" value={project.reporting_period ?? "—"} />
              <Info label="Budget" value={project.budget ? `${project.budget.toLocaleString("fr-FR")} ${project.currency}` : "—"} />
            </dl>
            {(project.objectives || project.target_groups) && (
              <div className="mt-4 grid grid-cols-1 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800">
                {project.objectives && (
                  <div>
                    <dt className="mb-1 flex items-center gap-1 text-xs text-slate-400">
                      <Target size={12} /> Objectifs
                    </dt>
                    <dd className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{project.objectives}</dd>
                  </div>
                )}
                {project.target_groups && (
                  <div>
                    <dt className="mb-1 flex items-center gap-1 text-xs text-slate-400">
                      <Users size={12} /> Groupes cibles
                    </dt>
                    <dd className="whitespace-pre-line text-sm text-slate-600 dark:text-slate-300">{project.target_groups}</dd>
                  </div>
                )}
              </div>
            )}
          </Card>

          <Card>
            <SectionTitle icon={Map} className="mb-3">Carte des réalisations</SectionTitle>
            <div style={{ height: 320 }}>
              <MapView points={featureCollection} />
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center justify-between">
              <SectionTitle icon={MapPinned} className="">Réalisations ({interventionsGeo?.length ?? 0})</SectionTitle>
              <Link href={`/interventions?project=${id}`} className="flex items-center gap-1 text-xs text-emerald-600 hover:underline">
                Voir tout <ArrowRight size={12} />
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
            <SectionTitle icon={Gauge} className="mb-3">Indicateurs</SectionTitle>
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
            <SectionTitle icon={HandCoins}>Bailleurs</SectionTitle>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {(donorLinks ?? []).map((d) => (
                <li key={d.donor_id} className="flex justify-between">
                  <span className="flex items-center gap-1">
                    {(d as unknown as { donors: { name: string } }).donors?.name}
                    {d.is_principal && <Star size={12} className="fill-amber-400 text-amber-400" />}
                  </span>
                  {d.amount && <span className="text-slate-400">{d.amount.toLocaleString("fr-FR")} {d.currency}</span>}
                </li>
              ))}
              {(donorLinks?.length ?? 0) === 0 && <p className="text-slate-400">Aucun</p>}
            </ul>
          </Card>
          <Card>
            <SectionTitle icon={Handshake}>Partenaires</SectionTitle>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {(partnerLinks ?? []).map((p) => (
                <li key={p.partner_id}>{(p as unknown as { partners: { name: string } }).partners?.name}</li>
              ))}
              {(partnerLinks?.length ?? 0) === 0 && <p className="text-slate-400">Aucun</p>}
            </ul>
          </Card>
          <Card>
            <SectionTitle icon={Layers}>Secteurs</SectionTitle>
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
            <SectionTitle icon={MapPin}>Zones de couverture</SectionTitle>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {(zoneLinks ?? []).map((z) => (
                <li key={z.admin_zone_id}>{(z as unknown as { admin_zones: { name: string } }).admin_zones?.name}</li>
              ))}
              {(zoneLinks?.length ?? 0) === 0 && <p className="text-slate-400">Aucune</p>}
            </ul>
          </Card>
          <Card>
            <SectionTitle icon={FileText}>Documents</SectionTitle>
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
      </div>

      {canWrite && (
        <Card className="mt-6 scroll-mt-6" id="modifier">
          <SectionTitle icon={Pencil} className="mb-4">Modifier le projet</SectionTitle>
          <ProjectForm
            project={project as Project}
            sectors={ref.sectors}
            zones={ref.zones}
            partners={ref.partners}
            donors={ref.donors}
            managers={ref.managers}
            canCreateManager={profile.role === "admin"}
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
