"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Satellite, Map as MapIcon, Sun, Download, Check } from "lucide-react";

export interface MapFeatureProperties {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
  href?: string;
}

export interface LegendEntry {
  id: string;
  label: string;
  color: string;
}

// Trois fonds de carte gratuits, sans clé d'API. Satellite = imagerie Esri World Imagery +
// calque de référence (frontières/toponymes) superposé pour rester lisible.
const BASEMAPS: Record<string, { label: string; icon: typeof Satellite; style: StyleSpecification }> = {
  satellite: {
    label: "Satellite",
    icon: Satellite,
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
        "satellite-labels": {
          type: "raster",
          tiles: ["https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"],
          tileSize: 256,
          maxzoom: 19,
          attribution: "Esri",
        },
      },
      layers: [
        { id: "base", type: "raster", source: "satellite" },
        { id: "base-labels", type: "raster", source: "satellite-labels" },
      ],
    },
  },
  streets: {
    label: "Rues",
    icon: MapIcon,
    style: {
      version: 8,
      sources: {
        streets: {
          type: "raster",
          tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
          maxzoom: 19,
          attribution: "© OpenStreetMap contributors",
        },
      },
      layers: [{ id: "base", type: "raster", source: "streets" }],
    },
  },
  light: {
    label: "Clair",
    icon: Sun,
    style: {
      version: 8,
      sources: {
        light: {
          type: "raster",
          tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png"],
          tileSize: 256,
          maxzoom: 19,
          attribution: "© CARTO, © OpenStreetMap contributors",
        },
      },
      layers: [{ id: "base", type: "raster", source: "light" }],
    },
  },
};

const STORAGE_KEY = "terrameal:basemap";

