// Portada: América Latina de noche, dibujada por código (SVG), con foco en el Perú.
// Reemplaza al Perú en hilos de luz (peru3d.js), que queda guardado sin usar. Tomó como referencia el
// ambiente del hero del Foro de Estado (noche azul, luces doradas, vista desde arriba), pero el mapa es
// propio: vectorial, nítido a cualquier tamaño y sin fotos.
//
// Qué pasa
//   · El continente se ve como desde un satélite: proyección ortográfica (la Tierra curva), retícula
//     de meridianos y paralelos, costas con un brillo cálido, fronteras tenues y luces de ciudad
//     (src/america-datos.js, generado por scripts/build-america.mjs).
//   · Entrada de cámara: se ve el continente entero y la cámara se acerca al Perú.
//   · Foco en el Perú: el resto queda en penumbra y el Perú se ilumina en dorado, con su silueta
//     (Natural Earth, src/peru.js) trazándose encima.
//   · La red sale de Lima hacia las capitales de región, y cada tanto una onda parte de Lima y enciende
//     las capitales a medida que las alcanza (el retardo de cada una sale de su distancia a Lima).
//
// Todo vive en un <svg> de 1920 × 949. Los tiempos y el movimiento son CSS (home.css, "1. Portada");
// aquí se arma el dibujo, se encuadra según la pantalla y se elige hacia dónde va la cámara.

import { PERU } from "./peru.js";
import { TIERRA, FRONTERAS, LUCES } from "./america-datos.js";

const SVG = "http://www.w3.org/2000/svg";
const ANCHO = 1920;
const ALTO = 949;

// Proyección ortográfica centrada cerca del Perú. El centro cae en (CX, CY) del lienzo.
const LON0 = (-72 * Math.PI) / 180;
const LAT0 = (-12 * Math.PI) / 180;
const RADIO = 650;
const CX = 1330;
const CY = 440;
function proyectar(lon, lat) {
  const l = (lon * Math.PI) / 180 - LON0;
  const p = (lat * Math.PI) / 180;
  return [CX + RADIO * Math.cos(p) * Math.sin(l), CY - RADIO * (Math.cos(LAT0) * Math.sin(p) - Math.sin(LAT0) * Math.cos(p) * Math.cos(l))];
}

const LIMA = proyectar(-77.04, -12.05);
const PERU_CENTRO = proyectar(-75, -9.5);
// Capitales de región (las mismas de peru3d.js).
const CAPITALES = [
  [-80.45, -3.57], // Tumbes
  [-80.63, -5.19], // Piura
  [-79.84, -6.77], // Chiclayo
  [-79.03, -8.11], // Trujillo
  [-78.51, -7.16], // Cajamarca
  [-77.87, -6.23], // Chachapoyas
  [-76.97, -6.03], // Moyobamba
  [-73.25, -3.75], // Iquitos
  [-77.53, -9.53], // Huaraz
  [-76.24, -9.93], // Huánuco
  [-74.55, -8.38], // Pucallpa
  [-76.26, -10.68], // Cerro de Pasco
  [-75.21, -12.07], // Huancayo
  [-74.98, -12.79], // Huancavelica
  [-75.73, -14.07], // Ica
  [-74.22, -13.16], // Ayacucho
  [-72.88, -13.63], // Abancay
  [-71.97, -13.53], // Cusco
  [-69.19, -12.59], // Puerto Maldonado
  [-70.02, -15.84], // Puno
  [-71.54, -16.4], // Arequipa
  [-70.94, -17.19], // Moquegua
  [-70.25, -18.01], // Tacna
].map(([lon, lat]) => proyectar(lon, lat));

// La onda tarda 2,4 s en llegar a la capital más lejana (el 40 % de la vuelta de 6 s, ver g-peru-onda).
const ONDA_INICIO = 4.6; // s desde que arranca la portada
const ONDA_EXPANSION = 2.4;
const ONDA_RADIO = 1.08 * Math.max(...CAPITALES.map(([x, y]) => Math.hypot(x - LIMA[0], y - LIMA[1])));

// Cuánto se acerca la cámara: en vertical más, porque el Perú tiene que bajar y dejar arriba el texto.
const ZOOM_HORIZONTAL = 2.1;
const ZOOM_VERTICAL = 2.5;

function nodo(nombre, attrs = {}, ...hijos) {
  const el = document.createElementNS(SVG, nombre);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...hijos);
  return el;
}

const f = (n) => n.toFixed(1);

// Lista plana [lon, lat, …] → trazo SVG.
function trazo(plana, cerrar) {
  let d = "";
  for (let i = 0; i < plana.length; i += 2) {
    const [x, y] = proyectar(plana[i], plana[i + 1]);
    d += (i ? "L" : "M") + f(x) + " " + f(y);
  }
  return cerrar ? d + "Z" : d;
}

