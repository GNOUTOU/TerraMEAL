"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import PulsingLogo from "@/components/ui/PulsingLogo";
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
  ChevronsLeft,
  ChevronsRight,
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

const STORAGE_KEY = "terrameal:sidebar-collapsed";

export default function Sidebar({ role }: { role: UserRole }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Lecture volontairement différée au montage : localStorage n'existe pas côté serveur, donc
  // lire la valeur pendant le rendu créerait un mismatch d'hydratation. `mounted` évite le
  // flash visuel le temps de cette resynchronisation.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
    setMounted(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function toggle() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={`relative hidden shrink-0 flex-col bg-gradient-to-b from-[#0b3a52] to-[#082a3d] shadow-xl transition-[width] duration-200 md:flex ${
        collapsed ? "w-[72px]" : "w-64"
      } ${mounted ? "" : "duration-0"}`}
    >
      <div className={`flex h-16 items-center gap-2.5 border-b border-white/10 ${collapsed ? "justify-center px-2" : "px-5"}`}>
        <PulsingLogo size={30} />
        {!collapsed && <span className="truncate text-lg font-semibold tracking-tight text-white">TerraMEAL</span>}
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden p-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`group relative flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition-all duration-150 ${
                collapsed ? "justify-center px-0" : "px-3"
              } ${
                active
                  ? "bg-[#17A398]/15 text-[#4fd8c8]"
                  : "text-slate-300/80 hover:bg-white/5 hover:text-white"
              }`}
            >
              {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-[#17A398]" />}
              <Icon size={18} strokeWidth={active ? 2.25 : 2} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={toggle}
        title={collapsed ? "Déplier le menu" : "Réduire le menu"}
        className={`flex items-center gap-2 border-t border-white/10 px-3 py-3 text-xs font-medium text-slate-300/70 transition hover:bg-white/5 hover:text-white ${
          collapsed ? "justify-center" : ""
        }`}
      >
        {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        {!collapsed && "Réduire"}
      </button>
      {!collapsed && <div className="border-t border-white/10 p-3 text-[11px] text-slate-400/70">TerraMEAL — v0.1 (MVP)</div>}
    </aside>
  );
}
