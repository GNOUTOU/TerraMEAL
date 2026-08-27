"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

// Barre de filtres combinables (17) : géographie, projet, secteur, bailleur, temps, statut.
// Écrit dans l'URL — les Server Components lisent `searchParams` et appliquent le même
// filtre à la carte, aux KPI, aux graphiques et aux tableaux (CA04).
export default function FilterBar({ filters }: { filters: FilterDef[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  const hasActive = filters.some((f) => searchParams.get(f.key));

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <SlidersHorizontal size={15} className="text-slate-400" />
      {filters.map((f) => (
        <select
          key={f.key}
          value={searchParams.get(f.key) ?? ""}
          onChange={(e) => setFilter(f.key, e.target.value)}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-600 outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
        >
          <option value="">{f.label}</option>
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}
      {hasActive && (
        <button
          onClick={() => router.push(pathname)}
          className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
        >
          <RotateCcw size={12} /> Réinitialiser
        </button>
      )}
    </div>
  );
}
