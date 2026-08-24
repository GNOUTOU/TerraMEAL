import { createClient } from "@/lib/supabase/server";
import EntityManager from "@/components/ui/EntityManager";
import type { Sector } from "@/lib/types";

export default async function SectorsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("sectors").select("*").order("name");

  return (
    <EntityManager<Sector>
      table="sectors"
      title="Secteur"
      revalidate="/admin/sectors"
      canWrite
      rows={(data as Sector[]) ?? []}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Nom" },
        {
          key: "color",
          label: "Couleur",
          render: (r) => (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: r.color }} />
              {r.color}
            </span>
          ),
        },
        { key: "active", label: "Actif", render: (r) => (r.active ? "Oui" : "Non") },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Nom", required: true },
        { name: "description", label: "Description", type: "textarea" },
        { name: "color", label: "Couleur (légende carte)", type: "color", defaultValue: "#2563eb" },
        { name: "active", label: "Actif", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
