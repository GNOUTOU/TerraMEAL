import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import FileImportWizard from "./FileImportWizard";

export default async function FilesImportPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase.from("projects").select("id, name").is("deleted_at", null).order("name");

  return (
    <Card>
      <FileImportWizard projects={projects ?? []} />
    </Card>
  );
}
