import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import TabNav from "@/components/ui/TabNav";
import { UploadCloud, FileSpreadsheet, Smartphone, Droplets, ListChecks, History } from "lucide-react";

const TABS = [
  { href: "/import/files", label: "Fichiers (CSV/Excel/GeoJSON)", icon: FileSpreadsheet },
  { href: "/import/kobo", label: "KoboToolbox", icon: Smartphone },
  { href: "/import/mwater", label: "mWater", icon: Droplets },
  { href: "/import/review", label: "Revue STAGING", icon: ListChecks },
  { href: "/import/history", label: "Historique", icon: History },
];

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "meal_sig"]);

  return (
    <div>
      <PageHeader title="Import / Synchronisation" description="Pipeline SOURCE → RAW → STAGING → VALIDATION → PRODUCTION." icon={UploadCloud} />
      <TabNav tabs={TABS} />
      {children}
    </div>
  );
}