export default function MapView({
  points,
  polygons,
  legend,
  height = "100%",
  center = [0, 12],
  zoom = 5,
  fitToData = true,
  onFeatureClick,
  exportable = false,
}: {
  points?: GeoJSON.FeatureCollection<GeoJSON.Point, MapFeatureProperties>;
  polygons?: GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
  legend?: LegendEntry[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  fitToData?: boolean;
  onFeatureClick?: (props: MapFeatureProperties) => void;
  exportable?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dataRef = useRef({ points, polygons, onFeatureClick });
  const hiddenColorsRef = useRef<Set<string>>(new Set());

  const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("satellite");
  const [basemapMenuOpen, setBasemapMenuOpen] = useState(false);
  const [hiddenColors, setHiddenColors] = useState<Set<string>>(new Set());

  // Refs synchronisées après le rendu (jamais pendant) : elles servent uniquement aux handlers
  // MapLibre (mousemove/click) qui vivent hors du cycle de rendu React et ont besoin de lire
  // les dernières props/état sans re-souscrire à chaque changement.
  useEffect(() => {
    dataRef.current = { points, polygons, onFeatureClick };
  });
  useEffect(() => {
    hiddenColorsRef.current = hiddenColors;
  });

  function visiblePoints() {
    const src = dataRef.current.points;
    if (!src) return src;
    if (hiddenColorsRef.current.size === 0) return src;
    return {
      ...src,
      features: src.features.filter((f) => !hiddenColorsRef.current.has(f.properties.color ?? "")),
    };
  }

  function renderData() {
    const map = mapRef.current;
    if (!map) return;
    const { polygons, onFeatureClick } = dataRef.current;

    if (map.getLayer("zones-fill")) map.removeLayer("zones-fill");
    if (map.getLayer("zones-line")) map.removeLayer("zones-line");
    if (map.getSource("zones")) map.removeSource("zones");
    if (map.getLayer("clusters")) map.removeLayer("clusters");
    if (map.getLayer("cluster-count")) map.removeLayer("cluster-count");
    if (map.getLayer("points")) map.removeLayer("points");
    if (map.getSource("points")) map.removeSource("points");

    if (polygons && polygons.features.length > 0) {
      map.addSource("zones", { type: "geojson", data: polygons });
      map.addLayer({ id: "zones-fill", type: "fill", source: "zones", paint: { "fill-color": "#059669", "fill-opacity": 0.06 } });
      map.addLayer({ id: "zones-line", type: "line", source: "zones", paint: { "line-color": "#059669", "line-width": 1 } });
    }

    const pts = visiblePoints();
    if (pts && pts.features.length > 0) {
      map.addSource("points", { type: "geojson", data: pts, cluster: true, clusterRadius: 40 });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: "points",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#059669",
          "circle-radius": ["step", ["get", "point_count"], 14, 10, 18, 30, 24],
          "circle-opacity": 0.85,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: "points",
        filter: ["has", "point_count"],
        layout: { "text-field": "{point_count_abbreviated}", "text-size": 12 },
        paint: { "text-color": "#fff" },
      });
      map.addLayer({
        id: "points",
        type: "circle",
        source: "points",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": ["coalesce", ["get", "color"], "#2563eb"],
          "circle-radius": 6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#fff",
        },
      });

      if (fitToData && dataRef.current.points) {
        const bounds = new maplibregl.LngLatBounds();
        for (const f of dataRef.current.points.features) bounds.extend(f.geometry.coordinates as [number, number]);
        if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 0 });
      }

      map.on("mouseenter", "points", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseenter", "clusters", () => {
        map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "points", () => {
        map.getCanvas().style.cursor = "";
      });
      map.on("mouseleave", "clusters", () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", "points", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const props = f.properties as MapFeatureProperties;
        if (dataRef.current.onFeatureClick) {
          dataRef.current.onFeatureClick(props);
          return;
        }
        const linkHtml = props.href
          ? `<a href="${props.href}" style="display:inline-flex;align-items:center;gap:4px;margin-top:8px;font:600 12px system-ui,sans-serif;color:#059669;text-decoration:none;">Voir la fiche →</a>`
          : "";
        new maplibregl.Popup({ closeButton: true, offset: 12, maxWidth: "240px" })
          .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
          .setHTML(
            `<div style="font:13px system-ui,sans-serif;min-width:140px">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="display:inline-block;width:9px;height:9px;border-radius:999px;background:${props.color ?? "#2563eb"};flex-shrink:0"></span>
                <strong style="color:#0f172a;">${props.title}</strong>
              </div>
              ${props.subtitle ? `<div style="color:#64748b;font-size:12px;">${props.subtitle}</div>` : ""}
              ${linkHtml}
            </div>`
          )
          .addTo(map);
      });

      map.on("click", "clusters", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const source = map.getSource("points") as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(f.properties!.cluster_id).then((z) => {
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z });
        });
      });
    }
  }

  // Lecture du fond de carte préféré faite ici, à la création de la carte, pour éviter un
  // flash (tuiles satellite puis bascule vers le fond restauré) — localStorage indisponible
  // côté serveur, donc uniquement lu au montage client (cf. Sidebar pour le même principe).
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const saved = localStorage.getItem(STORAGE_KEY);
    const initialKey: keyof typeof BASEMAPS = saved && saved in BASEMAPS ? (saved as keyof typeof BASEMAPS) : "satellite";
    // Resynchronise juste le libellé du sélecteur avec le fond réellement restauré (localStorage
    // indisponible en SSR, donc lu uniquement ici, au montage client).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialKey !== "satellite") setBasemap(initialKey);

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: BASEMAPS[initialKey].style,
      center,
      zoom,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;
    map.once("load", renderData);

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rafraîchit les couches quand les données (ou le filtre de légende) changent.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.isStyleLoaded()) renderData();
    else map.once("load", renderData);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, polygons, hiddenColors]);

  function changeBasemap(key: keyof typeof BASEMAPS) {
    setBasemap(key);
    setBasemapMenuOpen(false);
    localStorage.setItem(STORAGE_KEY, key);
    const map = mapRef.current;
    if (!map) return;
    map.setStyle(BASEMAPS[key].style);
    map.once("style.load", renderData);
  }

  function toggleSector(color: string) {
    setHiddenColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  }

  function handleExportPng() {
    const map = mapRef.current;
    if (!map) return;
    const link = document.createElement("a");
    link.download = "carte-terrameal.png";
    link.href = map.getCanvas().toDataURL("image/png");
    link.click();
  }

  const CurrentIcon = BASEMAPS[basemap].icon;

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%", borderRadius: "0.75rem", overflow: "hidden" }} />

      {/* Sélecteur de fond de carte */}
      <div className="absolute left-3 top-3 z-10">
        <button
          onClick={() => setBasemapMenuOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-lg backdrop-blur hover:bg-white dark:bg-slate-900/95 dark:text-slate-300"
        >
          <CurrentIcon size={13} /> {BASEMAPS[basemap].label}
        </button>
        {basemapMenuOpen && (
          <div className="absolute left-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            {(Object.keys(BASEMAPS) as (keyof typeof BASEMAPS)[]).map((key) => {
              const B = BASEMAPS[key];
              return (
                <button
                  key={key}
                  onClick={() => changeBasemap(key)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium ${
                    key === basemap ? "text-emerald-600" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  }`}
                >
                  <B.icon size={13} className="shrink-0" />
                  <span className="flex-1">{B.label}</span>
                  {key === basemap && <Check size={13} />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Légende interactive (clic = masquer/afficher un secteur) */}
      {legend && legend.length > 0 && (
        <div className="pointer-events-none absolute bottom-4 left-3 z-10 max-w-[calc(100vw-5.5rem)] rounded-lg bg-white/95 p-3 text-xs shadow-lg backdrop-blur sm:left-4 sm:max-w-[calc(100vw-8rem)] dark:bg-slate-900/95">
          <p className="mb-1.5 font-semibold text-slate-600 dark:text-slate-300">Légende — secteurs</p>
          <div className="pointer-events-auto flex flex-col gap-0.5">
            {legend.map((entry) => {
              const isHidden = hiddenColors.has(entry.color);
              return (
                <button
                  key={entry.id}
                  onClick={() => toggleSector(entry.color)}
                  className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${isHidden ? "opacity-40" : ""}`}
                  title={isHidden ? "Cliquer pour afficher" : "Cliquer pour masquer"}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} />
                  <span className="truncate text-slate-600 dark:text-slate-300">{entry.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {exportable && (
        <button
          onClick={handleExportPng}
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow hover:bg-white dark:bg-slate-900/95 dark:text-slate-300"
        >
          <Download size={13} /> Exporter PNG
        </button>
      )}

      {basemapMenuOpen && <div className="fixed inset-0 z-[5]" onClick={() => setBasemapMenuOpen(false)} />}
    </div>
  );
}
