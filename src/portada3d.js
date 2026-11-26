// Portada: un territorio de hilos de luz en 3D (three.js), en lugar de la imagen del mockup.
//
// Qué se ve (sobrio, a propósito)
//   · Un relieve compuesto: praderas cerca, una cordillera a la derecha y una sierra lejana
//     entre la bruma. Se calcula una vez, fuera del hilo principal (relieve.js).
//   · Sobre el relieve, cientos de hilos finos que avanzan muy despacio hacia quien mira; las
//     cumbres brillan más. El grosor se mide en píxeles: igual en una pantalla normal y en una Retina.
//   · Los hilos son datos: por algunos corre una corriente, como electricidad, con la cabeza
//     blanca y la cola hecha de paquetes. Es la misma corriente que en la sección siguiente
//     llega al chip (templo3d.js).
//   · Bruma en la distancia y una luz suave en el horizonte, detrás de la cordillera.
// Cómo se mueve
//   · Al cargar, el relieve se levanta de izquierda a derecha.
//   · El puntero eleva e ilumina un poco el terreno que tiene debajo, y la cámara lo acompaña.
// El lienzo, el resplandor, el fundido de los bordes y el cuidado del equipo (pausa cuando no se
// ve, resolución según lo que aguante) están en lienzo3d.js. Sin WebGL queda el fondo oscuro.
import * as THREE from "three";
import { crearLienzo3D } from "./lienzo3d.js";
import { hornearRelieve } from "./relieve.js";
import Horno from "./relieve-trabajador.js?worker&inline";

/* ───────── Medidas del mundo ───────── */
const FOV = 38;
const TAN = Math.tan(THREE.MathUtils.degToRad(FOV / 2));
const CZ = 9; // z de la cámara en reposo. El terreno se mide en (x, d), con d = CZ - z
const D0 = 5; // primer punto del terreno
const D1 = 135; // horizonte
const PM = 1.5; // reparto de las filas: más juntas cerca
const KMAPA = 1.3; // semiancho del mapa de relieve por unidad de distancia
const RW = 384; // tamaño del mapa de relieve
const RH = 288;
const NL = 40; // densidad de hilos: nº de hilo = NL · (d + SESGO·x)^0.45
const SESGO = 0.3; // los hilos cruzan algo en diagonal
const FLUJO = 0.4; // hilos por segundo que avanzan hacia quien mira

const CAM = new THREE.Vector3(0, 4, CZ);
const MIRA = new THREE.Vector3(0, 2.6, CZ - 40);
const MIRA_ANGOSTA = new THREE.Vector3(0, -3.1, CZ - 40); // en vertical se mira más abajo: el horizonte sube y las montañas quedan sobre el texto

// Macizos: [x, d, radio a lo largo, radio a lo ancho, altura, giro]. El ruido de crestas les da forma.
const MACIZOS_ANCHA = [
  [18, 47, 17, 8, 13, 0.75], // cordillera principal
  [32, 64, 15, 9, 15, 0.5], // cumbre de atrás, a la derecha
  [7.5, 36, 9, 5, 6.2, 0.9], // hombro que baja hacia el centro
  [0, 28.5, 7, 4.2, 2.9, 0.8], // estribaciones
  [12, 14, 9, 5, 1.4, 0.35], // loma del primer plano
  [72, 106, 30, 13, 13, 0.25], // sierra lejana, al borde derecho
];
const MACIZOS_ANGOSTA = [
  [1.8, 44, 6, 4.2, 8.2, 0.5],
  [-4.8, 56, 6.5, 4.5, 8.6, -0.3],
  [6, 64, 7, 5, 10.5, 0.3],
  [-1, 30, 4, 3, 2.2, 0.6],
  [-13, 108, 22, 10, 11, 0.1],
  [15, 112, 24, 11, 12, -0.1],
];

/* ───────── Shaders ───────── */

const f1 = (n) => n.toFixed(4);

