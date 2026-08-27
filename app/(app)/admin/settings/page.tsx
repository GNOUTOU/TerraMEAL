import { createClient } from "@/lib/supabase/server";
import EntityManager from "@/components/ui/EntityManager";
import { Info } from "lucide-react";

interface AppSetting {
  key: string;
  value: unknown;
  description: string | null;
}

export default async function SettingsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("app_settings").select("key, value, description").order("key");
  const settings = (data as AppSetting[]) ?? [];

  return (
    <div>
      <p className="mb-4 flex items-start gap-1.5 text-xs text-slate-400">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Paramètres généraux de la plateforme (37/39) : portail public, seuils de fraîcheur des données, seuils
          d&apos;alerte qualité. La valeur est au format JSON — ex. <code>true</code>, <code>180</code>, <code>&quot;texte&quot;</code>.
        </span>
      </p>
      <EntityManager<AppSetting & Record<string, unknown>>
        table="app_settings"
        title="Paramètre"
        revalidate="/admin/settings"
        canWrite
        idKey="key"
        rows={settings as (AppSetting & Record<string, unknown>)[]}
        columns={[
          { key: "key", label: "Clé" },
          { key: "description", label: "Description" },
          { key: "value", label: "Valeur", render: (r) => JSON.stringify(r.value) },
        ]}
        fields={[
          { name: "key", label: "Clé", required: true },
          { name: "description", label: "Description" },
          { name: "value", label: "Valeur (JSON)", type: "json", required: true },
        ]}
      />
    </div>
  );
}
