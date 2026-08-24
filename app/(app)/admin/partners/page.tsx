import { createClient } from "@/lib/supabase/server";
import EntityManager from "@/components/ui/EntityManager";
import type { Partner } from "@/lib/types";

export default async function PartnersAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("partners").select("*").order("name");

  return (
    <EntityManager<Partner>
      table="partners"
      title="Partenaire"
      revalidate="/admin/partners"
      canWrite
      rows={(data as Partner[]) ?? []}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Nom" },
        { key: "type", label: "Type" },
        { key: "active", label: "Actif", render: (r) => (r.active ? "Oui" : "Non") },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Nom", required: true },
        { name: "type", label: "Type" },
        { name: "contact_name", label: "Contact" },
        { name: "contact_email", label: "E-mail", type: "email" },
        { name: "contact_phone", label: "Téléphone" },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "active", label: "Actif", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