const TERRENO_VS = /* glsl */ `
  uniform sampler2D uRelieve;
  uniform float uTime;
  uniform float uVista;   // semiancho de la vista por unidad de distancia
  uniform float uMargen;
  uniform float uFrente;  // por dónde va la entrada (el relieve se levanta a su paso)
  uniform vec4 uFoco;     // x, z del puntero sobre el terreno, fuerza y radio
  attribute vec2 aRejilla; // x: -1…1 de lado a lado; y: 0 cerca … 1 horizonte
  varying vec3 vPos;
  varying vec3 vN;
  varying float vLin;
  varying vec4 vDato;
  void main() {
    float d = ${f1(D0)} + ${f1(D1 - D0)} * pow(aRejilla.y, ${f1(PM)});
    float x = aRejilla.x * (d * uVista * uMargen + 1.8);
    vec4 r = texture2D(uRelieve, vec2(x / (d * ${f1(KMAPA)}) * 0.5 + 0.5, aRejilla.y));
    // Entrada: el relieve sube de izquierda a derecha, sin rebote.
    float e = clamp((uFrente - (x * 0.94 + d * 0.34)) / 26.0, 0.0, 1.0);
    float sube = 1.0 - (1.0 - e) * (1.0 - e) * (1.0 - e);
    // Viento leve en las praderas.
    float y = (r.r + (1.0 - r.a) * 0.07 * sin(x * 0.55 + d * 0.4 + uTime * 0.9)) * sube;
    vec3 p = vec3(x, y, ${f1(CZ)} - d);
    // El puntero eleva un poco el terreno.
    float dF = distance(p.xz, uFoco.xy);
    p.y += uFoco.z * 0.13 * uFoco.w * exp(-dF * dF / (uFoco.w * uFoco.w));
    vPos = p;
    vN = vec3(-r.g * sube, 1.0, r.b * sube);
    vLin = ${f1(NL)} * pow(max(d + ${f1(SESGO)} * x, 0.5), 0.45);
    vDato = vec4(e, r.r * sube, distance(cameraPosition, p), 0.0);
    gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
  }
`;

