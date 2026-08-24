// Connecteur KoboToolbox (21). Utilise l'API REST v2 documentée sur
// https://support.kobotoolbox.org/api.html — nécessite un jeton d'API personnel
// (KoboToolbox > Compte > Paramètres > Jetons API) stocké dans data_sources.config.
export interface KoboConfig {
  base_url: string; // ex: https://kf.kobotoolbox.org
  api_token: string;
  asset_uid: string; // identifiant du formulaire ("asset")
}

export interface KoboSubmission {
  _id: number | string;
  _submission_time?: string;
  _geolocation?: [number, number] | null;
  [key: string]: unknown;
}

export async function fetchKoboSubmissions(config: KoboConfig, sinceCursor?: string): Promise<KoboSubmission[]> {
  const url = new URL(`/api/v2/assets/${config.asset_uid}/data.json`, config.base_url);
  url.searchParams.set("format", "json");
  if (sinceCursor) {
    // Filtre MongoDB-style supporté par l'API Kobo pour ne récupérer que les nouvelles soumissions.
    url.searchParams.set("query", JSON.stringify({ _submission_time: { $gt: sinceCursor } }));
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Token ${config.api_token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`KoboToolbox API : ${res.status} ${res.statusText}`);
  const json = await res.json();
  return (json.results ?? []) as KoboSubmission[];
}

// Extrait des coordonnées si le champ standard "_geolocation" ou un champ GPS Kobo (ex: "location")
// est présent. Kobo encode les champs GPS comme "lat lon alt precision".
export function extractKoboCoordinates(submission: KoboSubmission): { lat: number | null; lng: number | null } {
  if (Array.isArray(submission._geolocation) && submission._geolocation.length === 2) {
    const [lat, lng] = submission._geolocation;
    if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  }
  for (const [key, value] of Object.entries(submission)) {
    if (typeof value === "string" && /gps|location|geopoint/i.test(key)) {
      const parts = value.trim().split(/\s+/).map(Number);
      if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
        return { lat: parts[0], lng: parts[1] };
      }
    }
  }
  return { lat: null, lng: null };
}
