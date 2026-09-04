// Normalisation d'une ligne de fichier importé (15.x). Module PUR (aucune dépendance serveur)
// pour être testable et partagé entre l'import (submitFileImport) et la promotion STAGING.
//
// Chaîne : valeurs source brutes -> normalizeImportRow -> objet `normalized` stocké en STAGING
//          -> interventionColumnsFromNormalized -> colonnes de la table `interventions`.

export const EXTRA_FIELD = "__extra";

/** Cibles qui acceptent PLUSIEURS colonnes source (fusionnées au lieu d'écraser). */
export const MULTI_SOURCE_TARGETS = new Set(["photos", "description"]);

/** Colonnes source ignorées d'office (métadonnées Kobo/ODK, index techniques). */
export function isMetaColumn(col: string): boolean {
  const c = col.trim().toLowerCase();
  return (
    c.startsWith("_") ||
    c.startsWith("meta/") ||
    c.startsWith("__") ||
    /^(start|end|today|deviceid|subscriberid|simserial|phonenumber|username|instanceid|instancename|formhub\/uuid|version|__version__)$/.test(c)
  );
}

const JUNK = new Set([
  "",
  "-",
  "--",
  "n/a",
  "na",
  "nan",
  "null",
  "none",
  "néant",
  "neant",
  "nsp",
  "ras",
  "r.a.s",
  "aucun",
  "aucune",
  "non renseigné",
  "non renseigne",
  "non applicable",
  "#n/a",
  "#value!",
  ".",
]);

/** Renvoie null pour les valeurs « vides déguisées ». */
export function cleanValue(v: unknown): unknown {
  if (v == null) return null;
  if (typeof v !== "string") return v;
  const t = v.trim();
  if (JUNK.has(t.toLowerCase())) return null;
  return t;
}

