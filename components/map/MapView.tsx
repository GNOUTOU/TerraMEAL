"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, MapMouseEvent, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Satellite, Map as MapIcon, Sun, Download, Check, Ruler, BoxSelect, X, Trash2 } from "lucide-react";

// Turbopack (dev) ne résout pas correctement l'URL du Web Worker que maplibre-gl calcule à
// l'exécution (import.meta.url) — la requête du script de module renvoie du HTML au lieu du JS
// ("Failed to load module script: ... text/html"), et ce worker traite TOUTES les sources
// GeoJSON (points, clusters, zones) : sans lui, rien ne s'affiche jamais, silencieusement.
// Contournement standard maplibre/mapbox : pointer vers une copie statique du worker servie
// depuis /public (maplibre-gl-worker.mjs + son dépendant maplibre-gl-shared.mjs), en dehors du
// pipeline de bundling. Voir package.json → script "postinstall".
maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");

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
const EMPTY_FC: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[1] - a[1]) * Math.PI) / 180;
  const dLng = ((b[0] - a[0]) * Math.PI) / 180;
  const lat1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[1] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function formatDistance(km: number) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(2)} km`;
}

type Tool = "none" | "measure" | "select";

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
  tools = false,
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
  /** Active les outils de mesure de distance et de sélection rectangulaire. */
  tools?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const dataRef = useRef({ points, polygons, onFeatureClick });
  const hiddenColorsRef = useRef<Set<string>>(new Set());
  const toolRef = useRef<Tool>("none");
  const measurePointsRef = useRef<[number, number][]>([]);
  const dragStateRef = useRef<{ startPixel: [number, number] } | null>(null);
  const selectionBoxRef = useRef<HTMLDivElement>(null);

  const [basemap, setBasemap] = useState<keyof typeof BASEMAPS>("satellite");
  const [basemapMenuOpen, setBasemapMenuOpen] = useState(false);
  const [hiddenColors, setHiddenColors] = useState<Set<string>>(new Set());
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [measureKm, setMeasureKm] = useState(0);
  const [selectionResults, setSelectionResults] = useState<MapFeatureProperties[] | null>(null);

  // Refs synchronisées après le rendu (jamais pendant) : elles servent uniquement aux handlers
  // MapLibre (mousemove/click) qui vivent hors du cycle de rendu React et ont besoin de lire
  // les dernières props/état sans re-souscrire à chaque changement.
  useEffect(() => {
    dataRef.current = { points, polygons, onFeatureClick };
  });
  useEffect(() => {
    hiddenColorsRef.current = hiddenColors;
  });
  useEffect(() => {
    toolRef.current = activeTool;
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
        if (toolRef.current === "none") map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseenter", "clusters", () => {
        if (toolRef.current === "none") map.getCanvas().style.cursor = "pointer";
      });
      map.on("mouseleave", "points", () => {
        if (toolRef.current === "none") map.getCanvas().style.cursor = "";
      });
      map.on("mouseleave", "clusters", () => {
        if (toolRef.current === "none") map.getCanvas().style.cursor = "";
      });

      map.on("click", "points", (e) => {
        if (toolRef.current !== "none") return;
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
        if (toolRef.current !== "none") return;
        const f = e.features?.[0];
        if (!f) return;
        const source = map.getSource("points") as maplibregl.GeoJSONSource;
        source.getClusterExpansionZoom(f.properties!.cluster_id).then((z) => {
          map.easeTo({ center: (f.geometry as GeoJSON.Point).coordinates as [number, number], zoom: z });
        });
      });
    }
  }

  function updateMeasureLayer() {
    const map = mapRef.current;
    if (!map || !map.getSource("measure-points")) return;
    const pts = measurePointsRef.current;
    (map.getSource("measure-points") as maplibregl.GeoJSONSource).setData({
      type: "FeatureCollection",
      features: pts.map((p) => ({ type: "Feature", geometry: { type: "Point", coordinates: p }, properties: {} })),
    });
    (map.getSource("measure-line") as maplibregl.GeoJSONSource).setData(
      pts.length > 1
        ? { type: "Feature", geometry: { type: "LineString", coordinates: pts }, properties: {} }
        : EMPTY_FC
    );
    let total = 0;
    for (let i = 1; i < pts.length; i++) total += haversineKm(pts[i - 1], pts[i]);
    setMeasureKm(total);
  }

  // Outils mesure/sélection — un seul jeu de handlers, branché une fois au montage, qui lit
  // `toolRef` pour savoir quoi faire (évite de ré-attacher des listeners à chaque rendu).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !tools) return;

    function onClick(e: MapMouseEvent) {
      if (toolRef.current !== "measure") return;
      measurePointsRef.current = [...measurePointsRef.current, [e.lngLat.lng, e.lngLat.lat]];
      updateMeasureLayer();
    }

    function onMouseDown(e: MapMouseEvent) {
      if (toolRef.current !== "select") return;
      e.preventDefault();
      map!.dragPan.disable();
      dragStateRef.current = { startPixel: [e.point.x, e.point.y] };
      const box = selectionBoxRef.current;
      if (box) {
        box.style.display = "block";
        box.style.left = `${e.point.x}px`;
        box.style.top = `${e.point.y}px`;
        box.style.width = "0px";
        box.style.height = "0px";
      }
    }

    function onMouseMove(e: MapMouseEvent) {
      if (!dragStateRef.current) return;
      const [sx, sy] = dragStateRef.current.startPixel;
      const box = selectionBoxRef.current;
      if (!box) return;
      const x = Math.min(sx, e.point.x);
      const y = Math.min(sy, e.point.y);
      box.style.left = `${x}px`;
      box.style.top = `${y}px`;
      box.style.width = `${Math.abs(e.point.x - sx)}px`;
      box.style.height = `${Math.abs(e.point.y - sy)}px`;
    }

    function onMouseUp(e: MapMouseEvent) {
      if (!dragStateRef.current || !map) return;
      const [sx, sy] = dragStateRef.current.startPixel;
      dragStateRef.current = null;
      map.dragPan.enable();
      const box = selectionBoxRef.current;
      if (box) box.style.display = "none";

      if (!map.getLayer("points")) return;
      const features = map.queryRenderedFeatures(
        [
          [sx, sy],
          [e.point.x, e.point.y],
        ],
        { layers: ["points"] }
      );
      const unique = new Map<string, MapFeatureProperties>();
      for (const f of features) {
        const props = f.properties as MapFeatureProperties;
        if (props?.id) unique.set(props.id, props);
      }
      setSelectionResults(Array.from(unique.values()));
    }

    map.on("click", onClick);
    map.on("mousedown", onMouseDown);
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);
    return () => {
      map.off("click", onClick);
      map.off("mousedown", onMouseDown);
      map.off("mousemove", onMouseMove);
      map.off("mouseup", onMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tools]);

  function addToolSources() {
    const map = mapRef.current;
    if (!map) return;
    if (!map.getSource("measure-line")) {
      map.addSource("measure-line", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "measure-line",
        type: "line",
        source: "measure-line",
        paint: { "line-color": "#f59e0b", "line-width": 3, "line-dasharray": [1, 1.5] },
      });
    }
    if (!map.getSource("measure-points")) {
      map.addSource("measure-points", { type: "geojson", data: EMPTY_FC });
      map.addLayer({
        id: "measure-points",
        type: "circle",
        source: "measure-points",
        paint: { "circle-radius": 5, "circle-color": "#f59e0b", "circle-stroke-width": 2, "circle-stroke-color": "#fff" },
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
    map.addControl(
      new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true }, trackUserLocation: true }),
      "top-right"
    );
    mapRef.current = map;
    map.once("load", () => {
      renderData();
      addToolSources();
    });

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
    map.once("style.load", () => {
      renderData();
      addToolSources();
      updateMeasureLayer();
    });
  }

  function toggleSector(color: string) {
    setHiddenColors((prev) => {
      const next = new Set(prev);
      if (next.has(color)) next.delete(color);
      else next.add(color);
      return next;
    });
  }

  function selectTool(tool: Tool) {
    setActiveTool((prev) => (prev === tool ? "none" : tool));
    setSelectionResults(null);
    const map = mapRef.current;
    if (map) map.getCanvas().style.cursor = "";
  }

  function clearMeasure() {
    measurePointsRef.current = [];
    updateMeasureLayer();
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
      <div
        ref={containerRef}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem", overflow: "hidden", cursor: activeTool === "select" ? "crosshair" : activeTool === "measure" ? "crosshair" : undefined }}
      />
      <div
        ref={selectionBoxRef}
        className="pointer-events-none absolute z-20 hidden border-2 border-dashed border-blue-500 bg-blue-500/10"
      />

      {/* Sélecteur de fond de carte + outils */}
      <div className="absolute left-3 top-3 z-10 flex flex-col items-start gap-1.5">
        <div className="relative">
          <button
            onClick={() => setBasemapMenuOpen((v) => !v)}
            aria-label="Choisir le fond de carte"
            aria-haspopup="true"
            aria-expanded={basemapMenuOpen}
            className="flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow-lg backdrop-blur hover:bg-white dark:bg-slate-900/95 dark:text-slate-300"
          >
            <CurrentIcon size={13} aria-hidden="true" /> {BASEMAPS[basemap].label}
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
                    <B.icon size={13} className="shrink-0" aria-hidden="true" />
                    <span className="flex-1">{B.label}</span>
                    {key === basemap && <Check size={13} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {tools && (
          <div className="flex overflow-hidden rounded-lg bg-white/95 shadow-lg backdrop-blur dark:bg-slate-900/95">
            <button
              onClick={() => selectTool("measure")}
              aria-pressed={activeTool === "measure"}
              aria-label="Mesurer une distance"
              title="Mesurer une distance"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium ${
                activeTool === "measure" ? "bg-amber-500 text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <Ruler size={13} aria-hidden="true" /> Mesurer
            </button>
            <button
              onClick={() => selectTool("select")}
              aria-pressed={activeTool === "select"}
              aria-label="Sélection rectangulaire"
              title="Sélection rectangulaire"
              className={`flex items-center gap-1.5 border-l border-slate-100 px-2.5 py-1.5 text-xs font-medium dark:border-slate-800 ${
                activeTool === "select" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              <BoxSelect size={13} aria-hidden="true" /> Sélection
            </button>
          </div>
        )}

        {activeTool === "measure" && (
          <div className="flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
            {formatDistance(measureKm)}
            <button onClick={clearMeasure} aria-label="Effacer la mesure" className="rounded p-0.5 hover:bg-white/20">
              <Trash2 size={13} aria-hidden="true" />
            </button>
          </div>
        )}

        {activeTool === "select" && selectionResults && (
          <div className="max-h-56 w-64 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-700 dark:bg-slate-900">
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{selectionResults.length} sélectionné(s)</span>
              <button onClick={() => setSelectionResults(null)} aria-label="Fermer la sélection" className="rounded p-0.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={13} aria-hidden="true" />
              </button>
            </div>
            {selectionResults.length === 0 ? (
              <p className="px-1 py-2 text-xs text-slate-400">Aucun point dans la zone dessinée. Cliquez-glissez sur la carte.</p>
            ) : (
              <ul className="space-y-0.5">
                {selectionResults.map((r) => (
                  <li key={r.id}>
                    {r.href ? (
                      <a href={r.href} className="block truncate rounded px-1.5 py-1 text-xs text-slate-600 hover:bg-slate-50 hover:text-emerald-600 dark:text-slate-300 dark:hover:bg-slate-800">
                        {r.title}
                      </a>
                    ) : (
                      <span className="block truncate px-1.5 py-1 text-xs text-slate-600 dark:text-slate-300">{r.title}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
                  aria-pressed={!isHidden}
                  className={`flex items-center gap-1.5 rounded px-1 py-0.5 text-left transition hover:bg-slate-100 dark:hover:bg-slate-800 ${isHidden ? "opacity-40" : ""}`}
                  title={isHidden ? "Cliquer pour afficher" : "Cliquer pour masquer"}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
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
          aria-label="Exporter la carte en image PNG"
          className="absolute bottom-4 right-4 z-10 flex items-center gap-1.5 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow hover:bg-white dark:bg-slate-900/95 dark:text-slate-300"
        >
          <Download size={13} aria-hidden="true" /> Exporter PNG
        </button>
      )}

      {basemapMenuOpen && <div className="fixed inset-0 z-[5]" onClick={() => setBasemapMenuOpen(false)} />}
    </div>
  );
}
