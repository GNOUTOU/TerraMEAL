"use client";

import EntityManager from "@/components/ui/EntityManager";
import type { IndicatorResult } from "@/lib/types";

export default function ResultsTable({
  indicatorId,
  rows,
  projects,
  zones,
  canWrite,
}: {
  indicatorId: string;
  rows: (IndicatorResult & Record<string, unknown>)[];
  projects: { id: string; name: string }[];
  zones: { id: string; name: string }[];
  canWrite: boolean;
}) {
  return (
    <EntityManager<IndicatorResult & Record<string, unknown>>
      table="indicator_results"
      title="Résultat"
      revalidate={`/indicators/${indicatorId}`}
      canWrite={canWrite}
      rows={rows}
      columns={[
        { key: "period", label: "Période" },
        { key: "target_value", label: "Cible" },
        { key: "actual_value", label: "Réalisé" },
        { key: "achievement_rate", label: "Taux", render: (r) => (r.achievement_rate != null ? `${r.achievement_rate}%` : "—") },
        { key: "validation_status", label: "Statut" },
      ]}
      fields={[
        { name: "indicator_id", label: "Indicateur", type: "hidden", defaultValue: indicatorId },
        { name: "period", label: "Période (ex: 2026-T1)", required: true },
        { name: "year", label: "Année", type: "number" },
        {
          name: "project_id",
          label: "Projet",
          type: "select",
          options: projects.map((p) => ({ value: p.id, label: p.name })),
        },
        {
          name: "admin_zone_id",
          label: "Zone",
          type: "select",
          options: zones.map((z) => ({ value: z.id, label: z.name })),
        },
        { name: "target_value", label: "Cible", type: "number" },
        { name: "actual_value", label: "Réalisé", type: "number" },
        {
          name: "validation_status",
          label: "Statut",
          type: "select",
          defaultValue: "validated",
          options: [
            { value: "imported", label: "Importé" },
            { value: "to_verify", label: "À vérifier" },
            { value: "validated", label: "Validé" },
            { value: "published", label: "Publié" },
          ],
        },
      ]}
    />
  );
}
