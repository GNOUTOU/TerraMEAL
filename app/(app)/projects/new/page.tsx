import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { getReferenceData } from "@/lib/queries/reference";
import ProjectForm from "../ProjectForm";

export default async function NewProjectPage() {
  const { profile } = await requireRole(["admin", "meal_sig"]);
  const ref = await getReferenceData();

  return (
    <div>
      <PageHeader title="Nouveau projet" description="Créer une nouvelle fiche projet." />
      <Card>
        <ProjectForm
          sectors={ref.sectors}
          zones={ref.zones}
          partners={ref.partners}
          donors={ref.donors}
          managers={ref.managers}
          canCreateManager={profile.role === "admin"}
        />
      </Card>
    </div>
  );
}
