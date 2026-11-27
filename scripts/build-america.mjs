// Genera src/america-datos.js: el mapa de la portada, dibujado por código (sin foto).
//   TIERRA     anillos de costa de América Latina (y el sur de EE. UU.), cerrados, para rellenar.
//   FRONTERAS  límites entre países.
//   LUCES      luces de ciudad de noche: más densas cerca de la costa y alrededor de las grandes
//              ciudades, como en una foto nocturna. Se generan con azar con semilla fija (siempre
//              salen iguales).
// Fuente: Natural Earth 1:50m (dominio público), vía world-atlas.
// Formato: listas planas [lon, lat, lon, lat, …] en grados con dos decimales; LUCES es [lon, lat, brillo, …].
// Uso: node scripts/build-america.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { feature, mesh } from "topojson-client";

const CAJA = { oeste: -125, este: -25, sur: -60, norte: 38 };
const PASO = 0.06; // grados: se descartan puntos más cerca que esto del anterior
const ISLA_MINIMA = 0.3; // grados (diagonal de la caja): islas menores se descartan

const tierra = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const paises = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));

const figuras = feature(tierra, tierra.objects.land);
const geometrias = figuras.type === "FeatureCollection" ? figuras.features.map((f) => f.geometry) : [figuras.geometry];
const anillosMundo = geometrias.flatMap((g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat()));
const fronterasMundo = mesh(paises, paises.objects.countries, (a, b) => a !== b).coordinates;

const dentro = ([x, y]) => x >= CAJA.oeste && x <= CAJA.este && y >= CAJA.sur && y <= CAJA.norte;

// Deja solo los puntos dentro de la caja (lo de afuera queda fuera de cuadro) y simplifica.
function recortar(linea) {
  const salida = [];
  for (const p of linea) {
    if (!dentro(p)) continue;
    const u = salida[salida.length - 1];
    if (!u || Math.hypot(p[0] - u[0], p[1] - u[1]) >= PASO) salida.push(p);
  }
  return salida;
}

function diagonal(linea) {
  const xs = linea.map((p) => p[0]);
  const ys = linea.map((p) => p[1]);
  return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
}

const TIERRA = anillosMundo.map(recortar).filter((a) => a.length > 3 && diagonal(a) >= ISLA_MINIMA);
const FRONTERAS = fronterasMundo.map(recortar).filter((l) => l.length > 1);

/* ---------- Luces ---------- */

// Azar con semilla (mulberry32).
let semilla = 20261126;
const azar = () => {
  semilla = (semilla + 0x6d2b79f5) | 0;
  let t = Math.imul(semilla ^ (semilla >>> 15), 1 | semilla);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const normal = () => Math.sqrt(-2 * Math.log(azar() || 1e-9)) * Math.cos(2 * Math.PI * azar());

const cajas = TIERRA.map((a) => {
  const xs = a.map((p) => p[0]);
  const ys = a.map((p) => p[1]);
  return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)];
});
function enTierra(x, y) {
  let adentro = false;
  TIERRA.forEach((a, k) => {
    const [x0, y0, x1, y1] = cajas[k];
    if (x < x0 || x > x1 || y < y0 || y > y1) return;
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i];
      const [xj, yj] = a[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) adentro = !adentro;
    }
  });
  return adentro;
}

// Distancia aproximada a la costa: al punto de costa más cercano, buscado en celdas de 1°.
const celdas = new Map();
for (const a of TIERRA) {
  for (const [x, y] of a) {
    const k = `${Math.floor(x)},${Math.floor(y)}`;
    if (!celdas.has(k)) celdas.set(k, []);
    celdas.get(k).push([x, y]);
  }
}
function aLaCosta(x, y) {
  let d = Infinity;
  const cx = Math.floor(x);
  const cy = Math.floor(y);
  for (let i = -2; i <= 2; i++) {
    for (let j = -2; j <= 2; j++) {
      for (const [px, py] of celdas.get(`${cx + i},${cy + j}`) ?? []) d = Math.min(d, Math.hypot(px - x, py - y));
    }
  }
  return d;
}

