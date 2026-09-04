import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/ui/PageHeader";
import { CheckCircle2, ListChecks } from "lucide-react";
import StagingReviewTable from "./StagingReviewTable";
import type { DataSourceType } from "@/lib/types";

type RawRef = { source: DataSourceType | null; source_ref: string | null };
interface StagingRow {
  id: string;
  normalized: Record<string, unknown>;
  created_at: string;
  raw_records: RawRef | RawRef[] | null;
}

export default async function StagingReviewPage() {
  const supabase = await createClient();
  const [{ data: staging }, { data: projects }, { data: sectors }, { data: zones }] = await Promise.all([
    supabase
      .from("staging_records")
      .select("id, normalized, created_at, raw_records(source, source_ref)")
      .eq("validation_status", "to_verify")
      .order("created_at", { ascending: false }),
    supabase.from("projects").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("sectors").select("id, name").eq("active", true).order("name"),
    supabase.from("admin_zones").select("id, name").order("name"),
  ]);

  const rows = ((staging as unknown as StagingRow[]) ?? []).map((r) => {
    const rr = Array.isArray(r.raw_records) ? r.raw_records[0] : r.raw_records;
    return {
      id: r.id,
      normalized: r.normalized ?? {},
      created_at: r.created_at,
      source: rr?.source ?? null,
      source_ref: rr?.source_ref ?? null,
    };
  });

  return (
    <div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-400">
        <ListChecks size={14} className="mt-0.5 shrink-0" />
        <span>
          {rows.length} enregistrement(s) en attente de vérification avant publication (RG04/RG05/26). Corrigez les champs
          si nécessaire puis promouvez chaque ligne, rejetez-la avec un motif (RG12), ou supprimez-la définitivement.
        </span>
      </p>
      {rows.length === 0 ? (
        <EmptyState icon={CheckCircle2} title="Rien à vérifier" description="Toutes les données importées ont été traitées." />
      ) : (
        <StagingReviewTable records={rows} projects={projects ?? []} sectors={sectors ?? []} zones={zones ?? []} />
      )}
    </div>
  );
}
