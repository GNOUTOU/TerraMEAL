"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export default function ExportMenu({ baseUrl, formats }: { baseUrl: string; formats: { format: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
      >
        <Download size={14} /> Exporter
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg dark:border-slate-700 dark:bg-slate-900">
          {formats.map((f) => (
            <a
              key={f.format}
              href={`${baseUrl}${baseUrl.includes("?") ? "&" : "?"}format=${f.format}`}
              onClick={() => setOpen(false)}
              className="block px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {f.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
