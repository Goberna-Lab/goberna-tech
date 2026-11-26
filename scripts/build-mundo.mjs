// Genera src/mundo-datos.js: costas y fronteras del mundo para el globo de la portada.
// Fuente: Natural Earth 1:50m (dominio público), vía world-atlas.
// Las líneas se simplifican (se descartan puntos a menos de PASO grados del anterior y las islas muy
// chicas) y se guardan como enteros de 16 bits (centésimas de grado ×1,5) con delta, en base64.
// Uso: node scripts/build-mundo.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { feature, mesh } from "topojson-client";

const PASO = 0.1; // grados
const ISLA_MINIMA = 0.35; // grados (diagonal de la caja): las islas menores se descartan
const Q = 150; // unidades por grado

const tierra = JSON.parse(readFileSync("node_modules/world-atlas/land-50m.json", "utf8"));
const paises = JSON.parse(readFileSync("node_modules/world-atlas/countries-50m.json", "utf8"));

// La tierra puede venir como una figura o como una colección; cada polígono es [exterior, huecos…].
const figuras = feature(tierra, tierra.objects.land);
const geometrias = figuras.type === "FeatureCollection" ? figuras.features.map((f) => f.geometry) : [figuras.geometry];
const anillos = geometrias.flatMap((g) => (g.type === "Polygon" ? g.coordinates : g.coordinates.flat()));
const fronteras = mesh(paises, paises.objects.countries, (a, b) => a !== b).coordinates;

function simplificar(linea, cerrada) {
  const salida = [linea[0]];
  for (let i = 1; i < linea.length; i++) {
    const [x, y] = linea[i];
    const [px, py] = salida[salida.length - 1];
    if (Math.hypot(x - px, y - py) >= PASO || i === linea.length - 1) salida.push([x, y]);
  }
  if (cerrada && salida.length > 2) {
    const [a, b] = [salida[0], salida[salida.length - 1]];
    if (a[0] !== b[0] || a[1] !== b[1]) salida.push(a);
  }
  return salida;
}
const tamano = (linea) => {
  const xs = linea.map((p) => p[0]);
  const ys = linea.map((p) => p[1]);
  return Math.hypot(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys));
};

// Formato: [n, x0, y0, dx1, dy1, …] por línea, todo en Int16.
function codificar(lineas) {
  const datos = [];
  let puntos = 0;
  for (const l of lineas) {
    if (l.length < 2) continue;
    datos.push(l.length);
    let px = 0;
    let py = 0;
    l.forEach(([lon, lat], i) => {
      const x = Math.round(lon * Q);
      const y = Math.round(lat * Q);
      datos.push(i ? x - px : x, i ? y - py : y);
      px = x;
      py = y;
    });
    puntos += l.length;
  }
  const buf = Buffer.from(new Int16Array(datos).buffer);
  return { b64: buf.toString("base64"), puntos, lineas: lineas.length };
}

const costas = anillos.filter((a) => tamano(a) >= ISLA_MINIMA).map((a) => simplificar(a, true));
const limites = fronteras.map((l) => simplificar(l, false)).filter((l) => l.length > 1);
const c = codificar(costas);
const f = codificar(limites);
writeFileSync(
  "src/mundo-datos.js",
  `// Generado por scripts/build-mundo.mjs. Fuente: Natural Earth 1:50m (dominio público), vía world-atlas.
// Formato: Int16 en base64; por línea [n, lon0, lat0, Δlon, Δlat, …] en 1/${Q} de grado.
export const Q = ${Q};
export const COSTAS = "${c.b64}";
export const FRONTERAS = "${f.b64}";
`,
);
console.log(`costas: ${c.lineas} anillos, ${c.puntos} puntos · fronteras: ${f.lineas} líneas, ${f.puntos} puntos`);
console.log(`peso: ${((c.b64.length + f.b64.length) / 1024).toFixed(0)} KB`);
