"use client";

import { FileDown } from "lucide-react";

// Export PDF (33) : rapport imprimable via le navigateur — pas de dépendance serveur lourde.
// La mise en page d'impression (masque sidebar/topbar/formulaire) est définie dans globals.css.
export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      aria-label="Exporter en PDF"
      className="print:hidden flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
    >
      <FileDown size={15} aria-hidden="true" /> Exporter PDF
    </button>
  );
}
