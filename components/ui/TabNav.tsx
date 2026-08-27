"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export default function TabNav({ tabs }: { tabs: TabItem[] }) {
  const pathname = usePathname();

  return (
    <div className="mb-6 flex flex-wrap gap-1 border-b border-slate-200 dark:border-slate-800">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = pathname === t.href || pathname.startsWith(t.href + "/");
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-sm font-medium transition ${
              active
                ? "border-emerald-600 text-emerald-700 dark:text-emerald-400"
                : "border-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
            }`}
          >
            <Icon size={15} />
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
