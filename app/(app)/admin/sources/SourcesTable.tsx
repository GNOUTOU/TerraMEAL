"use client";

import EntityManager from "@/components/ui/EntityManager";
import type { DataSource } from "@/lib/types";

export default function SourcesTable({ rows }: { rows: DataSource[] }) {
  return (
    <EntityManager<DataSource>
      table="data_sources"
      title="Source de données"
      revalidate="/admin/sources"
      canWrite
      rows={rows}
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
  );
}
