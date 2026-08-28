"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Trash2, Download, Upload } from "lucide-react";
import { uploadDocument, getDocumentUrl, deleteDocument } from "@/lib/actions/documents";
import type { DocumentRecord, VisibilityLevel } from "@/lib/types";

const VISIBILITY_LABELS: Record<VisibilityLevel, string> = {
  public: "Public",
  restricted: "Restreint",
  sensitive: "Sensible",
  forbidden: "Interdit à la diffusion",
};

export default function DocumentsPanel({
  entityTable,
  entityId,
  documents,
  canWrite,
  revalidate,
}: {
  entityTable: string;
  entityId: string;
  documents: DocumentRecord[];
  canWrite: boolean;
  revalidate: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("entity_table", entityTable);
    formData.set("entity_id", entityId);
    formData.set("revalidate", revalidate);
    setError(null);
    startTransition(async () => {
      const res = await uploadDocument(formData);
      if (res.error) setError(res.error);
      else {
        (e.target as HTMLFormElement).reset();
        router.refresh();
      }
    });
  }

  async function handleOpen(path: string) {
    const url = await getDocumentUrl(path);
    if (url) window.open(url, "_blank");
  }

  function handleDelete(doc: DocumentRecord) {
    if (!confirm("Supprimer ce document ?")) return;
    startTransition(async () => {
      await deleteDocument(doc.id, doc.file_path, revalidate);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="space-y-2">
        {documents.length === 0 && <p className="text-sm text-slate-400">Aucun document.</p>}
        {documents.map((d) => (
          <div key={d.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText size={16} className="shrink-0 text-slate-400" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{d.name}</p>
                <p className="text-xs text-slate-400">{VISIBILITY_LABELS[d.visibility_level]}</p>
              </div>
            </div>
            <div className="flex shrink-0 gap-1">
              <button onClick={() => handleOpen(d.file_path)} aria-label={`Télécharger — ${d.name}`} className="rounded p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700">
                <Download size={14} aria-hidden="true" />
              </button>
              {canWrite && (
                <button onClick={() => handleDelete(d)} aria-label={`Supprimer — ${d.name}`} className="rounded p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40">
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {canWrite && (
        <form onSubmit={handleUpload} className="mt-4 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
          <input type="file" name="file" required aria-label="Sélectionner un fichier" className="w-full text-xs" />
          <div className="grid grid-cols-2 gap-2">
            <input name="name" placeholder="Nom du document" aria-label="Nom du document" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800" />
            <select name="visibility_level" defaultValue="restricted" aria-label="Niveau de visibilité" className="rounded-lg border border-slate-300 px-2 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
              {Object.entries(VISIBILITY_LABELS).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-900 disabled:opacity-60 dark:bg-slate-700"
          >
            <Upload size={13} /> {pending ? "Envoi..." : "Téléverser"}
          </button>
        </form>
      )}
    </div>
  );
}
