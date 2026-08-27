import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireUser, canWriteOperationalData } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import EntityManager from "@/components/ui/EntityManager";
import { Gauge } from "lucide-react";
import type { Indicator } from "@/lib/types";

export default async function IndicatorsPage() {
  const { profile } = await requireUser();
  const supabase = await createClient();
  const [{ data: indicators }, { data: sectors }] = await Promise.all([
    supabase.from("indicators").select("*, sectors(name)").order("code"),
    supabase.from("sectors").select("id, name").eq("active", true).order("name"),
  ]);

  const canWrite = canWriteOperationalData(profile.role);
  const rows = (indicators as (Indicator & { sectors: { name: string } | null })[]) ?? [];

  return (
    <div>
      <PageHeader title="Indicateurs" description="Référentiel d'indicateurs : définitions, cibles et méthodes de calcul." icon={Gauge} />
      <EntityManager<Indicator & Record<string, unknown>>
        table="indicators"
        title="Indicateur"
        revalidate="/indicators"
        canWrite={canWrite}
        rows={rows as unknown as (Indicator & Record<string, unknown>)[]}
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
          { key: "sector", label: "Secteur", render: (r) => (r as unknown as { sectors: { name: string } | null }).sectors?.name ?? "—" },
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
            options: (sectors ?? []).map((s) => ({ value: s.id, label: s.name })),
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
    </div>
  );
}
