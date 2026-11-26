// Globo: el mundo conectado, en 3D (three.js). Es la portada desde el 26/11/2026, con una composición
// partida: el texto a la izquierda y el planeta grande ocupando todo el lado derecho, con su parte baja
// detrás de la fila de los tres ejes de servicio (index.html, home.css). En pantallas verticales el
// globo va debajo del texto.
//
// Qué se ve (sobrio, a propósito)
//   · Un globo de noche: océano casi negro, continentes en azul acero y costas finas de luz celeste
//     que se apagan hacia el borde. Las fronteras, apenas. Los contornos son de Natural Earth (dominio
//     público), simplificados en mundo-datos.js (scripts/build-mundo.mjs).
//   · Luces de ciudad, cálidas y quietas.
//   · Arcos de datos entre ciudades: primero desde Lima (el nodo de oro) hacia la región y el mundo;
//     después, una red que une América con Europa, África y Asia. Cada arco, una vez trazado, lo
//     recorre cada tanto una corriente lenta: la misma idea que los hilos que llegan al chip (templo3d.js).
//   · Una atmósfera fina alrededor del globo, más clara del lado de la luz.
// Se arma y se desarma
//   · El globo está hecho de teselas. Al cargar llegan una a una, de sur a norte, girando desde
//     afuera; después se encienden las luces, se trazan los arcos de Lima y luego la red.
//   · Con el scroll todo eso va hacia atrás: al bajar se apagan los arcos y las luces y las
//     teselas se sueltan (de norte a sur); al volver a subir, el globo se arma de nuevo. Es un solo
//     reloj de armado (uArmado) que al cargar avanza con el tiempo y el scroll hace retroceder.
// Cómo se mueve
//   · Sin tocarlo: gira solo, lento, de oeste a este (es el mundo entero, no solo América), flota
//     unos píxeles arriba y abajo y su eje respira apenas.
//   · Se arrastra con el mouse o el dedo (en táctiles, solo de lado, para no robarle el scroll a la
//     página) y al soltarlo sigue con inercia. La inclinación vuelve sola a su sitio.
//   · Un clic (o un toque) sobre el planeta lanza una onda dorada desde ese punto: enciende costas,
//     fronteras y luces a su paso; el globo late apenas y gira un poco hacia donde se tocó.
//   · La cámara se corre apenas hacia el puntero.
// El lienzo, el resplandor, el fundido de los bordes y el cuidado del equipo (pausa cuando no se
// ve, resolución según lo que aguante) están en lienzo3d.js, en modo "cubre": el cuerpo del globo
// tapa las estrellas del fondo. Sin WebGL queda el fondo de la portada.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { crearLienzo3D, sumaDeLuz } from "./lienzo3d.js";
import { Q, COSTAS, FRONTERAS } from "./mundo-datos.js";

/* ───────── Medidas y tiempos ───────── */
const FOV = 30;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const D2R = Math.PI / 180;
const LLEGA = 3.6; // segundos de la llegada de la cámara
const VELOCIDAD = 0.34; // de la corriente, en radios del globo por segundo
// Reloj de armado (en segundos al cargar): cuándo llega cada cosa.
const TESELAS_LLEGAN = 1.3; // lapso en que van saliendo las teselas
const VUELO = 0.9; // lo que tarda cada tesela en llegar
const LUCES_DESDE = 2.25; // las luces, cuando ya están todas las teselas
const LIMA_DESDE = 2.4; // los arcos de Lima
const RED_DESDE = 3.4; // la red entre continentes
const TRAZO = 1.3; // lo que tarda en trazarse cada arco
const RECORRIDO = 0.62; // parte del alto de la portada que hay que bajar para desarmarlo todo
const CELDA = 5; // grados por lado de cada tesela
// Giro e interacción
const GIRO_AUTO = 0.05; // rad/s: una vuelta cada ~2 min
// Vida propia, sin tocarlo: flota apenas (sube y baja) y su eje respira un poco.
const FLOTA = 0.006; // parte del alto de la portada
const FLOTA_PERIODO = 9; // s
const RESPIRA = 0.035; // rad de inclinación
const RESPIRA_PERIODO = 14; // s
const FRENO = 2.4; // cuánto frena la inercia al soltarlo (1/s)
const INCLINA_MAX = 0.55; // rad que se puede inclinar arrastrando
const ONDAS = 3; // ondas a la vez
const ONDA_VEL = 0.62; // rad/s sobre la superficie
const ONDA_DURA = 3.2; // s
const ORO_GLSL = "vec3(1.0, 0.7, 0.28)";
// Lo que queda de frente al cargar: el globo asoma abajo como un horizonte y se mira hacia el sur,
// para que América (y Lima, el nodo de oro) quede en la parte que se ve. Después gira.
const VISTA = { lat: -12, lon: -66 };
const VISTA_VERTICAL = { lat: -30, lon: -72 };
const LUZ = new THREE.Vector3(-0.55, 0.5, 0.65).normalize(); // arriba a la izquierda: el lado del texto
const LUZ_GLSL = `const vec3 LUZ = vec3(${LUZ.toArray().map((n) => n.toFixed(4)).join(", ")});`;
const f2 = (n) => n.toFixed(2);

