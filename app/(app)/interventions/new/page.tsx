import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import InterventionForm from "../InterventionForm";

export default async function NewInterventionPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  await requireRole(["admin", "meal_sig", "program_manager"]);
  const { project } = await searchParams;
  const supabase = await createClient();

  const [{ data: projects }, { data: sectors }, { data: zones }, { data: partners }] = await Promise.all([
    supabase.from("projects").select("id, name").is("deleted_at", null).order("name"),
    supabase.from("sectors").select("id, name").eq("active", true).order("name"),
    supabase.from("admin_zones").select("id, name").order("name"),
    supabase.from("partners").select("id, name").eq("active", true).order("name"),
  ]);

  return (
    <div>
      <PageHeader title="Nouvelle réalisation" description="Enregistrer une intervention, infrastructure ou activité." />
      <Card>
        <InterventionForm
          projects={projects ?? []}
          sectors={sectors ?? []}
          zones={zones ?? []}
          partners={partners ?? []}
          defaultProjectId={project}
        />
      </Card>
    </div>
  );
}
