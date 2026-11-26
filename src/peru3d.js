// Portada: el Perú en hilos de luz (three.js). Reemplaza al territorio genérico de portada3d.js,
// que queda guardado sin usar. Guardado sin usar desde el 25/11/2026: la portada pasó al mapa de
// América Latina del Foro de Estado (portada-mapa.js). Para ponerlo otra vez: importar montarPeru3D,
// agregar un <canvas class="g-hero-3d"> a la portada y llamar montarPeru3D($(".g-hero"), $(".g-hero-3d"), { quieto }).
//
// Qué se ve
//   · El mapa del Perú visto en diagonal, con su silueta real (Natural Earth, src/peru.js). El
//     relieve se dibuja con hilos finos que siguen los paralelos: en la costa van planos, en los
//     Andes se levantan y brillan más, y en la Amazonía vuelven a bajar.
//   · El relieve es una aproximación hecha a mano (no un modelo de elevación): la Cordillera
//     Occidental y la Oriental como crestas que siguen su trazado real, el Altiplano alrededor del
//     Titicaca y la meseta de Junín. Las cumbres altas (Huascarán, Coropuna, Ausangate…) caen
//     donde están.
//   · Las 24 capitales de región como puntos de oro, y Lima como el nodo principal, con un pulso.
//     Desde Lima salen arcos finos hacia cada capital, con corrientes de datos que viajan por ellos.
// Cómo se mueve
//   · Al cargar, el relieve se levanta de sur a norte; después se encienden las capitales y se
//     trazan los arcos.
//   · El puntero ilumina un poco el terreno que tiene debajo y la cámara lo acompaña.
// El lienzo, el resplandor, el fundido de los bordes y el cuidado del equipo están en lienzo3d.js.
// Sin WebGL queda el fondo oscuro.
import * as THREE from "three";
import { crearLienzo3D, sumaDeLuz } from "./lienzo3d.js";
import { PERU } from "./peru.js";

/* ───────── Mapa ───────── */
const LON0 = -81.6; // caja del mapa, con un margen alrededor del país
const LON1 = -68.4;
const LAT0 = -18.6;
const LAT1 = 0.2;
const LONC = (LON0 + LON1) / 2;
const LATC = (LAT0 + LAT1) / 2;
const MW = 264; // tamaño del mapa de alturas (≈ 0,05° por punto)
const MH = 376;
const ALTO = 0.2; // unidades de escena por km de altura (exagerado, para que se lea)
const NL = 6.2; // hilos por grado de latitud

const aX = (lon) => lon - LONC; // 1 unidad = 1 grado
const aZ = (lat) => -(lat - LATC); // el norte se aleja de quien mira

// Capitales de región (la de Lima Metropolitana es Lima; la de Lima Provincias, Huacho, se omite por
// estar junto a Lima, igual que el Callao).
const LIMA = [-77.04, -12.05];
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
];

/* ───────── Relieve (aproximado) ───────── */
// Crestas: [lon, lat, altura en km, semiancho en grados], unidas en orden.
const OCCIDENTAL = [
  [-79.9, -4.4, 2.6, 0.4],
  [-79.35, -5.7, 2.3, 0.45], // depresión de Huancabamba: el paso más bajo
  [-78.7, -6.9, 3.7, 0.5],
  [-78.0, -8.3, 4.5, 0.5],
  [-77.6, -9.15, 6.4, 0.32], // Cordillera Blanca (Huascarán)
  [-76.95, -10.25, 5.8, 0.36], // Huayhuash
  [-76.3, -11.5, 5.0, 0.5],
  [-75.5, -12.5, 4.9, 0.55],
  [-74.5, -13.6, 4.8, 0.6],
  [-73.3, -14.7, 5.1, 0.6],
  [-72.6, -15.5, 6.1, 0.42], // Coropuna
  [-71.4, -16.3, 5.7, 0.45], // Misti, Chachani
  [-70.4, -17.3, 5.0, 0.45],
  [-69.9, -17.9, 4.6, 0.4],
];
const ORIENTAL = [
  [-78.2, -5.6, 2.6, 0.45],
  [-77.4, -7.6, 3.6, 0.5],
  [-76.4, -9.8, 4.2, 0.5],
  [-75.3, -11.5, 4.6, 0.5],
  [-73.7, -12.8, 4.8, 0.5],
  [-72.55, -13.35, 5.9, 0.38], // Vilcabamba (Salkantay)
  [-71.25, -13.8, 6.2, 0.38], // Vilcanota (Ausangate)
  [-70.1, -14.3, 5.4, 0.45], // Carabaya
  [-69.3, -14.9, 4.6, 0.4],
];
// Mesetas: [lon, lat, radio lon, radio lat, altura en km].
const MESETAS = [
  [-70.4, -15.7, 1.25, 1.0, 3.9], // Altiplano (Titicaca)
  [-76.0, -11.1, 0.75, 0.6, 4.0], // Junín
];