const TERRENO_FS = /* glsl */ `
  uniform float uTime;
  uniform float uVista;
  uniform float uEntrada; // 0…1: aparición general al cargar
  uniform vec4 uFoco;
  uniform float uPx;      // píxeles del lienzo por píxel de pantalla
  varying vec3 vPos;
  varying vec3 vN;
  varying float vLin;
  varying vec4 vDato;

  const vec3 LUZ = normalize(vec3(-0.75, 0.42, 0.1)); // luz baja desde la izquierda, el lado del texto
  const vec3 HONDO = vec3(0.05, 0.11, 0.36);
  const vec3 MEDIO = vec3(0.21, 0.44, 0.94);
  const vec3 HIELO = vec3(0.72, 0.88, 1.0);
  const vec3 BRUMA = vec3(0.012, 0.045, 0.15);

  float azar(float n) { return fract(sin(n * 127.1 + 1.7) * 43758.5453); }

  void main() {
    float e = vDato.x;
    float alto = vDato.y;
    float lejos = vDato.z;
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vPos);

    /* Luz sobre el relieve */
    float clave = max(dot(N, LUZ), 0.0);
    float cielo = 0.5 + 0.5 * N.y;
    float canto = 1.0 - clamp(dot(N, V), 0.0, 1.0);
    canto *= canto * canto;
    float cumbre = smoothstep(2.5, 11.0, alto);
    float luz = 0.15 * cielo + 0.8 * pow(clave, 1.4) + 0.45 * canto * (0.25 + cumbre) + 0.45 * cumbre * clave;

    /* Hilos */
    float f = vLin + uTime * ${f1(FLUJO)};
    float df = length(vec2(dFdx(vLin), dFdy(vLin))); // hilos por píxel
    float px = abs(fract(f) - 0.5) / max(df, 1e-6);  // píxeles hasta el hilo más cercano
    float medio = 0.55 * uPx;
    float hilo = 1.0 - smoothstep(medio - 0.6, medio + 0.6, px);
    float halo = 0.2 * exp(-px * px / (9.0 * uPx * uPx));
    // Cuando los hilos quedan a menos de dos o tres píxeles se funden en un brillo parejo.
    float parejo = min(2.0 * medio * df + 0.2 * clamp(5.3 * uPx * df, 0.0, 1.0), 0.62);
    float I = mix(hilo + halo, parejo, smoothstep(0.2, 0.45, df));
    float idHilo = floor(f);
    float fibra = 0.55 + 0.6 * azar(idHilo); // cada hilo con su brillo
    float banda = 0.62 + 0.38 * smoothstep(-0.3, 0.5, sin(f * 0.19 + 1.3 * sin(f * 0.043))); // cintas

    /* Puntero */
    float dF = distance(vPos.xz, uFoco.xy);
    float foco = uFoco.z > 0.003 ? uFoco.z * exp(-dF * dF / (uFoco.w * uFoco.w)) : 0.0;

    /* Corriente: algunos hilos llevan datos, como electricidad (cabeza blanca, cola en paquetes) */
    float corriente = 0.0;
    float lleva = azar(idHilo + 3.7);
    if (lleva > 0.66) {
      float lado = vPos.x / ((${f1(CZ)} - vPos.z) * uVista); // -1…1 de lado a lado de la vista
      float dir = lleva > 0.83 ? 1.0 : -1.0;
      float cabeza = (fract(azar(idHilo + 1.3) + uTime * (0.055 + 0.08 * azar(idHilo + 9.1))) * 3.4 - 1.7) * dir;
      float tras = (cabeza - lado) * dir; // > 0: detrás de la cabeza
      float cola = tras > 0.0 ? exp(-tras / (0.07 + 0.09 * azar(idHilo + 4.4))) : exp(tras / 0.004);
      float paquetes = tras > 0.01 ? 0.35 + 0.65 * step(0.4, fract(tras * 70.0)) : 1.0;
      corriente = cola * paquetes * (0.86 + 0.14 * sin(uTime * 9.0 + idHilo * 5.0));
    }

    float L = luz * fibra * banda + 0.55 * foco + 1.5 * corriente;
    vec3 col = mix(HONDO, MEDIO, smoothstep(0.05, 0.75, L));
    col = mix(col, HIELO, smoothstep(0.8, 1.9, L));
    vec3 hilos = col * I * (0.3 + 0.7 * min(L, 1.0)) * 1.12 * (1.0 + 0.8 * corriente);
    vec3 cuerpo = vec3(0.003, 0.014, 0.06) * (0.3 + 1.5 * luz + foco);

    // Bruma: lo lejano y lo bajo se pierden en el aire.
    float b = lejos / 105.0;
    float aire = clamp(1.0 - exp(-b * b * 1.3) + 0.5 * smoothstep(28.0, 85.0, lejos) * (1.0 - smoothstep(0.4, 5.0, alto)), 0.0, 1.0);
    float visible = uEntrada * (0.3 + 0.7 * smoothstep(0.0, 0.25, e));
    vec3 c = (cuerpo + hilos) * visible * (1.0 - aire);
    // En el alfa va cuánto de este punto resplandece: solo los hilos más iluminados.
    vec3 emite = hilos * smoothstep(0.45, 1.3, L) * visible * (1.0 - aire);
    float resplandece = clamp(dot(emite, vec3(0.333)) / max(dot(c, vec3(0.333)), 1e-4), 0.0, 1.0);
    c += BRUMA * aire * visible;
    gl_FragColor = vec4(c, resplandece);
  }
`;

// Cielo: luz suave en el horizonte, más fuerte detrás de la cordillera.
const CIELO_VS = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vec4 p = modelMatrix * vec4(position, 1.0);
    vDir = p.xyz - cameraPosition;
    gl_Position = projectionMatrix * viewMatrix * p;
  }
