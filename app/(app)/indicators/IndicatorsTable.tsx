"use client";

import Link from "next/link";
import EntityManager from "@/components/ui/EntityManager";
import type { Indicator } from "@/lib/types";

type Row = Indicator & Record<string, unknown> & { sectors: { name: string } | null };

export default function IndicatorsTable({
  rows,
  sectors,
  canWrite,
}: {
  rows: Row[];
  sectors: { id: string; name: string }[];
  canWrite: boolean;
}) {
  return (
    <EntityManager<Row>
      table="indicators"
      title="Indicateur"
      revalidate="/indicators"
      canWrite={canWrite}
      rows={rows}
      idKey="id"
      columns={[
        { key: "code", label: "Code" },
        {
          key: "label",
          label: "Libellé",
          render: (r) => (
            <Link href={`/indicators/${r.id}`} className="font-medium text-slate-800 hover:text-emerald-600 dark:text-slate-100">
              {r.label}
            </Link>
          ),
        },
        { key: "sector", label: "Secteur", render: (r) => r.sectors?.name ?? "—" },
        { key: "unit", label: "Unité" },
        { key: "frequency", label: "Fréquence" },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "label", label: "Libellé", required: true },
        { name: "definition", label: "Définition", type: "textarea" },
        { name: "unit", label: "Unité" },
        {
          name: "sector_id",
          label: "Secteur",
          type: "select",
          options: sectors.map((s) => ({ value: s.id, label: s.name })),
        },
        { name: "source", label: "Source" },
        { name: "calculation_method", label: "Méthode de calcul", type: "textarea" },
        { name: "numerator", label: "Numérateur" },
        { name: "denominator", label: "Dénominateur" },
        { name: "frequency", label: "Fréquence (mensuel, trimestriel...)" },
        { name: "baseline_value", label: "Valeur de référence", type: "number" },
        { name: "active", label: "Actif", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