// Ruido de valor 2D con semilla fija: el relieve sale igual en todos los equipos.
function crearRuido(semilla) {
  const tabla = new Float32Array(1024);
  let s = semilla >>> 0;
  for (let i = 0; i < 1024; i++) tabla[i] = ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  const v = (i, j) => tabla[(Math.imul(i, 374761393) + Math.imul(j, 668265263)) >>> 22];
  const suave = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const a = suave(x - i);
    const b = suave(y - j);
    return (v(i, j) * (1 - a) + v(i + 1, j) * a) * (1 - b) + (v(i, j + 1) * (1 - a) + v(i + 1, j + 1) * a) * b;
  };
}

function cresta(puntos, lon, lat) {
  let h = 0;
  for (let k = 0; k < puntos.length - 1; k++) {
    const [ax, ay, ah, aw] = puntos[k];
    const [bx, by, bh, bw] = puntos[k + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const t = Math.min(1, Math.max(0, ((lon - ax) * dx + (lat - ay) * dy) / (dx * dx + dy * dy)));
    const px = lon - (ax + dx * t);
    const py = lat - (ay + dy * t);
    // Hacia el oeste (la costa) la cordillera cae más empinada que hacia la selva.
    const oeste = px < 0 ? 1.35 : 0.85;
    const dist = Math.hypot(px * oeste, py) / (aw + (bw - aw) * t);
    h = Math.max(h, (ah + (bh - ah) * t) * Math.exp(-dist * dist));
  }
  return h;
}

// Altura en km.
function crearAltura() {
  const n = crearRuido(20261125);
  return (lon, lat) => {
    let h = Math.max(cresta(OCCIDENTAL, lon, lat), cresta(ORIENTAL, lon, lat) * 0.97);
    for (const [x, y, rx, ry, alto] of MESETAS) {
      const e = ((lon - x) / rx) ** 2 + ((lat - y) / ry) ** 2;
      h = Math.max(h, alto * Math.exp(-e * e * 0.9));
    }
    // Crestas y quebradas: ruido plegado, más fuerte donde hay montaña.
    let c = 0;
    let amp = 1;
    let f = 2.2;
    for (let o = 0; o < 4; o++) {
      c += amp * (1 - Math.abs(n(lon * f + o * 13.1, lat * f - o * 7.7)));
      f *= 2.1;
      amp *= 0.45;
    }
    const monte = Math.min(1, h / 3);
    h = h * (0.78 + 0.26 * c * monte) + 0.12 + 0.12 * n(lon * 1.3 + 4.2, lat * 1.3 - 1.7);
    return Math.max(h, 0.02);
  };
}

// Silueta del país en el mismo mapa (1 dentro, 0 fuera, con el borde suavizado).
function crearMascara() {
  const lienzo = document.createElement("canvas");
  lienzo.width = MW;
  lienzo.height = MH;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true });
  ctx.filter = "blur(0.6px)";
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  PERU.forEach(([lon, lat], i) => {
    const x = ((lon - LON0) / (LON1 - LON0)) * MW;
    const y = ((LAT1 - lat) / (LAT1 - LAT0)) * MH; // el norte arriba
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  });
  ctx.closePath();
  ctx.fill();
  const px = ctx.getImageData(0, 0, MW, MH).data;
  const m = new Float32Array(MW * MH);
  for (let r = 0; r < MH; r++) {
    for (let c = 0; c < MW; c++) m[(MH - 1 - r) * MW + c] = px[(r * MW + c) * 4 + 3] / 255; // fila 0 = sur
  }
  return m;
}