`;
const CIELO_FS = /* glsl */ `
  uniform float uEntradaCielo;
  uniform float uLado;
  varying vec3 vDir;
  void main() {
    vec3 dir = normalize(vDir);
    float sube = max(dir.y, 0.0);
    float az = atan(dir.x, -dir.z);
    float lado = exp(-(az - uLado) * (az - uLado) / 0.3);
    vec3 c = vec3(0.014, 0.036, 0.11) * exp(-sube * 11.0) * (0.3 + 0.7 * lado);
    c += vec3(0.045, 0.1, 0.27) * exp(-sube * 34.0) * (0.25 + 0.75 * lado) * 0.6;
    float el = asin(clamp(dir.y, -1.0, 1.0));
    c += vec3(0.022, 0.055, 0.16) * exp(-((az - uLado) * (az - uLado) / 0.1 + (el - 0.09) * (el - 0.09) / 0.022));
    gl_FragColor = vec4(c * uEntradaCielo, 0.0); // el cielo no resplandece
  }
`;

// Fundido de la portada: se apaga hacia el texto (a la izquierda; en vertical, una franja tenue
// detrás del texto) y hacia el borde de abajo, donde empieza la sección siguiente.
const FUNDIDO = /* glsl */ `
  uniform vec3 uTexto;     // borde derecho, borde inferior y borde superior del texto, de 0 a 1
  uniform float uVertical; // 1 en pantallas verticales
  float fundido(vec2 uv) {
    float y = 1.0 - uv.y;
    float franja = smoothstep(uTexto.z - 0.07, uTexto.z + 0.03, y) * (1.0 - smoothstep(uTexto.y - 0.03, uTexto.y + 0.07, y));
    float f = uVertical > 0.5 ? mix(1.0, 0.26, franja) * (0.45 + 0.55 * smoothstep(0.03, 0.17, y)) : smoothstep(uTexto.x - 0.11, uTexto.x + 0.2, uv.x);
    return f * smoothstep(0.0, 0.15, uv.y);
  }
