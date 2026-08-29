import type { MapFeatureProperties } from "@/components/map/MapView";

interface InterventionGeoRow {
  id: string;
  name: string;
  type: string;
  status: string;
  sector_name: string | null;
  sector_color: string | null;
  project_name: string | null;
  admin_zone_name: string | null;
  geom_json: GeoJSON.Geometry | null;
}

export function interventionsToFeatureCollection(
  rows: InterventionGeoRow[]
): GeoJSON.FeatureCollection<GeoJSON.Point, MapFeatureProperties> {
  return {
    type: "FeatureCollection",
    features: rows
      .filter((r) => r.geom_json && r.geom_json.type === "Point")
      .map((r) => ({
        type: "Feature",
        geometry: r.geom_json as GeoJSON.Point,
        properties: {
          id: r.id,
          title: r.name,
          subtitle: [r.sector_name, r.admin_zone_name].filter(Boolean).join(" · "),
          color: r.sector_color ?? "#2563eb",
          href: `/interventions/${r.id}`,
        },
      })),
  };
}

export function interventionsToLineAndPolygonFeatureCollection(
  rows: InterventionGeoRow[]
): GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }> {
  return {
    type: "FeatureCollection",
    features: rows
      .filter((r) => r.geom_json && (r.geom_json.type === "LineString" || r.geom_json.type === "Polygon"))
      .map((r) => ({
        type: "Feature",
        geometry: r.geom_json as GeoJSON.Geometry,
        properties: { name: r.name },
      })),
  };
}

interface AdminZoneGeoRow {
  id: string;
  name: string;
  geom_json: GeoJSON.Geometry | null;
}

export function zonesToFeatureCollection(rows: AdminZoneGeoRow[]): GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }> {
  return {
    type: "FeatureCollection",
    features: rows
      .filter((r) => r.geom_json)
      .map((r) => ({
        type: "Feature",
        geometry: r.geom_json as GeoJSON.Geometry,
        properties: { name: r.name },
      })),
  };
}
