"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { parseCsvFile, parseExcelFile, parseGeoJsonFile, detectFileType, type ParsedFile } from "@/lib/import/parse";
import { submitFileImport } from "@/lib/actions/import";
import { analyzeImportColumns } from "@/lib/actions/import-ai";
import {
  TARGET_FIELDS,
  TARGET_FIELD_GROUPS,
  TARGET_FIELD_MAP,
  MULTI_TARGETS,
  heuristicMapping,
  isMetaColumn,
} from "@/lib/import/target-fields";
import { useToast } from "@/components/ui/Toast";
import {
  FileUp,
  ArrowLeftRight,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  UploadCloud,
  CircleAlert,
  Sparkles,
  FileSpreadsheet,
  FileJson,
  FileText,
  X,
  Loader2,
  Info,
} from "lucide-react";

const EXTRA = "__extra";

const ACCEPT = ".csv,.xlsx,.xls,.geojson,.json";

type Confidence = "high" | "medium" | "low";

function humanSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function fileIcon(type: ReturnType<typeof detectFileType>) {
  if (type === "excel") return FileSpreadsheet;
  if (type === "geojson") return FileJson;
  return FileText;
}

/** Toute colonne non mappée qui contient des données et n'est pas une métadonnée → « Autres ».
 *  Garantit qu'aucune information du fichier n'est perdue silencieusement. */
function fillUnmappedAsExtra(parsed: ParsedFile, mapping: Record<string, string>): Record<string, string> {
  const next = { ...mapping };
  for (const col of parsed.columns) {
    if (col === "__lat" || col === "__lng") continue;
    if (next[col]) continue;
    if (isMetaColumn(col)) continue;
    const hasData = parsed.rows.some((r) => r[col] != null && String(r[col]).trim() !== "");
    if (hasData) next[col] = EXTRA;
  }
  return next;
}

function sampleValues(parsed: ParsedFile, column: string, n = 5): string[] {
  const seen: string[] = [];
  for (const row of parsed.rows) {
    const v = row[column];
    if (v == null || String(v).trim() === "") continue;
    const s = String(v);
    if (!seen.includes(s)) seen.push(s);
    if (seen.length >= n) break;
  }
  return seen;
}

