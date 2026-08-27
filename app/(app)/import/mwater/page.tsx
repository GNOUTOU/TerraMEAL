import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/PageHeader";
import { Droplets, Info } from "lucide-react";
import SyncButton from "../SyncButton";
import type { DataSource } from "@/lib/types";

export default async function MwaterImportPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("data_sources").select("*").eq("type", "mwater").order("name");
  const sources = (data as DataSource[]) ?? [];

  return (
    <div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Les datasets mWater se configurent dans{" "}
          <Link href="/admin/sources" className="text-emerald-600 hover:underline">
            Administration → Sources de données
          </Link>
          . Les unités et statuts hétérogènes doivent être harmonisés lors du mapping des champs (22).
        </span>
      </p>
      {sources.length === 0 ? (
        <EmptyState icon={Droplets} title="Aucune source mWater configurée" description="Ajoutez-en une dans Administration → Sources de données." />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sources.map((s) => (
            <Card key={s.id}>
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <h3 className="font-medium text-slate-800 dark:text-slate-100">{s.name}</h3>
                  <p className="text-xs text-slate-400">{s.description}</p>
                </div>
                {!s.active && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-slate-800">Inactive</span>}
              </div>
              <p className="mb-3 text-xs text-slate-500">
                Dernière synchro : {s.last_sync_at ? new Date(s.last_sync_at).toLocaleString("fr-FR") : "Jamais"}
                {s.last_sync_status ? ` — ${s.last_sync_status}` : ""}
              </p>
              <SyncButton sourceId={s.id} type="mwater" />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
