import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";

const TABS = [
  { href: "/admin/users", label: "Utilisateurs" },
  { href: "/admin/donors", label: "Bailleurs" },
  { href: "/admin/partners", label: "Partenaires" },
  { href: "/admin/sectors", label: "Secteurs" },
  { href: "/admin/zones", label: "Zones administratives" },
  { href: "/admin/sources", label: "Sources de données" },
  { href: "/admin/settings", label: "Paramètres" },
  { href: "/admin/logs", label: "Journal d'activité" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin"]);

  return (
    <div>
      <PageHeader title="Administration" description="Utilisateurs, rôles, référentiels, sources et paramètres généraux." />
      <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
        {TABS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-t-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {t.label}
          </Link>
        ))}
      </div>
      {children}
    </div>
  );
}
