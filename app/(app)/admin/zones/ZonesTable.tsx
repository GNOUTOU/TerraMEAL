"use client";

import EntityManager from "@/components/ui/EntityManager";
import type { AdminZone } from "@/lib/types";

const LEVEL_LABELS: Record<string, string> = {
  country: "Pays",
  region: "Région",
  province: "Province",
  commune: "Commune",
  locality: "Localité",
};

export default function ZonesTable({ zones }: { zones: AdminZone[] }) {
  return (
    <EntityManager<AdminZone>
      table="admin_zones"
      title="Zone administrative"
      revalidate="/admin/zones"
      canWrite
      rows={zones}
      columns={[
        { key: "level", label: "Niveau", render: (r) => LEVEL_LABELS[r.level] ?? r.level },
        { key: "code", label: "Code" },
        { key: "name", label: "Nom" },
        { key: "parent_id", label: "Zone parente", render: (r) => zones.find((z) => z.id === r.parent_id)?.name ?? "—" },
        { key: "population", label: "Population" },
      ]}
      fields={[
        {
          name: "level",
          label: "Niveau",
          type: "select",
          required: true,
          options: Object.entries(LEVEL_LABELS).map(([value, label]) => ({ value, label })),
        },
        { name: "code", label: "Code" },
        { name: "name", label: "Nom", required: true },
        {
          name: "parent_id",
          label: "Zone parente",
          type: "select",
          options: zones.map((z) => ({ value: z.id, label: `${LEVEL_LABELS[z.level]} — ${z.name}` })),
        },
        { name: "country_iso3", label: "Code pays (ISO3)" },
        { name: "population", label: "Population", type: "number" },
      ]}
    />
  );
}
