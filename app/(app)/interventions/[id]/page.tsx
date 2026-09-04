import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ValidationStatusBadge, SeverityBadge } from "@/components/ui/Badge";
import MapView from "@/components/map/MapView";
import DocumentsPanel from "@/components/documents/DocumentsPanel";
import { interventionsToFeatureCollection, interventionsToLineAndPolygonFeatureCollection } from "@/lib/geo";
import InterventionForm from "../InterventionForm";
import ValidationActions from "./ValidationActions";
import BeneficiaryForm from "./BeneficiaryForm";
import { DATA_SOURCE_LABELS } from "@/lib/types";
import type { Activity, Anomaly, BeneficiaryBreakdown, DocumentRecord, Infrastructure } from "@/lib/types";
import { MapPinned, Map, HardHat, CalendarCheck, Users2, ShieldAlert, FileText, Pencil, ShieldCheck } from "lucide-react";
import SectionTitle from "@/components/ui/SectionTitle";

export default async function InterventionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { profile } = await requireUser();
  const supabase = await createClient();

  const { data: intervention } = await supabase.from("interventions_geo").select("*").eq("id", id).single();
  if (!intervention) notFound();

  const [{ data: infra }, { data: activity }, { data: beneficiaries }, { data: anomalies }, { data: documents }, { data: projects }, { data: sectors }, { data: zones }, { data: partners }] =
    await Promise.all([
      supabase.from("infrastructures").select("*").eq("intervention_id", id).maybeSingle(),
      supabase.from("activities").select("*").eq("intervention_id", id).maybeSingle(),
      supabase.from("beneficiaries_breakdown").select("*").eq("intervention_id", id),
      supabase.from("anomalies").select("*").eq("entity_table", "interventions").eq("entity_id", id).order("detected_at", { ascending: false }),
      supabase.from("documents").select("*").eq("entity_table", "interventions").eq("entity_id", id).order("uploaded_at", { ascending: false }),
      supabase.from("projects").select("id, name").is("deleted_at", null).order("name"),
      supabase.from("sectors").select("id, name").eq("active", true).order("name"),
      supabase.from("admin_zones").select("id, name").order("name"),
      supabase.from("partners").select("id, name").eq("active", true).order("name"),
    ]);

  const canWrite = canWriteOperationalData(profile.role);
  const canValidate = profile.role === "admin" || profile.role === "meal_sig";
  const features = interventionsToFeatureCollection([intervention] as never[]);
  const lineAndPolygonFeatures = interventionsToLineAndPolygonFeatureCollection([intervention] as never[]);
  const beneficiariesTotal = (beneficiaries ?? []).reduce((s, b) => s + b.count, 0);

  return (
    <div>
      <PageHeader
        title={intervention.name}
        description={`${intervention.type} · ${intervention.project_name ?? ""}`}
        icon={MapPinned}
        actions={<ValidationStatusBadge status={intervention.validation_status} />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <dl className="grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
              <Info label="Projet" value={<Link href={`/projects/${intervention.project_id}`} className="text-emerald-600 hover:underline">{intervention.project_name}</Link>} />
              {intervention.realisation_nature && <Info label="Nature de la réalisation" value={intervention.realisation_nature} />}
              <Info label="Secteur" value={intervention.sector_name ?? "—"} />
              <Info label="Zone" value={intervention.admin_zone_name ?? "—"} />
              <Info label="Partenaire de mise en œuvre" value={intervention.implementing_partner_name ?? "—"} />
              {(intervention.author_name || intervention.author_type) && (
                <Info
                  label="Auteur de la réalisation"
                  value={[intervention.author_name, intervention.author_type && `(${intervention.author_type})`].filter(Boolean).join(" ")}
                />
              )}
              <Info label="Date" value={intervention.date ?? "—"} />
              <Info label="Statut opérationnel" value={intervention.status} />
              <Info label="Source" value={DATA_SOURCE_LABELS[intervention.source as keyof typeof DATA_SOURCE_LABELS]} />
              <Info label="Identifiant source" value={intervention.source_id ?? "—"} />
              <Info label="Dernière mise à jour" value={new Date(intervention.last_updated_at).toLocaleDateString("fr-FR")} />
            </dl>

            {(intervention.country || intervention.region || intervention.province || intervention.commune || intervention.village) && (
              <div className="mt-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Localisation (source)</p>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {[intervention.village, intervention.commune, intervention.province, intervention.region, intervention.country]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
            )}

            <div className="mt-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Bénéficiaires</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Total : <strong>{(intervention.beneficiaries_total ?? beneficiariesTotal).toLocaleString("fr-FR")}</strong>
                {intervention.beneficiaries_female != null && <> · Femmes : {Number(intervention.beneficiaries_female).toLocaleString("fr-FR")}</>}
                {intervention.beneficiaries_male != null && <> · Hommes : {Number(intervention.beneficiaries_male).toLocaleString("fr-FR")}</>}
              </p>
            </div>

            {Array.isArray(intervention.photos) && intervention.photos.length > 0 && (
              <div className="mt-4">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Photos ({intervention.photos.length})</p>
                <ul className="space-y-0.5 text-xs">
                  {(intervention.photos as string[]).map((p, i) => (
                    <li key={i}>
                      {/^https?:\/\//.test(p) ? (
                        <a href={p} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline break-all">{p}</a>
                      ) : (
                        <span className="font-mono text-slate-500">{p}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {intervention.import_extras && typeof intervention.import_extras === "object" && Object.keys(intervention.import_extras).length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-2 dark:border-amber-900 dark:bg-amber-950/20">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Autres informations conservées à l&apos;import</p>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
                  {Object.entries(intervention.import_extras as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="flex gap-1.5">
                      <dt className="shrink-0 font-medium text-slate-500">{k} :</dt>
                      <dd className="truncate text-slate-600 dark:text-slate-300">{String(v ?? "")}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {intervention.description && <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{intervention.description}</p>}
            {intervention.rejection_reason && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                Motif de rejet : {intervention.rejection_reason}
              </p>
            )}
          </Card>

          {intervention.geom_json && (
            <Card>
              <SectionTitle icon={Map} className="mb-3">Localisation</SectionTitle>
              <div style={{ height: 260 }}>
                <MapView points={features} polygons={lineAndPolygonFeatures} zoom={11} />
              </div>
            </Card>
          )}

          {infra && (
            <Card>
              <SectionTitle icon={HardHat} className="mb-3">Infrastructure</SectionTitle>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Info label="Type" value={(infra as Infrastructure).infra_type} />
                <Info label="Capacité" value={(infra as Infrastructure).capacity ?? "—"} />
                <Info label="État" value={(infra as Infrastructure).functional_status} />
              </dl>
            </Card>
          )}

          {activity && (
            <Card>
              <SectionTitle icon={CalendarCheck} className="mb-3">Activité</SectionTitle>
              <dl className="grid grid-cols-3 gap-3 text-sm">
                <Info label="Type" value={(activity as Activity).activity_type} />
                <Info label="Participants" value={(activity as Activity).participants_count ?? "—"} />
                <Info label="Sessions" value={(activity as Activity).sessions_count ?? "—"} />
              </dl>
            </Card>
          )}

          <Card>
            <SectionTitle icon={Users2} className="mb-3">Bénéficiaires désagrégés</SectionTitle>
            <table className="mb-3 w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400">
                <tr>
                  <th className="py-1">Sexe</th>
                  <th className="py-1">Tranche d&apos;âge</th>
                  <th className="py-1">Nombre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {((beneficiaries as BeneficiaryBreakdown[]) ?? []).map((b) => (
                  <tr key={b.id}>
                    <td className="py-1">{b.sex ?? "—"}</td>
                    <td className="py-1">{b.age_bracket ?? "—"}</td>
                    <td className="py-1">{b.count}</td>
                  </tr>
                ))}
                {(beneficiaries?.length ?? 0) === 0 && (
                  <tr>
                    <td colSpan={3} className="py-2 text-slate-400">
                      Aucune désagrégation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            {canWrite && <BeneficiaryForm interventionId={id} />}
          </Card>

          {canWrite && (
            <Card>
              <SectionTitle icon={Pencil} className="mb-4">Modifier</SectionTitle>
              <InterventionForm
                intervention={intervention as never}
                infra={infra as Infrastructure | null}
                activity={activity as Activity | null}
                projects={projects ?? []}
                sectors={sectors ?? []}
                zones={zones ?? []}
                partners={partners ?? []}
              />
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canValidate && (
            <Card>
              <SectionTitle icon={ShieldCheck}>Workflow de validation</SectionTitle>
              <ValidationActions id={id} current={intervention.validation_status} />
            </Card>
          )}

          <Card>
            <SectionTitle icon={ShieldAlert}>Anomalies</SectionTitle>
            <div className="space-y-2">
              {((anomalies as Anomaly[]) ?? []).map((a) => (
                <div key={a.id} className="rounded-lg border border-slate-200 p-2 text-xs dark:border-slate-800">
                  <div className="mb-1 flex items-center justify-between">
                    <SeverityBadge severity={a.severity} />
                    <span className="text-slate-400">{a.status}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{a.description}</p>
                </div>
              ))}
              {(anomalies?.length ?? 0) === 0 && <p className="text-sm text-slate-400">Aucune anomalie détectée.</p>}
            </div>
          </Card>

          <Card>
            <SectionTitle icon={FileText}>Documents / preuves</SectionTitle>
            <DocumentsPanel
              entityTable="interventions"
              entityId={id}
              documents={(documents as DocumentRecord[]) ?? []}
              canWrite={canWrite}
              revalidate={`/interventions/${id}`}
            />
          </Card>
        </div>
      </div>
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