`;

/* ───────── Montaje ───────── */

export function montarPortada3D(seccion, canvas, { quieto = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 700);
  let mira = MIRA;

  const u = {
    uRelieve: { value: null },
    uTime: { value: 0 },
    uVista: { value: TAN },
    uMargen: { value: 1.12 },
    uFrente: { value: quieto ? 1e4 : -30 },
    uEntrada: { value: quieto ? 1 : 0 },
    uEntradaCielo: { value: quieto ? 1 : 0 },
    uFoco: { value: new THREE.Vector4(0, 0, 0, 3) },
    uLado: { value: 0.3 },
  };
  const uFundido = { uTexto: { value: new THREE.Vector3(0.44, 0.75, 0.25) }, uVertical: { value: 0 } };

  /* Terreno: una rejilla alineada con la vista. */
  const COLS = 256;
  const FILAS = 200;
  const rejilla = new Float32Array(COLS * FILAS * 2);
  for (let j = 0; j < FILAS; j++) {
    for (let i = 0; i < COLS; i++) rejilla.set([(i / (COLS - 1)) * 2 - 1, j / (FILAS - 1)], (j * COLS + i) * 2);
  }
  const indices = new Uint32Array((COLS - 1) * (FILAS - 1) * 6);
  let n = 0;
  for (let j = 0; j < FILAS - 1; j++) {
    for (let i = 0; i < COLS - 1; i++) {
      const a = j * COLS + i;
      indices.set([a, a + 1, a + COLS, a + 1, a + COLS + 1, a + COLS], n); // de cerca a lejos: lo tapado no se pinta
      n += 6;
    }
  }
  const geoTerreno = new THREE.BufferGeometry();
  geoTerreno.setAttribute("aRejilla", new THREE.BufferAttribute(rejilla, 2));
  geoTerreno.setAttribute("position", new THREE.BufferAttribute(new Float32Array(COLS * FILAS * 3), 3)); // la posición la calcula el shader
  geoTerreno.setIndex(new THREE.BufferAttribute(indices, 1));
  const terreno = new THREE.Mesh(geoTerreno, new THREE.ShaderMaterial({ uniforms: u, vertexShader: TERRENO_VS, fragmentShader: TERRENO_FS, side: THREE.DoubleSide }));

  /* Cielo: un plano muy lejano, detrás del terreno. */
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(2400, 900), new THREE.ShaderMaterial({ uniforms: u, vertexShader: CIELO_VS, fragmentShader: CIELO_FS, depthWrite: false }));
  cielo.position.set(0, 200, CZ - 500);

  [terreno, cielo].forEach((o, i) => {
    o.frustumCulled = false;
    o.renderOrder = i;
    scene.add(o);
  });

  /* Relieve: se calcula en un trabajador; si no se puede, aquí mismo. */
  let horno = null;
  try {
    horno = new Horno();
  } catch {}
  let ultimo = 0;
  function pedirRelieve(angosta, listo) {
    const pedido = { macizos: angosta ? MACIZOS_ANGOSTA : MACIZOS_ANCHA, RW, RH, D0, D1, PM, KMAPA };
    if (!horno) return listo(hornearRelieve(pedido));
    const id = ++ultimo;
    horno.onmessage = ({ data }) => data.id === ultimo && listo(data);
    horno.onerror = () => {
      horno = null;
      listo(hornearRelieve(pedido));
    };
    horno.postMessage({ id, ...pedido });
  }
  let aplicada = null; // composición del relieve que se ve
  let pedida = null;
  let leerAltura = () => 0;
  function aplicarRelieve({ alt, datos }, angosta) {
    const tex = new THREE.DataTexture(datos, RW, RH, THREE.RGBAFormat, THREE.HalfFloatType);
    tex.minFilter = tex.magFilter = THREE.LinearFilter;
    tex.needsUpdate = true;
    u.uRelieve.value?.dispose();
    u.uRelieve.value = tex;
    // Altura en cualquier punto, leyendo el mapa (para saber dónde toca el puntero).
    leerAltura = (x, d) => {
      const fu = THREE.MathUtils.clamp((x / (d * KMAPA)) * 0.5 + 0.5, 0, 1) * (RW - 1);
      const fv = Math.pow(THREE.MathUtils.clamp((d - D0) / (D1 - D0), 0, 1), 1 / PM) * (RH - 1);
      const i = Math.min(fu | 0, RW - 2);
      const j = Math.min(fv | 0, RH - 2);
      const a = fu - i;
      const b = fv - j;
      const k = j * RW + i;
      return (alt[k] * (1 - a) + alt[k + 1] * a) * (1 - b) + (alt[k + RW] * (1 - a) + alt[k + RW + 1] * a) * b;
    };
    mira = angosta ? MIRA_ANGOSTA : MIRA;
    u.uLado.value = angosta ? 0 : 0.3;
    aplicada = angosta;
  }

  /* Medidas: composición según la forma de la pantalla y sitio que ocupa el texto. */
  function alMedir(w, h) {
    u.uVista.value = TAN * camera.aspect;
    u.uMargen.value = Math.min(1.12, (KMAPA - 0.36) / u.uVista.value);
    const angosta = camera.aspect < 0.9;
    if (angosta !== aplicada && angosta !== pedida) {
      // Otra composición (por ejemplo, al girar el teléfono): en vertical las montañas van al centro.
      pedida = angosta;
      pedirRelieve(angosta, (mapa) => {
        aplicarRelieve(mapa, angosta);
        pedida = null;
        if (quieto) {
          alAnimar(1e3, 0);
          lienzo?.dibujar();
        }
      });
    }
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

  /* Puntero: dónde toca el terreno (se sigue el rayo hasta cruzar el relieve). */
  const puntero = { x: 0, y: 0, dentro: false, sx: 0, sy: 0 };
  const foco = { x: 8, z: CZ - 24, f: 0, r: 3, tx: 8, tz: CZ - 24, tr: 3 };
  const rayo = new THREE.Vector3();
  function tocar(nx, ny) {
    rayo.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize();
    const o = camera.position;
    const debajo = (t) => o.y + rayo.y * t < leerAltura(o.x + rayo.x * t, CZ - (o.z + rayo.z * t));
    for (let t = 3; t < 150; ) {
      const sig = t + 0.3 + t * 0.03;
      if (debajo(sig)) {
        let a = t;
        let b = sig;
        for (let k = 0; k < 7; k++) {
          const m = (a + b) / 2;
          if (debajo(m)) b = m;
          else a = m;
        }
        return { x: o.x + rayo.x * b, z: o.z + rayo.z * b };
      }
      t = sig;
    }
    return null;
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
  const T0 = 30;
  const ENTRADA = 2.8; // segundos que tarda el relieve en levantarse
  const suave = (x) => x * x * (3 - 2 * x);
  function alAnimar(t, dt) {
    u.uTime.value = T0 + (quieto ? 0 : t);
    const k = Math.min(t / ENTRADA, 1);
    u.uFrente.value = k < 1 ? -8 + 190 * Math.pow(k, 2.3) : 1e4;
    u.uEntrada.value = suave(Math.min(t / 0.7, 1));
    u.uEntradaCielo.value = suave(THREE.MathUtils.clamp((t - 0.6) / 2.4, 0, 1));

    // Cámara: entra retrocediendo un poco, respira y sigue al puntero.
    const sigue = 1 - Math.exp(-dt * 3.5);
    const tc = quieto ? 0 : t; // con "reducir movimiento" la cámara queda en su sitio
    puntero.sx += ((puntero.dentro ? puntero.x : 0) - puntero.sx) * sigue;
    puntero.sy += ((puntero.dentro ? puntero.y : 0) - puntero.sy) * sigue;
    const llega = 1 - Math.pow(1 - Math.min(t / 3.6, 1), 3);
    camera.position.set(
      CAM.x + puntero.sx * 0.9 + Math.sin(tc * 0.11) * 0.3,
      CAM.y - (1 - llega) * 0.7 + puntero.sy * 0.3 + Math.sin(tc * 0.07 + 1) * 0.1,
      CAM.z - (1 - llega) * 2.2,
    );
    camera.lookAt(mira.x + puntero.sx * 0.5, mira.y, mira.z);
    camera.updateMatrixWorld();

    // Foco: sigue, con retraso, el punto del terreno que está bajo el puntero.
    const toca = puntero.dentro && t > ENTRADA ? tocar(puntero.x, puntero.y) : null;
    if (toca) {
      foco.tx = toca.x;
      foco.tz = toca.z;
      foco.tr = THREE.MathUtils.clamp(0.07 * Math.hypot(toca.x - camera.position.x, toca.z - camera.position.z), 1, 4.5); // en pantalla mide parecido cerca y lejos
      if (foco.f < 0.03) {
        foco.x = toca.x;
        foco.z = toca.z;
        foco.r = foco.tr;
      }
    }
    const va = 1 - Math.exp(-dt * 7);
    foco.x += (foco.tx - foco.x) * va;
    foco.z += (foco.tz - foco.z) * va;
    foco.r += (foco.tr - foco.r) * va;
    foco.f += ((toca ? 1 : 0) - foco.f) * (1 - Math.exp(-dt * (toca ? 5 : 2.5)));
    u.uFoco.value.set(foco.x, foco.z, foco.f, foco.r);
  }

  // El lienzo se crea cuando el primer relieve está listo: la entrada empieza con todo en su sitio.
  let lienzo = null;
  const primera = seccion.clientWidth / Math.max(seccion.clientHeight, 1) < 0.9;
  pedida = primera;
  pedirRelieve(primera, (mapa) => {
    aplicarRelieve(mapa, primera);
    pedida = null;
    lienzo = crearLienzo3D({
      canvas,
      marco: seccion,
      scene,
      camera,
      u,
      quieto,
      brillo: 0.8,
      maxPixeles: 2.2e6,
      fundido: FUNDIDO,
      uFundido,
      alMedir,
      alAnimar,
    });
  });
}
