"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Loader2, Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";

export interface ComboOption {
  id: string;
  name: string;
}

interface Props {
  label: string;
  /** Nom des <input type="hidden"> émis pour la soumission du formulaire. */
  name: string;
  options: ComboOption[];
  value: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  hint?: string;
  /**
   * Création éclair. Le parent effectue l'appel serveur *et* ajoute l'option à sa propre liste,
   * puis renvoie l'option créée (ou `{ error }`). Le combobox se contente de la sélectionner.
   */
  onCreate?: (name: string, extra: { level?: string }) => Promise<ComboOption | { error: string }>;
  /** Niveaux proposés dans la ligne de création (zones administratives). */
  createLevels?: { value: string; label: string }[];
}

export default function EntityCombobox({
  label,
  name,
  options,
  value,
  onChange,
  multiple = false,
  placeholder = "Rechercher…",
  hint,
  onCreate,
  createLevels,
}: Props) {
  const toast = useToast();
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState(false);
  const [level, setLevel] = useState(createLevels?.[0]?.value ?? "");

  const byId = useMemo(() => new Map(options.map((o) => [o.id, o])), [options]);
  const selected = value.map((id) => byId.get(id)).filter((o): o is ComboOption => Boolean(o));

  const q = query.trim().toLowerCase();
  const filtered = useMemo(
    () => options.filter((o) => o.name.toLowerCase().includes(q)),
    [options, q]
  );
  const exactMatch = options.some((o) => o.name.trim().toLowerCase() === q);
  const canCreate = Boolean(onCreate) && q.length > 0 && !exactMatch && !creating;
  const rows = filtered.length + (canCreate ? 1 : 0);

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  function updateQuery(v: string) {
    setQuery(v);
    setActive(0);
    setOpen(true);
  }

  function commit(ids: string[]) {
    onChange(ids);
    setActive(0);
    setQuery("");
    if (multiple) {
      inputRef.current?.focus();
    } else {
      setOpen(false);
    }
  }

  function toggle(id: string) {
    if (multiple) {
      commit(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
    } else {
      commit(value[0] === id ? [] : [id]);
    }
  }

  async function runCreate() {
    if (!onCreate || !q || creating) return;
    setCreating(true);
    const res = await onCreate(query.trim(), { level: level || undefined });
    setCreating(false);
    if ("error" in res) {
      toast.error(res.error);
      return;
    }
    toast.success(`« ${res.name} » ajouté.`);
    commit(multiple ? [...value, res.id] : [res.id]);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, Math.max(rows - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active < filtered.length) toggle(filtered[active].id);
      else if (canCreate) void runCreate();
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && !query && multiple && value.length) {
      commit(value.slice(0, -1));
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>

      {value.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}

      <div
        className="flex min-h-[38px] flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 px-2 py-1.5 text-sm focus-within:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
        onClick={() => {
          setOpen(true);
          inputRef.current?.focus();
        }}
      >
        {multiple &&
          selected.map((o) => (
            <span
              key={o.id}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-50 py-0.5 pl-2 pr-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
            >
              {o.name}
              <button
                type="button"
                aria-label={`Retirer ${o.name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  commit(value.filter((v) => v !== o.id));
                }}
                className="rounded p-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </span>
          ))}

        {!multiple && selected[0] && !open && (
          <span className="text-slate-800 dark:text-slate-100">{selected[0].name}</span>
        )}

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => updateQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          placeholder={!multiple && selected[0] && !open ? "" : placeholder}
          className="min-w-[6ch] flex-1 bg-transparent py-0.5 outline-none placeholder:text-slate-400"
        />

        {!multiple && selected[0] && (
          <button
            type="button"
            aria-label="Effacer"
            onClick={(e) => {
              e.stopPropagation();
              commit([]);
              setQuery("");
            }}
            className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X size={14} aria-hidden="true" />
          </button>
        )}
        <ChevronDown size={15} className="shrink-0 text-slate-400" aria-hidden="true" />
      </div>

      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}

      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg dark:border-slate-700 dark:bg-slate-900"
        >
          {filtered.map((o, i) => {
            const isSel = value.includes(o.id);
            return (
              <li
                key={o.id}
                role="option"
                aria-selected={isSel}
                onMouseEnter={() => setActive(i)}
                onClick={() => toggle(o.id)}
                className={`flex cursor-pointer items-center justify-between px-3 py-1.5 ${
                  active === i ? "bg-slate-100 dark:bg-slate-800" : ""
                }`}
              >
                <span className={isSel ? "font-medium text-emerald-700 dark:text-emerald-300" : ""}>{o.name}</span>
                {isSel && <Check size={14} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />}
              </li>
            );
          })}

          {filtered.length === 0 && !canCreate && (
            <li className="px-3 py-2 text-xs text-slate-400">Aucun résultat.</li>
          )}

          {canCreate && (
            <li
              role="option"
              aria-selected={active === filtered.length}
              onMouseEnter={() => setActive(filtered.length)}
              className={`flex items-center gap-2 px-3 py-1.5 ${
                active === filtered.length ? "bg-emerald-50 dark:bg-emerald-950/40" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => void runCreate()}
                disabled={creating}
                className="flex flex-1 items-center gap-1.5 text-left font-medium text-emerald-700 disabled:opacity-60 dark:text-emerald-300"
              >
                {creating ? (
                  <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Plus size={14} aria-hidden="true" />
                )}
                Créer «&nbsp;{query.trim()}&nbsp;»
              </button>
              {createLevels && (
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label="Niveau administratif"
                  className="rounded border border-slate-300 bg-white px-1.5 py-1 text-xs outline-none dark:border-slate-600 dark:bg-slate-800"
                >
                  {createLevels.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </select>
              )}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