function hornearMapa() {
  const altura = crearAltura();
  const mascara = crearMascara();
  const alt = new Float32Array(MW * MH);
  const datos = new Uint16Array(MW * MH * 4);
  const medio = THREE.DataUtils.toHalfFloat;
  for (let j = 0; j < MH; j++) {
    const lat = LAT0 + ((j + 0.5) / MH) * (LAT1 - LAT0);
    for (let i = 0; i < MW; i++) {
      const lon = LON0 + ((i + 0.5) / MW) * (LON1 - LON0);
      const k = j * MW + i;
      const m = mascara[k];
      // Fuera del país el suelo baja a cero: los bordes no quedan colgando.
      const h = m > 0.001 ? altura(lon, lat) * Math.min(1, m * 1.6) : 0;
      alt[k] = h;
      datos[k * 4] = medio(h);
      datos[k * 4 + 1] = medio(m);
      datos[k * 4 + 2] = medio(0);
      datos[k * 4 + 3] = medio(1);
    }
  }
  const leer = (lon, lat) => {
    const fu = THREE.MathUtils.clamp(((lon - LON0) / (LON1 - LON0)) * MW - 0.5, 0, MW - 1.001);
    const fv = THREE.MathUtils.clamp(((lat - LAT0) / (LAT1 - LAT0)) * MH - 0.5, 0, MH - 1.001);
    const i = fu | 0;
    const j = fv | 0;
    const a = fu - i;
    const b = fv - j;
    const k = j * MW + i;
    return (alt[k] * (1 - a) + alt[k + 1] * a) * (1 - b) + (alt[k + MW] * (1 - a) + alt[k + MW + 1] * a) * b;
  };
  return { datos, leer };
}

/* ───────── Shaders ───────── */
const f1 = (n) => n.toFixed(4);
const ORO = "vec3(0.98, 0.72, 0.28)";

