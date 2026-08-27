"use client";

import EntityManager from "@/components/ui/EntityManager";

interface AppSetting {
  key: string;
  value: unknown;
  description: string | null;
}

export default function SettingsTable({ rows }: { rows: (AppSetting & Record<string, unknown>)[] }) {
  return (
    <EntityManager<AppSetting & Record<string, unknown>>
      table="app_settings"
      title="Paramètre"
      revalidate="/admin/settings"
      canWrite
      idKey="key"
      rows={rows}
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
  );
}
