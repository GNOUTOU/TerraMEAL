"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Check, X } from "lucide-react";
import { promoteStagingRecord, rejectStagingRecord, updateStagingNormalized } from "@/lib/actions/staging";
import type { StagingRecord } from "@/lib/types";

interface RefItem {
  id: string;
  name: string;
}

export default function StagingReviewRow({
  record,
  projects,
  sectors,
  zones,
}: {
  record: StagingRecord;
  projects: RefItem[];
  sectors: RefItem[];
  zones: RefItem[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const normalized = record.normalized as Record<string, unknown>;

  function findByName(list: RefItem[], name: unknown) {
    if (!name || typeof name !== "string") return "";
    const match = list.find((i) => i.name.toLowerCase() === name.toLowerCase());
    return match?.id ?? "";
  }

  const [fields, setFields] = useState({
    name: String(normalized.name ?? ""),
    type: String(normalized.type ?? ""),
    date: String(normalized.date ?? "").slice(0, 10),
    lat: normalized.lat != null ? String(normalized.lat) : "",
    lng: normalized.lng != null ? String(normalized.lng) : "",
    project_id: String(normalized.project_id ?? ""),
    sector_id: String(normalized.sector_id ?? findByName(sectors, normalized.sector_name)),
    admin_zone_id: String(normalized.admin_zone_id ?? findByName(zones, normalized.admin_zone_name)),
  });

  function handlePromote() {
    setError(null);
    startTransition(async () => {
      await updateStagingNormalized(record.id, {
        ...fields,
        lat: fields.lat ? Number(fields.lat) : null,
        lng: fields.lng ? Number(fields.lng) : null,
      });
      const res = await promoteStagingRecord(record.id, {
        ...fields,
        lat: fields.lat ? Number(fields.lat) : null,
        lng: fields.lng ? Number(fields.lng) : null,
      });
      if (res.error) setError(res.error);
      else router.refresh();
    });
  }

  function handleReject() {
    const reason = prompt("Motif du rejet :");
    if (!reason) return;
    startTransition(async () => {
      await rejectStagingRecord(record.id, reason);
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800">
      <button onClick={() => setExpanded((v) => !v)} aria-expanded={expanded} className="flex w-full items-center justify-between px-3 py-2 text-left text-sm">
        <span className="font-medium text-slate-700 dark:text-slate-200">{fields.name || "(sans nom)"}</span>
        <span className="flex items-center gap-2 text-xs text-slate-400">
          {fields.type} {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      {expanded && (
        <div className="border-t border-slate-100 p-3 dark:border-slate-800">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Field label="Nom" value={fields.name} onChange={(v) => setFields((f) => ({ ...f, name: v }))} />
            <Field label="Type" value={fields.type} onChange={(v) => setFields((f) => ({ ...f, type: v }))} />
            <Field label="Date" type="date" value={fields.date} onChange={(v) => setFields((f) => ({ ...f, date: v }))} />
            <Select label="Projet" value={fields.project_id} options={projects} onChange={(v) => setFields((f) => ({ ...f, project_id: v }))} />
            <Select label="Secteur" value={fields.sector_id} options={sectors} onChange={(v) => setFields((f) => ({ ...f, sector_id: v }))} />
            <Select label="Zone" value={fields.admin_zone_id} options={zones} onChange={(v) => setFields((f) => ({ ...f, admin_zone_id: v }))} />
            <Field label="Latitude" value={fields.lat} onChange={(v) => setFields((f) => ({ ...f, lat: v }))} />
            <Field label="Longitude" value={fields.lng} onChange={(v) => setFields((f) => ({ ...f, lng: v }))} />
          </div>
          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={handlePromote} disabled={pending} className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
              <Check size={13} /> Promouvoir en PRODUCTION
            </button>
            <button onClick={handleReject} disabled={pending} className="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300">
              <X size={13} /> Rejeter
            </button>
          </div>
        </div>
      )}
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
