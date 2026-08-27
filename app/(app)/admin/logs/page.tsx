import { createClient } from "@/lib/supabase/server";
import type { ActivityLogEntry, Profile } from "@/lib/types";
import { Info } from "lucide-react";

const ACTION_LABELS: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  publish: "Publication",
  export: "Export",
  sync: "Synchronisation",
  login: "Connexion",
  role_change: "Changement de rôle",
};

export default async function LogsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Math.max(1, Number(page) || 1);
  const pageSize = 50;

  const supabase = await createClient();
  const { data: logs, count } = await supabase
    .from("activity_log")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

  const userIds = Array.from(new Set((logs ?? []).map((l) => l.user_id).filter(Boolean))) as string[];
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
    : { data: [] as Pick<Profile, "id" | "full_name">[] };
  const userMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / pageSize));

  return (
    <div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        Traçabilité (35/52) : qui a fait quoi, quand, sur quelle donnée. Généré automatiquement par des triggers sur
        les tables sensibles (projets, interventions, résultats d&apos;indicateurs, profils).
      </p>
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Date</th>
              <th className="px-4 py-2.5 font-medium">Utilisateur</th>
              <th className="px-4 py-2.5 font-medium">Action</th>
              <th className="px-4 py-2.5 font-medium">Table</th>
              <th className="px-4 py-2.5 font-medium">Objet</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {((logs as ActivityLogEntry[]) ?? []).map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-2.5 whitespace-nowrap text-slate-500">{new Date(log.created_at).toLocaleString("fr-FR")}</td>
                <td className="px-4 py-2.5 text-slate-700 dark:text-slate-200">{log.user_id ? userMap.get(log.user_id) ?? "—" : "Système"}</td>
                <td className="px-4 py-2.5 text-slate-500">{ACTION_LABELS[log.action] ?? log.action}</td>
                <td className="px-4 py-2.5 text-slate-500">{log.entity_table ?? "—"}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{log.entity_id?.slice(0, 8) ?? "—"}</td>
              </tr>
            ))}
            {(!logs || logs.length === 0) && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                  Aucune entrée.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm text-slate-500">
          <a
            href={`?page=${Math.max(1, currentPage - 1)}`}
            className={currentPage <= 1 ? "pointer-events-none opacity-40" : "hover:underline"}
          >
            ← Précédent
          </a>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <a
            href={`?page=${Math.min(totalPages, currentPage + 1)}`}
            className={currentPage >= totalPages ? "pointer-events-none opacity-40" : "hover:underline"}
          >
            Suivant →
          </a>
        </div>
      )}
    </div>
  );
}