const TERRENO_VS = /* glsl */ `
  uniform sampler2D uMapa;
  uniform float uFrente;  // por dónde va la entrada (el relieve se levanta a su paso, de sur a norte)
  uniform vec4 uFoco;     // x, z del puntero sobre el mapa, fuerza y radio
  attribute vec2 aUv;
  varying vec3 vPos;
  varying vec3 vN;
  varying float vLin;
  varying vec4 vDato;
  void main() {
    vec2 tx = vec2(1.0 / ${f1(MW)}, 1.0 / ${f1(MH)});
    vec4 m = texture2D(uMapa, aUv);
    float hl = texture2D(uMapa, aUv - vec2(tx.x, 0.0)).r;
    float hr = texture2D(uMapa, aUv + vec2(tx.x, 0.0)).r;
    float hs = texture2D(uMapa, aUv - vec2(0.0, tx.y)).r;
    float hn = texture2D(uMapa, aUv + vec2(0.0, tx.y)).r;
    float lon = ${f1(LON0)} + aUv.x * ${f1(LON1 - LON0)};
    float lat = ${f1(LAT0)} + aUv.y * ${f1(LAT1 - LAT0)};
    float e = clamp((uFrente - aUv.y * 18.0 - aUv.x * 3.0) / 5.0, 0.0, 1.0);
    float sube = 1.0 - (1.0 - e) * (1.0 - e) * (1.0 - e);
    float k = ${f1(ALTO)} * sube;
    vec3 p = vec3(lon - ${f1(LONC)}, m.r * k, -(lat - ${f1(LATC)}));
    float dF = distance(p.xz, uFoco.xy);
    p.y += uFoco.z * 0.12 * uFoco.w * exp(-dF * dF / (uFoco.w * uFoco.w)) * m.g;
    vPos = p;
    // Pendientes en unidades de escena (el sur queda hacia +z).
    float dx = ${f1((LON1 - LON0) / MW)} * 2.0;
    float dz = ${f1((LAT1 - LAT0) / MH)} * 2.0;
    vN = vec3(-(hr - hl) * k / dx, 1.0, -(hs - hn) * k / dz);
    vLin = (lat - ${f1(LAT0)}) * ${f1(NL)};
    vDato = vec4(e, m.r, m.g, aUv.x);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const TERRENO_FS = /* glsl */ `
  uniform float uTime;
  uniform float uEntrada;
  uniform vec4 uFoco;
  uniform float uPx;
  varying vec3 vPos;
  varying vec3 vN;
  varying float vLin;
  varying vec4 vDato;

  const vec3 LUZ = normalize(vec3(-0.75, 0.55, 0.25)); // luz baja desde el oeste, el lado del texto
  const vec3 HONDO = vec3(0.05, 0.11, 0.36);
  const vec3 MEDIO = vec3(0.21, 0.44, 0.94);
  const vec3 HIELO = vec3(0.74, 0.89, 1.0);

  float azar(float n) { return fract(sin(n * 127.1 + 1.7) * 43758.5453); }

  void main() {
    float dentro = smoothstep(0.08, 0.6, vDato.z);
    if (dentro <= 0.0) discard;
    float e = vDato.x;
    float alto = vDato.y;
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vPos);

    /* Luz sobre el relieve */
    float clave = max(dot(N, LUZ), 0.0);
    float canto = 1.0 - clamp(dot(N, V), 0.0, 1.0);
    canto *= canto;
    float cumbre = smoothstep(2.6, 5.6, alto);
    float luz = 0.22 + 0.5 * pow(clave, 1.5) + 0.35 * canto * (0.3 + cumbre) + 0.55 * cumbre * clave;

    /* Hilos (los paralelos) */
    float f = vLin;
    float df = length(vec2(dFdx(vLin), dFdy(vLin)));
    float px = abs(fract(f) - 0.5) / max(df, 1e-6);
    float medio = 0.55 * uPx;
    float hilo = 1.0 - smoothstep(medio - 0.6, medio + 0.6, px);
    float halo = 0.2 * exp(-px * px / (9.0 * uPx * uPx));
    float parejo = min(2.0 * medio * df + 0.2 * clamp(5.3 * uPx * df, 0.0, 1.0), 0.62);
    float I = mix(hilo + halo, parejo, smoothstep(0.2, 0.45, df));
    float idHilo = floor(f);
    float fibra = 0.6 + 0.5 * azar(idHilo);

    /* Puntero */
    float dF = distance(vPos.xz, uFoco.xy);
    float foco = uFoco.z > 0.003 ? uFoco.z * exp(-dF * dF / (uFoco.w * uFoco.w)) : 0.0;

    /* Corriente: algunos paralelos llevan datos de lado a lado del país */
    float corriente = 0.0;
    float lleva = azar(idHilo + 3.7);
    if (lleva > 0.7) {
      float lado = vDato.w * 2.0 - 1.0;
      float dir = lleva > 0.85 ? 1.0 : -1.0;
      float cabeza = (fract(azar(idHilo + 1.3) + uTime * (0.05 + 0.07 * azar(idHilo + 9.1))) * 3.4 - 1.7) * dir;
      float tras = (cabeza - lado) * dir;
      float cola = tras > 0.0 ? exp(-tras / (0.06 + 0.08 * azar(idHilo + 4.4))) : exp(tras / 0.004);
      float paquetes = tras > 0.01 ? 0.35 + 0.65 * step(0.4, fract(tras * 70.0)) : 1.0;
      corriente = cola * paquetes;
    }

    float L = luz * fibra + 0.6 * foco + 1.4 * corriente;
    vec3 col = mix(HONDO, MEDIO, smoothstep(0.05, 0.75, L));
    col = mix(col, HIELO, smoothstep(0.85, 1.9, L));
    vec3 hilos = col * I * (0.3 + 0.7 * min(L, 1.0)) * 1.15 * (1.0 + 0.8 * corriente);
    // El suelo entre los hilos: apenas un velo, para que la silueta del país se lea entera.
    vec3 cuerpo = vec3(0.006, 0.022, 0.085) * (0.6 + 1.2 * luz + foco);

    float visible = uEntrada * (0.25 + 0.75 * smoothstep(0.0, 0.3, e)) * dentro;
    vec3 c = (cuerpo + hilos) * visible;
    vec3 emite = hilos * smoothstep(0.5, 1.3, L) * visible;
    float resplandece = clamp(dot(emite, vec3(0.333)) / max(dot(c, vec3(0.333)), 1e-4), 0.0, 1.0);
    gl_FragColor = vec4(c, resplandece);
  }
