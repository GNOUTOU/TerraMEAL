import Papa from "papaparse";
import * as XLSX from "xlsx";

export interface ParsedFile {
  columns: string[];
  rows: Record<string, unknown>[];
}

export function parseCsvFile(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({ columns: results.meta.fields ?? [], rows: results.data });
      },
      error: reject,
    });
  });
}

export async function parseExcelFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
  return { columns, rows };
}

export async function parseGeoJsonFile(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const json = JSON.parse(text) as GeoJSON.FeatureCollection;
  const rows = (json.features ?? []).map((f) => {
    const props = { ...(f.properties ?? {}) } as Record<string, unknown>;
    if (f.geometry?.type === "Point") {
      const [lng, lat] = f.geometry.coordinates;
      props.__lng = lng;
      props.__lat = lat;
    }
    return props;
  });
  const columnSet = new Set<string>();
  rows.forEach((r) => Object.keys(r).forEach((k) => columnSet.add(k)));
  return { columns: Array.from(columnSet), rows };
}

export function detectFileType(file: File): "csv" | "excel" | "geojson" | "kml" | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv")) return "csv";
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return "excel";
  if (name.endsWith(".geojson") || name.endsWith(".json")) return "geojson";
  if (name.endsWith(".kml")) return "kml";
  return null;
}
