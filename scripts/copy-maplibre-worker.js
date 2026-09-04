// Copie le Web Worker de maplibre-gl (+ son dépendant "shared") dans public/, en dehors du
// pipeline de bundling Turbopack/Next. Contournement pour "Failed to load module script: ...
// text/html" en dev : Turbopack ne résout pas correctement l'URL du worker que maplibre-gl
// calcule via import.meta.url à l'exécution ; ce worker traite TOUTES les sources GeoJSON
// (points, clusters, zones), donc sans lui rien ne s'affiche jamais sur la carte, silencieusement.
// Voir components/map/MapView.tsx (maplibregl.setWorkerUrl) qui pointe vers cette copie statique.
// S'exécute à chaque `npm install` (postinstall) pour rester synchronisé avec la version installée.

const fs = require("fs");
const path = require("path");

const FILES = ["maplibre-gl-worker.mjs", "maplibre-gl-shared.mjs"];
const srcDir = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist");
const destDir = path.join(__dirname, "..", "public");

for (const file of FILES) {
  const src = path.join(srcDir, file);
  const dest = path.join(destDir, file);
  if (!fs.existsSync(src)) {
    console.warn(`[copy-maplibre-worker] introuvable, ignoré : ${src}`);
    continue;
  }
  fs.copyFileSync(src, dest);
}
console.log("[copy-maplibre-worker] copié dans public/");