`;

// Contorno del país: una línea tenue que cierra la silueta.
const BORDE_VS = /* glsl */ `
  attribute float aLat;
  uniform float uFrente;
  varying float vE;
  void main() {
    float v = (aLat - ${f1(LAT0)}) / ${f1(LAT1 - LAT0)};
    vE = clamp((uFrente - v * 18.0) / 5.0, 0.0, 1.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(position.x, position.y * vE, position.z, 1.0);
  }
`;
const BORDE_FS = /* glsl */ `
  uniform float uEntrada;
  varying float vE;
  void main() {
    gl_FragColor = vec4(vec3(0.55, 0.74, 1.0), 0.32 * vE * uEntrada);
  }
`;

// Capitales: puntos de oro. Lima, más grande y con un pulso que se abre.
const CIUDADES_VS = /* glsl */ `
  uniform float uPx;
  uniform float uCiudades; // 0…1: se encienden de a una
  attribute vec2 aCiudad;  // tamaño, orden de encendido (0…1)
  varying float vA;
  varying float vLima;
  void main() {
    vec4 mv = viewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    vLima = step(1.5, aCiudad.x);
    vA = smoothstep(aCiudad.y, aCiudad.y + 0.12, uCiudades);
    gl_PointSize = aCiudad.x * 470.0 / -mv.z * uPx * (vLima > 0.5 ? 2.6 : 1.0);
  }
`;
const CIUDADES_FS = /* glsl */ `
  uniform float uTime;
  varying float vA;
  varying float vLima;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    if (d > 1.0) discard;
    float k = vLima > 0.5 ? 0.38 : 1.0; // en Lima el punto ocupa menos: el resto es para el pulso
    float nucleo = 1.0 - smoothstep(0.16 * k, 0.32 * k, d);
    float halo = exp(-d * d / (0.16 * k * k)) * 0.55;
    float pulso = 0.0;
    if (vLima > 0.5) {
      float r = fract(uTime * 0.45);
      pulso = exp(-pow((d - r) / 0.045, 2.0)) * (1.0 - r) * 0.9;
    }
    vec3 col = mix(${ORO}, vec3(1.0, 0.84, 0.5), nucleo * 0.7);
    gl_FragColor = vec4(col, (nucleo + halo + pulso) * vA);
  }
`;

// Arcos desde Lima: un hilo de oro muy tenue y una corriente que viaja hasta cada capital.
const ARCOS_VS = /* glsl */ `
  attribute vec2 aArco; // posición a lo largo (0 Lima … 1 capital), fase
  varying vec2 vArco;
  void main() {
    vArco = aArco;
    gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
  }
`;
const ARCOS_FS = /* glsl */ `
  uniform float uTime;
  uniform float uArcos; // 0…1: cuánto se ha trazado
  varying vec2 vArco;
  void main() {
    float t = vArco.x;
    if (t > uArcos) discard;
    float cabeza = fract(vArco.y + uTime * 0.16) * 1.6 - 0.3;
    float tras = cabeza - t; // > 0: detrás de la cabeza
    float corriente = tras > 0.0 ? exp(-tras / 0.12) : exp(tras / 0.015);
    float punta = smoothstep(uArcos - 0.08, uArcos, t) * step(uArcos, 0.999); // la punta mientras se traza
    float a = 0.1 + 0.9 * corriente + 0.8 * punta;
    gl_FragColor = vec4(mix(${ORO}, vec3(1.0, 0.84, 0.5), corriente), a * 0.85);
  }
