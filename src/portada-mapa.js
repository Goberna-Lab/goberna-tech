// Portada: la foto nocturna de América Latina del hero del Foro de Estado (Foro-estado2,
// src/components/Hero.tsx), con una puesta en escena propia de Goberna Tech para no repetir la del Foro.
// Reemplaza al Perú en hilos de luz (peru3d.js), que queda guardado sin usar.
//
// Qué pasa
//   · Entrada de cámara: se ve el continente entero y la cámara se acerca al Perú.
//   · Foco en el Perú: el resto del continente queda en penumbra y el Perú se ilumina en dorado, con su
//     silueta real (Natural Earth, src/peru.js) trazándose encima.
//   · La red sale de Lima hacia las capitales de región, y cada tanto una onda parte de Lima y enciende
//     las capitales a medida que las alcanza (el retardo de cada una sale de su distancia a Lima).
//
// La foto y todo lo de encima viven en un solo <svg> de 1920 × 949 (el lienzo del XD del Foro). La
// silueta y las ciudades se pasan de longitud/latitud a ese lienzo con un ajuste hecho a mano sobre la
// foto (Punta Pariñas y el codo de Arica). Los tiempos y el movimiento son CSS (home.css, "1. Portada");
// aquí se arma el dibujo, se encuadra según la pantalla y se elige hacia dónde va la cámara.

import { PERU } from "./peru.js";

const SVG = "http://www.w3.org/2000/svg";
const ANCHO = 1920;
const ALTO = 949;

// Longitud/latitud → lienzo de la foto.
const enFoto = ([lon, lat]) => [10.9 * lon + 2166.5, 348.1 - 8.33 * lat];

const LIMA = enFoto([-77.04, -12.05]);
const PERU_CENTRO = enFoto([-75, -9.5]);
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
].map(enFoto);

// La onda: alcance (px del lienzo) y cuánto tarda en llegar hasta ahí. Debe calzar con g-onda en home.css.
const ONDA_RADIO = 95;
const ONDA_INICIO = 4.6; // s desde que arranca la portada
const ONDA_EXPANSION = 2.4; // s (el 40 % de la vuelta de 6 s)

// Cuánto se acerca la cámara: en vertical más, porque el Perú tiene que bajar y dejar arriba el texto.
const ZOOM_HORIZONTAL = 1.7;
const ZOOM_VERTICAL = 1.8;

function nodo(nombre, attrs = {}, ...hijos) {
  const el = document.createElementNS(SVG, nombre);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...hijos);
  return el;
}

const f = (n) => n.toFixed(1);

function dibujar(red) {
  const silueta = "M" + PERU.map((p) => enFoto(p).map(f).join(" ")).join("L") + "Z";
  const [lx, ly] = LIMA;

  const defs = nodo(
    "defs",
    {},
    nodo("filter", { id: "g-foco-difuso", x: "-20%", y: "-20%", width: "140%", height: "140%" }, nodo("feGaussianBlur", { stdDeviation: 9 })),
    nodo(
      "mask",
      { id: "g-foco-mascara", maskUnits: "userSpaceOnUse", x: -400, y: -400, width: 2720, height: 1750 },
      nodo("rect", { x: -400, y: -400, width: 2720, height: 1750, fill: "#fff" }),
      nodo("path", { d: silueta, fill: "#000", filter: "url(#g-foco-difuso)" }),
    ),
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
    const cx = (lx + x) / 2 - (y - ly) * 0.18;
    const cy = (ly + y) / 2 + (x - lx) * 0.18;
    lineas.append(nodo("path", { class: "g-peru-linea", d: `M${f(lx)} ${f(ly)}Q${f(cx)} ${f(cy)} ${f(x)} ${f(y)}`, pathLength: 1, style: `--lejos:${lejos.toFixed(3)}` }));
    puntos.append(
      nodo("circle", {
        class: "g-peru-capital",
        cx: f(x),
        cy: f(y),
        r: 2.2,
        style: `--lejos:${lejos.toFixed(3)};--toque:${(ONDA_INICIO + lejos * ONDA_EXPANSION).toFixed(2)}s`,
      }),
    );
  }

  const onda = nodo("circle", { class: "g-peru-onda", cx: f(lx), cy: f(ly), r: ONDA_RADIO });
  const sede = nodo(
    "g",
    { class: "g-peru-sede" },
    nodo("circle", { class: "g-peru-sede-aro", cx: f(lx), cy: f(ly), r: 7 }),
    nodo("circle", { class: "g-peru-sede-centro", cx: f(lx), cy: f(ly), r: 3.2 }),
  );

  red.append(defs, sombra, luz, borde, lineas, onda, puntos, sede);
}

export function montarPortadaMapa(seccion, { quieto = false } = {}) {
  const mapa = seccion.querySelector(".g-hero-mapa");
  const caja = seccion.querySelector(".g-hero-deriva");
  const svg = seccion.querySelector(".g-hero-red");
  dibujar(svg.querySelector(".g-red"));

  // Qué parte del lienzo se ve (la que cubre la portada sin deformarse) y hacia dónde va la cámara.
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
      // En horizontal se recorta el mar de la izquierda; en vertical se centra en Sudamérica.
      x = Math.min(Math.max(PERU_CENTRO[0] + 20 - w / 2, 0), ANCHO - w);
    } else {
      h = ANCHO / forma;
      y = (ALTO - h) / 2;
    }
    svg.setAttribute("viewBox", `${f(x)} ${f(y)} ${f(w)} ${f(h)}`);

    // El acercamiento es un scale con origen calculado para que el Perú termine donde se quiere:
    // en horizontal, donde ya está; en vertical, abajo y al centro. El origen se mantiene dentro de la
    // portada para que la foto la siga cubriendo.
    const k = W / w;
    const px = (PERU_CENTRO[0] - x) * k;
    const py = (PERU_CENTRO[1] - y) * k;
    const vertical = forma < 1;
    const s = vertical ? ZOOM_VERTICAL : ZOOM_HORIZONTAL;
    const tx = vertical ? W * 0.5 : px;
    const ty = vertical ? H * 0.74 : py;
    const ox = Math.min(Math.max((s * px - tx) / (s - 1), 0), W);
    const oy = Math.min(Math.max((s * py - ty) / (s - 1), 0), H);
    mapa.style.setProperty("--zoom", s);
    mapa.style.setProperty("--origen", `${f(ox)}px ${f(oy)}px`);
  };
  encuadrar();
  new ResizeObserver(encuadrar).observe(caja);

  // La escena arranca cuando la foto está lista (o, si tarda, igual al rato).
  let listo = false;
  const arrancar = () => {
    if (listo) return;
    listo = true;
    mapa.classList.add("listo");
  };
  if (quieto) arrancar();
  else {
    const foto = new Image();
    foto.src = svg.querySelector("image").getAttribute("href");
    foto.decode().then(arrancar, arrancar);
    setTimeout(arrancar, 2500);
  }

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
