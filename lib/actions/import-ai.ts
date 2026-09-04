"use server";

import { requireRole } from "@/lib/auth";
import { analyzeColumnsWithAi, type AiColumnAnalysis, type ColumnSample } from "@/lib/ai/column-mapper";

const MAX_COLUMNS = 400;
const MAX_SAMPLES = 6;

/**
 * Analyse IA des colonnes d'un fichier en cours d'import (étape « Correspondance des colonnes »).
 * Reçoit les noms de colonnes + quelques valeurs d'exemple, renvoie le mapping proposé et les
 * colonnes hors catalogue à conserver dans « autres ». Aucune donnée n'est persistée ici.
 */
export async function analyzeImportColumns(
  columns: ColumnSample[]
): Promise<{ analysis: AiColumnAnalysis } | { error: string }> {
  await requireRole(["admin", "meal_sig"]);

  if (!Array.isArray(columns) || columns.length === 0) {
    return { error: "Aucune colonne à analyser." };
  }

  const trimmed: ColumnSample[] = columns.slice(0, MAX_COLUMNS).map((c) => ({
    column: String(c.column).slice(0, 200),
    samples: (Array.isArray(c.samples) ? c.samples : [])
      .filter((s) => s != null && String(s).trim() !== "")
      .slice(0, MAX_SAMPLES)
      .map((s) => String(s).slice(0, 200)),
  }));

  try {
    const analysis = await analyzeColumnsWithAi(trimmed);
    return { analysis };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Échec de l'analyse IA." };
  }
}
