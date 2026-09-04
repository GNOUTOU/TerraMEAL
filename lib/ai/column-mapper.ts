// Analyse IA des colonnes d'un fichier source (15.x — « correspondance des colonnes »).
// Server-only : n'est appelé que depuis une server action authentifiée (lib/actions/import-ai).
// Utilise l'API OpenAI directement en fetch (pas de SDK) — clé dans OPENAI_API_KEY.

import { TARGET_FIELDS } from "@/lib/import/target-fields";

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

export interface ColumnSample {
  column: string;
  samples: string[]; // quelques valeurs non vides observées
}

export interface AiMappingSuggestion {
  column: string;
  target: string | null; // valeur d'un TARGET_FIELDS, ou null si non mappable
  confidence: "high" | "medium" | "low";
  reason: string;
}

export interface AiExtraSuggestion {
  column: string;
  reason: string; // pourquoi cette colonne hors catalogue mérite d'être conservée
  label: string; // libellé lisible proposé pour « autres »
}

export interface AiColumnAnalysis {
  mappings: AiMappingSuggestion[];
  extras: AiExtraSuggestion[];
}

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["mappings", "extras"],
  properties: {
    mappings: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["column", "target", "confidence", "reason"],
        properties: {
          column: { type: "string" },
          target: { type: ["string", "null"] },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
          reason: { type: "string" },
        },
      },
    },
    extras: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["column", "reason", "label"],
        properties: {
          column: { type: "string" },
          reason: { type: "string" },
          label: { type: "string" },
        },
      },
    },
  },
} as const;

function buildPrompt(columns: ColumnSample[]) {
  const catalogue = TARGET_FIELDS.map(
    (f) => `- ${f.value} — ${f.label}${f.hint ? ` (${f.hint})` : ""} [groupe: ${f.group}]`
  ).join("\n");

  const sourceCols = columns
    .map((c) => {
      const ex = c.samples.slice(0, 5).map((s) => JSON.stringify(s)).join(", ");
      return `- "${c.column}" — exemples: ${ex || "(vide)"}`;
    })
    .join("\n");

  return `Tu aides à importer un fichier de suivi de réalisations terrain (projets de développement) dans une base structurée.

CHAMPS CIBLES DISPONIBLES (utilise EXACTEMENT la valeur technique de gauche) :
${catalogue}

COLONNES DU FICHIER SOURCE (nom + valeurs d'exemple) :
${sourceCols}

Ta tâche :
1. "mappings" : pour CHAQUE colonne source, propose le champ cible le plus pertinent (valeur technique exacte) ou null si aucune ne convient. Base-toi sur le nom ET sur les valeurs d'exemple. Un même champ cible ne doit pas être attribué à deux colonnes (choisis la meilleure). "confidence" = high si évident, medium si probable, low si incertain.
2. "extras" : parmi les colonnes que tu as laissées en target=null, identifie celles qui contiennent une information utile à conserver (montant, bailleur, référence marché, coût, entreprise, indicateur, date de démarrage, etc.). Donne un "label" court et lisible en français. Ignore les colonnes vides, techniques (index, _uuid interne), ou redondantes.

Réponds uniquement via le format structuré demandé, en français pour les "reason" et "label".`;
}

const BATCH_SIZE = 60;

async function analyzeBatch(apiKey: string, columns: ColumnSample[]): Promise<AiColumnAnalysis> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      model: MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: "Tu es un assistant d'intégration de données précis et prudent." },
        { role: "user", content: buildPrompt(columns) },
      ],
      response_format: {
        type: "json_schema",
        json_schema: { name: "column_analysis", strict: true, schema: RESPONSE_SCHEMA },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    if (res.status === 401) throw new Error("Clé OpenAI invalide ou expirée.");
    if (res.status === 429) throw new Error("Quota OpenAI atteint — réessayez plus tard.");
    throw new Error(`OpenAI : ${res.status} ${res.statusText} ${detail.slice(0, 200)}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("Réponse OpenAI vide.");
  try {
    return JSON.parse(content) as AiColumnAnalysis;
  } catch {
    throw new Error("Réponse OpenAI illisible.");
  }
}

export async function analyzeColumnsWithAi(columns: ColumnSample[]): Promise<AiColumnAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY n'est pas configurée sur le serveur.");
  if (columns.length === 0) return { mappings: [], extras: [] };

  // Découpage en lots pour couvrir les exports Kobo à plusieurs centaines de colonnes
  // sans dépasser les limites de sortie du modèle.
  const batches: ColumnSample[][] = [];
  for (let i = 0; i < columns.length; i += BATCH_SIZE) batches.push(columns.slice(i, i + BATCH_SIZE));
  const results = await Promise.all(batches.map((b) => analyzeBatch(apiKey, b)));

  const validTargets = new Set(TARGET_FIELDS.map((f) => f.value));
  const sourceColumns = new Set(columns.map((c) => c.column));
  const seenMap = new Set<string>();
  const seenExtra = new Set<string>();
  const mappings: AiMappingSuggestion[] = [];
  const extras: AiExtraSuggestion[] = [];

  for (const r of results) {
    for (const m of r.mappings ?? []) {
      if (!sourceColumns.has(m.column) || seenMap.has(m.column)) continue;
      seenMap.add(m.column);
      mappings.push({
        column: m.column,
        target: m.target && validTargets.has(m.target) ? m.target : null,
        confidence: (["high", "medium", "low"].includes(m.confidence) ? m.confidence : "low") as "high" | "medium" | "low",
        reason: String(m.reason ?? ""),
      });
    }
    for (const e of r.extras ?? []) {
      if (!sourceColumns.has(e.column) || seenExtra.has(e.column)) continue;
      seenExtra.add(e.column);
      extras.push({ column: e.column, reason: String(e.reason ?? ""), label: String(e.label ?? e.column) });
    }
  }

  return { mappings, extras };
}
