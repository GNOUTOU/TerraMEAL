import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader, EmptyState } from "@/components/ui/PageHeader";
import FilterBar from "@/components/ui/FilterBar";
import { KpiCard } from "@/components/ui/Card";
import { SeverityBadge } from "@/components/ui/Badge";
import { ANOMALY_TYPE_LABELS, DATA_SOURCE_LABELS } from "@/lib/types";
import type { Anomaly } from "@/lib/types";
import { ShieldCheck, ShieldAlert, AlertOctagon, ListChecks } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  open: "Ouverte",
  in_review: "En cours de traitement",
  corrected: "Corrigée",
  rejected: "Rejetée",
  closed: "Clôturée",
};

export default async function QualityPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  let query = supabase.from("anomalies").select("*").order("detected_at", { ascending: false });
  if (sp.status) query = query.eq("status", sp.status);
  else query = query.neq("status", "closed");
  if (sp.severity) query = query.eq("severity", sp.severity);
  if (sp.type) query = query.eq("anomaly_type", sp.type);
  if (sp.source) query = query.eq("source", sp.source);

  const [{ data: anomalies }, { count: openCount }, { count: blockingCount }] = await Promise.all([
    query,
    supabase.from("anomalies").select("*", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("anomalies").select("*", { count: "exact", head: true }).eq("status", "open").eq("severity", "blocking"),
  ]);

  const rows = (anomalies as Anomaly[]) ?? [];

  return (
    <div>
      <PageHeader title="Qualité des données" description="Anomalies détectées automatiquement (25) et leur traitement (26/27)." icon={ShieldCheck} />

      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard icon={ShieldAlert} color="amber" label="Anomalies ouvertes" value={openCount ?? 0} />
        <KpiCard icon={AlertOctagon} color="red" label="Bloquantes" value={blockingCount ?? 0} hint="empêchent la publication (RG05)" />
        <KpiCard icon={ListChecks} color="blue" label="Affichées" value={rows.length} />
      </div>

      <FilterBar
        filters={[
          {
            key: "status",
            label: "Statut (hors clôturées)",
            options: Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l })),
          },
          {
            key: "severity",
            label: "Toutes gravités",
            options: [
              { value: "info", label: "Information" },
              { value: "warning", label: "Avertissement" },
              { value: "blocking", label: "Bloquant" },
            ],
          },
          { key: "type", label: "Tous types", options: Object.entries(ANOMALY_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l })) },
          { key: "source", label: "Toutes sources", options: Object.entries(DATA_SOURCE_LABELS).map(([v, l]) => ({ value: v, label: l })) },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState icon={ShieldCheck} title="Aucune anomalie" description="Le jeu de données correspondant aux filtres est propre." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Détectée le</th>
                <th className="px-4 py-2.5 font-medium">Type</th>
                <th className="px-4 py-2.5 font-medium">Gravité</th>
                <th className="px-4 py-2.5 font-medium">Description</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{new Date(a.detected_at).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-2.5">{ANOMALY_TYPE_LABELS[a.anomaly_type]}</td>
                  <td className="px-4 py-2.5">
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">
                    <Link href={`/quality/${a.id}`} className="hover:text-emerald-600 hover:underline">
                      {a.description}
                    </Link>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{STATUS_LABELS[a.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
