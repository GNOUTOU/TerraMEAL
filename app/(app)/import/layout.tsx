import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";

const TABS = [
  { href: "/import/files", label: "Fichiers (CSV/Excel/GeoJSON)" },
  { href: "/import/kobo", label: "KoboToolbox" },
  { href: "/import/mwater", label: "mWater" },
  { href: "/import/review", label: "Revue STAGING" },
  { href: "/import/history", label: "Historique" },
];

export default async function ImportLayout({ children }: { children: React.ReactNode }) {
  await requireRole(["admin", "meal_sig"]);

  return (
    <div>
      <PageHeader title="Import / Synchronisation" description="Pipeline SOURCE → RAW → STAGING → VALIDATION → PRODUCTION." />
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
