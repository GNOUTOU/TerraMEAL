import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import AdminTabs from "@/components/layout/AdminTabs";
import { Settings } from "lucide-react";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);

  return (
    <div>
      <PageHeader title="Administration" description="Utilisateurs, rôles, référentiels, sources et paramètres généraux." icon={Settings} />
      <AdminTabs />
      {children}
    </div>
  );
}
