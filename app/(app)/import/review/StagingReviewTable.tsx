"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  X,
  Trash2,
  ChevronRight,
  Pencil,
  MapPin,
  Users,
  Search,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import {
  promoteStagingRecord,
  promoteStagingRecords,
  rejectStagingRecord,
  rejectStagingRecords,
  deleteStagingRecord,
  deleteStagingRecords,
  updateStagingNormalized,
} from "@/lib/actions/staging";
import { DATA_SOURCE_LABELS } from "@/lib/types";
import type { DataSourceType } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

interface RefItem {
  id: string;
  name: string;
}
interface Row {
  id: string;
  normalized: Record<string, unknown>;
  created_at: string;
  source: DataSourceType | null;
  source_ref: string | null;
}

function findByName(list: RefItem[], name: unknown) {
  if (!name || typeof name !== "string") return "";
  return list.find((i) => i.name.toLowerCase() === name.toLowerCase())?.id ?? "";
}

/** Ce qu'il manque pour promouvoir la ligne en PRODUCTION. */
function missingFields(n: Record<string, unknown>, zones: RefItem[]): string[] {
  const miss: string[] = [];
  if (!n.project_id) miss.push("projet");
  if (!n.name || String(n.name).trim() === "") miss.push("nom");
  const hasGeo =
    (n.lat != null && n.lng != null) || n.admin_zone_id || findByName(zones, n.admin_zone_name);
  if (!hasGeo) miss.push("localisation");
  return miss;
}

function locationLabel(n: Record<string, unknown>): string {
  const parts = [n.village, n.commune, n.province, n.region]
    .map((v) => (v == null ? "" : String(v).trim()))
    .filter(Boolean);
  if (parts.length) return parts.slice(0, 2).join(", ");
  if (n.admin_zone_name) return String(n.admin_zone_name);
  if (n.lat != null && n.lng != null) return `${n.lat}, ${n.lng}`;
  return "—";
}

