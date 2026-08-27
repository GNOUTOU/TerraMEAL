import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import ImportTabs from "@/components/layout/ImportTabs";
import { UploadCloud } from "lucide-react";

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "meal_sig"]);

  return (
    <div>
      <PageHeader title="Import / Synchronisation" description="Pipeline SOURCE → RAW → STAGING → VALIDATION → PRODUCTION." icon={UploadCloud} />
      <ImportTabs />
      {children}
    </div>
  );
}
