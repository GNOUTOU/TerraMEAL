import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/PageHeader";
import { DATA_SOURCE_LABELS } from "@/lib/types";
import { History } from "lucide-react";
import type { ImportBatch } from "@/lib/types";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  processing: "En cours",
  completed: "Terminé",
  completed_with_errors: "Terminé avec erreurs",
  failed: "Échec",
};

export default async function ImportHistoryPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("import_batches").select("*").order("started_at", { ascending: false }).limit(100);
  const batches = (data as ImportBatch[]) ?? [];

  return (
    <div>
      {batches.length === 0 ? (
        <EmptyState icon={History} title="Aucun import réalisé" />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              <tr>
                <th className="px-4 py-2.5 font-medium">Date</th>
                <th className="px-4 py-2.5 font-medium">Source</th>
                <th className="px-4 py-2.5 font-medium">Nom</th>
                <th className="px-4 py-2.5 font-medium">Statut</th>
                <th className="px-4 py-2.5 font-medium">Total</th>
                <th className="px-4 py-2.5 font-medium">Succès</th>
                <th className="px-4 py-2.5 font-medium">Erreurs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {batches.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{new Date(b.started_at).toLocaleString("fr-FR")}</td>
                  <td className="px-4 py-2.5">{DATA_SOURCE_LABELS[b.source]}</td>
                  <td className="px-4 py-2.5 text-slate-500">{b.source_name ?? b.file_name ?? "—"}</td>
                  <td className="px-4 py-2.5 text-slate-500">{STATUS_LABELS[b.status] ?? b.status}</td>
                  <td className="px-4 py-2.5 text-slate-500">{b.records_total}</td>
                  <td className="px-4 py-2.5 text-emerald-600">{b.records_success}</td>
                  <td className="px-4 py-2.5 text-red-500">{b.records_error}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
