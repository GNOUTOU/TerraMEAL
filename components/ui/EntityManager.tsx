"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { crudInsert, crudUpdate, crudDelete } from "@/lib/actions/crud";

export interface FieldConfig {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "select" | "checkbox" | "color" | "email" | "date" | "json" | "hidden";
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: unknown;
}

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

export default function EntityManager<T extends object>({
  table,
  title,
  columns,
  fields,
  rows,
  revalidate,
  canWrite,
  idKey = "id",
}: {
  table: string;
  title: string;
  columns: ColumnConfig<T>[];
  fields: FieldConfig[];
  rows: T[];
  revalidate: string;
  canWrite: boolean;
  idKey?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const initialValues = useMemo(() => {
    if (editing) return editing;
    const defaults: Record<string, unknown> = {};
    for (const f of fields) if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
    return defaults as T;
  }, [editing, fields]);

  function openCreate() {
    setEditing(null);
    setError(null);
    setOpen(true);
  }
  function openEdit(row: T) {
    setEditing(row);
    setError(null);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values: Record<string, unknown> = {};
    for (const f of fields) {
      if (f.type === "checkbox") {
        values[f.name] = form.get(f.name) === "on";
      } else if (f.type === "number") {
        const v = form.get(f.name);
        values[f.name] = v === "" || v === null ? null : Number(v);
      } else if (f.type === "json") {
        const v = String(form.get(f.name) ?? "").trim();
        try {
          values[f.name] = v === "" ? {} : JSON.parse(v);
        } catch {
          setError(`Le champ "${f.label}" doit être un JSON valide.`);
          return;
        }
      } else {
        const v = form.get(f.name);
        values[f.name] = v === "" ? null : v;
      }
    }

    startTransition(async () => {
      const result = editing
        ? await crudUpdate(table, String((editing as Record<string, unknown>)[idKey]), values, revalidate, idKey)
        : await crudInsert(table, values, revalidate);
      if (result.error) {
        setError(result.error);
      } else {
        setOpen(false);
        router.refresh();
      }
    });
  }

  function handleDelete(row: T) {
    if (!confirm("Confirmer la suppression ?")) return;
    startTransition(async () => {
      const result = await crudDelete(table, String((row as Record<string, unknown>)[idKey]), revalidate, idKey);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  return (
    <div>
      {canWrite && (
        <div className="mb-3 flex justify-end">
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            <Plus size={15} /> Nouveau
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2.5 font-medium">
                  {c.label}
                </th>
              ))}
              {canWrite && <th className="px-4 py-2.5" />}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-slate-400">
                  Aucun élément.
                </td>
              </tr>
            )}
            {rows.map((row) => (
              <tr key={String((row as Record<string, unknown>)[idKey])} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2.5 text-slate-700 dark:text-slate-300">
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
                {canWrite && (
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(row)} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(row)} className="rounded p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <Modal title={editing ? `Modifier — ${title}` : `Nouveau — ${title}`} onClose={() => setOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-3">
            {fields.map((f) =>
              f.type === "hidden" ? (
                <input
                  key={f.name}
                  type="hidden"
                  name={f.name}
                  defaultValue={String((initialValues as Record<string, unknown>)[f.name] ?? "")}
                />
              ) : (
              <div key={f.name}>
                <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                  {f.label}
                  {f.required && <span className="text-red-500"> *</span>}
                </label>
                {f.type === "textarea" ? (
                  <textarea
                    name={f.name}
                    required={f.required}
                    defaultValue={String((initialValues as Record<string, unknown>)[f.name] ?? "")}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                ) : f.type === "json" ? (
                  <textarea
                    name={f.name}
                    required={f.required}
                    defaultValue={(() => {
                      const v = (initialValues as Record<string, unknown>)[f.name];
                      return v === undefined ? "{}" : JSON.stringify(v, null, 2);
                    })()}
                    rows={5}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-xs outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                ) : f.type === "select" ? (
                  <select
                    name={f.name}
                    required={f.required}
                    defaultValue={String((initialValues as Record<string, unknown>)[f.name] ?? "")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  >
                    <option value="">—</option>
                    {f.options?.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    name={f.name}
                    defaultChecked={Boolean((initialValues as Record<string, unknown>)[f.name])}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    name={f.name}
                    required={f.required}
                    defaultValue={String((initialValues as Record<string, unknown>)[f.name] ?? "")}
                    className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
                  />
                )}
              </div>
              )
            )}
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
