"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseCsvFile, parseExcelFile, parseGeoJsonFile, detectFileType, type ParsedFile } from "@/lib/import/parse";
import { submitFileImport } from "@/lib/actions/import";

const TARGET_FIELDS = [
  { value: "name", label: "Nom de la réalisation" },
  { value: "type", label: "Type" },
  { value: "description", label: "Description" },
  { value: "date", label: "Date" },
  { value: "status", label: "Statut" },
  { value: "lat", label: "Latitude" },
  { value: "lng", label: "Longitude" },
  { value: "beneficiaries_total", label: "Bénéficiaires (total)" },
  { value: "external_id", label: "Identifiant source" },
  { value: "sector_name", label: "Secteur (nom, résolu en revue STAGING)" },
  { value: "admin_zone_name", label: "Zone administrative (nom, résolu en revue STAGING)" },
];

export default function FileImportWizard({ projects }: { projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("realisation");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleFileChange(f: File) {
    setError(null);
    setFile(f);
    const type = detectFileType(f);
    try {
      let p: ParsedFile;
      if (type === "csv") p = await parseCsvFile(f);
      else if (type === "excel") p = await parseExcelFile(f);
      else if (type === "geojson") p = await parseGeoJsonFile(f);
      else {
        setError("Format KML non pris en charge pour l'instant — convertissez le fichier en GeoJSON.");
        return;
      }
      if (p.rows.length === 0) {
        setError("Le fichier ne contient aucune ligne exploitable.");
        return;
      }
      setParsed(p);
      const autoMapping: Record<string, string> = {};
      for (const col of p.columns) {
        const lower = col.toLowerCase();
        const match = TARGET_FIELDS.find((f) => lower.includes(f.value.replace("_name", "").replace("_total", "")));
        if (match) autoMapping[col] = match.value;
      }
      if (p.columns.includes("__lat")) autoMapping["__lat"] = "lat";
      if (p.columns.includes("__lng")) autoMapping["__lng"] = "lng";
      setMapping(autoMapping);
      setStep(2);
    } catch {
      setError("Impossible de lire ce fichier. Vérifiez le format.");
    }
  }

  function handleImport() {
    if (!parsed || !file) return;
    setError(null);
    startTransition(async () => {
      const type = detectFileType(file);
      const res = await submitFileImport({
        fileName: file.name,
        fileType: (type ?? "csv") as "csv" | "excel" | "geojson",
        rows: parsed.rows,
        mapping,
        defaultProjectId: projectId,
        defaultCategory: category,
      });
      if ("error" in res && res.error) setError(res.error);
      else if ("success" in res) {
        setResult({ success: res.success, errors: res.errors });
        setStep(3);
        router.refresh();
      }
    });
  }

  return (
    <div>
      <ol className="mb-6 flex gap-6 text-xs text-slate-400">
        <li className={step >= 1 ? "font-semibold text-emerald-600" : ""}>1. Fichier</li>
        <li className={step >= 2 ? "font-semibold text-emerald-600" : ""}>2. Correspondance des colonnes</li>
        <li className={step >= 3 ? "font-semibold text-emerald-600" : ""}>3. Résultat</li>
      </ol>

      {step === 1 && (
        <div>
          <p className="mb-3 text-sm text-slate-500">Formats pris en charge : CSV, Excel (.xlsx), GeoJSON.</p>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,.geojson,.json"
            onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
            className="text-sm"
          />
        </div>
      )}

      {step === 2 && parsed && (
        <div>
          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Projet cible</label>
              <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                <option value="">— Sélectionner —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Catégorie</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800">
                <option value="realisation">Réalisation générique</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="activity">Activité</option>
              </select>
            </div>
          </div>

          <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-200">Correspondance des colonnes ({parsed.rows.length} lignes détectées)</p>
          <div className="mb-4 max-h-72 space-y-1.5 overflow-y-auto rounded-lg border border-slate-200 p-3 dark:border-slate-800">
            {parsed.columns.map((col) => (
              <div key={col} className="flex items-center gap-2 text-sm">
                <span className="w-40 truncate font-mono text-xs text-slate-500">{col}</span>
                <span className="text-slate-300">→</span>
                <select
                  value={mapping[col] ?? ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [col]: e.target.value }))}
                  className="flex-1 rounded-lg border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-800"
                >
                  <option value="">Ignorer cette colonne</option>
                  {TARGET_FIELDS.map((f) => (
                    <option key={f.value} value={f.value}>
                      {f.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <p className="mb-2 text-xs font-medium text-slate-500">Aperçu (3 premières lignes)</p>
          <div className="mb-4 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {parsed.columns.map((c) => (
                    <th key={c} className="px-2 py-1.5 font-medium">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 3).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    {parsed.columns.map((c) => (
                      <td key={c} className="px-2 py-1.5 text-slate-500">
                        {String(r[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}

          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              Retour
            </button>
            <button
              onClick={handleImport}
              disabled={pending || !projectId}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? "Import en cours..." : `Importer ${parsed.rows.length} ligne(s)`}
            </button>
          </div>
        </div>
      )}

      {step === 3 && result && (
        <div className="space-y-3">
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Import terminé : {result.success} ligne(s) placée(s) en STAGING, {result.errors} erreur(s).
          </p>
          <Link href="/import/review" className="inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
            Passer à la revue STAGING →
          </Link>
        </div>
      )}
    </div>
  );
}
