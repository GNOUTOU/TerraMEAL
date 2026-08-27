"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Map,
  FolderKanban,
  MapPinned,
  Gauge,
  UploadCloud,
  ShieldCheck,
  HandCoins,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import type { UserRole } from "@/lib/types";

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Map,
  FolderKanban,
  MapPinned,
  Gauge,
  UploadCloud,
  ShieldCheck,
  HandCoins,
  Settings,
};

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex dark:border-slate-800 dark:bg-slate-900">
      <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5 dark:border-slate-800">
        <Image src="/terrameal-mark.svg" alt="TerraMEAL" width={30} height={30} className="shrink-0 drop-shadow-sm" />
        <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">TerraMEAL</span>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                  : "text-slate-600 hover:translate-x-0.5 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-emerald-600" />}
              <Icon size={18} strokeWidth={active ? 2.25 : 2} />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3 text-xs text-slate-400 dark:border-slate-800">
        TerraMEAL — v0.1 (MVP)
      </div>
    </aside>
  );
}