// [nombre, latitud, longitud, peso 0…1]: el peso da el tamaño de la ciudad y cuántas luces la rodean.
const CIUDADES = [
  ["Lima", -12.05, -77.04, 1],
  // América
  ["Bogotá", 4.71, -74.07, 0.9],
  ["Ciudad de México", 19.43, -99.13, 1],
  ["Miami", 25.76, -80.19, 0.7],
  ["Washington", 38.91, -77.04, 0.8],
  ["Nueva York", 40.71, -74.01, 1],
  ["Buenos Aires", -34.6, -58.38, 0.9],
  ["São Paulo", -23.55, -46.63, 1],
  ["Santiago", -33.45, -70.67, 0.8],
  ["Panamá", 8.98, -79.52, 0.5],
  ["Quito", -0.18, -78.47, 0.5],
  ["Caracas", 10.48, -66.9, 0.6],
  ["La Paz", -16.5, -68.15, 0.4],
  ["Asunción", -25.26, -57.58, 0.4],
  ["Montevideo", -34.9, -56.16, 0.5],
  ["Río de Janeiro", -22.91, -43.17, 0.8],
  ["Brasilia", -15.79, -47.88, 0.5],
  ["Salvador", -12.97, -38.5, 0.4],
  ["Recife", -8.05, -34.88, 0.4],
  ["Fortaleza", -3.73, -38.52, 0.4],
  ["Manaos", -3.12, -60.02, 0.3],
  ["Belém", -1.46, -48.5, 0.3],
  ["Guayaquil", -2.19, -79.89, 0.4],
  ["Medellín", 6.24, -75.58, 0.5],
  ["Cali", 3.45, -76.53, 0.4],
  ["Arequipa", -16.41, -71.54, 0.35],
  ["Trujillo", -8.11, -79.03, 0.3],
  ["Cusco", -13.53, -71.97, 0.25],
  ["Córdoba", -31.42, -64.18, 0.4],
  ["Guatemala", 14.63, -90.51, 0.4],
  ["San José", 9.93, -84.08, 0.3],
  ["La Habana", 23.11, -82.37, 0.4],
  ["Santo Domingo", 18.49, -69.93, 0.4],
  ["San Juan", 18.47, -66.11, 0.3],
  ["Monterrey", 25.69, -100.32, 0.5],
  ["Guadalajara", 20.66, -103.35, 0.5],
  ["Los Ángeles", 34.05, -118.24, 1],
  ["San Francisco", 37.77, -122.42, 0.8],
  ["Seattle", 47.61, -122.33, 0.6],
  ["Vancouver", 49.28, -123.12, 0.5],
  ["Chicago", 41.88, -87.63, 0.9],
  ["Houston", 29.76, -95.37, 0.7],
  ["Dallas", 32.78, -96.8, 0.6],
  ["Atlanta", 33.75, -84.39, 0.6],
  ["Toronto", 43.65, -79.38, 0.8],
  ["Montreal", 45.5, -73.57, 0.6],
  ["Denver", 39.74, -104.99, 0.5],
  ["Phoenix", 33.45, -112.07, 0.5],
  ["Boston", 42.36, -71.06, 0.6],
  // Europa
  ["Madrid", 40.42, -3.7, 0.9],
  ["Barcelona", 41.39, 2.17, 0.7],
  ["Lisboa", 38.72, -9.14, 0.6],
  ["París", 48.86, 2.35, 1],
  ["Londres", 51.51, -0.13, 1],
  ["Ámsterdam", 52.37, 4.9, 0.6],
  ["Bruselas", 50.85, 4.35, 0.5],
  ["Berlín", 52.52, 13.4, 0.8],
  ["Roma", 41.9, 12.5, 0.7],
  ["Milán", 45.46, 9.19, 0.6],
  ["Viena", 48.21, 16.37, 0.5],
  ["Varsovia", 52.23, 21.01, 0.5],
  ["Estocolmo", 59.33, 18.07, 0.5],
  ["Moscú", 55.76, 37.62, 0.9],
  ["Estambul", 41.01, 28.98, 0.9],
  ["Atenas", 37.98, 23.73, 0.5],
  ["Kiev", 50.45, 30.52, 0.5],
  ["Múnich", 48.14, 11.58, 0.5],
  ["Dublín", 53.35, -6.26, 0.4],
  // África y Medio Oriente
  ["El Cairo", 30.04, 31.24, 0.9],
  ["Lagos", 6.52, 3.38, 0.8],
  ["Johannesburgo", -26.2, 28.05, 0.7],
  ["Ciudad del Cabo", -33.92, 18.42, 0.5],
  ["Nairobi", -1.29, 36.82, 0.6],
  ["Casablanca", 33.57, -7.59, 0.5],
  ["Argel", 36.75, 3.06, 0.4],
  ["Accra", 5.6, -0.19, 0.4],
  ["Dakar", 14.72, -17.47, 0.4],
  ["Adís Abeba", 9.03, 38.74, 0.5],
  ["Kinsasa", -4.44, 15.27, 0.6],
  ["Luanda", -8.84, 13.23, 0.4],
  ["Dubái", 25.2, 55.27, 0.8],
  ["Riad", 24.71, 46.68, 0.6],
  ["Teherán", 35.69, 51.39, 0.7],
  ["Tel Aviv", 32.09, 34.78, 0.4],
  // Asia y Oceanía
  ["Bombay", 19.08, 72.88, 0.9],
  ["Delhi", 28.61, 77.21, 1],
  ["Bangalore", 12.97, 77.59, 0.6],
  ["Calcuta", 22.57, 88.36, 0.7],
  ["Karachi", 24.86, 67.01, 0.7],
  ["Daca", 23.81, 90.41, 0.6],
  ["Bangkok", 13.76, 100.5, 0.7],
  ["Singapur", 1.35, 103.82, 0.8],
  ["Yakarta", -6.21, 106.85, 0.8],
  ["Manila", 14.6, 120.98, 0.7],
  ["Hong Kong", 22.32, 114.17, 0.8],
  ["Shanghái", 31.23, 121.47, 1],
  ["Pekín", 39.9, 116.41, 1],
  ["Seúl", 37.57, 126.98, 0.9],
  ["Tokio", 35.68, 139.69, 1],
  ["Osaka", 34.69, 135.5, 0.6],
  ["Taipéi", 25.03, 121.57, 0.6],
  ["Kuala Lumpur", 3.14, 101.69, 0.5],
  ["Ho Chi Minh", 10.82, 106.63, 0.6],
  ["Chengdú", 30.57, 104.07, 0.6],
  ["Cantón", 23.13, 113.26, 0.8],
  ["Sídney", -33.87, 151.21, 0.8],
  ["Melbourne", -37.81, 144.96, 0.7],
  ["Perth", -31.95, 115.86, 0.4],
  ["Auckland", -36.85, 174.76, 0.5],
];
// Desde Lima hacia la región y el mundo (en este orden se trazan), y la red: América con Europa,
// África y Asia, y entre sus grandes ciudades. Todo cae en la cara del globo que se ve.
const DESDE_LIMA = ["Bogotá", "Ciudad de México", "Miami", "Washington", "Madrid", "Buenos Aires", "São Paulo", "Santiago", "Panamá", "Nueva York"];
const RED = [
  ["Nueva York", "Londres"],
  ["Miami", "Madrid"],
  ["São Paulo", "Lisboa"],
  ["Ciudad de México", "Los Ángeles"],
  ["Lagos", "São Paulo"],
  ["Los Ángeles", "Tokio"],
  ["Bogotá", "Miami"],
  ["Buenos Aires", "Madrid"],
  ["Nueva York", "Ciudad de México"],
  ["San Francisco", "Shanghái"],
  ["São Paulo", "Miami"],
  ["Toronto", "Houston"],
  ["Buenos Aires", "Santiago"],
];

/* ───────── Datos del mundo ───────── */

// Latitud y longitud → punto de la esfera. La longitud 0 mira hacia +z (hacia la cámara).
function enEsfera(lat, lon, r = 1, v = new THREE.Vector3()) {
  const la = lat * D2R;
  const lo = lon * D2R;
  return v.set(r * Math.cos(la) * Math.sin(lo), r * Math.sin(la), r * Math.cos(la) * Math.cos(lo));
}

// Teselas: el globo se divide en celdas de CELDA grados. Cada una guarda su centro sobre la esfera y
// un azar propio; el cuerpo y las líneas que caen en ella se mueven juntos.
const FILAS_T = 180 / CELDA;
const COLS_T = 360 / CELDA;
const TESELAS = (() => {
  const t = new Float32Array(FILAS_T * COLS_T * 4);
  const v = new THREE.Vector3();
  for (let i = 0; i < FILAS_T; i++) {
    for (let j = 0; j < COLS_T; j++) {
      enEsfera((i + 0.5) * CELDA - 90, (j + 0.5) * CELDA - 180, 1, v);
      const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453;
      t.set([v.x, v.y, v.z, s - Math.floor(s)], (i * COLS_T + j) * 4);
    }
  }
  return t;
})();
const teselaDe = (lat, lon) => {
  const i = Math.min(FILAS_T - 1, Math.max(0, Math.floor((lat + 90) / CELDA)));
  const j = (((Math.floor((lon + 180) / CELDA) % COLS_T) + COLS_T) % COLS_T);
  return (i * COLS_T + j) * 4;
};