`;

// Fundido: se apaga hacia el texto (a la izquierda; en vertical, una franja tenue detrás del
// texto) y hacia el borde de abajo, donde empieza la sección siguiente.
const FUNDIDO = /* glsl */ `
  uniform vec3 uTexto;     // borde derecho, borde inferior y borde superior del texto, de 0 a 1
  uniform float uVertical; // 1 en pantallas verticales
  float fundido(vec2 uv) {
    float y = 1.0 - uv.y;
    float franja = smoothstep(uTexto.z - 0.07, uTexto.z + 0.03, y) * (1.0 - smoothstep(uTexto.y - 0.03, uTexto.y + 0.07, y));
    float f = uVertical > 0.5 ? mix(1.0, 0.22, franja) * (0.45 + 0.55 * smoothstep(0.03, 0.17, y)) : smoothstep(uTexto.x - 0.14, uTexto.x + 0.1, uv.x);
    return f * smoothstep(0.0, 0.12, uv.y);
  }
`;

/* ───────── Montaje ───────── */

export function montarPeru3D(seccion, canvas, { quieto = false } = {}) {
  const { datos, leer } = hornearMapa();
  const y = (lon, lat) => leer(lon, lat) * ALTO;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.5, 300);

  const tex = new THREE.DataTexture(datos, MW, MH, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter;
  tex.needsUpdate = true;

  const u = {
    uMapa: { value: tex },
    uTime: { value: 0 },
    uFrente: { value: quieto ? 1e4 : -6 },
    uEntrada: { value: quieto ? 1 : 0 },
    uCiudades: { value: quieto ? 2 : 0 },
    uArcos: { value: quieto ? 1 : 0 },
    uFoco: { value: new THREE.Vector4(0, 0, 0, 1) },
  };
  const uFundido = { uTexto: { value: new THREE.Vector3(0.44, 0.75, 0.25) }, uVertical: { value: 0 } };

  /* Terreno: una rejilla sobre la caja del mapa (lo de fuera del país no se pinta). */
  const COLS = 300;
  const FILAS = 420;
  const uv = new Float32Array(COLS * FILAS * 2);
  for (let j = 0; j < FILAS; j++) for (let i = 0; i < COLS; i++) uv.set([i / (COLS - 1), j / (FILAS - 1)], (j * COLS + i) * 2);
  const indices = new Uint32Array((COLS - 1) * (FILAS - 1) * 6);
  let n = 0;
  for (let j = 0; j < FILAS - 1; j++) {
    for (let i = 0; i < COLS - 1; i++) {
      const a = j * COLS + i;
      indices.set([a, a + 1, a + COLS, a + 1, a + COLS + 1, a + COLS], n);
      n += 6;
    }
  }
  const geoTerreno = new THREE.BufferGeometry();
  geoTerreno.setAttribute("aUv", new THREE.BufferAttribute(uv, 2));
  geoTerreno.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COLS * FILAS * 3), 3));
  geoTerreno.setIndex(new THREE.BufferAttribute(indices, 1));
  const terreno = new THREE.Mesh(geoTerreno, new THREE.ShaderMaterial({ uniforms: u, vertexShader: TERRENO_VS, fragmentShader: TERRENO_FS, side: THREE.DoubleSide }));

  /* Contorno */
  const borde = new THREE.BufferGeometry();
  const pb = new Float32Array(PERU.length * 3);
  const lb = new Float32Array(PERU.length);
  PERU.forEach(([lon, lat], i) => {
    pb.set([aX(lon), y(lon, lat) + 0.02, aZ(lat)], i * 3);
    lb[i] = lat;
  });
  borde.setAttribute("position", new THREE.BufferAttribute(pb, 3));
  borde.setAttribute("aLat", new THREE.BufferAttribute(lb, 1));
  const contorno = new THREE.LineLoop(borde, new THREE.ShaderMaterial({ uniforms: u, vertexShader: BORDE_VS, fragmentShader: BORDE_FS, ...sumaDeLuz(false) }));

  /* Capitales y Lima */
  const todas = [LIMA, ...CAPITALES];
  const dLima = (c) => Math.hypot(c[0] - LIMA[0], c[1] - LIMA[1]);
  const lejos = Math.max(...CAPITALES.map(dLima));
  const geoCiudades = new THREE.BufferGeometry();
  const pc = new Float32Array(todas.length * 3);
  const ac = new Float32Array(todas.length * 2);
  todas.forEach((c, i) => {
    pc.set([aX(c[0]), y(c[0], c[1]) + 0.05, aZ(c[1])], i * 3);
    ac.set([i === 0 ? 2 : 1, i === 0 ? 0 : 0.1 + 0.75 * (dLima(c) / lejos)], i * 2); // se encienden de Lima hacia afuera
  });
  geoCiudades.setAttribute("position", new THREE.BufferAttribute(pc, 3));
  geoCiudades.setAttribute("aCiudad", new THREE.BufferAttribute(ac, 2));
  const ciudades = new THREE.Points(geoCiudades, new THREE.ShaderMaterial({ uniforms: u, vertexShader: CIUDADES_VS, fragmentShader: CIUDADES_FS, ...sumaDeLuz(true) }));

  /* Arcos desde Lima */
  const PASOS = 48;
  const pa = [];
  const aa = [];
  const l0 = new THREE.Vector3(aX(LIMA[0]), y(...LIMA) + 0.05, aZ(LIMA[1]));
  CAPITALES.forEach((c, k) => {
    const fase = (k * 0.618) % 1;
    const dist = dLima(c);
    const punto = (t) => {
      const lon = LIMA[0] + (c[0] - LIMA[0]) * t;
      const lat = LIMA[1] + (c[1] - LIMA[1]) * t;
      const suelo = Math.max(y(lon, lat), l0.y + (y(...c) - l0.y) * t);
      return [aX(lon), suelo + 0.05 + (0.25 + 0.16 * dist) * 4 * t * (1 - t), aZ(lat)];
    };
    for (let s = 0; s < PASOS; s++) {
      const t0 = s / PASOS;
      const t1 = (s + 1) / PASOS;
      pa.push(...punto(t0), ...punto(t1));
      aa.push(t0, fase, t1, fase);
    }
  });
  const geoArcos = new THREE.BufferGeometry();
  geoArcos.setAttribute("position", new THREE.Float32BufferAttribute(pa, 3));
  geoArcos.setAttribute("aArco", new THREE.Float32BufferAttribute(aa, 2));
  const arcos = new THREE.LineSegments(geoArcos, new THREE.ShaderMaterial({ uniforms: u, vertexShader: ARCOS_VS, fragmentShader: ARCOS_FS, ...sumaDeLuz(true) }));

  [terreno, contorno, arcos, ciudades].forEach((o, i) => {
    o.frustumCulled = false;
    o.renderOrder = i;
    scene.add(o);
  });

  /* Composición según la forma de la pantalla */
  // Ancha: la cámara mira desde el suroeste y el país queda a la derecha del texto.
  // Angosta (teléfono, tableta en vertical): el país va al centro, arriba, detrás del texto.
  const ANCHA = { cam: new THREE.Vector3(-3, 26, 23), mira: new THREE.Vector3(0.6, 0, 0.2), corre: 0.21 };
  const ANGOSTA = { cam: new THREE.Vector3(-0.8, 40, 21), mira: new THREE.Vector3(0.2, 0, 0.6), corre: 0 };
  let comp = ANCHA;

  function alMedir(w, h) {
    comp = camera.aspect < 0.9 ? ANGOSTA : ANCHA;
    // El centro de la vista se corre a la derecha: el país queda junto al texto, no detrás.
    if (comp.corre) camera.setViewOffset(w, h, -w * comp.corre, 0, w, h);
    else camera.clearViewOffset();
    // Qué sitio ocupa el texto (las letras en sí, no sus cajas): de ahí sale el fundido.
    const caja = seccion.getBoundingClientRect();
    const rango = document.createRange();
    let derecha = 0;
    let abajo = 0;
    let arriba = h;
    const sumar = (r) => {
      if (!r.width) return;
      derecha = Math.max(derecha, r.right - caja.left);
      abajo = Math.max(abajo, r.bottom - caja.top);
      arriba = Math.min(arriba, r.top - caja.top);
    };
    const letras = document.createTreeWalker(seccion.querySelector(".g-hero-in") ?? seccion, NodeFilter.SHOW_TEXT);
    while (letras.nextNode()) {
      if (!letras.currentNode.nodeValue.trim()) continue;
      rango.selectNodeContents(letras.currentNode);
      sumar(rango.getBoundingClientRect());
    }
    seccion.querySelectorAll(".g-acciones > *").forEach((el) => sumar(el.getBoundingClientRect()));
    if (derecha) uFundido.uTexto.value.set(Math.min(derecha / w, 0.6), abajo / h, arriba / h);
    uFundido.uVertical.value = w <= 900 ? 1 : 0;
  }

  /* Puntero: dónde toca el mapa (se corta el rayo con el suelo a media altura). */
  const puntero = { x: 0, y: 0, dentro: false, sx: 0, sy: 0 };
  const foco = { x: 0, z: 0, f: 0, r: 1, tx: 0, tz: 0 };
  const rayo = new THREE.Vector3();
  function tocar(nx, ny) {
    rayo.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
    if (rayo.y > -0.01) return null;
    const t = (0.6 - camera.position.y) / rayo.y;
    const x = camera.position.x + rayo.x * t;
    const z = camera.position.z + rayo.z * t;
    const lon = x + LONC;
    const lat = LATC - z;
    return lon > LON0 && lon < LON1 && lat > LAT0 && lat < LAT1 ? { x, z } : null;
  }
  if (!quieto) {
    seccion.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = seccion.getBoundingClientRect();
      puntero.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      puntero.y = 1 - ((e.clientY - r.top) / r.height) * 2;
      puntero.dentro = true;
    });
    seccion.addEventListener("pointerleave", () => (puntero.dentro = false));
  }

  /* Animación */
  const T0 = 20;
  const ENTRADA = 2.6; // segundos que tarda el relieve en levantarse
  const suave = (x) => x * x * (3 - 2 * x);
  function alAnimar(t, dt) {
    u.uTime.value = T0 + (quieto ? 0 : t);
    const k = Math.min(t / ENTRADA, 1);
    u.uFrente.value = k < 1 ? -5 + 30 * Math.pow(k, 1.6) : 1e4;
    u.uEntrada.value = suave(Math.min(t / 0.7, 1));
    u.uCiudades.value = quieto ? 2 : Math.max(0, (t - 1.6) / 1.6);
    u.uArcos.value = quieto ? 1 : suave(THREE.MathUtils.clamp((t - 2.4) / 1.8, 0, 1));

    // Cámara: entra acercándose un poco, respira y sigue al puntero.
    const sigue = 1 - Math.exp(-dt * 3.5);
    const tc = quieto ? 0 : t;
    puntero.sx += ((puntero.dentro ? puntero.x : 0) - puntero.sx) * sigue;
    puntero.sy += ((puntero.dentro ? puntero.y : 0) - puntero.sy) * sigue;
    const llega = 1 - Math.pow(1 - Math.min(t / 3.4, 1), 3);
    const c = comp.cam;
    camera.position.set(
      c.x + puntero.sx * 0.8 + Math.sin(tc * 0.1) * 0.35,
      c.y + (1 - llega) * 2.2 + puntero.sy * 0.4 + Math.sin(tc * 0.07 + 1) * 0.15,
      c.z + (1 - llega) * 1.6,
    );
    camera.lookAt(comp.mira.x + puntero.sx * 0.3, comp.mira.y, comp.mira.z);
    camera.updateMatrixWorld();

    const toca = puntero.dentro && t > ENTRADA ? tocar(puntero.x, puntero.y) : null;
    if (toca) {
      foco.tx = toca.x;
      foco.tz = toca.z;
      if (foco.f < 0.03) {
        foco.x = toca.x;
        foco.z = toca.z;
      }
    }
    const va = 1 - Math.exp(-dt * 7);
    foco.x += (foco.tx - foco.x) * va;
    foco.z += (foco.tz - foco.z) * va;
    foco.f += ((toca ? 1 : 0) - foco.f) * (1 - Math.exp(-dt * (toca ? 5 : 2.5)));
    u.uFoco.value.set(foco.x, foco.z, foco.f, foco.r);
  }

  return crearLienzo3D({
    canvas,
    marco: seccion,
    scene,
    camera,
    u,
    quieto,
    brillo: 0.85,
    maxPixeles: 2.2e6,
    fundido: FUNDIDO,
    uFundido,
    alMedir,
    alAnimar,
  });
}
