"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { createUserAction, updateUserAction, deactivateUserAction } from "@/lib/actions/users";
import type { Donor, Partner, Profile } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

const ROLES = Object.entries(ROLE_LABELS).filter(([r]) => r !== "public");

export default function UsersManager({ users, donors, partners }: { users: Profile[]; donors: Donor[]; partners: Partner[] }) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await createUserAction(formData);
      if (res.error) setError(res.error);
      else {
        setCreateOpen(false);
        router.refresh();
      }
    });
  }

  function handleEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const form = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      const res = await updateUserAction(editing.id, {
        full_name: form.get("full_name"),
        role: form.get("role"),
        organization: form.get("organization") || null,
        donor_id: form.get("donor_id") || null,
        partner_id: form.get("partner_id") || null,
      });
      if (res.error) setError(res.error);
      else {
        setEditing(null);
        router.refresh();
      }
    });
  }

  function toggleActive(u: Profile) {
    startTransition(async () => {
      await deactivateUserAction(u.id, !u.is_active);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          <Plus size={15} /> Nouvel utilisateur
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="px-4 py-2.5 font-medium">Nom</th>
              <th className="px-4 py-2.5 font-medium">E-mail</th>
              <th className="px-4 py-2.5 font-medium">Rôle</th>
              <th className="px-4 py-2.5 font-medium">Organisation</th>
              <th className="px-4 py-2.5 font-medium">Statut</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-4 py-2.5 font-medium text-slate-700 dark:text-slate-200">{u.full_name}</td>
                <td className="px-4 py-2.5 text-slate-500">{u.email}</td>
                <td className="px-4 py-2.5">
                  <Badge color="blue">{ROLE_LABELS[u.role]}</Badge>
                </td>
                <td className="px-4 py-2.5 text-slate-500">{u.organization ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <Badge color={u.is_active ? "emerald" : "red"}>{u.is_active ? "Actif" : "Désactivé"}</Badge>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditing(u)} className="text-xs text-emerald-600 hover:underline">
                      Modifier
                    </button>
                    <button onClick={() => toggleActive(u)} className="text-xs text-slate-500 hover:underline">
                      {u.is_active ? "Désactiver" : "Activer"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {createOpen && (
        <Modal title="Nouvel utilisateur" onClose={() => setCreateOpen(false)}>
          <form onSubmit={handleCreate} className="space-y-3">
            <Field label="Nom complet" name="full_name" required />
            <Field label="E-mail" name="email" type="email" required />
            <Field label="Mot de passe temporaire" name="temp_password" type="text" required hint="8 caractères min. — à communiquer à l'utilisateur." />
            <SelectField label="Rôle" name="role" options={ROLES.map(([v, l]) => ({ value: v, label: l }))} defaultValue="meal_sig" />
            <Field label="Organisation" name="organization" />
            <SelectField label="Bailleur associé (si rôle Bailleur)" name="donor_id" options={donors.map((d) => ({ value: d.id, label: d.name }))} />
            <SelectField label="Partenaire associé (si rôle Partenaire)" name="partner_id" options={partners.map((p) => ({ value: p.id, label: p.name }))} />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
            <button type="submit" disabled={pending} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {pending ? "Création..." : "Créer l'utilisateur"}
            </button>
          </form>
        </Modal>
      )}

      {editing && (
        <Modal title={`Modifier — ${editing.full_name}`} onClose={() => setEditing(null)}>
          <form onSubmit={handleEdit} className="space-y-3">
            <Field label="Nom complet" name="full_name" defaultValue={editing.full_name} required />
            <SelectField label="Rôle" name="role" options={ROLES.map(([v, l]) => ({ value: v, label: l }))} defaultValue={editing.role} />
            <Field label="Organisation" name="organization" defaultValue={editing.organization ?? ""} />
            <SelectField label="Bailleur associé" name="donor_id" defaultValue={editing.donor_id ?? ""} options={donors.map((d) => ({ value: d.id, label: d.name }))} />
            <SelectField label="Partenaire associé" name="partner_id" defaultValue={editing.partner_id ?? ""} options={partners.map((p) => ({ value: p.id, label: p.name }))} />
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
            <button type="submit" disabled={pending} className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              {pending ? "Enregistrement..." : "Enregistrer"}
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      />
      {hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

function SelectField({
  label,
  name,
  options,
  defaultValue,
}: {
  label: string;
  name: string;
  options: { value: string; label: string }[];
  defaultValue?: string;
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
