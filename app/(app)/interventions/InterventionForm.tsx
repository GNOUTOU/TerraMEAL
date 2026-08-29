"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createIntervention, updateIntervention } from "@/lib/actions/interventions";
import GeometryDrawMap from "./GeometryDrawMap";
import type { Activity, Infrastructure, Intervention } from "@/lib/types";

interface RefItem {
  id: string;
  name: string;
}

export default function InterventionForm({
  intervention,
  infra,
  activity,
  projects,
  sectors,
  zones,
  partners = [],
  defaultProjectId,
}: {
  intervention?: Intervention;
  infra?: Infrastructure | null;
  activity?: Activity | null;
  projects: RefItem[];
  sectors: RefItem[];
  zones: RefItem[];
  partners?: RefItem[];
  defaultProjectId?: string;
}) {
  const router = useRouter();
  const [category, setCategory] = useState(intervention?.category ?? "realisation");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const lat = (intervention?.geom as { coordinates?: [number, number] } | undefined)?.coordinates?.[1];
  const lng = (intervention?.geom as { coordinates?: [number, number] } | undefined)?.coordinates?.[0];

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const result = intervention ? await updateIntervention(intervention.id, formData) : await createIntervention(formData);
      if (result?.error) setError(result.error);
      else if (intervention) router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Select label="Projet" name="project_id" defaultValue={intervention?.project_id ?? defaultProjectId} required options={projects} />
        <Select
          label="Catégorie"
          name="category"
          defaultValue={category}
          onChange={(v) => setCategory(v as typeof category)}
          options={[
            { id: "realisation", name: "Réalisation générique" },
            { id: "infrastructure", name: "Infrastructure" },
            { id: "activity", name: "Activité" },
          ]}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Text label="Nom" name="name" defaultValue={intervention?.name} required />
        <Text label="Type" name="type" defaultValue={intervention?.type} required placeholder="Forage, formation, distribution..." />
      </div>
      <Textarea label="Description" name="description" defaultValue={intervention?.description ?? ""} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Select label="Secteur" name="sector_id" defaultValue={intervention?.sector_id ?? ""} options={sectors} />
        <Select label="Zone administrative" name="admin_zone_id" defaultValue={intervention?.admin_zone_id ?? ""} options={zones} />
        <Select label="Partenaire de mise en œuvre" name="implementing_partner_id" defaultValue={intervention?.implementing_partner_id ?? ""} options={partners} />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Text label="Date" name="date" type="date" defaultValue={intervention?.date ?? ""} />
        <Text label="Statut" name="status" defaultValue={intervention?.status ?? "planifie"} />
        <Text label="Latitude" name="lat" type="number" defaultValue={lat} placeholder="ex: 13.45" />
        <Text label="Longitude" name="lng" type="number" defaultValue={lng} placeholder="ex: -1.55" />
      </div>
      <Text label="Bénéficiaires (total agrégé)" name="beneficiaries_total" type="number" defaultValue={intervention?.beneficiaries_total ?? undefined} />

      <fieldset className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
        <legend className="px-1 text-xs font-semibold uppercase text-slate-400">Géométrie sur la carte (point / ligne / polygone)</legend>
        <p className="mb-2 text-xs text-slate-400">
          Optionnel : pour une ligne ou un polygone, dessinez directement sur la carte. Pour un simple point, les champs latitude/longitude ci-dessus suffisent.
        </p>
        <GeometryDrawMap initialGeometry={intervention?.geom as GeoJSON.Geometry | null | undefined} />
      </fieldset>

      {category === "infrastructure" && (
        <fieldset className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <legend className="px-1 text-xs font-semibold uppercase text-slate-400">Infrastructure</legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Text label="Type d'infrastructure" name="infra_type" defaultValue={infra?.infra_type} placeholder="Forage, latrine, école..." />
            <Text label="Capacité" name="capacity" type="number" defaultValue={infra?.capacity ?? undefined} />
            <Select
              label="État fonctionnel"
              name="functional_status"
              defaultValue={infra?.functional_status ?? "functional"}
              options={[
                { id: "functional", name: "Fonctionnel" },
                { id: "non_functional", name: "Non fonctionnel" },
                { id: "under_construction", name: "En construction" },
                { id: "rehabilitated", name: "Réhabilité" },
                { id: "abandoned", name: "Abandonné" },
              ]}
            />
          </div>
        </fieldset>
      )}

      {category === "activity" && (
        <fieldset className="rounded-lg border border-slate-200 p-4 dark:border-slate-800">
          <legend className="px-1 text-xs font-semibold uppercase text-slate-400">Activité</legend>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Text label="Type d'activité" name="activity_type" defaultValue={activity?.activity_type} placeholder="Formation, distribution..." />
            <Text label="Nombre de participants" name="participants_count" type="number" defaultValue={activity?.participants_count ?? undefined} />
            <Text label="Nombre de sessions" name="sessions_count" type="number" defaultValue={activity?.sessions_count ?? undefined} />
          </div>
          <div className="mt-4">
            <Text label="Lieu" name="location_text" defaultValue={activity?.location_text ?? ""} />
          </div>
        </fieldset>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

      <button type="submit" disabled={pending} className="rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
        {pending ? "Enregistrement..." : intervention ? "Enregistrer" : "Créer la réalisation"}
      </button>
    </form>
  );
}

function Text({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        step={type === "number" ? "any" : undefined}
        defaultValue={defaultValue}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      />
    </div>
  );
}

function Textarea({ label, name, defaultValue }: { label: string; name: string; defaultValue?: string }) {
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

function Select({
  label,
  name,
  defaultValue,
  options,
  required,
  onChange,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: RefItem[];
  required?: boolean;
  onChange?: (v: string) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <select
        name={name}
        defaultValue={defaultValue}
        required={required}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </select>
    </div>
  );
}
