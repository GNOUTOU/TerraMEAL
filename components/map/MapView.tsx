"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import * as maplibregl from "maplibre-gl";
import type { Map as MapLibreMap, StyleSpecification } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export interface MapFeatureProperties {
  id: string;
  title: string;
  subtitle?: string;
  color?: string;
  href?: string;
}

// Fond satellite (imagerie Esri World Imagery) + calque de référence (frontières, routes,
// toponymes) superposé pour rester lisible — pas de clé d'API requise.
const SATELLITE_STYLE: StyleSpecification = {
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
      tiles: [
        "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution: "Esri",
    },
  },
  layers: [
    { id: "satellite", type: "raster", source: "satellite" },
    { id: "satellite-labels", type: "raster", source: "satellite-labels" },
  ],
};

export default function MapView({
  points,
  polygons,
  height = "100%",
  center = [0, 12],
  zoom = 5,
  fitToData = true,
  onFeatureClick,
  exportable = false,
}: {
  points?: GeoJSON.FeatureCollection<GeoJSON.Point, MapFeatureProperties>;
  polygons?: GeoJSON.FeatureCollection<GeoJSON.Geometry, { name?: string }>;
  height?: string;
  center?: [number, number];
  zoom?: number;
  fitToData?: boolean;
  onFeatureClick?: (props: MapFeatureProperties) => void;
  exportable?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: SATELLITE_STYLE,
      center,
      zoom,
    });
    map.addControl(new maplibregl.NavigationControl(), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    function render() {
      if (!map) return;
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

      if (points && points.features.length > 0) {
        map.addSource("points", { type: "geojson", data: points, cluster: true, clusterRadius: 40 });
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

        if (fitToData) {
          const bounds = new maplibregl.LngLatBounds();
          for (const f of points.features) bounds.extend(f.geometry.coordinates as [number, number]);
          if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 0 });
        }

        const popup = new maplibregl.Popup({ closeButton: false, offset: 10 });
        map.on("mousemove", "points", (e) => {
          map.getCanvas().style.cursor = "pointer";
          const f = e.features?.[0];
          if (!f) return;
          const props = f.properties as MapFeatureProperties;
          popup
            .setLngLat((f.geometry as GeoJSON.Point).coordinates as [number, number])
            .setHTML(`<div style="font:13px sans-serif"><strong>${props.title}</strong><br/>${props.subtitle ?? ""}</div>`)
            .addTo(map);
        });
        map.on("mouseleave", "points", () => {
          map.getCanvas().style.cursor = "";
          popup.remove();
        });
        map.on("click", "points", (e) => {
          const f = e.features?.[0];
          if (!f) return;
          const props = f.properties as MapFeatureProperties;
          if (onFeatureClick) onFeatureClick(props);
          else if (props.href) router.push(props.href);
        });
      }
    }

    if (map.isStyleLoaded()) render();
    else map.once("load", render);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, polygons]);

  function handleExportPng() {
    const map = mapRef.current;
    if (!map) return;
    const link = document.createElement("a");
    link.download = "carte-terrameal.png";
    link.href = map.getCanvas().toDataURL("image/png");
    link.click();
  }

  return (
    <div style={{ position: "relative", height, width: "100%" }}>
      <div ref={containerRef} style={{ height: "100%", width: "100%", borderRadius: "0.75rem", overflow: "hidden" }} />
      {exportable && (
        <button
          onClick={handleExportPng}
          className="absolute bottom-4 right-4 z-10 rounded-lg bg-white/95 px-2.5 py-1.5 text-xs font-medium text-slate-600 shadow hover:bg-white dark:bg-slate-900/95 dark:text-slate-300"
        >
          Exporter PNG
        </button>
      )}
    </div>
  );
}
