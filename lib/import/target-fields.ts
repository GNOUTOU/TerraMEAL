// Catalogue unique des champs cibles de l'import de fichiers (15.x du cahier des charges).
// Source de vérité partagée par le wizard (étape « Correspondance des colonnes ») ET par
// l'analyse IA (lib/ai/column-mapper). Les `aliases` alimentent l'auto-mapping heuristique
// hors ligne ; l'IA vient l'affiner et proposer des colonnes hors catalogue à conserver
// dans « autres » (import_extras).

export interface TargetField {
  value: string;
  label: string;
  group: string;
  hint?: string;
  /** Cible qui accepte plusieurs colonnes source (fusion, pas d'écrasement). */
  multi?: boolean;
  /**
   * Formes reconnues, écrites SANS accent, en minuscules, sans séparateur. Comparées à la
   * version normalisée du nom de colonne. Éviter les fragments de moins de 4 caractères.
   */
  aliases: string[];
}

export const TARGET_FIELD_GROUPS = ["Localisation", "Réalisation", "Bénéficiaires", "Traçabilité"] as const;

export const TARGET_FIELDS: TargetField[] = [
  // — Localisation ————————————————————————————————————————————————
  { value: "country", label: "Pays", group: "Localisation", aliases: ["pays", "country", "nation"] },
  { value: "region", label: "Région", group: "Localisation", aliases: ["region", "regions", "regionadministrative"] },
  { value: "province", label: "Province", group: "Localisation", aliases: ["province", "provinces", "departement", "district", "cercle"] },
  { value: "commune", label: "Commune", group: "Localisation", aliases: ["commune", "communes", "municipalite", "communerurale", "communeurbaine", "arrondissement"] },
  { value: "village", label: "Village / Secteur", group: "Localisation", aliases: ["village", "villages", "secteur", "localite", "quartier", "hameau", "communaute", "nomduvillage", "villagesecteur", "nomvillage"] },
  { value: "lat", label: "Latitude", group: "Localisation", aliases: ["latitude", "gpslatitude", "gpslat", "ycoord", "coordy"] },
  { value: "lng", label: "Longitude", group: "Localisation", aliases: ["longitude", "gpslongitude", "gpslong", "gpslng", "xcoord", "coordx"] },
  { value: "coordinates", label: "Coordonnées géo (lat + lng)", group: "Localisation", hint: "Champ unique « 12.36, -1.53 » ou point GPS Kobo", aliases: ["coordonnees", "coordonneesgeo", "coordonneesgps", "coordinates", "geolocation", "geopoint", "geoloc", "pointgps", "positiongps", "gpspoint"] },
  { value: "admin_zone_name", label: "Zone administrative (nom — résolue en revue)", group: "Localisation", aliases: ["zoneadministrative", "adminzone", "zonedintervention"] },

  // — Réalisation —————————————————————————————————————————————————
  { value: "name", label: "Nom de la réalisation", group: "Réalisation", aliases: ["nom", "name", "titre", "title", "intitule", "libelle", "designation", "nomdusite", "nomsite", "nomrealisation", "nomdelarealisation", "nomouvrage", "nomdelouvrage", "nominfrastructure"] },
  { value: "realisation_nature", label: "Nature de la réalisation", group: "Réalisation", hint: "Ce qui a été réalisé (forage, formation, latrine…)", aliases: ["nature", "naturerealisation", "naturedelarealisation", "naturedestravaux", "naturetravaux", "typederealisation", "typerealisation", "typeouvrage", "typedouvrage", "typeinfrastructure", "typedinfrastructure", "typedactivite", "objetrealisation", "prestationrealisee", "travauxrealises"] },
  { value: "type", label: "Type (catégorie normalisée)", group: "Réalisation", aliases: ["type", "typologie", "categorie", "categorierealisation"] },
  { value: "description", label: "Description / observations", group: "Réalisation", multi: true, aliases: ["description", "descriptif", "commentaire", "commentaires", "observation", "observations", "details", "remarque", "remarques", "note", "notes", "precisions"] },
  { value: "date", label: "Date de réalisation", group: "Réalisation", aliases: ["date", "daterealisation", "datedelarealisation", "dateexecution", "datefin", "datedefin", "datedachevement", "dateachevement", "datereception", "datedereception", "datelivraison", "datesoumission", "submissiontime", "periode", "annee", "moisannee"] },
  { value: "status", label: "Statut", group: "Réalisation", aliases: ["statut", "status", "etat", "etatdavancement", "avancement", "etatfonctionnel", "etatouvrage", "situation"] },
  { value: "author_name", label: "Auteur de la réalisation (nom)", group: "Réalisation", hint: "Prestataire ou organisation ayant réalisé", aliases: ["auteur", "auteurrealisation", "auteurdelarealisation", "prestataire", "nomprestataire", "entreprise", "nomentreprise", "entrepriseexecutante", "operateur", "maitredoeuvre", "executant", "contractant", "fournisseur", "attributaire", "adjudicataire", "titulairemarche", "realisepar", "misenoeuvrepar", "partenaire", "partenairemiseenoeuvre", "partenairedexecution", "partner", "implementingpartner", "ongpartenaire"] },
  { value: "author_type", label: "Auteur — nature (prestataire / organisation)", group: "Réalisation", aliases: ["typeauteur", "natureauteur", "typeprestataire", "categorieauteur", "typestructure", "typedestructure", "naturestructure", "structure", "typeintervenant", "natureintervenant"] },
  { value: "photos", label: "Photos de la réalisation", group: "Réalisation", hint: "1 ou plusieurs colonnes ; URLs ou noms de fichier", multi: true, aliases: ["photo", "photos", "photorealisation", "photodelarealisation", "photosrealisation", "photosite", "photodusite", "photoouvrage", "photoavant", "photoapres", "phototravaux", "image", "images", "picture", "pictures", "media", "illustration", "cliche"] },

  // — Bénéficiaires ——————————————————————————————————————————————
  { value: "beneficiaries_total", label: "Bénéficiaires — total", group: "Bénéficiaires", aliases: ["beneficiaires", "beneficiaries", "beneficiairestotal", "totalbeneficiaires", "nombrebeneficiaires", "nombredebeneficiaires", "nbbeneficiaires", "nbrebeneficiaires", "totalbeneficiaries", "populationbeneficiaire", "populationtouchee", "personnestouchees", "nombrepersonnes", "effectiftotal"] },
  { value: "beneficiaries_female", label: "Bénéficiaires — femmes", group: "Bénéficiaires", aliases: ["femmes", "femme", "beneficiairesfemmes", "nombrefemmes", "nbfemmes", "nbrefemmes", "female", "females", "women", "filles", "nombrefilles", "effectiffemmes"] },
  { value: "beneficiaries_male", label: "Bénéficiaires — hommes", group: "Bénéficiaires", aliases: ["hommes", "homme", "beneficiaireshommes", "nombrehommes", "nbhommes", "nbrehommes", "male", "males", "garcons", "nombregarcons", "effectifhommes"] },

  // — Traçabilité ————————————————————————————————————————————————
  { value: "external_id", label: "Identifiant source", group: "Traçabilité", aliases: ["id", "identifiant", "externalid", "reference", "numero", "numeroordre", "codesite", "coderealisation", "uuid", "instanceid", "idsource", "idkobo", "idformulaire"] },
];