export default function FileImportWizard({ projects }: { projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [parsing, setParsing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [extraLabels, setExtraLabels] = useState<Record<string, string>>({});
  const [aiConfidence, setAiConfidence] = useState<Record<string, Confidence>>({});
  const [aiDone, setAiDone] = useState(false);
  const [aiPending, startAi] = useTransition();
  const [projectId, setProjectId] = useState("");
  const [category, setCategory] = useState("realisation");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const detectedType = file ? detectFileType(file) : null;

  const handleFile = useCallback(async (f: File) => {
    setError(null);
    setAiConfidence({});
    setAiDone(false);
    setExtraLabels({});
    setFile(f);
    const type = detectFileType(f);
    if (!type) {
      setError("Format non reconnu. Utilisez un fichier CSV, Excel (.xlsx) ou GeoJSON.");
      setFile(null);
      return;
    }
    if (type === "kml") {
      setError("Format KML non pris en charge — convertissez le fichier en GeoJSON.");
      setFile(null);
      return;
    }
    setParsing(true);
    try {
      let p: ParsedFile;
      if (type === "csv") p = await parseCsvFile(f);
      else if (type === "excel") p = await parseExcelFile(f);
      else p = await parseGeoJsonFile(f);

      if (p.rows.length === 0) {
        setError("Le fichier ne contient aucune ligne exploitable.");
        setFile(null);
        return;
      }
      setParsed(p);
      let auto = heuristicMapping(p.columns);
      if (p.columns.includes("__lat")) auto["__lat"] = "lat";
      if (p.columns.includes("__lng")) auto["__lng"] = "lng";
      auto = fillUnmappedAsExtra(p, auto);
      setMapping(auto);
      setStep(2);
    } catch {
      setError("Impossible de lire ce fichier. Vérifiez qu'il n'est pas corrompu.");
      setFile(null);
    } finally {
      setParsing(false);
    }
  }, []);

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  function resetFile() {
    setFile(null);
    setParsed(null);
    setMapping({});
    setStep(1);
    if (inputRef.current) inputRef.current.value = "";
  }

  function runAiAnalysis() {
    if (!parsed) return;
    startAi(async () => {
      const cols = parsed.columns
        .filter((c) => c !== "__lat" && c !== "__lng")
        .map((c) => ({ column: c, samples: sampleValues(parsed, c) }));
      const res = await analyzeImportColumns(cols);
      if ("error" in res) {
        toast.error(res.error, "Analyse IA");
        return;
      }
      const { mappings, extras } = res.analysis;
      const nextMapping: Record<string, string> = { ...mapping };
      const nextConf: Record<string, Confidence> = {};
      const nextLabels: Record<string, string> = { ...extraLabels };

      // L'IA a priorité sur l'heuristique : on repart des cibles simples libres.
      const usedSimple = new Set<string>();
      const sorted = [...mappings].sort((a, b) => {
        const rank = { high: 0, medium: 1, low: 2 } as const;
        return rank[a.confidence] - rank[b.confidence];
      });
      for (const m of sorted) {
        if (!m.target) continue;
        const multi = MULTI_TARGETS.has(m.target);
        if (!multi && usedSimple.has(m.target)) {
          // cible déjà prise par une meilleure colonne → on ne perd pas la colonne : « Autres »
          if (!nextMapping[m.column] || nextMapping[m.column] === EXTRA) nextMapping[m.column] = EXTRA;
          continue;
        }
        nextMapping[m.column] = m.target;
        nextConf[m.column] = m.confidence;
        if (!multi) usedSimple.add(m.target);
      }
      for (const ex of extras) {
        const cur = nextMapping[ex.column];
        if (!cur || cur === EXTRA) {
          nextMapping[ex.column] = EXTRA;
          nextLabels[ex.column] = ex.label;
        }
      }
      // Filet de sécurité : rien du fichier n'est perdu.
      const withExtras = fillUnmappedAsExtra(parsed, nextMapping);
      if (parsed.columns.includes("__lat")) withExtras["__lat"] = "lat";
      if (parsed.columns.includes("__lng")) withExtras["__lng"] = "lng";

      setMapping(withExtras);
      setAiConfidence(nextConf);
      setExtraLabels(nextLabels);
      setAiDone(true);
      const mapped = Object.values(withExtras).filter((v) => v && v !== EXTRA).length;
      const kept = Object.values(withExtras).filter((v) => v === EXTRA).length;
      toast.success(
        `${mapped} correspondance(s) proposée(s), ${kept} colonne(s) conservée(s) dans « Autres ».`,
        "Analyse IA terminée"
      );
    });
  }

  function handleImport() {
    if (!parsed || !file) return;
    startTransition(async () => {
      const type = detectFileType(file);
      const res = await submitFileImport({
        fileName: file.name,
        fileType: (type ?? "csv") as "csv" | "excel" | "geojson",
        rows: parsed.rows,
        mapping,
        extraLabels,
        defaultProjectId: projectId,
        defaultCategory: category,
      });
      if ("error" in res && res.error) toast.error(res.error, "Import impossible");
      else if ("success" in res) {
        setResult({ success: res.success, errors: res.errors });
        if (res.errors > 0) toast.warning(`${res.success} ligne(s) importée(s), ${res.errors} en erreur.`);
        else toast.success(`${res.success} ligne(s) placée(s) en STAGING.`);
        setStep(3);
        router.refresh();
      }
    });
  }

  const columnsForMapping = useMemo(
    () => (parsed ? parsed.columns.filter((c) => c !== "__lat" && c !== "__lng") : []),
    [parsed]
  );
  const mappedCount = Object.entries(mapping).filter(([, v]) => v && v !== EXTRA).length;
  const extraCount = Object.entries(mapping).filter(([, v]) => v === EXTRA).length;

  return (
    <div>
      <ol className="mb-6 flex flex-wrap gap-x-6 gap-y-2 text-xs text-slate-400">
        <Stepper active={step >= 1} icon={FileUp} label="1. Fichier" />
        <Stepper active={step >= 2} icon={ArrowLeftRight} label="2. Correspondance des colonnes" />
        <Stepper active={step >= 3} icon={CheckCircle2} label="3. Résultat" />
      </ol>

      {/* ——— Étape 1 : dépôt du fichier ——————————————————————————— */}
      {step === 1 && (
        <div>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />

          <div
            role="button"
            tabIndex={0}
            aria-label="Déposer ou choisir un fichier à importer"
            onClick={() => !parsing && inputRef.current?.click()}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && !parsing) {
                e.preventDefault();
                inputRef.current?.click();
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={`group relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all duration-200 ${
              dragging
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40"
                : "border-slate-300 bg-slate-50 hover:border-emerald-400 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-800/40 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20"
            }`}
          >
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-200 ${
                dragging
                  ? "scale-110 bg-emerald-500 text-white"
                  : "bg-white text-emerald-600 shadow-sm group-hover:scale-105 dark:bg-slate-900 dark:text-emerald-400"
              }`}
            >
              {parsing ? <Loader2 size={26} className="animate-spin" /> : <UploadCloud size={26} strokeWidth={2} />}
            </div>

            {parsing ? (
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Lecture du fichier…</p>
            ) : (
              <>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                    Glissez-déposez votre fichier ici
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    ou <span className="font-medium text-emerald-600 dark:text-emerald-400">cliquez pour parcourir</span>
                  </p>
                </div>
                <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                  {[
                    { icon: FileText, label: "CSV" },
                    { icon: FileSpreadsheet, label: "Excel .xlsx" },
                    { icon: FileJson, label: "GeoJSON" },
                  ].map(({ icon: Icon, label }) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400"
                    >
                      <Icon size={12} /> {label}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <Info size={12} /> La première ligne du fichier doit contenir les noms de colonnes.
          </p>

          {error && (
            <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
              <CircleAlert size={14} className="mt-0.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      )}

      {/* ——— Étape 2 : correspondance ————————————————————————————— */}
      {step === 2 && parsed && file && (
        <div>
          <FileChip
            name={file.name}
            meta={`${humanSize(file.size)} · ${parsed.rows.length} ligne(s) · ${columnsForMapping.length} colonne(s)`}
            icon={fileIcon(detectedType)}
            onRemove={resetFile}
          />

          <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">Projet cible</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
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
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <option value="realisation">Réalisation générique</option>
                <option value="infrastructure">Infrastructure</option>
                <option value="activity">Activité</option>
              </select>
            </div>
          </div>

          {/* Barre IA */}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2.5 dark:border-violet-900 dark:bg-violet-950/40">
            <div className="flex items-start gap-2">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-violet-600 dark:text-violet-400" />
              <div className="text-xs text-violet-900 dark:text-violet-200">
                <p className="font-medium">Correspondance assistée par l&apos;IA</p>
                <p className="text-violet-700/80 dark:text-violet-300/70">
                  Analyse les noms et le contenu des colonnes pour proposer le mapping et repérer les infos utiles à conserver.
                </p>
              </div>
            </div>
            <button
              onClick={runAiAnalysis}
              disabled={aiPending}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
            >
              {aiPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              {aiPending ? "Analyse en cours…" : aiDone ? "Relancer l'analyse" : "Analyser avec l'IA"}
            </button>
          </div>

          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Correspondance des colonnes</p>
            <p className="text-[11px] text-slate-400">
              {mappedCount} mappée(s) · {extraCount} dans « Autres »
            </p>
          </div>

          <div className="mb-4 max-h-[22rem] space-y-1 overflow-y-auto rounded-xl border border-slate-200 p-2 dark:border-slate-800">
            {columnsForMapping.map((col) => {
              const value = mapping[col] ?? "";
              const conf = aiConfidence[col];
              const samples = sampleValues(parsed, col, 3);
              return (
                <div
                  key={col}
                  className="flex flex-col gap-1.5 rounded-lg px-2 py-1.5 hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-2 dark:hover:bg-slate-800/50"
                >
                  <div className="min-w-0 sm:w-48">
                    <p className="truncate font-mono text-xs font-medium text-slate-700 dark:text-slate-200">{col}</p>
                    {samples.length > 0 && (
                      <p className="truncate text-[10px] text-slate-400">{samples.join(" · ")}</p>
                    )}
                  </div>
                  <ArrowRight size={13} className="hidden shrink-0 text-slate-300 sm:block" />
                  <div className="flex flex-1 items-center gap-1.5">
                    <select
                      value={value}
                      onChange={(e) => {
                        setMapping((m) => ({ ...m, [col]: e.target.value }));
                        setAiConfidence((c) => {
                          const n = { ...c };
                          delete n[col];
                          return n;
                        });
                      }}
                      className={`flex-1 rounded-lg border px-2 py-1 text-xs dark:bg-slate-800 ${
                        value === EXTRA
                          ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/40"
                          : value
                            ? "border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30"
                            : "border-slate-300 dark:border-slate-700"
                      }`}
                    >
                      <option value="">Ignorer cette colonne</option>
                      <option value={EXTRA}>★ Conserver dans « Autres »</option>
                      {TARGET_FIELD_GROUPS.map((group) => (
                        <optgroup key={group} label={group}>
                          {TARGET_FIELDS.filter((f) => f.group === group).map((f) => (
                            <option key={f.value} value={f.value}>
                              {f.label}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {conf && <ConfidenceBadge level={conf} />}
                  </div>
                </div>
              );
            })}
          </div>

          {extraCount > 0 && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50/60 p-3 text-xs dark:border-amber-900 dark:bg-amber-950/20">
              <p className="mb-1.5 flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-300">
                <Info size={13} /> Colonnes conservées dans « Autres »
              </p>
              <ul className="space-y-0.5 text-amber-700/90 dark:text-amber-300/80">
                {Object.entries(mapping)
                  .filter(([, v]) => v === EXTRA)
                  .map(([col]) => (
                    <li key={col} className="flex items-center gap-1.5">
                      <span className="font-mono">{col}</span>
                      {extraLabels[col] && <span className="text-amber-500">→ {extraLabels[col]}</span>}
                    </li>
                  ))}
              </ul>
              <p className="mt-1.5 text-[11px] text-amber-600/80 dark:text-amber-400/70">
                Ces valeurs seront stockées telles quelles et visibles à la revue STAGING.
              </p>
            </div>
          )}

          <p className="mb-1.5 text-xs font-medium text-slate-500">Aperçu (3 premières lignes)</p>
          <div className="mb-4 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  {columnsForMapping.map((c) => (
                    <th key={c} className="whitespace-nowrap px-2 py-1.5 font-medium">
                      {c}
                      {mapping[c] && mapping[c] !== EXTRA && (
                        <span className="ml-1 font-normal text-emerald-500">→ {TARGET_FIELD_MAP[mapping[c]]?.label}</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 3).map((r, i) => (
                  <tr key={i} className="border-t border-slate-100 dark:border-slate-800">
                    {columnsForMapping.map((c) => (
                      <td key={c} className="max-w-[16rem] truncate px-2 py-1.5 text-slate-500">
                        {String(r[c] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex gap-2">
            <button
              onClick={resetFile}
              className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              <ArrowLeft size={15} /> Changer de fichier
            </button>
            <button
              onClick={handleImport}
              disabled={pending || !projectId}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {pending ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
              {pending ? "Import en cours…" : `Importer ${parsed.rows.length} ligne(s)`}
            </button>
          </div>
          {!projectId && (
            <p className="mt-2 text-[11px] text-slate-400">Sélectionnez un projet cible pour lancer l&apos;import.</p>
          )}
        </div>
      )}

      {/* ——— Étape 3 : résultat —————————————————————————————————— */}
      {step === 3 && result && (
        <div className="space-y-3">
          <p className="flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
            Import terminé : {result.success} ligne(s) placée(s) en STAGING, {result.errors} erreur(s).
          </p>
          <div className="flex gap-2">
            <Link
              href="/import/review"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
            >
              Passer à la revue STAGING <ArrowRight size={15} />
            </Link>
            <button
              onClick={() => {
                setResult(null);
                resetFile();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
            >
              <FileUp size={15} /> Importer un autre fichier
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Stepper({ active, icon: Icon, label }: { active: boolean; icon: typeof FileUp; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${active ? "font-semibold text-emerald-600" : ""}`}>
      <Icon size={14} /> {label}
    </li>
  );
}

function FileChip({
  name,
  meta,
  icon: Icon,
  onRemove,
}: {
  name: string;
  meta: string;
  icon: typeof FileText;
  onRemove: () => void;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-800/40">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
        <Icon size={17} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-100">{name}</p>
        <p className="truncate text-[11px] text-slate-400">{meta}</p>
      </div>
      <button
        onClick={onRemove}
        aria-label="Retirer le fichier"
        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600 dark:hover:bg-slate-700"
      >
        <X size={15} />
      </button>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: Confidence }) {
  const map = {
    high: { label: "IA · sûr", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
    medium: { label: "IA · probable", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
    low: { label: "IA · à vérifier", cls: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300" },
  }[level];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${map.cls}`}>
      <Sparkles size={9} /> {map.label}
    </span>
  );
}
