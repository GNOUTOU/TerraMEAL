import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { ANOMALY_TYPE_LABELS, DATA_SOURCE_LABELS } from "@/lib/types";
import QualityActions from "./QualityActions";

export default async function AnomalyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: anomaly } = await supabase.from("anomalies").select("*").eq("id", id).single();
  if (!anomaly) notFound();

  let entityLabel: string | null = null;
  let entityHref: string | null = null;
  if (anomaly.entity_table === "interventions" && anomaly.entity_id) {
    const { data: intervention } = await supabase.from("interventions").select("name").eq("id", anomaly.entity_id).single();
    entityLabel = intervention?.name ?? null;
    entityHref = `/interventions/${anomaly.entity_id}`;
  }

  const { data: assignee } = anomaly.assignee_id
    ? await supabase.from("profiles").select("full_name").eq("id", anomaly.assignee_id).single()
    : { data: null };
  const { data: resolver } = anomaly.resolved_by
    ? await supabase.from("profiles").select("full_name").eq("id", anomaly.resolved_by).single()
    : { data: null };

  return (
    <div>
      <PageHeader title={ANOMALY_TYPE_LABELS[anomaly.anomaly_type as keyof typeof ANOMALY_TYPE_LABELS]} actions={<SeverityBadge severity={anomaly.severity} />} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <p className="text-sm text-slate-700 dark:text-slate-200">{anomaly.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Info label="Détectée le" value={new Date(anomaly.detected_at).toLocaleString("fr-FR")} />
              <Info label="Source" value={anomaly.source ? DATA_SOURCE_LABELS[anomaly.source as keyof typeof DATA_SOURCE_LABELS] : "—"} />
              <Info label="Table concernée" value={anomaly.entity_table} />
              <Info label="Objet" value={entityHref ? <Link href={entityHref} className="text-emerald-600 hover:underline">{entityLabel}</Link> : "—"} />
              <Info label="Assigné à" value={assignee?.full_name ?? "Non assigné"} />
              <Info label="Statut" value={anomaly.status} />
            </dl>
            {anomaly.resolution_comment && (
              <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                <p className="mb-1 text-xs text-slate-400">
                  Commentaire {resolver?.full_name && `— ${resolver.full_name}`} {anomaly.resolved_at && `(${new Date(anomaly.resolved_at).toLocaleDateString("fr-FR")})`}
                </p>
                <p className="text-slate-600 dark:text-slate-300">{anomaly.resolution_comment}</p>
              </div>
            )}
          </Card>
        </div>
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Traitement</h2>
          <QualityActions id={id} status={anomaly.status} />
        </Card>
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