// Cuerpo del globo en teselas (cada una partida en 2 × 2 para seguir la curva).
function cuerpoEnTeselas() {
  const N = 2;
  const pos = [];
  const tes = [];
  const celda = [];
  const idx = [];
  const v = new THREE.Vector3();
  for (let i = 0; i < FILAS_T; i++) {
    for (let j = 0; j < COLS_T; j++) {
      const base = pos.length / 3;
      const k = (i * COLS_T + j) * 4;
      for (let a = 0; a <= N; a++) {
        for (let b = 0; b <= N; b++) {
          enEsfera(-90 + (i + a / N) * CELDA, -180 + (j + b / N) * CELDA, 1, v);
          pos.push(v.x, v.y, v.z);
          tes.push(TESELAS[k], TESELAS[k + 1], TESELAS[k + 2], TESELAS[k + 3]);
          celda.push(b / N, a / N);
        }
      }
      for (let a = 0; a < N; a++) {
        for (let b = 0; b < N; b++) {
          const q = base + a * (N + 1) + b;
          idx.push(q, q + 1, q + N + 1, q + 1, q + N + 2, q + N + 1);
        }
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aTesela", new THREE.Float32BufferAttribute(tes, 4));
  g.setAttribute("aCelda", new THREE.Float32BufferAttribute(celda, 2));
  g.setIndex(idx);
  return g;
}

// mundo-datos.js → líneas [lon, lat, lon, lat, …] en grados.
function decodificar(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const datos = new Int16Array(bytes.buffer);
  const lineas = [];
  for (let i = 0; i < datos.length; ) {
    const n = datos[i++];
    const l = new Float32Array(n * 2);
    let x = 0;
    let y = 0;
    for (let k = 0; k < n; k++) {
      x += datos[i++];
      y += datos[i++];
      l[k * 2] = x / Q;
      l[k * 2 + 1] = y / Q;
    }
    lineas.push(l);
  }
  return lineas;
}

// Líneas sobre la esfera, en tramos cortos para que sigan la curva; cada tramo va con la tesela en
// la que cae. Se saltan los cortes del mapa (el antimeridiano y el borde del polo sur), que no son costa.
function segmentos(lineas, r) {
  const pos = [];
  const tes = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const l of lineas) {
    for (let k = 0; k + 3 < l.length; k += 2) {
      const [lon0, lat0, lon1, lat1] = [l[k], l[k + 1], l[k + 2], l[k + 3]];
      if (Math.abs(lon1 - lon0) > 90) continue;
      if (Math.abs(lon0) > 179.9 && Math.abs(lon1) > 179.9) continue;
      if (lat0 < -89.9 && lat1 < -89.9) continue;
      const pasos = Math.max(1, Math.ceil(Math.hypot(lon1 - lon0, lat1 - lat0) / 1.5));
      enEsfera(lat0, lon0, r, a);
      let laA = lat0;
      let loA = lon0;
      for (let s = 1; s <= pasos; s++) {
        const la = lat0 + ((lat1 - lat0) * s) / pasos;
        const lo = lon0 + ((lon1 - lon0) * s) / pasos;
        enEsfera(la, lo, r, b);
        pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
        const t = teselaDe((laA + la) / 2, (loA + lo) / 2);
        for (let m = 0; m < 2; m++) tes.push(TESELAS[t], TESELAS[t + 1], TESELAS[t + 2], TESELAS[t + 3]);
        a.copy(b);
        laA = la;
        loA = lo;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aTesela", new THREE.Float32BufferAttribute(tes, 4));
  return g;
}

// Mapa de la tierra firme (blanco) en proyección equirectangular: tiñe los continentes del globo
// y dice dónde puede haber luces.
function mascaraTierra(costas, w, h) {
  const lienzo = document.createElement("canvas");
  lienzo.width = w;
  lienzo.height = h;
  const g = lienzo.getContext("2d");
  g.fillStyle = "#000";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#fff";
  g.beginPath();
  for (const l of costas) {
    for (let k = 0; k < l.length; k += 2) {
      const x = (l[k] / 360 + 0.5) * w;
      const y = (0.5 - l[k + 1] / 180) * h;
      if (k) g.lineTo(x, y);
      else g.moveTo(x, y);
    }
    g.closePath();
  }
  g.fill("evenodd"); // los lagos grandes quedan como huecos
  return lienzo;
}
function lectorDeTierra(mascara) {
  const W = 720;
  const H = 360;
  const chico = document.createElement("canvas");
  chico.width = W;
  chico.height = H;
  const g = chico.getContext("2d", { willReadFrequently: true });
  g.drawImage(mascara, 0, 0, W, H);
  const px = g.getImageData(0, 0, W, H).data;
  return (lat, lon) => {
    if (lat < -58 || lat > 72) return false; // sin luces en los hielos
    const lo = ((((lon + 180) % 360) + 360) % 360) - 180;
    const x = Math.min(W - 1, Math.floor((lo / 360 + 0.5) * W));
    const y = Math.min(H - 1, Math.max(0, Math.floor((0.5 - lat / 180) * H)));
    return px[(y * W + x) * 4] > 128;
  };
}

// Azar con semilla: las luces y los arcos quedan siempre iguales.
function azarCon(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Luces de ciudad: un punto en cada ciudad (aunque la costa la deje en el agua), luces cercanas a
// su alrededor y otras más tenues en su región, solo sobre tierra firme. Se encienden (en el reloj
// de armado) cuando el globo ya está entero.
function lucesDeCiudad(esTierra) {
  const azar = azarCon(7);
  const gauss = () => Math.sqrt(-2 * Math.log(1 - azar())) * Math.cos(2 * Math.PI * azar());
  const pos = [];
  const datos = [];
  const v = new THREE.Vector3();
  const poner = (lat, lon, tam, brillo, enciende) => {
    enEsfera(lat, lon, 1.002, v);
    pos.push(v.x, v.y, v.z);
    datos.push(tam, brillo, enciende);
  };
  for (const [, lat, lon, w] of CIUDADES) {
    poner(lat, lon, 2.2 + 1.5 * w, 0.7 + 0.4 * w, LUCES_DESDE + azar() * 0.7);
    const cerca = Math.round(26 * w);
    const region = Math.round(14 * w);
    for (let i = 0; i < cerca + region; i++) {
      const lejos = i >= cerca;
      const s = lejos ? 2.2 + 3.2 * w : 0.3 + 0.8 * w; // grados
      const la = lat + gauss() * s;
      const lo = lon + (gauss() * s) / Math.max(Math.cos(la * D2R), 0.35);
      if (!esTierra(la, lo)) continue;
      poner(la, lo, lejos ? 1.1 + azar() * 0.5 : 1.2 + azar() * 0.9, (lejos ? 0.14 + 0.2 * azar() : 0.26 + 0.4 * azar()) * (0.6 + 0.4 * w), LUCES_DESDE + 0.15 + azar() * 1.5);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aLuz", new THREE.Float32BufferAttribute(datos, 3));
  return g;
}

// Arcos entre ciudades (tubos finos que se levantan según la distancia) y los nodos de sus extremos.
// Devuelve también en qué momento del reloj de armado queda todo terminado.
function redDeDatos() {
  const azar = azarCon(11);
  const ciudad = new Map(CIUDADES.map(([n, la, lo, w]) => [n, { la, lo, w }]));
  const pares = [...DESDE_LIMA.map((n, i) => ["Lima", n, LIMA_DESDE + i * 0.16, i % 2 ? -1 : 1]), ...RED.map(([a, b], i) => [a, b, RED_DESDE + i * 0.1, 0])];
  const tubos = [];
  const nodos = new Map(); // nombre → { aparece, tam, oro }
  const nodo = (n, aparece, tam, oro) => {
    const antes = nodos.get(n);
    nodos.set(n, { aparece: Math.min(aparece, antes?.aparece ?? 1e9), tam: Math.max(tam, antes?.tam ?? 0), oro: oro || antes?.oro || 0 });
  };
  let fin = 0;
  for (const [a, b, inicio, lima] of pares) {
    const ca = ciudad.get(a);
    const cb = ciudad.get(b);
    if (!ca || !cb) continue;
    const A = enEsfera(ca.la, ca.lo);
    const B = enEsfera(cb.la, cb.lo);
    const ang = A.angleTo(B);
    const alto = 0.04 + (0.3 * ang) / Math.PI;
    const puntos = [];
    for (let i = 0; i <= 48; i++) {
      const s = i / 48;
      const p = new THREE.Vector3()
        .addScaledVector(A, Math.sin((1 - s) * ang))
        .addScaledVector(B, Math.sin(s * ang))
        .divideScalar(Math.sin(ang));
      puntos.push(p.multiplyScalar(1 + alto * Math.sin(Math.PI * s)));
    }
    const curva = new THREE.CatmullRomCurve3(puntos);
    const largo = curva.getLength();
    const tubo = new THREE.TubeGeometry(curva, 96, lima ? 0.0034 : 0.0024, 6, false);
    const n = tubo.attributes.position.count;
    const arco = [0.6 + azar() * 2.4, 1.8 + azar() * 3.2, inicio, lima]; // retraso de la 1.ª corriente, pausa, inicio, Lima (1 sale, -1 llega, 0 otro)
    const aArco = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) aArco.set(arco, i * 4);
    tubo.setAttribute("aArco", new THREE.BufferAttribute(aArco, 4));
    tubo.setAttribute("aLargo", new THREE.BufferAttribute(new Float32Array(n).fill(largo), 1));
    tubos.push(tubo);
    nodo(a, inicio, a === "Lima" ? 30 : lima ? 18 : 15, a === "Lima" ? 1 : 0);
    nodo(b, inicio + TRAZO * 0.85, lima ? 18 : 15, 0);
    fin = Math.max(fin, inicio + TRAZO);
  }
  const pos = [];
  const datos = [];
  const v = new THREE.Vector3();
  for (const [n, { aparece, tam, oro }] of nodos) {
    const c = ciudad.get(n);
    const cuando = n === "Lima" ? LUCES_DESDE : aparece;
    enEsfera(c.la, c.lo, 1.003, v);
    pos.push(v.x, v.y, v.z);
    datos.push(tam, oro, cuando);
    fin = Math.max(fin, cuando + 0.7);
  }
  const geoNodos = new THREE.BufferGeometry();
  geoNodos.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geoNodos.setAttribute("aNodo", new THREE.Float32BufferAttribute(datos, 3));
  return { arcos: mergeGeometries(tubos), nodos: geoNodos, fin: fin + 0.05 };
}

/* ───────── Shaders ───────── */

// Teselas: cuánto está cada una en su sitio según el reloj de armado (al armarse llegan de sur a
// norte; al desarmarse se van al revés) y dónde está mientras viaja: afuera, girada y más chica.
const TESELA = /* glsl */ `
  uniform float uArmado;
  attribute vec4 aTesela; // centro de la tesela (sobre la esfera) y su azar
  float enSitio(vec4 t) {
    float orden = 0.55 * (t.y * 0.5 + 0.5) + 0.45 * t.w;
    return clamp((uArmado - ${f2(TESELAS_LLEGAN)} * orden) / ${f2(VUELO)}, 0.0, 1.0);
  }
  vec3 girar(vec3 v, vec3 eje, float a) {
    float c = cos(a);
    float s = sin(a);
    return v * c + cross(eje, v) * s + eje * dot(eje, v) * (1.0 - c);
  }
  vec3 soltar(vec3 p, vec4 t, float k, inout vec3 n) {
    float e = (1.0 - k) * (1.0 - k);
    vec3 c = t.xyz;
    vec3 este = vec3(c.z, 0.0, -c.x);
    float l = length(este);
    este = l > 1e-3 ? este / l : vec3(1.0, 0.0, 0.0);
    float a = e * (0.7 + 1.1 * fract(t.w * 7.31)) * (t.w > 0.5 ? 1.0 : -1.0);
    n = girar(n, este, a);
    float tam = smoothstep(0.0, 0.75, k);
    return c * (1.0 + e * (0.25 + 0.45 * fract(t.w * 3.17))) + girar(p - c, este, a) * tam + vec3(0.0, 0.2 * e, 0.0);
  }
`;

// Ondas: anillos que salen del punto tocado y se abren sobre la esfera (p: dirección local, unitaria).
// uOndas[i] = (dirección local del punto tocado, segundo en que se tocó).
const ONDA_GLSL = /* glsl */ `
  uniform vec4 uOndas[${ONDAS}];
  uniform float uTime;
  float onda(vec3 p) {
    float s = 0.0;
    for (int i = 0; i < ${ONDAS}; i++) {
      vec4 o = uOndas[i];
      float e = uTime - o.w;
      if (e < 0.0 || e > ${f2(ONDA_DURA)}) continue;
      float k = e / ${f2(ONDA_DURA)};
      float ang = acos(clamp(dot(p, o.xyz), -1.0, 1.0));
      float d = (ang - ${f2(ONDA_VEL)} * e) / (0.028 + 0.07 * k);
      float anillo = exp(-d * d) * (1.0 - k) * (1.0 - k);
      float chispa = exp(-ang * ang / 0.0018) * exp(-e * 2.2); // el destello en el punto tocado
      s += anillo + chispa * 1.6;
    }
    return s;
  }
`;

// Cuerpo del globo: océano casi negro, tierra en azul acero, luz suave y atmósfera en el borde.
// Es lo único opaco: tapa el fondo y, con su profundidad, esconde lo que queda detrás del globo.
const GLOBO_VS = /* glsl */ `
  ${TESELA}
  attribute vec2 aCelda; // posición dentro de la tesela (0…1)
  varying vec3 vLocal;
  varying vec3 vMundo;
  varying vec3 vNormal;
  varying vec2 vCelda;
  varying float vK;
  void main() {
    float k = enSitio(aTesela);
    vec3 n = normal;
    vec3 p = soltar(position, aTesela, k, n);
    vLocal = position;
    vCelda = aCelda;
    vK = k;
    vec4 w = modelMatrix * vec4(p, 1.0);
    vMundo = w.xyz;
    vNormal = mat3(modelMatrix) * n;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const GLOBO_FS = /* glsl */ `
  uniform sampler2D uTierra;
  ${ONDA_GLSL}
  varying vec3 vLocal;
  varying vec3 vMundo;
  varying vec3 vNormal;
  varying vec2 vCelda;
  varying float vK;
  ${LUZ_GLSL}
  const vec3 OCEANO = vec3(0.004, 0.011, 0.028);
  const vec3 TIERRA = vec3(0.021, 0.055, 0.095);
  void main() {
    vec3 p = normalize(vLocal);
    float lon = length(p.xz) > 1e-5 ? atan(p.x, p.z) : 0.0;
    float lat = asin(clamp(p.y, -1.0, 1.0));
    float tierra = texture2D(uTierra, vec2(lon * 0.1591549 + 0.5, lat * 0.3183099 + 0.5)).r;
    vec3 N = normalize(vNormal);
    vec3 V = normalize(cameraPosition - vMundo);
    float cara = clamp(dot(N, V), 0.0, 1.0);
    float luz = clamp(dot(N, LUZ), 0.0, 1.0);
    vec3 c = mix(OCEANO, TIERRA, tierra) * (0.45 + 1.1 * luz);
    // El agua devuelve apenas la luz.
    c += vec3(0.02, 0.045, 0.1) * pow(max(dot(N, normalize(LUZ + V)), 0.0), 60.0) * (1.0 - tierra);
    // Atmósfera en el borde, más clara del lado de la luz.
    float borde = 1.0 - cara;
    c += vec3(0.05, 0.11, 0.25) * borde * borde * borde * (0.3 + 0.7 * luz);
    // Mientras una tesela viaja es un vidrio azul tenue (no un hueco negro) y su contorno se
    // enciende apenas: se ve que el globo va por piezas.
    float viaja = 4.0 * vK * (1.0 - vK);
    vec2 g = min(vCelda, 1.0 - vCelda);
    vec2 b = smoothstep(vec2(0.0), max(fwidth(vCelda) * 1.3, vec2(1e-4)), g);
    c = mix(c, vec3(0.03, 0.065, 0.14), viaja * 0.75);
    c += vec3(0.2, 0.42, 0.8) * (1.0 - b.x * b.y) * 0.55 * viaja;
    // La onda: un velo dorado que se abre, más fuerte sobre la tierra.
    c += ${ORO_GLSL} * onda(p) * (0.2 + 0.28 * tierra) * vK;
    gl_FragColor = vec4(c, 1.0);
  }
`;

// Costas y fronteras: líneas de luz que se apagan hacia el borde del globo (ahí se apiñan). Viajan
// con su tesela.
const LINEAS_VS = /* glsl */ `
  ${TESELA}
  ${ONDA_GLSL}
  varying float vOnda;
  varying float vCara;
  varying float vLuz;
  varying float vK;
  ${LUZ_GLSL}
  void main() {
    float k = enSitio(aTesela);
    vec3 n = vec3(0.0, 1.0, 0.0);
    vec3 p = soltar(position, aTesela, k, n);
    vec4 w0 = modelMatrix * vec4(position, 1.0);
    vec3 N = normalize(w0.xyz);
    vCara = dot(N, normalize(cameraPosition - w0.xyz));
    vLuz = max(dot(N, LUZ), 0.0);
    vK = k;
    vOnda = onda(normalize(position));
    gl_Position = projectionMatrix * viewMatrix * (modelMatrix * vec4(p, 1.0));
  }
`;
const lineasFS = ([r, g, b], fuerza) => /* glsl */ `
  varying float vOnda;
  varying float vCara;
  varying float vLuz;
  varying float vK;
  void main() {
    float limbo = smoothstep(0.0, 0.45, vCara);
    vec3 c = vec3(${r.toFixed(3)}, ${g.toFixed(3)}, ${b.toFixed(3)}) * ${fuerza.toFixed(3)};
    // Al pasar la onda, la línea se vuelve oro.
    c = mix(c, ${ORO_GLSL} * 1.15, clamp(vOnda, 0.0, 1.0));
    gl_FragColor = vec4(c * (0.25 + 0.75 * limbo) * (0.6 + 0.5 * vLuz) * smoothstep(0.15, 0.8, vK), 1.0);
  }
`;

// Luces de ciudad: puntos cálidos, quietos; cada una se enciende a su tiempo en el reloj de armado.
const LUCES_VS = /* glsl */ `
  attribute vec3 aLuz; // tamaño (px de pantalla), brillo, momento en que se enciende
  uniform float uPx;
  uniform float uArmado;
  uniform float uDist;
  uniform float uPunto;
  ${ONDA_GLSL}
  varying float vB;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    float cara = dot(normalize(w.xyz), normalize(cameraPosition - w.xyz));
    vec4 mv = viewMatrix * w;
    float o = min(onda(normalize(position)), 1.5);
    vB = aLuz.y * (1.0 + 2.2 * o) * smoothstep(aLuz.z, aLuz.z + 0.6, uArmado) * smoothstep(0.05, 0.35, cara);
    gl_PointSize = max(aLuz.x * (1.0 + 0.7 * o) * uPx * uPunto * uDist / -mv.z, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const LUCES_FS = /* glsl */ `
  varying float vB;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float a = 1.0 - smoothstep(0.2, 1.0, r);
    gl_FragColor = vec4(vec3(1.0, 0.79, 0.5) * vB * a * a, 1.0);
  }
`;

// Nodos de la red: un núcleo nítido con un halo suave. Lima, en oro.
const NODOS_VS = /* glsl */ `
  attribute vec3 aNodo; // tamaño (px de pantalla), oro (0 o 1), momento en que aparece
  uniform float uPx;
  uniform float uArmado;
  uniform float uDist;
  uniform float uPunto;
  varying float vB;
  varying float vOro;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    float cara = dot(normalize(w.xyz), normalize(cameraPosition - w.xyz));
    vec4 mv = viewMatrix * w;
    float k = clamp((uArmado - aNodo.z) / 0.7, 0.0, 1.0);
    vB = k * k * (3.0 - 2.0 * k) * smoothstep(0.0, 0.3, cara);
    vOro = aNodo.y;
    gl_PointSize = aNodo.x * uPx * uPunto * uDist / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;
const NODOS_FS = /* glsl */ `
  varying float vB;
  varying float vOro;
  void main() {
    float r = length(gl_PointCoord - 0.5) * 2.0;
    float nucleo = 1.0 - smoothstep(0.1, 0.19, r);
    float halo = exp(-r * r * 10.0) * 0.42;
    vec3 c = mix(vec3(0.62, 0.84, 1.0), vec3(1.0, 0.75, 0.36), vOro);
    gl_FragColor = vec4(c * (nucleo * 1.15 + halo) * vB, 1.0);
  }
`;

// Arcos de datos: se trazan (y con el scroll se destrazan) según el reloj de armado, con la punta
// encendida. Enteros, cada tanto los recorre una corriente (en tiempo real): cabeza clara y cola que
// se apaga. En los de Lima la corriente va y viene (unos salen, otros llegan: Lima reúne los datos)
// y llevan un dejo de oro junto a Lima.
const ARCOS_VS = /* glsl */ `
  attribute vec4 aArco;   // retraso de la primera corriente (s), pausa entre corrientes (s), inicio, Lima (1: la corriente sale, -1: llega, 0: otro)
  attribute float aLargo; // largo del arco
  varying float vS;
  varying vec4 vArco;
  varying float vLargo;
  varying float vCara;
  void main() {
    vS = uv.x;
    vArco = aArco;
    vLargo = aLargo;
    vec4 w = modelMatrix * vec4(position, 1.0);
    vec3 N = normalize(mat3(modelMatrix) * normal);
    vCara = abs(dot(N, normalize(cameraPosition - w.xyz)));
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const ARCOS_FS = /* glsl */ `
  uniform float uTime;
  uniform float uArmado;
  varying float vS;
  varying vec4 vArco;
  varying float vLargo;
  varying float vCara;
  const vec3 AZUL = vec3(0.38, 0.6, 0.92);
  const vec3 CABEZA = vec3(0.78, 0.9, 1.0);
  const vec3 ORO = vec3(1.0, 0.74, 0.36);
  void main() {
    float edad = uArmado - vArco.z;
    if (edad <= 0.0) discard;
    float lima = abs(vArco.w);
    float d = vS * vLargo; // distancia desde el origen
    float dc = vArco.w < 0.0 ? vLargo - d : d; // ídem, en el sentido de la corriente
    // Trazo
    float k = clamp(edad / ${f2(TRAZO)}, 0.0, 1.0);
    float falta = d - (1.0 - (1.0 - k) * (1.0 - k) * (1.0 - k)) * vLargo; // > 0: aún sin trazar
    if (falta > 0.004) discard;
    float punta = exp(min(falta, 0.0) / 0.07) * (1.0 - smoothstep(0.75, 1.0, k));
    // Corriente
    float desde = uTime - vArco.z - ${f2(TRAZO)} - vArco.x;
    float ciclo = vLargo / ${VELOCIDAD.toFixed(3)} + vArco.y;
    float cabeza = mod(max(desde, 0.0), ciclo) * ${VELOCIDAD.toFixed(3)};
    float tras = cabeza - dc; // > 0: detrás de la cabeza
    float cola = (tras >= 0.0 ? exp(-tras / 0.15) : exp(tras / 0.008)) * (1.0 - smoothstep(0.3, 0.45, tras));
    cola *= step(0.0, desde) * smoothstep(0.96, 1.0, k);
    float brillo = clamp(punta + cola, 0.0, 1.0);
    vec3 col = mix(AZUL, CABEZA, brillo * 0.85);
    col = mix(col, ORO, lima * exp(-d / 0.12) * 0.7);
    float I = mix(0.15, 0.27, lima) + 1.2 * punta + 0.9 * cola;
    gl_FragColor = vec4(col * I * (0.55 + 0.45 * vCara), 1.0);
  }
`;

// Atmósfera exterior: para cada rayo de la cámara, cuánto pasa cerca del globo sin tocarlo.
const HALO_VS = /* glsl */ `
  varying vec3 vMundo;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vMundo = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const HALO_FS = /* glsl */ `
  uniform float uHalo;
  varying vec3 vMundo;
  ${LUZ_GLSL}
  void main() {
    vec3 V = normalize(vMundo - cameraPosition);
    vec3 cerca = cameraPosition - V * dot(cameraPosition, V); // punto del rayo más cercano al centro
    float d = length(cerca);
    float h = max(d - 1.0, 0.0);
    float g = (exp(-h / 0.026) * 0.34 + exp(-h / 0.1) * 0.1) * (1.0 - smoothstep(0.18, 0.28, h));
    float lado = 0.3 + 0.7 * smoothstep(-0.5, 0.8, dot(cerca / max(d, 1e-4), LUZ));
    gl_FragColor = vec4(vec3(0.22, 0.38, 0.7) * g * lado * uHalo, 1.0);
  }
`;

// Fundido de la portada: el globo se apaga detrás del texto (una caja de bordes suaves), baja un poco
// detrás de la fila de los ejes y se funde con el borde de abajo, donde empieza la sección siguiente.
const FUNDIDO = /* glsl */ `
  uniform vec4 uTexto;  // caja del texto: izquierda, derecha, arriba, abajo (0…1, y desde arriba)
  uniform float uTira;  // borde de arriba de la fila de ejes (0…1, desde arriba)
  float fundido(vec2 uv) {
    float y = 1.0 - uv.y;
    float enX = smoothstep(uTexto.x - 0.1, uTexto.x + 0.04, uv.x) * (1.0 - smoothstep(uTexto.y - 0.04, uTexto.y + 0.1, uv.x));
    float enY = smoothstep(uTexto.z - 0.08, uTexto.z + 0.02, y) * (1.0 - smoothstep(uTexto.w - 0.03, uTexto.w + 0.07, y));
    float f = mix(1.0, 0.38, enX * enY);
    f *= mix(1.0, 0.6, smoothstep(uTira - 0.01, uTira + 0.1, y));
    return f * smoothstep(0.0, 0.06, uv.y);
  }
`;

/* ───────── Montaje ───────── */

export function montarGlobo3D(seccion, canvas, { quieto = false } = {}) {
  seccion.classList.add("g-con-globo");
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 10);
  camera.position.set(0, 0, 3.4);

  const u = {
    uTime: { value: 0 },
    uArmado: { value: 0 }, // reloj de armado
    uHalo: { value: 0 },
    uDist: { value: 2.4 }, // distancia de la cámara a la cara del globo: a esa distancia los puntos miden lo indicado
    uPunto: { value: 1 }, // escala de los puntos según el tamaño del globo en pantalla
    uTierra: { value: null },
    uOndas: { value: Array.from({ length: ONDAS }, () => new THREE.Vector4(0, 0, 1, -1e3)) },
  };
  const uFundido = { uTexto: { value: new THREE.Vector4(0.25, 0.75, 0.15, 0.5) }, uTira: { value: 0.86 } };

  /* El mundo */
  const costas = decodificar(COSTAS);
  const mascara = mascaraTierra(costas, 2048, 1024);
  const tierra = new THREE.CanvasTexture(mascara);
  tierra.wrapS = THREE.RepeatWrapping;
  tierra.minFilter = THREE.LinearFilter;
  tierra.generateMipmaps = false;
  u.uTierra.value = tierra;

  const material = (vertexShader, fragmentShader, extra) => new THREE.ShaderMaterial({ uniforms: u, vertexShader, fragmentShader, ...extra });
  const luzSumada = sumaDeLuz(false); // suma luz sin tapar el fondo (el alfa queda para el cuerpo)
  const red = redDeDatos();
  const armado = red.fin; // en este momento del reloj de armado ya está todo
  const globo = new THREE.Group();
  const piezas = [
    new THREE.Mesh(cuerpoEnTeselas(), material(GLOBO_VS, GLOBO_FS)),
    new THREE.LineSegments(segmentos(decodificar(FRONTERAS), 1.0012), material(LINEAS_VS, lineasFS([0.4, 0.6, 0.9], 0.18), luzSumada)),
    new THREE.LineSegments(segmentos(costas, 1.0016), material(LINEAS_VS, lineasFS([0.46, 0.72, 0.96], 0.58), luzSumada)),
    new THREE.Points(lucesDeCiudad(lectorDeTierra(mascara)), material(LUCES_VS, LUCES_FS, luzSumada)),
    new THREE.Mesh(red.arcos, material(ARCOS_VS, ARCOS_FS, luzSumada)),
    new THREE.Points(red.nodos, material(NODOS_VS, NODOS_FS, luzSumada)),
  ];
  piezas.forEach((o, i) => {
    o.frustumCulled = false;
    o.renderOrder = i;
    globo.add(o);
  });
  const halo = new THREE.Mesh(new THREE.SphereGeometry(1.3, 96, 48), material(HALO_VS, HALO_FS, { side: THREE.BackSide, ...luzSumada }));
  halo.frustumCulled = false;
  halo.renderOrder = piezas.length;
  scene.add(globo, halo);

  /* Medidas: sitio que ocupa el texto y, según eso y la forma de la pantalla, la composición. */
  const comp = { d: 3.4, radioPx: 400, offset: null };
  let vista = VISTA;
  let medida = null;
  function alMedir(w, h) {
    medida = [w, h];
    // Qué sitio ocupa el texto (las letras en sí, no sus cajas): de ahí salen el fundido y el globo.
    const caja = seccion.getBoundingClientRect();
    const rango = document.createRange();
    let izquierda = w;
    let derecha = 0;
    let abajo = 0;
    let arriba = h;
    const sumar = (r) => {
      if (!r.width) return;
      izquierda = Math.min(izquierda, r.left - caja.left);
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
    if (derecha) uFundido.uTexto.value.set(izquierda / w, derecha / w, arriba / h, abajo / h);
    const tira = seccion.querySelector(".g-hero-ejes");
    const tiraArriba = tira ? (tira.getBoundingClientRect().top - caja.top) / h : 1;
    uFundido.uTira.value = tiraArriba;

    // Horizontal: el globo ocupa el lado derecho, centrado en el alto libre entre la barra y
    // la fila de ejes, sin pisar el texto (puede salirse un poco por la derecha). Vertical: va debajo
    // del texto, entero de lado a lado, con la parte de abajo detrás de la fila de ejes.
    const textoAbajo = derecha ? abajo / h : 0.5;
    const vertical = w <= 900 || w / h < 0.9;
    let c;
    if (vertical) {
      const radio = Math.min((0.29 * w) / h, 0.2);
      c = { cx: 0.5, cy: textoAbajo + 0.035 + radio, radio };
    } else {
      // Entre la barra y la fila de ejes, con aire arriba y abajo.
      const barra = (document.getElementById("bar")?.offsetHeight ?? 0.08 * h) / h;
      const radio = Math.min(0.3, (0.17 * w) / h, (tiraArriba - barra) / 2 - 0.06);
      const textoDerecha = derecha ? derecha / w : 0.45;
      const cx = THREE.MathUtils.clamp(textoDerecha + (radio * h) / w + 0.02, 0.7, 0.8);
      c = { cx, cy: (barra + tiraArriba) / 2, radio };
    }
    vista = vertical ? VISTA_VERTICAL : VISTA;
    comp.d = 1 / (c.radio * 2 * TAN) + 0.2;
    comp.radioPx = c.radio * h;
    // El globo queda en el eje de la cámara (redondo) y la vista se corre para ponerlo en su sitio.
    camera.near = Math.max(0.1, comp.d * 0.9 - 1.45);
    camera.far = comp.d + 1.45;
    comp.offset = [w, h, (0.5 - c.cx) * w, (0.5 - c.cy) * h];
    // Dónde queda el globo en la portada (centro y radio en px): la red de fondo (red-fondo.js) deja un claro ahí.
    seccion.dataset.globo = `${(c.cx * w).toFixed(0)},${(c.cy * h).toFixed(0)},${(c.radio * h).toFixed(0)}`;
    camera.setViewOffset(w, h, comp.offset[2], comp.offset[3], w, h);
    u.uDist.value = comp.d - 1;
    u.uPunto.value = THREE.MathUtils.clamp(Math.sqrt((c.radio * h) / 440), 0.8, 1.3);
  }
  // El texto puede moverse después de la primera medida (llegan las fuentes, termina su entrada).
  const remedir = () => {
    if (!medida) return;
    alMedir(...medida);
    if (quieto && lienzo) {
      alAnimar(1e3, 0);
      lienzo.dibujar();
    }
  };
  document.fonts?.ready.then(remedir);
  setTimeout(remedir, 1600);

  /* Giro: el propio (lento), el del arrastre y la inercia. yaw gira sobre el eje de los polos;
     pitch inclina hacia adelante o atrás y vuelve solo a cero. */
  const giro = { yaw: 0, pitch: 0, vy: 0, vp: 0 };
  // Latido al tocarlo: un resorte sobre la escala.
  const latido = { s: 0, v: 0 };
  let ahora = 0; // segundos de escena (los de las ondas)
  let bajada = 0; // cuánto se bajó (0 arriba … 1 desarmado), suavizado

  /* Puntero: la cámara se corre apenas hacia él y el globo parece inclinarse. */
  const puntero = { x: 0, y: 0, dentro: false, sx: 0, sy: 0 };
  let arrastre = null;
  if (!quieto) {
    const rayo = new THREE.Raycaster();
    const esfera = new THREE.Sphere(new THREE.Vector3(), 1);
    const ndc = new THREE.Vector2();
    const centro = new THREE.Vector3();
    // Dónde toca el puntero al globo (en el mundo), o null si cae fuera.
    const tocar = (e) => {
      const r = canvas.getBoundingClientRect();
      if (!r.width) return null;
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, 1 - ((e.clientY - r.top) / r.height) * 2);
      rayo.setFromCamera(ndc, camera);
      esfera.radius = globo.scale.x;
      return rayo.ray.intersectSphere(esfera, new THREE.Vector3());
    };
    const sobreControl = (e) => e.target.closest?.("a, button, input, textarea, select, .g-hero-ejes");
    let siguiente = 0;
    function lanzarOnda(punto) {
      // La onda sale de ese punto del globo (en sus coordenadas, para que gire con él).
      const local = globo.worldToLocal(punto.clone()).normalize();
      u.uOndas.value[siguiente].set(local.x, local.y, local.z, ahora);
      siguiente = (siguiente + 1) % ONDAS;
      // El globo gira un poco hacia donde se tocó y late.
      centro.set(0, 0, 0).project(camera);
      const p = punto.clone().project(camera);
      const r = canvas.getBoundingClientRect();
      const nx = ((p.x - centro.x) * r.width) / 2 / comp.radioPx;
      const ny = ((p.y - centro.y) * r.height) / 2 / comp.radioPx;
      giro.vy -= nx * 0.55;
      giro.vp += ny * 0.4;
      latido.v -= 0.32;
    }

    seccion.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 || sobreControl(e) || bajada > 0.5) return;
      const punto = tocar(e);
      if (!punto) return;
      if (e.pointerType === "mouse") e.preventDefault(); // sin seleccionar texto al arrastrar
      arrastre = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), movido: 0, punto, tactil: e.pointerType !== "mouse" };
      giro.vy = 0;
      giro.vp = 0;
      seccion.setPointerCapture?.(e.pointerId);
      seccion.classList.add("g-arrastrando");
    });
    seccion.addEventListener("pointermove", (e) => {
      if (arrastre && e.pointerId === arrastre.id) {
        const dx = e.clientX - arrastre.x;
        const dy = arrastre.tactil ? 0 : e.clientY - arrastre.y;
        const t = performance.now();
        const dt = Math.max((t - arrastre.t) / 1000, 1 / 240);
        arrastre.movido += Math.abs(dx) + Math.abs(dy);
        const ay = dx / comp.radioPx;
        const ap = dy / comp.radioPx;
        giro.yaw += ay;
        giro.pitch = THREE.MathUtils.clamp(giro.pitch + ap, -INCLINA_MAX, INCLINA_MAX);
        // Velocidad para la inercia, suavizada.
        giro.vy += (THREE.MathUtils.clamp(ay / dt, -4, 4) - giro.vy) * 0.5;
        giro.vp += (THREE.MathUtils.clamp(ap / dt, -3, 3) - giro.vp) * 0.5;
        Object.assign(arrastre, { x: e.clientX, y: e.clientY, t });
        return;
      }
      if (e.pointerType === "touch") return;
      const r = seccion.getBoundingClientRect();
      puntero.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      puntero.y = 1 - ((e.clientY - r.top) / r.height) * 2;
      puntero.dentro = true;
      seccion.classList.toggle("g-sobre-globo", !sobreControl(e) && bajada < 0.5 && !!tocar(e));
    });
    const soltar = (e, cancelado) => {
      if (!arrastre || e.pointerId !== arrastre.id) return;
      if (!cancelado && arrastre.movido < 6) lanzarOnda(arrastre.punto);
      // Si se quedó quieto antes de soltar, no hay inercia.
      else if (performance.now() - arrastre.t > 90) giro.vy = giro.vp = 0;
      arrastre = null;
      seccion.classList.remove("g-arrastrando");
    };
    seccion.addEventListener("pointerup", (e) => soltar(e, false));
    seccion.addEventListener("pointercancel", (e) => soltar(e, true));
    seccion.addEventListener("pointerleave", () => {
      puntero.dentro = false;
      seccion.classList.remove("g-sobre-globo");
    });
  }

  /* Animación */
  const suave = (x) => x * x * (3 - 2 * x);
  function alAnimar(t, dt) {
    u.uTime.value = t;
    ahora = t;
    // El scroll: cuánto se fue la portada hacia arriba. Se suaviza para que la rueda del mouse no
    // lo haga a saltos.
    if (!quieto) {
      const r = seccion.getBoundingClientRect();
      const p = THREE.MathUtils.clamp(-r.top / (r.height * RECORRIDO), 0, 1);
      bajada += (p - bajada) * (dt ? 1 - Math.exp(-dt * 9) : 1);
    }
    // Reloj de armado: al cargar avanza con el tiempo; al bajar retrocede. El primer 40 % de la
    // bajada apaga la red y las luces; el resto suelta las teselas.
    const porScroll = bajada < 0.4 ? armado + (LUCES_DESDE - armado) * (bajada / 0.4) : LUCES_DESDE * (1 - (bajada - 0.4) / 0.6);
    const reloj = quieto ? armado : Math.min(t, porScroll);
    u.uArmado.value = reloj;
    u.uHalo.value = suave(THREE.MathUtils.clamp((reloj - 0.8) / 1.4, 0, 1));

    // Giro: llega con un giro corto, después gira solo, y el arrastre y la inercia se le suman.
    const llega = quieto ? 1 : 1 - Math.pow(1 - Math.min(t / LLEGA, 1), 3);
    if (!quieto && !arrastre) {
      const freno = Math.exp(-dt * FRENO);
      giro.yaw += (GIRO_AUTO * llega + giro.vy) * dt;
      giro.pitch = THREE.MathUtils.clamp(giro.pitch + giro.vp * dt, -INCLINA_MAX, INCLINA_MAX);
      giro.vy *= freno;
      giro.vp *= freno;
      giro.pitch *= Math.exp(-dt * 0.9); // la inclinación vuelve sola
    }
    const entrada = quieto ? 0 : -(1 - llega) * 0.3 + bajada * 0.2;
    const respira = quieto ? 0 : RESPIRA * Math.sin((t / RESPIRA_PERIODO) * Math.PI * 2);
    globo.rotation.set(vista.lat * D2R + giro.pitch + respira, -vista.lon * D2R + entrada + giro.yaw, 0);
    // Flota: la vista sube y baja unos píxeles.
    if (!quieto && comp.offset) {
      const [w, h, ox, oy] = comp.offset;
      camera.setViewOffset(w, h, ox, oy + Math.sin((t / FLOTA_PERIODO) * Math.PI * 2) * FLOTA * h, w, h);
    }

    // Latido (resorte amortiguado).
    if (dt) {
      latido.v += (-140 * latido.s - 10 * latido.v) * dt;
      latido.s += latido.v * dt;
    }
    const escala = 1 + latido.s;
    globo.scale.setScalar(escala);
    halo.scale.setScalar(escala);

    const sigue = 1 - Math.exp(-dt * 3);
    const mira = puntero.dentro && !arrastre;
    puntero.sx += ((mira ? puntero.x : 0) - puntero.sx) * sigue;
    puntero.sy += ((mira ? puntero.y : 0) - puntero.sy) * sigue;
    const d = comp.d * (0.9 + 0.1 * llega);
    const ay = puntero.sx * 0.05;
    const ax = puntero.sy * 0.035;
    camera.position.set(Math.sin(ay) * Math.cos(ax) * d, Math.sin(ax) * d, Math.cos(ay) * Math.cos(ax) * d);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  }

  if (import.meta.env?.DEV) window.__globo = { globo, giro, u, comp }; // solo en desarrollo, para pruebas
  const lienzo = crearLienzo3D({
    canvas,
    marco: seccion,
    scene,
    camera,
    u,
    quieto,
    brillo: 0.85,
    muestras: 4,
    exposicion: 1.2,
    cubre: true,
    maxPixeles: 2.2e6,
    fundido: FUNDIDO,
    uFundido,
    alMedir,
    alAnimar,
  });
}
