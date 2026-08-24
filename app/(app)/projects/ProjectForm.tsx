"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject } from "@/lib/actions/projects";
import type { Project } from "@/lib/types";
import { PROJECT_STATUS_LABELS } from "@/lib/types";

interface RefItem {
  id: string;
  name: string;
  level?: string;
  color?: string;
}

export default function ProjectForm({
  project,
  sectors,
  zones,
  partners,
  donors,
  managers,
  selected,
}: {
  project?: Project;
  sectors: RefItem[];
  zones: RefItem[];
  partners: RefItem[];
  donors: RefItem[];
  managers: { id: string; full_name: string }[];
  selected?: { sector_ids: string[]; zone_ids: string[]; partner_ids: string[]; donor_ids: string[] };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = project ? await updateProject(project.id, formData) : await createProject(formData);
      if (result?.error) setError(result.error);
      else if (project) router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TextField label="Code projet" name="code" defaultValue={project?.code} required />
        <TextField label="Nom du projet" name="name" defaultValue={project?.name} required />
      </div>
      <TextArea label="Description" name="description" defaultValue={project?.description ?? ""} />

      <fieldset className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-xs font-semibold uppercase text-slate-400">Statut &amp; période</legend>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <SelectField
            label="Statut"
            name="status"
            defaultValue={project?.status ?? "preparation"}
            options={Object.entries(PROJECT_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
          />
          <TextField label="Année" name="year" type="number" defaultValue={project?.year ?? undefined} />
          <TextField label="Début" name="start_date" type="date" defaultValue={project?.start_date ?? undefined} />
          <TextField label="Fin" name="end_date" type="date" defaultValue={project?.end_date ?? undefined} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <TextField label="Période de reporting" name="reporting_period" defaultValue={project?.reporting_period ?? ""} />
          <SelectField
            label="Responsable"
            name="manager_id"
            defaultValue={project?.manager_id ?? ""}
            options={managers.map((m) => ({ value: m.id, label: m.full_name }))}
          />
        </div>
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-xs font-semibold uppercase text-slate-400">Financement</legend>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <TextField label="Budget" name="budget" type="number" defaultValue={project?.budget ?? undefined} />
          <TextField label="Devise" name="currency" defaultValue={project?.currency ?? "USD"} />
          <SelectField
            label="Bailleur principal"
            name="donor_principal_id"
            defaultValue={project?.donor_principal_id ?? ""}
            options={donors.map((d) => ({ value: d.id, label: d.name }))}
          />
        </div>
        <CheckboxGroup label="Bailleurs / co-financements" name="donor_ids" options={donors} defaultValues={selected?.donor_ids} />
      </fieldset>

      <fieldset className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-xs font-semibold uppercase text-slate-400">Programmatique &amp; géographie</legend>
        <CheckboxGroup label="Secteurs" name="sector_ids" options={sectors} defaultValues={selected?.sector_ids} />
        <CheckboxGroup
          label="Zones de couverture"
          name="zone_ids"
          options={zones.map((z) => ({ id: z.id, name: `${z.name}${z.level ? ` (${z.level})` : ""}` }))}
          defaultValues={selected?.zone_ids}
        />
        <CheckboxGroup label="Partenaires de mise en œuvre" name="partner_ids" options={partners} defaultValues={selected?.partner_ids} />
      </fieldset>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Enregistrement..." : project ? "Enregistrer les modifications" : "Créer le projet"}
      </button>
    </form>
  );
}

function TextField({
  label,
  name,
  type = "text",
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      />
    </div>
  );
}

function TextArea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={3}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      />
    </div>
  );
}

function SelectField({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  defaultValues = [],
}: {
  label: string;
  name: string;
  options: { id: string; name: string }[];
  defaultValues?: string[];
}) {
  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">{label}</p>
      <div className="flex max-h-32 flex-wrap gap-x-4 gap-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-2 dark:border-slate-700">
        {options.length === 0 && <span className="text-xs text-slate-400">Aucun élément disponible.</span>}
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
            <input type="checkbox" name={name} value={o.id} defaultChecked={defaultValues.includes(o.id)} className="h-3.5 w-3.5 rounded border-slate-300" />
            {o.name}
          </label>
        ))}
      </div>
    </div>
  );
}
