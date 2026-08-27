import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/PageHeader";
import { CheckCircle2, ListChecks } from "lucide-react";
import StagingReviewRow from "./StagingReviewRow";
import type { StagingRecord } from "@/lib/types";

export default async function StagingReviewPage() {
  const supabase = await createClient();
  const [{ data: staging }, { data: projects }, { data: sectors }, { data: zones }] = await Promise.all([
    supabase.from("staging_records").select("*").eq("validation_status", "to_verify").order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").order("name"),
    supabase.from("sectors").select("id, name").eq("active", true).order("name"),
    supabase.from("admin_zones").select("id, name").order("name"),
  ]);

  const rows = (staging as StagingRecord[]) ?? [];

  return (
    <div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-400">
        <ListChecks size={14} className="mt-0.5 shrink-0" />
        <span>
          {rows.length} enregistrement(s) en attente de vérification avant publication (RG04/RG05/26). Corrigez les champs
          si nécessaire puis promouvez chaque ligne, ou rejetez-la avec un motif (RG12).
        </span>
      </p>
      {rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Rien à vérifier" description="Toutes les données importées ont été traitées." />
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <StagingReviewRow key={r.id} record={r} projects={projects ?? []} sectors={sectors ?? []} zones={zones ?? []} />
          ))}
        </div>
      )}
    </div>
  );
}
