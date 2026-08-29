"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin, Spline, Hexagon, Trash2, Undo2 } from "lucide-react";

type GeomKind = "Point" | "LineString" | "Polygon";

const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function toGeometry(kind: GeomKind, points: [number, number][]): GeoJSON.Geometry | null {
  if (points.length === 0) return null;
  if (kind === "Point") return { type: "Point", coordinates: points[0] };
  if (kind === "LineString") return points.length >= 2 ? { type: "LineString", coordinates: points } : null;
  if (points.length >= 3) return { type: "Polygon", coordinates: [[...points, points[0]]] };
  return null;
}

/**
 * Saisie de géométrie point / ligne / polygone (15.5 du cahier des charges) directement sur la
 * carte, en plus des champs latitude/longitude existants (Point simple). Produit un GeoJSON dans
 * un champ caché `geom_geojson` — priorisé côté serveur sur lat/lng quand présent, sans retirer
 * la saisie lat/lng qui reste la voie la plus simple pour un point isolé.
 */
export default function GeometryDrawMap({ initialGeometry }: { initialGeometry?: GeoJSON.Geometry | null }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [kind, setKind] = useState<GeomKind>(
    initialGeometry?.type === "LineString" ? "LineString" : initialGeometry?.type === "Polygon" ? "Polygon" : "Point",
  );
  const kindRef = useRef(kind);
  useEffect(() => {
    kindRef.current = kind;
  });

  const initialPoints: [number, number][] =
    initialGeometry?.type === "Point"
      ? [initialGeometry.coordinates as [number, number]]
      : initialGeometry?.type === "LineString"
        ? (initialGeometry.coordinates as [number, number][])
        : initialGeometry?.type === "Polygon"
          ? (initialGeometry.coordinates[0] as [number, number][]).slice(0, -1)
          : [];

  const [vertices, setVertices] = useState<[number, number][]>(initialPoints);
  const verticesRef = useRef(vertices);
  useEffect(() => {
    verticesRef.current = vertices;
  });

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"],
            tileSize: 256,
            maxzoom: 19,
            attribution: "Esri, Maxar, Earthstar Geographics",
          },
        },
        layers: [{ id: "base", type: "raster", source: "satellite" }],
      },
      center: initialPoints[0] ?? [-1.5, 12.35],
      zoom: initialPoints.length > 0 ? 13 : 5,
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    map.on("load", () => {
      map.addSource("draw-line", { type: "geojson", data: EMPTY_FC });
      map.addLayer({ id: "draw-line", type: "line", source: "draw-line", paint: { "line-color": "#f59e0b", "line-width": 3 } });
      map.addSource("draw-fill", { type: "geojson", data: EMPTY_FC });
      map.addLayer({ id: "draw-fill", type: "fill", source: "draw-fill", paint: { "fill-color": "#f59e0b", "fill-opacity": 0.2 } });
      map.addSource("draw-points", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "draw-points",
        type: "circle",
        source: "draw-points",
        paint: { "circle-radius": 5, "circle-color": "#f59e0b", "circle-stroke-color": "#fff", "circle-stroke-width": 1.5 },
      });
      render();
    });

    map.on("click", (e) => {
      const pt: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const next = kindRef.current === "Point" ? [pt] : [...verticesRef.current, pt];
      setVertices(next);
      verticesRef.current = next;
      render();
    });

    function render() {
      const pts = verticesRef.current;
      map.getSource<maplibregl.GeoJSONSource>("draw-points")?.setData({
        type: "FeatureCollection",
        features: pts.map((c) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: c } })),
      });
      const lineCoords = kindRef.current === "Polygon" && pts.length >= 3 ? [...pts, pts[0]] : pts;
      map.getSource<maplibregl.GeoJSONSource>("draw-line")?.setData(
        pts.length >= 2 ? { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: lineCoords } } : EMPTY_FC,
      );
      map.getSource<maplibregl.GeoJSONSource>("draw-fill")?.setData(
        kindRef.current === "Polygon" && pts.length >= 3
          ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] } }
          : EMPTY_FC,
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [initialPoints]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const pts = verticesRef.current;
    map.getSource<maplibregl.GeoJSONSource>("draw-points")?.setData({
      type: "FeatureCollection",
      features: pts.map((c) => ({ type: "Feature", properties: {}, geometry: { type: "Point", coordinates: c } })),
    });
    const lineCoords = kind === "Polygon" && pts.length >= 3 ? [...pts, pts[0]] : pts;
    map.getSource<maplibregl.GeoJSONSource>("draw-line")?.setData(
      pts.length >= 2 ? { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: lineCoords } } : EMPTY_FC,
    );
    map.getSource<maplibregl.GeoJSONSource>("draw-fill")?.setData(
      kind === "Polygon" && pts.length >= 3
        ? { type: "Feature", properties: {}, geometry: { type: "Polygon", coordinates: [[...pts, pts[0]]] } }
        : EMPTY_FC,
    );
  }, [vertices, kind]);

  function selectKind(k: GeomKind) {
    setKind(k);
    setVertices([]);
  }

  function undo() {
    setVertices((v) => v.slice(0, -1));
  }

  function clear() {
    setVertices([]);
  }

  // N'expose au serveur que les lignes/polygones : le point simple reste géré par les champs
  // latitude/longitude existants, pour ne rien changer au comportement actuel quand la carte
  // n'est pas utilisée pour dessiner une ligne ou un polygone.
  const geometry = kind === "Point" ? null : toGeometry(kind, vertices);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="flex overflow-hidden rounded-lg border border-slate-300 dark:border-slate-700">
          {(
            [
              ["Point", MapPin, "Point"],
              ["LineString", Spline, "Ligne"],
              ["Polygon", Hexagon, "Polygone"],
            ] as [GeomKind, typeof MapPin, string][]
          ).map(([k, Icon, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => selectKind(k)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium ${
                kind === k ? "bg-amber-500 text-white" : "bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={undo}
          disabled={vertices.length === 0}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Undo2 size={13} /> Annuler le dernier point
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={vertices.length === 0}
          className="flex items-center gap-1 rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <Trash2 size={13} /> Effacer
        </button>
        <span className="text-xs text-slate-400">
          {kind === "Point" && "Cliquez sur la carte pour placer le point."}
          {kind === "LineString" && `Cliquez pour ajouter des points (${vertices.length} placé(s), 2 minimum).`}
          {kind === "Polygon" && `Cliquez pour ajouter des sommets (${vertices.length} placé(s), 3 minimum).`}
        </span>
      </div>
      <div ref={containerRef} style={{ height: 280, borderRadius: "0.75rem", overflow: "hidden" }} />
      <input type="hidden" name="geom_geojson" value={geometry ? JSON.stringify(geometry) : ""} />
    </div>
  );
}