export const TARGET_FIELD_MAP: Record<string, TargetField> = Object.fromEntries(TARGET_FIELDS.map((f) => [f.value, f]));

export const MULTI_TARGETS = new Set(TARGET_FIELDS.filter((f) => f.multi).map((f) => f.value));

/** minuscules, sans accent, sans séparateur ni espace. */
export function normalizeColumnName(raw: string): string {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Découpe un nom de colonne en jetons normalisés (gère snake/camel/slash/espaces). */
export function tokenizeColumnName(raw: string): string[] {
  return raw
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length >= 2);
}

/** Métadonnées Kobo/ODK et index techniques à ignorer d'office (sauf `_id`/`_uuid`, utiles). */
export function isMetaColumn(col: string): boolean {
  const c = col.trim().toLowerCase();
  if (c === "_id" || c === "_uuid" || c === "meta/instanceid") return false;
  return (
    c.startsWith("_") ||
    c.startsWith("__") ||
    c.startsWith("meta/") ||
    c.startsWith("formhub/") ||
    /^(start|end|today|deviceid|subscriberid|simserial|phonenumber|username|instanceid|instancename|version|__version__|attachments|index)$/.test(c)
  );
}

const STOPWORDS = new Set([
  "de", "des", "du", "la", "le", "les", "un", "une", "au", "aux", "et", "ou", "the", "of", "and", "or",
  "par", "pour", "sur", "dans", "avec", "quelle", "quel", "quels", "quelles", "est", "sont", "votre",
  "combien", "nombre", "nbre", "nbr", "groupe", "group", "grp", "section", "partie", "info", "infos",
]);
const F_WORDS = ["femmes", "femme", "filles", "fille", "female", "females", "women"];
const M_WORDS = ["hommes", "homme", "garcons", "garcon", "male", "males", "men"];

