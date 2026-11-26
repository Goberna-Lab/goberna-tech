// Genera src/peru.js (contorno del Perú) a partir de Natural Earth 1:50m (dominio público, vía world-atlas).
import { readFileSync, writeFileSync } from "node:fs";
import { feature } from "topojson-client";

const topo = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));
const peru = feature(topo, topo.objects.countries).features.find((f) => f.id === "604");
const polys = peru.geometry.type === "Polygon" ? [peru.geometry.coordinates] : peru.geometry.coordinates;
const ring = polys.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
const pts = ring.map(([lon, lat]) => [Number(lon.toFixed(3)), Number(lat.toFixed(3))]);
writeFileSync(
  "src/peru.js",
  `// Generado por scripts/build-peru.mjs. Fuente: Natural Earth 1:50m (dominio público).\nexport const PERU = ${JSON.stringify(pts)};\n`,
);
console.log(peru.properties.name, "puntos:", pts.length, "polígonos:", polys.length);
const lons = pts.map((p) => p[0]), lats = pts.map((p) => p[1]);
console.log("lon", Math.min(...lons), Math.max(...lons), "lat", Math.min(...lats), Math.max(...lats));
