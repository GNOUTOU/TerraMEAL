import { createClient } from "@/lib/supabase/server";
import type { DataSource } from "@/lib/types";
import { Info } from "lucide-react";
import SourcesTable from "./SourcesTable";

export default async function SourcesAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("data_sources").select("*").order("name");
  const sources = (data as DataSource[]) ?? [];

  return (
    <div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Identifiants d&apos;API et mapping de champs pour les connecteurs KoboToolbox / mWater (21/22). Le
          champ <code>config</code> attend par ex. <code>{`{"base_url":"https://kf.kobotoolbox.org","api_token":"...","asset_uid":"..."}`}</code>{" "}
          pour Kobo, ou <code>{`{"base_url":"https://api.mwater.co","api_token":"...","dataset_id":"..."}`}</code> pour mWater.
        </span>
      </p>
      <SourcesTable rows={sources} />
    </div>
  );
}