// Meridianos y paralelos cada 10°, curvos por la proyección.
function reticula() {
  let d = "";
  for (let lon = -130; lon <= -10; lon += 10) {
    const linea = [];
    for (let lat = -70; lat <= 50; lat += 2) linea.push(lon, lat);
    d += trazo(linea, false);
  }
  for (let lat = -60; lat <= 40; lat += 10) {
    const linea = [];
    for (let lon = -140; lon <= 0; lon += 2) linea.push(lon, lat);
    d += trazo(linea, false);
  }
  return d;
}

// Luces de ciudad en tres intensidades: cada intensidad es un solo trazo de círculos chicos.
function luces() {
  const grupos = [
    { clase: "g-luz-tenue", r: 0.75, d: "" },
    { clase: "g-luz-media", r: 1.05, d: "" },
    { clase: "g-luz-fuerte", r: 1.5, d: "" },
  ];
  for (let i = 0; i < LUCES.length; i += 3) {
    const [x, y] = proyectar(LUCES[i], LUCES[i + 1]);
    const g = grupos[LUCES[i + 2] >= 0.9 ? 2 : LUCES[i + 2] >= 0.5 ? 1 : 0];
    g.d += `M${f(x - g.r)} ${f(y)}a${g.r} ${g.r} 0 1 0 ${2 * g.r} 0a${g.r} ${g.r} 0 1 0 ${-2 * g.r} 0`;
  }
  return grupos.map((g) => nodo("path", { class: g.clase, d: g.d }));
}

function dibujar(red) {
  const tierra = TIERRA.map((a) => trazo(a, true)).join("");
  const silueta = trazo(PERU.flat(), true);
  const [lx, ly] = LIMA;

  const defs = nodo(
    "defs",
    {},
    // Tierra: más clara arriba a la derecha, como si la luz viniera de ahí.
    nodo(
      "linearGradient",
      { id: "g-mapa-tierra", gradientUnits: "userSpaceOnUse", x1: 1700, y1: 0, x2: 1000, y2: 949 },
      nodo("stop", { offset: "0", "stop-color": "#1c2a4d" }),
      nodo("stop", { offset: "0.55", "stop-color": "#121d38" }),
      nodo("stop", { offset: "1", "stop-color": "#0b142a" }),
    ),
    // Halo del planeta detrás del continente.
    nodo(
      "radialGradient",
      { id: "g-mapa-halo", gradientUnits: "userSpaceOnUse", cx: CX, cy: CY, r: RADIO * 1.05 },
      nodo("stop", { offset: "0", "stop-color": "#264880", "stop-opacity": "0.28" }),
      nodo("stop", { offset: "0.7", "stop-color": "#1b2a5e", "stop-opacity": "0.12" }),
      nodo("stop", { offset: "1", "stop-color": "#1b2a5e", "stop-opacity": "0" }),
    ),
    nodo("filter", { id: "g-mapa-difuso", x: "-10%", y: "-10%", width: "120%", height: "120%" }, nodo("feGaussianBlur", { stdDeviation: 2.4 })),
    nodo("filter", { id: "g-foco-difuso", x: "-20%", y: "-20%", width: "140%", height: "140%" }, nodo("feGaussianBlur", { stdDeviation: 9 })),
    nodo(
      "mask",
      { id: "g-foco-mascara", maskUnits: "userSpaceOnUse", x: -400, y: -400, width: 2720, height: 1750 },
      nodo("rect", { x: -400, y: -400, width: 2720, height: 1750, fill: "#fff" }),
      nodo("path", { d: silueta, fill: "#000", filter: "url(#g-foco-difuso)" }),
    ),
  );

  // El mapa base.
  const mapa = nodo(
    "g",
    { class: "g-mapa" },
    nodo("circle", { class: "g-mapa-halo", cx: CX, cy: CY, r: RADIO * 1.05 }),
    nodo("path", { class: "g-mapa-reticula", d: reticula() }),
    nodo("path", { class: "g-mapa-tierra", d: tierra }),
    nodo("path", { class: "g-mapa-costa-luz", d: tierra }),
    nodo("path", { class: "g-mapa-costa", d: tierra }),
    nodo("path", { class: "g-mapa-fronteras", d: FRONTERAS.map((l) => trazo(l, false)).join("") }),
    nodo("g", { class: "g-mapa-luces" }, ...luces()),
  );

  // Penumbra sobre todo menos el Perú, y el Perú iluminado.
  const sombra = nodo("rect", { class: "g-foco-sombra", x: -400, y: -400, width: 2720, height: 1750, mask: "url(#g-foco-mascara)" });
  const luz = nodo("path", { class: "g-peru-luz", d: silueta });
  const borde = nodo("path", { class: "g-peru-borde", d: silueta, pathLength: 1 });

  // Red: de Lima a cada capital, en orden de distancia.
  const lineas = nodo("g");
  const puntos = nodo("g");
  for (const [x, y] of CAPITALES) {
    const lejos = Math.hypot(x - lx, y - ly) / ONDA_RADIO;
    // Curva leve, siempre hacia el mismo lado del trazo.
    const qx = (lx + x) / 2 - (y - ly) * 0.18;
    const qy = (ly + y) / 2 + (x - lx) * 0.18;
    lineas.append(nodo("path", { class: "g-peru-linea", d: `M${f(lx)} ${f(ly)}Q${f(qx)} ${f(qy)} ${f(x)} ${f(y)}`, pathLength: 1, style: `--lejos:${lejos.toFixed(3)}` }));
    puntos.append(
      nodo("circle", {
        class: "g-peru-capital",
        cx: f(x),
        cy: f(y),
        r: 1.7,
        style: `--lejos:${lejos.toFixed(3)};--toque:${(ONDA_INICIO + lejos * ONDA_EXPANSION).toFixed(2)}s`,
      }),
    );
  }

  const onda = nodo("circle", { class: "g-peru-onda", cx: f(lx), cy: f(ly), r: f(ONDA_RADIO) });
  const sede = nodo(
    "g",
    { class: "g-peru-sede" },
    nodo("circle", { class: "g-peru-sede-aro", cx: f(lx), cy: f(ly), r: 5 }),
    nodo("circle", { class: "g-peru-sede-centro", cx: f(lx), cy: f(ly), r: 2.3 }),
  );

  red.append(defs, mapa, sombra, luz, borde, lineas, onda, puntos, sede);
}