interface Scored {
  column: string;
  target: string;
  score: number;
}

function scoreColumn(column: string): Scored[] {
  const norm = normalizeColumnName(column);
  if (!norm) return [];
  const allTokens = tokenizeColumnName(column).map(normalizeColumnName).filter(Boolean);
  const tokens = allTokens.filter((t) => !STOPWORDS.has(t));
  const tokenSet = new Set(tokens);

  const hasF = tokens.some((t) => F_WORDS.includes(t));
  const hasM = tokens.some((t) => M_WORDS.includes(t));

  const out: Scored[] = [];
  for (const field of TARGET_FIELDS) {
    // Désambiguïsation bénéficiaires par genre
    if (field.value === "beneficiaries_total" && (hasF || hasM)) continue;
    let best = 0;
    if (field.value === "beneficiaries_female" && hasF) best = 92;
    if (field.value === "beneficiaries_male" && hasM) best = 92;

    for (const alias of field.aliases) {
      if (norm === alias) best = Math.max(best, 100);
      else if (alias.length >= 6 && norm.startsWith(alias)) best = Math.max(best, 88);
      else if (tokenSet.has(alias)) best = Math.max(best, 82);
      else if (alias.length >= 6 && norm.includes(alias)) best = Math.max(best, 74);
      else if (
        alias.length >= 5 &&
        tokens.some((t) => t.length >= 5 && (t.startsWith(alias) || alias.startsWith(t)))
      )
        best = Math.max(best, 55);
    }
    if (best > 0) out.push({ column, target: field.value, score: best });
  }

  // "Type de structure" / "Nature de la structure" -> author_type (prioritaire sur `type`)
  if (tokenSet.has("structure") && (tokenSet.has("type") || tokenSet.has("nature"))) {
    out.push({ column, target: "author_type", score: 90 });
  }
  return out;
}

/**
 * Auto-mapping heuristique hors ligne. `{ colonne source -> champ cible }`.
 * - une cible « simple » n'est attribuée qu'une fois (au meilleur score) ;
 * - les cibles `multi` (photos, description) acceptent plusieurs colonnes ;
 * - seuil minimal : 56.
 */
export function heuristicMapping(columns: string[]): Record<string, string> {
  const all: Scored[] = [];
  for (const col of columns) {
    if (isMetaColumn(col)) continue;
    all.push(...scoreColumn(col));
  }
  all.sort((a, b) => b.score - a.score || a.column.localeCompare(b.column));

  const mapping: Record<string, string> = {};
  const usedSimpleTargets = new Set<string>();
  for (const { column, target, score } of all) {
    if (score < 56) continue;
    if (mapping[column]) continue;
    const multi = MULTI_TARGETS.has(target);
    if (!multi && usedSimpleTargets.has(target)) continue;
    mapping[column] = target;
    if (!multi) usedSimpleTargets.add(target);
  }
  return mapping;
}