export default function StagingReviewTable({
  records,
  projects,
  sectors,
  zones,
}: {
  records: Row[];
  projects: RefItem[];
  sectors: RefItem[];
  zones: RefItem[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [bulkPending, startBulk] = useTransition();

  const projectName = useMemo(
    () => Object.fromEntries(projects.map((p) => [p.id, p.name])),
    [projects]
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return records;
    return records.filter((r) => {
      const n = r.normalized;
      return [n.name, n.type, n.realisation_nature, n.author_name, locationLabel(n), projectName[String(n.project_id)]]
        .map((v) => String(v ?? "").toLowerCase())
        .some((s) => s.includes(needle));
    });
  }, [records, q, projectName]);

  const allVisibleSelected = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const readyCount = filtered.filter((r) => missingFields(r.normalized, zones).length === 0).length;

  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function toggleAll() {
    setSelected((s) => {
      if (filtered.every((r) => s.has(r.id))) return new Set();
      return new Set(filtered.map((r) => r.id));
    });
  }

  function runBulk(fn: () => Promise<void>) {
    startBulk(async () => {
      await fn();
      setSelected(new Set());
      router.refresh();
    });
  }

  const ids = () => [...selected];

  function bulkPromote() {
    if (!confirm(`Promouvoir ${selected.size} enregistrement(s) prêt(s) en PRODUCTION ?`)) return;
    runBulk(async () => {
      const r = await promoteStagingRecords(ids());
      if (r.errors.length) toast.warning(`${r.promoted} promu(s), ${r.errors.length} en échec : ${r.errors[0]}`);
      else toast.success(`${r.promoted} enregistrement(s) promu(s) en PRODUCTION.`);
    });
  }
  function bulkReject() {
    const reason = prompt(`Motif du rejet pour ${selected.size} enregistrement(s) :`);
    if (!reason) return;
    runBulk(async () => {
      const r = await rejectStagingRecords(ids(), reason);
      toast.success(`${r.rejected} enregistrement(s) rejeté(s).`);
    });
  }
  function bulkDelete() {
    if (!confirm(`Supprimer définitivement ${selected.size} enregistrement(s) ? Cette action est irréversible.`)) return;
    runBulk(async () => {
      const r = await deleteStagingRecords(ids());
      if (r.errors.length) toast.warning(`${r.deleted} supprimé(s), ${r.errors.length} refusé(s) : ${r.errors[0]}`);
      else toast.success(`${r.deleted} enregistrement(s) supprimé(s).`);
    });
  }

  return (
    <div>
      {/* Barre d'outils */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher (nom, lieu, projet, auteur…)"
            className="w-full rounded-lg border border-slate-300 py-1.5 pl-8 pr-3 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <span className="text-xs text-slate-400">
          {filtered.length} ligne(s) · <span className="text-emerald-600">{readyCount} prête(s)</span>
        </span>
      </div>

      {/* Barre d'actions groupées */}
      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900 dark:bg-emerald-950/40">
          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            {selected.size} sélectionné(s)
          </span>
          <div className="flex-1" />
          <button
            onClick={bulkPromote}
            disabled={bulkPending}
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {bulkPending ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} Promouvoir
          </button>
          <button
            onClick={bulkReject}
            disabled={bulkPending}
            className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
          >
            <X size={12} /> Rejeter
          </button>
          <button
            onClick={bulkDelete}
            disabled={bulkPending}
            className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 dark:bg-red-950 dark:text-red-300"
          >
            <Trash2 size={12} /> Supprimer
          </button>
          <button onClick={() => setSelected(new Set())} className="text-xs text-slate-400 hover:text-slate-600">
            annuler
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-800 dark:text-slate-400">
            <tr>
              <th className="w-8 px-3 py-2.5">
                <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Tout sélectionner" className="align-middle" />
              </th>
              <th className="px-3 py-2.5 font-medium">Réalisation</th>
              <th className="px-3 py-2.5 font-medium">Projet</th>
              <th className="px-3 py-2.5 font-medium">Localisation</th>
              <th className="px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Bénéf.</th>
              <th className="px-3 py-2.5 font-medium">État</th>
              <th className="px-3 py-2.5 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const n = r.normalized;
              const miss = missingFields(n, zones);
              const isOpen = expanded === r.id;
              return (
                <FragmentRow
                  key={r.id}
                  row={r}
                  open={isOpen}
                  selected={selected.has(r.id)}
                  missing={miss}
                  projectLabel={projectName[String(n.project_id)] ?? "—"}
                  onToggleSelect={() => toggle(r.id)}
                  onToggleOpen={() => setExpanded(isOpen ? null : r.id)}
                  projects={projects}
                  sectors={sectors}
                  zones={zones}
                  onDone={() => {
                    setExpanded(null);
                    router.refresh();
                  }}
                />
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-xs text-slate-400">
                  Aucun résultat pour « {q} ».
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FragmentRow({
  row,
  open,
  selected,
  missing,
  projectLabel,
  onToggleSelect,
  onToggleOpen,
  projects,
  sectors,
  zones,
  onDone,
}: {
  row: Row;
  open: boolean;
  selected: boolean;
  missing: string[];
  projectLabel: string;
  onToggleSelect: () => void;
  onToggleOpen: () => void;
  projects: RefItem[];
  sectors: RefItem[];
  zones: RefItem[];
  onDone: () => void;
}) {
  const n = row.normalized;
  const bf = n.beneficiaries_female;
  const bm = n.beneficiaries_male;
  const bt = n.beneficiaries_total;
  const benef = bt != null ? String(bt) : bf != null || bm != null ? `${bf ?? "?"}♀ / ${bm ?? "?"}♂` : "—";

  return (
    <>
      <tr
        className={`border-t border-slate-100 transition-colors dark:border-slate-800 ${
          selected ? "bg-emerald-50/50 dark:bg-emerald-950/20" : open ? "bg-slate-50 dark:bg-slate-800/40" : "hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
        }`}
      >
        <td className="px-3 py-2">
          <input type="checkbox" checked={selected} onChange={onToggleSelect} aria-label="Sélectionner" className="align-middle" />
        </td>
        <td className="px-3 py-2">
          <button onClick={onToggleOpen} className="flex items-start gap-1.5 text-left">
            <ChevronRight size={14} className={`mt-0.5 shrink-0 text-slate-400 transition-transform ${open ? "rotate-90" : ""}`} />
            <span className="min-w-0">
              <span className="block truncate font-medium text-slate-700 dark:text-slate-100">
                {String(n.name || "").trim() || "(sans nom)"}
              </span>
              <span className="block truncate text-[11px] text-slate-400">
                {[n.realisation_nature, n.type].map((v) => String(v ?? "").trim()).filter(Boolean).join(" · ") ||
                  DATA_SOURCE_LABELS[(row.source ?? "manual") as DataSourceType]}
              </span>
            </span>
          </button>
        </td>
        <td className="px-3 py-2 text-slate-500">
          <span className="block max-w-[10rem] truncate">{projectLabel}</span>
        </td>
        <td className="px-3 py-2 text-slate-500">
          <span className="flex items-center gap-1">
            <MapPin size={12} className="shrink-0 text-slate-300" />
            <span className="max-w-[12rem] truncate">{locationLabel(n)}</span>
          </span>
        </td>
        <td className="whitespace-nowrap px-3 py-2 text-slate-500">{String(n.date ?? "").slice(0, 10) || "—"}</td>
        <td className="whitespace-nowrap px-3 py-2 text-slate-500">
          <span className="flex items-center gap-1">
            <Users size={12} className="shrink-0 text-slate-300" /> {benef}
          </span>
        </td>
        <td className="px-3 py-2">
          {missing.length === 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <CheckCircle2 size={10} /> Prêt
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
              <AlertTriangle size={10} /> Manque {missing.join(", ")}
            </span>
          )}
        </td>
        <td className="px-3 py-2">
          <div className="flex items-center justify-end gap-1">
            <IconBtn title="Éditer" onClick={onToggleOpen}>
              <Pencil size={13} />
            </IconBtn>
            <RowActions id={row.id} name={String(n.name || "").trim() || "(sans nom)"} normalized={n} onDone={onDone} />
          </div>
        </td>
      </tr>
      {open && (
        <tr className="border-t border-slate-100 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60">
          <td colSpan={8} className="px-3 py-3">
            <RowEditor record={row} projects={projects} sectors={sectors} zones={zones} onDone={onDone} />
          </td>
        </tr>
      )}
    </>
  );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      title={title}
      aria-label={title}
      onClick={onClick}
      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
    >
      {children}
    </button>
  );
}

function RowActions({
  id,
  name,
  normalized,
  onDone,
}: {
  id: string;
  name: string;
  normalized: Record<string, unknown>;
  onDone: () => void;
}) {
  const toast = useToast();
  const [pending, start] = useTransition();

  function promote() {
    start(async () => {
      const res = await promoteStagingRecord(id, normalized);
      if (res.error) toast.error(res.error, "Promotion impossible");
      else {
        toast.success(`« ${name} » promu(e) en PRODUCTION.`);
        onDone();
      }
    });
  }
  function reject() {
    const reason = prompt("Motif du rejet :");
    if (!reason) return;
    start(async () => {
      await rejectStagingRecord(id, reason);
      toast.success(`« ${name} » rejeté(e).`);
      onDone();
    });
  }
  function remove() {
    if (!confirm(`Supprimer définitivement « ${name} » ?`)) return;
    start(async () => {
      const res = await deleteStagingRecord(id);
      if (res.error) toast.error(res.error, "Suppression impossible");
      else {
        toast.success(`« ${name} » supprimé(e).`);
        onDone();
      }
    });
  }

  return (
    <>
      <IconBtn title="Promouvoir en PRODUCTION" onClick={promote}>
        {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} className="text-emerald-600" />}
      </IconBtn>
      <IconBtn title="Rejeter" onClick={reject}>
        <X size={13} />
      </IconBtn>
      <IconBtn title="Supprimer" onClick={remove}>
        <Trash2 size={13} className="text-red-500" />
      </IconBtn>
    </>
  );
}

function RowEditor({
  record,
  projects,
  sectors,
  zones,
  onDone,
}: {
  record: Row;
  projects: RefItem[];
  sectors: RefItem[];
  zones: RefItem[];
  onDone: () => void;
}) {
  const normalized = record.normalized;
  const toast = useToast();
  const [pending, start] = useTransition();

  const [fields, setFields] = useState({
    name: String(normalized.name ?? ""),
    type: String(normalized.type ?? ""),
    realisation_nature: String(normalized.realisation_nature ?? ""),
    date: String(normalized.date ?? "").slice(0, 10),
    lat: normalized.lat != null ? String(normalized.lat) : "",
    lng: normalized.lng != null ? String(normalized.lng) : "",
    project_id: String(normalized.project_id ?? ""),
    sector_id: String(normalized.sector_id ?? findByName(sectors, normalized.sector_name)),
    admin_zone_id: String(normalized.admin_zone_id ?? findByName(zones, normalized.admin_zone_name)),
    country: String(normalized.country ?? ""),
    region: String(normalized.region ?? ""),
    province: String(normalized.province ?? ""),
    commune: String(normalized.commune ?? ""),
    village: String(normalized.village ?? ""),
    author_name: String(normalized.author_name ?? ""),
    author_type: String(normalized.author_type ?? ""),
    beneficiaries_total: normalized.beneficiaries_total != null ? String(normalized.beneficiaries_total) : "",
    beneficiaries_female: normalized.beneficiaries_female != null ? String(normalized.beneficiaries_female) : "",
    beneficiaries_male: normalized.beneficiaries_male != null ? String(normalized.beneficiaries_male) : "",
  });

  const photos = Array.isArray(normalized.photos) ? (normalized.photos as unknown[]).map(String) : [];
  const extras =
    normalized.import_extras && typeof normalized.import_extras === "object"
      ? (normalized.import_extras as Record<string, unknown>)
      : {};

  function payload() {
    return {
      ...fields,
      lat: fields.lat ? Number(fields.lat) : null,
      lng: fields.lng ? Number(fields.lng) : null,
    };
  }
  function save() {
    start(async () => {
      const res = await updateStagingNormalized(record.id, payload());
      if ("error" in res && res.error) toast.error(res.error, "Enregistrement impossible");
      else {
        toast.success("Modifications enregistrées.");
        onDone();
      }
    });
  }
  function promote() {
    start(async () => {
      const upd = await updateStagingNormalized(record.id, payload());
      if ("error" in upd && upd.error) {
        toast.error(upd.error, "Enregistrement impossible");
        return;
      }
      const res = await promoteStagingRecord(record.id, payload());
      if (res.error) toast.error(res.error, "Promotion impossible");
      else {
        toast.success(`« ${fields.name || "réalisation"} » promue en PRODUCTION.`);
        onDone();
      }
    });
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Field label="Nom" value={fields.name} onChange={(v) => setFields((f) => ({ ...f, name: v }))} />
        <Field label="Type" value={fields.type} onChange={(v) => setFields((f) => ({ ...f, type: v }))} />
        <Field label="Nature de la réalisation" value={fields.realisation_nature} onChange={(v) => setFields((f) => ({ ...f, realisation_nature: v }))} />
        <Field label="Date" type="date" value={fields.date} onChange={(v) => setFields((f) => ({ ...f, date: v }))} />
        <Select label="Projet" value={fields.project_id} options={projects} onChange={(v) => setFields((f) => ({ ...f, project_id: v }))} />
        <Select label="Secteur" value={fields.sector_id} options={sectors} onChange={(v) => setFields((f) => ({ ...f, sector_id: v }))} />
        <Select label="Zone" value={fields.admin_zone_id} options={zones} onChange={(v) => setFields((f) => ({ ...f, admin_zone_id: v }))} />
        <Field label="Latitude" value={fields.lat} onChange={(v) => setFields((f) => ({ ...f, lat: v }))} />
        <Field label="Longitude" value={fields.lng} onChange={(v) => setFields((f) => ({ ...f, lng: v }))} />
      </div>

      <p className="mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Localisation (source)</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Field label="Pays" value={fields.country} onChange={(v) => setFields((f) => ({ ...f, country: v }))} />
        <Field label="Région" value={fields.region} onChange={(v) => setFields((f) => ({ ...f, region: v }))} />
        <Field label="Province" value={fields.province} onChange={(v) => setFields((f) => ({ ...f, province: v }))} />
        <Field label="Commune" value={fields.commune} onChange={(v) => setFields((f) => ({ ...f, commune: v }))} />
        <Field label="Village / Secteur" value={fields.village} onChange={(v) => setFields((f) => ({ ...f, village: v }))} />
      </div>

      <p className="mt-3 mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Auteur &amp; bénéficiaires</p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5">
        <Field label="Auteur (nom)" value={fields.author_name} onChange={(v) => setFields((f) => ({ ...f, author_name: v }))} />
        <div>
          <label className="mb-0.5 block text-[10px] text-slate-400">Auteur (nature)</label>
          <select
            value={fields.author_type}
            onChange={(e) => setFields((f) => ({ ...f, author_type: e.target.value }))}
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
          >
            <option value="">—</option>
            <option value="prestataire">Prestataire</option>
            <option value="organisation">Organisation</option>
          </select>
        </div>
        <Field label="Bénéf. femmes" value={fields.beneficiaries_female} onChange={(v) => setFields((f) => ({ ...f, beneficiaries_female: v }))} />
        <Field label="Bénéf. hommes" value={fields.beneficiaries_male} onChange={(v) => setFields((f) => ({ ...f, beneficiaries_male: v }))} />
        <Field label="Bénéf. total" value={fields.beneficiaries_total} onChange={(v) => setFields((f) => ({ ...f, beneficiaries_total: v }))} />
      </div>

      {photos.length > 0 && (
        <div className="mt-3">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400">Photos ({photos.length})</p>
          <ul className="space-y-0.5 text-xs text-slate-500">
            {photos.map((p, i) => (
              <li key={i} className="truncate font-mono">{p}</li>
            ))}
          </ul>
        </div>
      )}

      {Object.keys(extras).length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50/50 p-2 dark:border-amber-900 dark:bg-amber-950/20">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">Autres infos conservées</p>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-0.5 text-xs sm:grid-cols-2">
            {Object.entries(extras).map(([k, v]) => (
              <div key={k} className="flex gap-1.5">
                <dt className="shrink-0 font-medium text-slate-500">{k} :</dt>
                <dd className="truncate text-slate-600 dark:text-slate-300">{String(v ?? "")}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={promote}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Enregistrer &amp; promouvoir
        </button>
        <button
          onClick={save}
          disabled={pending}
          className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
      />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: RefItem[]; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] text-slate-400">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800">
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