export function montarPortadaMapa(seccion, { quieto = false } = {}) {
  const escena = seccion.querySelector(".g-hero-mapa");
  const caja = seccion.querySelector(".g-hero-deriva");
  const svg = seccion.querySelector(".g-hero-red");
  dibujar(svg.querySelector(".g-red"));

  // Qué parte del lienzo se ve y hacia dónde va la cámara.
  const encuadrar = () => {
    // Tamaño sin transformar (getBoundingClientRect incluiría el propio acercamiento).
    const W = caja.offsetWidth;
    const H = caja.offsetHeight;
    if (!W || !H) return;
    const forma = W / H;
    let x = 0;
    let y = 0;
    let w = ANCHO;
    let h = ALTO;
    if (forma < ANCHO / ALTO) {
      w = ALTO * forma;
      // En horizontal se recorta por la izquierda (el océano, donde va el texto); en vertical se centra en
      // Sudamérica.
      x = Math.min(Math.max(PERU_CENTRO[0] + 20 - w / 2, 0), ANCHO - w);
    } else {
      h = ANCHO / forma;
      y = (ALTO - h) / 2;
    }
    svg.setAttribute("viewBox", `${f(x)} ${f(y)} ${f(w)} ${f(h)}`);

    // El acercamiento es un scale con origen calculado para que el Perú termine donde se quiere: en horizontal,
    // donde ya está; en vertical, abajo y al centro. Fuera del mapa solo hay fondo, así que el origen puede
    // caer donde haga falta.
    const k = W / w;
    const px = (PERU_CENTRO[0] - x) * k;
    const py = (PERU_CENTRO[1] - y) * k;
    const vertical = forma < 1;
    const s = vertical ? ZOOM_VERTICAL : ZOOM_HORIZONTAL;
    const tx = vertical ? W * 0.5 : px;
    const ty = vertical ? H * 0.72 : py;
    escena.style.setProperty("--zoom", s);
    escena.style.setProperty("--origen", `${f((s * px - tx) / (s - 1))}px ${f((s * py - ty) / (s - 1))}px`);
  };
  encuadrar();
  new ResizeObserver(encuadrar).observe(caja);

  // La escena arranca en el próximo cuadro (el dibujo ya está armado).
  requestAnimationFrame(() => escena.classList.add("listo"));

  // Paralaje suave siguiendo al mouse (solo con mouse y sin "reducir movimiento").
  if (quieto || !matchMedia("(pointer: fine)").matches) return;
  seccion.addEventListener("pointermove", (e) => {
    const r = seccion.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    seccion.style.setProperty("--px", `${(-x * 24).toFixed(1)}px`);
    seccion.style.setProperty("--py", `${(-y * 16).toFixed(1)}px`);
  });
}
