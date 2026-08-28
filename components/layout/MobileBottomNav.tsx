"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  MoreHorizontal,
  X,
  User as UserIcon,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { NAV_ITEMS } from "@/lib/nav";
import { signOut } from "@/lib/actions/auth";
import type { Profile, UserRole } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

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

const MAX_VISIBLE = 4;

export default function MobileBottomNav({ role, profile }: { role: UserRole; profile: Profile }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const items = NAV_ITEMS.filter((item) => item.roles.includes(role));

  const needsMore = items.length > MAX_VISIBLE;
  const visible = needsMore ? items.slice(0, MAX_VISIBLE) : items;
  const overflow = needsMore ? items.slice(MAX_VISIBLE) : [];

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-slate-200 bg-white/95 backdrop-blur-md md:hidden dark:border-slate-800 dark:bg-slate-900/95"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {visible.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium"
            >
              <Icon size={20} strokeWidth={active ? 2.4 : 2} className={active ? "text-emerald-600" : "text-slate-400"} />
              <span className={`max-w-full truncate ${active ? "text-emerald-600" : "text-slate-400"}`}>{item.label}</span>
            </Link>
          );
        })}
        {needsMore && (
          <button onClick={() => setOpen(true)} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-1 text-[10px] font-medium">
            <MoreHorizontal size={20} className="text-slate-400" />
            <span className="text-slate-400">Plus</span>
          </button>
        )}
      </nav>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl bg-white p-4 shadow-2xl dark:bg-slate-900"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{profile.full_name}</p>
                <p className="text-xs text-slate-400">{ROLE_LABELS[profile.role]}</p>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {overflow.map((item) => {
                const Icon = ICONS[item.icon];
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl p-3 text-center text-[11px] font-medium ${
                      active ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon size={19} />
                    <span className="line-clamp-2">{item.label}</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 dark:border-slate-800">
              <Link
                href="/profile"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <UserIcon size={16} /> Mon profil
              </Link>
              <button
                onClick={() =>
                  startTransition(() => {
                    setOpen(false);
                    signOut();
                  })
                }
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut size={16} /> Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Empêche le contenu de passer sous la barre fixe */}
      <div className="h-16 shrink-0 md:hidden" style={{ height: "calc(4rem + env(safe-area-inset-bottom))" }} />
    </>
  );
}
