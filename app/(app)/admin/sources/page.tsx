import { createClient } from "@/lib/supabase/server";
import EntityManager from "@/components/ui/EntityManager";
import type { DataSource } from "@/lib/types";

export default async function SourcesAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("data_sources").select("*").order("name");
  const sources = (data as DataSource[]) ?? [];

  return (
    <div>
      <p className="mb-4 text-xs text-slate-400">
        Identifiants d&apos;API et mapping de champs pour les connecteurs KoboToolbox / mWater (21/22). Le
        champ <code>config</code> attend par ex. <code>{`{"base_url":"https://kf.kobotoolbox.org","api_token":"...","asset_uid":"..."}`}</code>{" "}
        pour Kobo, ou <code>{`{"base_url":"https://api.mwater.co","api_token":"...","dataset_id":"..."}`}</code> pour mWater.
      </p>
      <EntityManager<DataSource>
        table="data_sources"
        title="Source de données"
        revalidate="/admin/sources"
        canWrite
        rows={sources}
        columns={[
          { key: "type", label: "Type" },
          { key: "name", label: "Nom" },
          { key: "active", label: "Active", render: (r) => (r.active ? "Oui" : "Non") },
          { key: "last_sync_at", label: "Dernière synchro", render: (r) => (r.last_sync_at ? new Date(r.last_sync_at).toLocaleString("fr-FR") : "Jamais") },
          { key: "last_sync_status", label: "Statut" },
        ]}
        fields={[
          {
            name: "type",
            label: "Type",
            type: "select",
            required: true,
            options: [
              { value: "kobo", label: "KoboToolbox" },
              { value: "mwater", label: "mWater" },
            ],
          },
          { name: "name", label: "Nom", required: true },
          { name: "description", label: "Description", type: "textarea" },
          { name: "config", label: "Configuration (JSON)", type: "json" },
          { name: "field_mapping", label: "Mapping des champs (JSON)", type: "json" },
          { name: "active", label: "Active", type: "checkbox", defaultValue: true },
        ]}
      />
    </div>
  );
}
