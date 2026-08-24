// Connecteur mWater (22). mWater expose des exports de données via son API portable
// (https://api.mwater.co) ou via un lien d'export CSV/JSON configuré côté mWater Portal.
// Le format exact dépend du dataset ; ce connecteur attend un endpoint JSON renvoyant un tableau
// d'enregistrements plats, chacun pouvant contenir des champs "lat"/"lng" ou "location.lat"/"location.lng".
export interface MwaterConfig {
  base_url: string; // ex: https://api.mwater.co ou l'URL d'export du dataset
  api_token: string;
  dataset_id: string;
}

export interface MwaterRecord {
  _id: string;
  [key: string]: unknown;
}

export async function fetchMwaterRecords(config: MwaterConfig): Promise<MwaterRecord[]> {
  const url = `${config.base_url.replace(/\/$/, "")}/datasets/${config.dataset_id}/data`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${config.api_token}` },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`mWater API : ${res.status} ${res.statusText}`);
  const json = await res.json();
  return (Array.isArray(json) ? json : json.data ?? []) as MwaterRecord[];
}

export function extractMwaterCoordinates(record: MwaterRecord): { lat: number | null; lng: number | null } {
  const loc = record.location as { lat?: number; lng?: number } | undefined;
  if (loc && typeof loc.lat === "number" && typeof loc.lng === "number") return { lat: loc.lat, lng: loc.lng };
  const lat = record.lat ?? record.latitude;
  const lng = record.lng ?? record.longitude;
  if (typeof lat === "number" && typeof lng === "number") return { lat, lng };
  return { lat: null, lng: null };
}
