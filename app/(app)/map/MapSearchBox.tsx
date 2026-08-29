"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, X, FolderKanban, MapPinned, Landmark } from "lucide-react";
import { globalSearch } from "@/lib/actions/search";
import type { SearchResult } from "@/lib/search-utils";

const MAPPABLE_TYPES = new Set(["project", "intervention", "admin_zone"]);

const TYPE_ICONS: Record<string, typeof FolderKanban> = {
  project: FolderKanban,
  intervention: MapPinned,
  admin_zone: Landmark,
};

const TYPE_LABELS: Record<string, string> = {
  project: "Projet",
  intervention: "Réalisation",
  admin_zone: "Localité / commune",
};

/**
 * Recherche cartographique dédiée (15.3) : projet, localité, commune, infrastructure,
 * intervention, réalisation — directement sur la carte, sans quitter la page. Réutilise le RPC
 * global_search déjà en place pour la recherche du topbar (0008_functions_views.sql), mais ne
 * garde que les résultats géolocalisables et pilote les filtres carte existants (project/zone/
 * intervention) via l'URL au lieu de naviguer vers une fiche.
 */
export default function MapSearchBox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [, startTransition] = useTransition();
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) return;
    const t = setTimeout(() => {
      startTransition(() => {
        globalSearch(query).then((r) => {
          setResults(r.filter((x) => MAPPABLE_TYPES.has(x.entity_type)));
          setShowResults(true);
        });
      });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const visibleResults = query.trim().length < 2 ? [] : results;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setShowResults(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const activeLabel = searchParams.get("focusLabel");

  function selectResult(r: SearchResult) {
    setShowResults(false);
    setQuery("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("project");
    params.delete("zone");
    params.delete("intervention");
    if (r.entity_type === "project") params.set("project", r.id);
    else if (r.entity_type === "admin_zone") params.set("zone", r.id);
    else if (r.entity_type === "intervention") params.set("intervention", r.id);
    params.set("focusLabel", r.label);
    router.push(`${pathname}?${params.toString()}`);
  }

  function clearFocus() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("project");
    params.delete("zone");
    params.delete("intervention");
    params.delete("focusLabel");
    router.push(params.toString() ? `${pathname}?${params.toString()}` : pathname);
  }

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1 sm:max-w-xs">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
      <input
        type="search"
        aria-label="Recherche cartographique"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => visibleResults.length > 0 && setShowResults(true)}
        placeholder="Chercher un projet, une commune, une réalisation..."
        className="w-full min-w-0 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-8 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      />
      {activeLabel && !query && (
        <button
          onClick={clearFocus}
          aria-label="Effacer la recherche cartographique"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          <X size={14} />
        </button>
      )}
      {showResults && visibleResults.length > 0 && (
        <div className="absolute z-30 mt-1 w-full min-w-[260px] rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {visibleResults.map((r) => {
            const Icon = TYPE_ICONS[r.entity_type] ?? Search;
            return (
              <button
                key={`${r.entity_type}-${r.id}`}
                onClick={() => selectResult(r)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <Icon size={14} className="shrink-0 text-slate-400" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-800 dark:text-slate-100">{r.label}</span>
                  <span className="block truncate text-xs text-slate-400">
                    {TYPE_LABELS[r.entity_type]} {r.subtitle ? `· ${r.subtitle}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
