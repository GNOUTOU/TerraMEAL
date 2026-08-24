import { createClient } from "@/lib/supabase/server";
import EntityManager from "@/components/ui/EntityManager";
import type { Donor } from "@/lib/types";

export default async function DonorsAdminPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("donors").select("*").order("name");

  return (
    <EntityManager<Donor>
      table="donors"
      title="Bailleur"
      revalidate="/admin/donors"
      canWrite
      rows={(data as Donor[]) ?? []}
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Nom" },
        { key: "type", label: "Type" },
        { key: "country", label: "Pays" },
        { key: "active", label: "Actif", render: (r) => (r.active ? "Oui" : "Non") },
      ]}
      fields={[
        { name: "code", label: "Code", required: true },
        { name: "name", label: "Nom", required: true },
        { name: "type", label: "Type" },
        { name: "contact_name", label: "Contact" },
        { name: "contact_email", label: "E-mail", type: "email" },
        { name: "contact_phone", label: "Téléphone" },
        { name: "country", label: "Pays" },
        { name: "website", label: "Site web" },
        { name: "notes", label: "Notes", type: "textarea" },
        { name: "active", label: "Actif", type: "checkbox", defaultValue: true },
      ]}
    />
  );
}