export function toNumber(v: unknown): number | null {
  const c = cleanValue(v);
  if (c == null) return null;
  if (typeof c === "number") return Number.isFinite(c) ? c : null;
  // "1 234,56" | "1,234.56" | "12 000" -> nombre
  let s = String(c).replace(/\s/g, "").replace(/ /g, "");
  if (s.includes(",") && s.includes(".")) s = s.replace(/,/g, "");
  else s = s.replace(",", ".");
  s = s.replace(/[^0-9.+-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) && s !== "" ? n : null;
}

/**
 * Extrait lat/lng d'une valeur combinée : "12.36, -1.53" | "12.36 -1.53 300 5" (Kobo GPS) |
 * "-1.53;12.36". Valide les plages et corrige l'ordre lat/lng si nécessaire.
 */
export function parseCoordinates(v: unknown): { lat: number | null; lng: number | null } {
  const c = cleanValue(v);
  if (c == null) return { lat: null, lng: null };
  const nums = String(c)
    .split(/[;,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
  if (nums.length < 2) return { lat: null, lng: null };
  return orderLatLng(nums[0], nums[1]);
}

/** Range-check + swap. lat ∈ [-90,90], lng ∈ [-180,180]. */
export function orderLatLng(a: number | null, b: number | null): { lat: number | null; lng: number | null } {
  if (a == null || b == null || Number.isNaN(a) || Number.isNaN(b)) return { lat: null, lng: null };
  const inLat = (x: number) => Math.abs(x) <= 90;
  const inLng = (x: number) => Math.abs(x) <= 180;
  if (inLat(a) && inLng(b)) {
    // a plausible comme lat ; si b l'est aussi mais pas a en lng, on garde (a,b)
    if (!inLat(b) || inLng(b)) return { lat: a, lng: b };
  }
  if (inLat(b) && inLng(a) && !inLat(a)) return { lat: b, lng: a };
  // 0,0 ou hors plage -> rejet
  if (!inLat(a) || !inLng(b)) return { lat: null, lng: null };
  return { lat: a, lng: b };
}

export function parsePhotos(v: unknown): string[] {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : [v];
  const out: string[] = [];
  for (const item of arr) {
    const c = cleanValue(item);
    if (c == null) continue;
    for (const piece of String(c).split(/[\n\r;,|]+|\s+(?=https?:\/\/)/)) {
      const s = piece.trim().replace(/^["']|["']$/g, "");
      if (s && !out.includes(s)) out.push(s);
    }
  }
  return out;
}

export function normalizeAuthorType(v: unknown): "prestataire" | "organisation" | null {
  const s = String(cleanValue(v) ?? "").toLowerCase();
  if (!s) return null;
  if (/(presta|entrep|bureau|société|societe|sarl|\bpme\b|\bgie\b|tâcheron|tacheron|artisan|individuel|contractant|fournisseur|maçon|macon)/.test(s))
    return "prestataire";
  if (/(organ|\bong\b|associ|coop|\bgie\b|fédération|federation|union|commune|mairie|service|direction|ministère|ministere|projet|programme|collectivité|collectivite)/.test(s))
    return "organisation";
  return null;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const asUuid = (v: unknown): string | null => {
  const c = cleanValue(v);
  return typeof c === "string" && UUID_RE.test(c) ? c : null;
};
export const asText = (v: unknown): string | null => {
  const c = cleanValue(v);
  return c == null ? null : String(c);
};

export interface NormalizeResult {
  normalized: Record<string, unknown>;
  warnings: string[];
}

/**
 * Construit l'objet `normalized` pour une ligne source.
 * @param row          la ligne brute (clé = nom de colonne source)
 * @param mapping      { colonne source -> champ cible | "__extra" | "" }
 * @param extraLabels  { colonne source -> libellé lisible pour « Autres » }
 */
export function normalizeImportRow(
  row: Record<string, unknown>,
  mapping: Record<string, string>,
  extraLabels: Record<string, string> = {}
): NormalizeResult {
  const warnings: string[] = [];
  const n: Record<string, unknown> = {};
  const photos: string[] = [];
  const descriptions: string[] = [];
  const extras: Record<string, unknown> = {};

  for (const [column, target] of Object.entries(mapping)) {
    if (!target) continue;
    const raw = row[column];

    if (target === EXTRA_FIELD) {
      const val = cleanValue(raw);
      if (val != null) extras[extraLabels[column] || column] = val;
      continue;
    }
    if (target === "photos") {
      photos.push(...parsePhotos(raw));
      continue;
    }
    if (target === "description") {
      const val = cleanValue(raw);
      if (val != null) descriptions.push(String(val));
      continue;
    }
    if (target === "coordinates") {
      const { lat, lng } = parseCoordinates(raw);
      if (lat != null && n.lat == null) n.lat = lat;
      if (lng != null && n.lng == null) n.lng = lng;
      continue;
    }
    // Cible simple : dernière valeur non vide gagne, on signale l'écrasement
    const val = cleanValue(raw);
    if (val == null) continue;
    if (n[target] != null && String(n[target]) !== String(val)) {
      warnings.push(`Plusieurs colonnes pointent vers « ${target} » (« ${n[target]} » écrasé par « ${val} »).`);
    }
    n[target] = val;
  }

  // — Dérivations ————————————————————————————————————————————————

  // Bénéficiaires : numériques + total = H + F si absent
  const bf = toNumber(n.beneficiaries_female);
  const bm = toNumber(n.beneficiaries_male);
  let bt = toNumber(n.beneficiaries_total);
  if (bf != null) n.beneficiaries_female = bf;
  else delete n.beneficiaries_female;
  if (bm != null) n.beneficiaries_male = bm;
  else delete n.beneficiaries_male;
  if (bt == null && (bf != null || bm != null)) bt = (bf ?? 0) + (bm ?? 0);
  if (bt != null) n.beneficiaries_total = bt;
  else delete n.beneficiaries_total;

  // Coordonnées : lat/lng directs -> nombre + range-check/swap
  const latDirect = toNumber(n.lat);
  const lngDirect = toNumber(n.lng);
  if (latDirect != null || lngDirect != null) {
    const { lat, lng } = orderLatLng(latDirect, lngDirect);
    if (lat != null) n.lat = lat;
    else delete n.lat;
    if (lng != null) n.lng = lng;
    else delete n.lng;
    if ((latDirect != null || lngDirect != null) && (n.lat == null || n.lng == null)) {
      warnings.push("Coordonnées hors plage ou incomplètes — ignorées.");
    }
  }
  delete n.coordinates;

  // author_type : normalisé, mais on garde la valeur brute si non reconnue
  if (n.author_type != null) {
    const at = normalizeAuthorType(n.author_type);
    if (at) n.author_type = at;
    else {
      extras["Auteur — nature (brut)"] = n.author_type;
      delete n.author_type;
    }
  }
  // Si author_name renseigné sans author_type -> tentative d'inférence
  if (n.author_name != null && n.author_type == null) {
    const at = normalizeAuthorType(n.author_name);
    if (at) n.author_type = at;
  }

  // type obligatoire côté DB : repli nature -> nom
  if (asText(n.type) == null) {
    const fallback = asText(n.realisation_nature) ?? asText(n.name);
    if (fallback) n.type = fallback;
  }

  // Champs texte : trim / nettoyage
  for (const k of ["name", "realisation_nature", "type", "status", "country", "region", "province", "commune", "village", "author_name", "external_id", "admin_zone_name", "sector_name"]) {
    if (n[k] != null) {
      const c = asText(n[k]);
      if (c == null) delete n[k];
      else n[k] = c;
    }
  }

  if (photos.length) n.photos = Array.from(new Set(photos));
  if (descriptions.length) n.description = descriptions.join(" — ");
  if (Object.keys(extras).length) n.import_extras = extras;

  return { normalized: n, warnings };
}

/**
 * Sous-ensemble des colonnes de la table `interventions` dérivé de `normalized`.
 * Utilisé à la promotion (les uuid project_id/geom/source sont gérés à part).
 */
export function interventionColumnsFromNormalized(normalized: Record<string, unknown>) {
  const n = normalized;
  const num = (v: unknown) => toNumber(v);

  const bf = num(n.beneficiaries_female);
  const bm = num(n.beneficiaries_male);
  let bt = num(n.beneficiaries_total);
  if (bt == null && (bf != null || bm != null)) bt = (bf ?? 0) + (bm ?? 0);

  const authorType = n.author_type === "prestataire" || n.author_type === "organisation" ? n.author_type : null;

  return {
    type: asText(n.type) ?? asText(n.realisation_nature) ?? asText(n.name) ?? "Non spécifié",
    name: asText(n.name) ?? "Sans nom",
    description: asText(n.description),
    category: asText(n.category) ?? "realisation",
    status: asText(n.status) ?? "termine",
    date: asText(n.date),
    realisation_nature: asText(n.realisation_nature),
    author_type: authorType,
    author_name: asText(n.author_name),
    country: asText(n.country),
    region: asText(n.region),
    province: asText(n.province),
    commune: asText(n.commune),
    village: asText(n.village),
    beneficiaries_total: bt,
    beneficiaries_female: bf,
    beneficiaries_male: bm,
    photos: Array.isArray(n.photos) ? (n.photos as unknown[]).map(String).filter(Boolean) : [],
    import_extras: n.import_extras && typeof n.import_extras === "object" ? (n.import_extras as Record<string, unknown>) : {},
  };
}
