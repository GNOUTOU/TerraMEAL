"use client";

import { useState, useTransition } from "react";
import { Loader2, UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { quickCreateManager } from "@/lib/actions/reference";

// Bouton + modale de création éclair d'un responsable (compte utilisateur réel). Affiché
// uniquement aux administrateurs — cf. `quickCreateManager`.
export default function ManagerQuickCreate({
  onCreated,
}: {
  onCreated: (m: { id: string; full_name: string }) => void;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function suggestPassword() {
    return `Tm-${Math.random().toString(36).slice(2, 8)}${Math.floor(Math.random() * 90 + 10)}`;
  }
  const [pwd, setPwd] = useState(suggestPassword);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await quickCreateManager({
        full_name: String(fd.get("full_name") || ""),
        email: String(fd.get("email") || ""),
        temp_password: String(fd.get("temp_password") || ""),
      });
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success(`Responsable « ${res.full_name} » créé.`);
      onCreated(res);
      setOpen(false);
      setPwd(suggestPassword());
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:underline dark:text-emerald-400"
      >
        <UserPlus size={13} aria-hidden="true" /> Nouveau responsable
      </button>

      {open && (
        <Modal title="Nouveau responsable" onClose={() => setOpen(false)}>
          <form onSubmit={submit} className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Un compte utilisateur (rôle « responsable de programme ») est créé. Communiquez-lui le
              mot de passe temporaire ; il pourra le changer à la première connexion.
            </p>
            <Field label="Nom complet" name="full_name" required autoFocus />
            <Field label="E-mail" name="email" type="email" required />
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                Mot de passe temporaire <span className="text-red-500">*</span>
              </label>
              <input
                name="temp_password"
                value={pwd}
                onChange={(e) => setPwd(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 font-mono text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
              />
            </div>
            <button
              type="submit"
              disabled={pending}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {pending ? "Création…" : "Créer le responsable"}
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  autoFocus,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        autoFocus={autoFocus}
        className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-emerald-500 dark:border-slate-700 dark:bg-slate-800"
      />
    </div>
  );
}