// Grandes ciudades: [lon, lat, peso]. Alrededor de cada una se agrupan luces.
const CIUDADES = [
  [-99.13, 19.43, 3], [-103.35, 20.67, 1.5], [-100.31, 25.67, 1.5], [-95.37, 29.76, 2], [-97.74, 30.27, 1],
  [-80.19, 25.76, 1.5], [-90.51, 14.64, 1], [-89.19, 13.69, 0.7], [-87.21, 14.07, 0.6], [-86.25, 12.13, 0.6],
  [-84.09, 9.93, 0.8], [-79.52, 8.98, 1], [-82.37, 23.11, 1], [-69.93, 18.49, 1], [-66.1, 18.47, 0.8],
  [-72.34, 18.54, 0.7], [-74.07, 4.71, 2], [-75.57, 6.24, 1.2], [-76.53, 3.45, 1], [-74.78, 10.96, 0.8],
  [-66.9, 10.48, 1.5], [-71.64, 10.65, 0.8], [-78.47, -0.18, 1.1], [-79.89, -2.19, 1.1], [-68.15, -16.5, 1],
  [-63.18, -17.78, 0.9], [-57.58, -25.26, 0.9], [-70.67, -33.45, 2], [-71.62, -33.05, 0.7], [-73.05, -36.83, 0.6],
  [-58.38, -34.6, 3], [-64.18, -31.42, 1.1], [-60.64, -32.95, 0.9], [-68.83, -32.89, 0.7], [-56.16, -34.9, 1],
  [-46.63, -23.55, 3], [-43.17, -22.91, 2.4], [-43.94, -19.92, 1.4], [-47.88, -15.79, 1.2], [-49.27, -25.43, 1.1],
  [-51.23, -30.03, 1.2], [-38.5, -12.97, 1.2], [-34.88, -8.05, 1.1], [-38.54, -3.73, 1.1], [-48.5, -1.46, 0.9],
  [-60.02, -3.12, 0.9], [-49.25, -16.68, 0.8], [-47.06, -22.91, 1], [-77.04, -12.05, 2.4], [-79.03, -8.11, 0.8],
  [-71.54, -16.4, 0.8], [-79.84, -6.77, 0.6],
];

const LUCES = [];
// Dispersas: casi todas cerca de la costa, pocas tierra adentro.
for (let n = 0; n < 70000 && LUCES.length < 900; n++) {
  const x = CAJA.oeste + azar() * (CAJA.este - CAJA.oeste);
  const y = CAJA.sur + azar() * (CAJA.norte - 8 - CAJA.sur);
  if (!enTierra(x, y)) continue;
  const d = aLaCosta(x, y);
  if (azar() > 0.035 + 0.55 * Math.exp(-d / 0.5)) continue;
  LUCES.push([x, y, 0.25 + azar() * 0.35]);
}
// Agrupadas en las ciudades: el centro más brillante.
for (const [cx, cy, peso] of CIUDADES) {
  LUCES.push([cx, cy, 1]);
  const cuantas = Math.round(8 * peso);
  for (let i = 0; i < cuantas; i++) {
    const r = 0.18 + 0.12 * peso;
    const x = cx + normal() * r;
    const y = cy + normal() * r;
    if (!enTierra(x, y)) continue;
    const cerca = Math.hypot(x - cx, y - cy) / r;
    LUCES.push([x, y, Math.max(0.3, 0.95 - cerca * 0.3)]);
  }
}

const plano = (linea) => linea.flatMap(([x, y]) => [+x.toFixed(2), +y.toFixed(2)]);
const js = `// Generado por scripts/build-america.mjs. Fuente: Natural Earth 1:50m (dominio público), vía world-atlas.
// Listas planas [lon, lat, …] en grados; LUCES es [lon, lat, brillo, …].
export const TIERRA = ${JSON.stringify(TIERRA.map(plano))};
export const FRONTERAS = ${JSON.stringify(FRONTERAS.map(plano))};
export const LUCES = ${JSON.stringify(LUCES.flatMap(([x, y, b]) => [+x.toFixed(2), +y.toFixed(2), +b.toFixed(2)]))};
`;
writeFileSync("src/america-datos.js", js);
const puntos = (ls) => ls.reduce((s, l) => s + l.length, 0);
console.log(
  `src/america-datos.js ${(js.length / 1024).toFixed(0)} KB · ${TIERRA.length} costas (${puntos(TIERRA)} puntos) · ` +
    `${FRONTERAS.length} fronteras (${puntos(FRONTERAS)} puntos) · ${LUCES.length} luces`,
);
