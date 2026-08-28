"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, LogOut, User as UserIcon } from "lucide-react";
import { globalSearch } from "@/lib/actions/search";
import { resultHref, type SearchResult } from "@/lib/search-utils";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notifications";
import { signOut } from "@/lib/actions/auth";
import type { AppNotification, Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

export default function Topbar({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [, startTransition] = useTransition();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listNotifications().then(setNotifications);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => {
      startTransition(() => {
        globalSearch(query).then((r) => {
          setResults(r);
          setShowResults(true);
        });
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const visibleResults = query.trim().length < 2 ? [] : results;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="flex h-16 min-w-0 items-center gap-2 border-b border-slate-200 bg-white/95 px-3 shadow-sm backdrop-blur-sm sm:gap-4 sm:px-4 md:px-6 dark:border-slate-800 dark:bg-slate-900/95">
      <div ref={searchRef} className="relative min-w-0 flex-1 sm:max-w-md">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <input
          type="search"
          aria-label="Recherche globale"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => visibleResults.length > 0 && setShowResults(true)}
          placeholder="Rechercher un projet, une localité..."
          className="w-full min-w-0 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:focus:bg-slate-800"
        />
        {showResults && visibleResults.length > 0 && (
          <div className="absolute z-30 mt-1 w-full rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
            {visibleResults.map((r) => (
              <button
                key={`${r.entity_type}-${r.id}`}
                onClick={() => {
                  setShowResults(false);
                  setQuery("");
                  router.push(resultHref(r));
                }}
                className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="font-medium text-slate-800 dark:text-slate-100">{r.label}</span>
                <span className="text-xs text-slate-400">
                  {r.entity_type} {r.subtitle ? `· ${r.subtitle}` : ""}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue(s)` : "Notifications"}
            aria-haspopup="true"
            aria-expanded={showNotifs}
            className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Bell size={18} aria-hidden="true" />
            {unreadCount > 0 && (
              <span aria-hidden="true" className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          {showNotifs && (
            <div className="fixed inset-x-3 top-16 z-30 mt-0 rounded-lg border border-slate-200 bg-white shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-80 dark:border-slate-700 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2 dark:border-slate-800">
                <span className="text-sm font-medium">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={() => startTransition(async () => { await markAllNotificationsRead(); setNotifications(await listNotifications()); })}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 && (
                  <p className="px-3 py-6 text-center text-sm text-slate-400">Aucune notification</p>
                )}
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => startTransition(async () => {
                      await markNotificationRead(n.id);
                      setNotifications(await listNotifications());
                      if (n.link) router.push(n.link);
                    })}
                    className={`block w-full border-b border-slate-50 px-3 py-2 text-left text-sm last:border-0 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 ${
                      !n.is_read ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                    }`}
                  >
                    <p className="font-medium text-slate-700 dark:text-slate-200">{n.title}</p>
                    {n.message && <p className="text-xs text-slate-400">{n.message}</p>}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => setShowUserMenu((v) => !v)}
            aria-label={`Menu du compte — ${profile.full_name}`}
            aria-haspopup="true"
            aria-expanded={showUserMenu}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
              {profile.full_name.slice(0, 1).toUpperCase()}
            </div>
            <div className="hidden text-left md:block">
              <p className="text-sm font-medium leading-tight text-slate-800 dark:text-slate-100">{profile.full_name}</p>
              <p className="text-xs leading-tight text-slate-400">{ROLE_LABELS[profile.role]}</p>
            </div>
          </button>
          {showUserMenu && (
            <div className="absolute right-0 z-30 mt-2 w-48 max-w-[calc(100vw-1.5rem)] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
              <Link href="/profile" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800">
                <UserIcon size={15} /> Mon profil
              </Link>
              <button
                onClick={() => startTransition(() => signOut())}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
              >
                <LogOut size={15} /> Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
