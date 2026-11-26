// Sección "Conocimiento que acompaña": un chip que construye el edificio (three.js), en lugar de
// la imagen del templo sobre el chip.
//   · Un chip de verdad sobre su placa: encapsulado negro biselado con la marca del pin 1 y un
//     grabado, patas plateadas que bajan a sus contactos dorados, tapa metálica y un núcleo de
//     vidrio. La placa no tiene bordes ni rejilla: sus pistas se disuelven en el fondo.
//     Antes de empezar, el edificio se ve como un plano de líneas tenues.
//   · Los datos de la portada llegan aquí: por las pistas, que vienen desde el fondo, corre la
//     misma corriente que por los hilos del territorio, siempre hacia el chip. Cada pata se
//     enciende cuando recibe un paquete, y el edificio concentra esos datos: suben por las
//     columnas y salen por el techo.
//   · Al llegar a la sección, el chip se enciende y, desde él, el edificio se levanta capa por
//     capa —escalinata, columnas, cornisa, frontón con el isotipo— mientras un frente de luz va
//     "imprimiendo" la piedra.
//   · La cámara acompaña un poco al puntero.
// El edificio sigue las proporciones del orden dórico: columnas de unos seis diámetros, con
// collarino; cornisamento de arquitrabe, friso con triglifos y cornisa; frontón bajo (15°) con el
// tímpano hundido bajo el alero; tejas en el techo y una puerta en la cella.
// El lienzo, el resplandor, el fundido de los bordes y el cuidado del equipo están en lienzo3d.js.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { crearLienzo3D, sumaDeLuz } from "./lienzo3d.js";

/* ───────── Medidas (unidades del mundo; el chip está en el centro, sobre y = 0) ───────── */
const CHIP = 7.0; // lado del encapsulado
const CHIP_BASE = 0.12; // el encapsulado no toca la placa: lo sostienen las patas
const CHIP_ALTO = 0.42;
const Y_PAQ = CHIP_BASE + CHIP_ALTO; // cara de arriba del encapsulado
const TAPA = 5.6; // tapa metálica
const NUCLEO = 5.4; // lámina de vidrio sobre la tapa: el núcleo que se enciende
const Y0 = Y_PAQ + 0.06 + 0.02 + 0.06; // base del edificio, sobre el núcleo
const PATAS = 16; // por lado
const ESCALON = 0.11;
const Y_ESTILO = Y0 + 3 * ESCALON; // escalinata terminada: aquí nacen las columnas
const PASO = 0.6; // entre ejes de columnas
const COL_ALTO = 1.8;
const Y_ARQ = Y_ESTILO + COL_ALTO; // arranque del arquitrabe
const Y_FRISO = Y_ARQ + 0.22;
const Y_CORNISA0 = Y_FRISO + 0.2;
const Y_CORNISA = Y_CORNISA0 + 0.08; // arranque del frontón
const ENT_ANCHO = 5 * PASO + 0.37; // cornisamento: el tramo de columnas más un ábaco
const ENT_LARGO = 7 * PASO + 0.37;
const PENDIENTE = Math.tan(THREE.MathUtils.degToRad(15));
const SUBIDA = (ENT_ANCHO / 2) * PENDIENTE; // alto del tímpano
const TEJA = 0.06; // grosor de los faldones del techo
const ALERO = 1.8; // medio ancho del techo, con el vuelo del alero
const Y_CUMBRE = Y_CORNISA + SUBIDA + TEJA;
const CELLA_FRENTE = 1.35;
const OBJETIVO = new THREE.Vector3(0, 1.8, 0);
const DISTANCIA = 17.5;
const AZIMUT = THREE.MathUtils.degToRad(38); // desde el frente (+z) hacia la derecha (+x)
const ALTURA = THREE.MathUtils.degToRad(23);
const DURA = 2.2; // segundos que tarda la obra

const f1 = (n) => n.toFixed(4);

/* ───────── Geometría ───────── */

// Caja con la base apoyada en yBase.
const caja = (w, h, d, x, yBase, z) => new THREE.BoxGeometry(w, h, d).translate(x, yBase + h / 2, z);

// Prisma triangular (tímpano): cumbrera a lo largo de z.
function prisma(w, h, l, y) {
  const hw = w / 2;
  const hl = l / 2;
  const A = [-hw, y, hl], B = [hw, y, hl], C = [0, y + h, hl];
  const A2 = [-hw, y, -hl], B2 = [hw, y, -hl], C2 = [0, y + h, -hl];
  const caras = [A, B, C, B2, A2, C2, A2, A, C, A2, C, C2, B, B2, C2, B, C2, C, A2, B2, B, A2, B, A];
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(caras.flat(), 3));
  g.computeVertexNormals();
  return g;
}

// Faldón del techo: una losa que baja de la cumbrera al alero (lado = 1 derecha, -1 izquierda).
function faldon(lado) {
  const largo = ALERO / Math.cos(Math.atan(PENDIENTE));
  return new THREE.BoxGeometry(largo, TEJA, ENT_LARGO + 0.18)
    .translate((lado * largo) / 2, TEJA / 2, 0)
    .rotateZ(-lado * Math.atan(PENDIENTE))
    .translate(0, Y_CORNISA + SUBIDA, 0);
}

const soloForma = (g) => {
  const s = g.index ? g.toNonIndexed() : g;
  s.deleteAttribute("uv");
  return s;
};

// Columna dórica: fuste con éntasis (sin basa), equino y ábaco.
function columna() {
  const partes = [
    new THREE.CylinderGeometry(0.115, 0.14, 1.68, 24, 1, true).translate(0, 0.84, 0),
    new THREE.CylinderGeometry(0.178, 0.118, 0.07, 24).translate(0, 1.68 + 0.035, 0),
    caja(0.37, 0.05, 0.37, 0, 1.75, 0),
  ];
  return mergeGeometries(partes.map(soloForma));
}

/* ───────── Shaders ───────── */

const UNIFORMES = /* glsl */ `
  uniform float uTime;
  uniform float uAltura;  // hasta dónde está construido (y del mundo)
  uniform float uObra;    // 1 mientras se construye: luz en el frente, energía en las pistas
  uniform float uHecho;   // 1 cuando el edificio está terminado
  uniform float uEnergia; // 0…1: el chip encendido
  uniform float uPx;
  float lum(vec3 c) { return dot(c, vec3(0.333)); }
`;

// Líneas de un píxel (solo en los shaders de fragmento: usan derivadas de pantalla).
const TRAZOS = /* glsl */ `
  // Línea donde v = 0 (v debe variar de forma continua).
  float linea(float v, float ancho) {
    float w = max(fwidth(v), 1e-5);
    return 1.0 - smoothstep(ancho * w, (ancho + 1.0) * w, abs(v));
  }
  // Líneas repetidas en cada entero de q.
  float lineas(float q, float ancho) {
    float w = max(fwidth(q), 1e-5);
    return 1.0 - smoothstep(ancho * w, (ancho + 1.0) * w, abs(fract(q + 0.5) - 0.5));
  }
`;

// Corriente por una pista: dónde va la cabeza del paquete (distancia al chip, en unidades del mundo).
// La comparten las pistas y las patas, para que cada pata se encienda cuando le llega su paquete.
const CORRIENTE = /* glsl */ `
  float cabezaPaquete(float fase, float vel, float largo, float t) {
    float ciclo = largo * 1.6 + 3.0;
    return fract(fase - t * vel / ciclo) * ciclo - 1.5;
  }
`;

const MUNDO_VS = /* glsl */ `
  varying vec3 vMundo;
  varying vec3 vN;
  #ifdef FLUJO
    uniform float uTime;
    attribute vec3 aFlujo; // fase, velocidad y largo de la pista de esta pata
    varying float vLlega;
    ${CORRIENTE}
  #endif
  void main() {
    vec4 p = vec4(position, 1.0);
    vec3 n = normal;
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      n = mat3(instanceMatrix) * n;
    #endif
    p = modelMatrix * p;
    vMundo = p.xyz;
    vN = normalize(mat3(modelMatrix) * n);
    #ifdef FLUJO
      float c = cabezaPaquete(aFlujo.x, aFlujo.y, aFlujo.z, uTime) + 0.15;
      vLlega = exp(-c * c * 4.0);
    #endif
    gl_Position = projectionMatrix * viewMatrix * p;
  }
`;

// Piedra del edificio: mármol gris azulado con luz suave desde arriba a la izquierda, relleno frío,
// un brillo especular discreto y sombras de contacto (al pie de las columnas, bajo el arquitrabe y
// dentro del pórtico). La luz del chip rebota apenas en la base. Solo el frente de obra y los
// anillos de datos alimentan el resplandor. Los detalles finos se apagan cuando se ven chicos.
// Por encima del frente de obra no se dibuja.
const PIEDRA_FS = /* glsl */ `
  ${UNIFORMES}
  ${TRAZOS}
  varying vec3 vMundo;
  varying vec3 vN;
  const vec3 PIEDRA = vec3(0.42, 0.46, 0.54);
  const vec3 CIELO = vec3(0.07, 0.09, 0.15);
  const vec3 AZUL = vec3(0.42, 0.62, 0.95);
  const vec3 HIELO = vec3(0.85, 0.92, 1.0);
  const vec3 LUZ = normalize(vec3(-0.55, 0.8, 0.25));
  void main() {
    float y = vMundo.y;
    if (y > uAltura) discard;
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vMundo);
    float clave = max(dot(N, LUZ), 0.0);
    float borde = 1.0 - max(dot(N, V), 0.0);
    borde *= borde * borde * borde;
    float tono = 1.0;
    float sombra = 1.0;
    float sube = 0.0;
    #ifdef COLUMNA
      float ang = length(N.xz) > 0.2 ? atan(N.z, N.x) * 20.0 : 0.0; // veinte estrías (en las caras planas de arriba no hay ángulo)
      tono *= 1.0 - 0.1 * (0.5 + 0.5 * cos(ang)) * (1.0 - smoothstep(0.6, 1.4, fwidth(ang)));
      tono *= 1.0 - 0.35 * linea(y - ${f1(Y_ESTILO + 1.6)}, 0.6); // collarino
      sombra *= mix(0.6, 1.0, smoothstep(${f1(Y_ESTILO)}, ${f1(Y_ESTILO + 0.45)}, y));
      sombra *= mix(1.0, 0.7, smoothstep(${f1(Y_ARQ - 0.5)}, ${f1(Y_ARQ)}, y));
      // Un anillo fino de datos sube por cada columna, a su ritmo.
      vec2 celda = floor(vMundo.xz / ${f1(PASO)});
      float fase = fract(sin(dot(celda, vec2(12.9898, 78.233))) * 43758.5453);
      float cabeza = fract(fase + uTime * (0.12 + 0.06 * fase)) * 3.0 - 0.5;
      float tras = cabeza - (y - ${f1(Y_ESTILO)}); // > 0: debajo del anillo
      sube = tras > 0.0 ? exp(-tras / 0.16) : exp(tras / 0.02);
    #else
      // Friso: un triglifo sobre cada columna y otro entre columnas, con dos canales.
      if (y > ${f1(Y_FRISO)} && y < ${f1(Y_CORNISA0)} && abs(N.y) < 0.5) {
        float u = abs(N.z) > 0.5 ? vMundo.x : vMundo.z;
        float d = abs(fract(u / ${f1(PASO / 2)} + 0.5) - 0.5) * ${f1(PASO / 2)};
        float triglifo = 1.0 - smoothstep(0.055, 0.055 + max(fwidth(u), 1e-5), d);
        tono *= 1.0 - 0.16 * triglifo - 0.25 * linea(d - 0.019, 0.5) * triglifo * (1.0 - smoothstep(0.012, 0.025, fwidth(u)));
        sombra *= 0.88;
      }
      tono *= 1.0 - 0.3 * linea(y - ${f1(Y_FRISO)}, 0.5); // tenia, entre arquitrabe y friso
      // La cella queda en la sombra del pórtico; su puerta, más oscura.
      if (y > ${f1(Y_ESTILO + 0.002)} && y < ${f1(Y_ARQ - 0.002)}) sombra *= 0.5;
      if (N.z > 0.5 && abs(vMundo.z - ${f1(CELLA_FRENTE)}) < 0.01 && abs(vMundo.x) < 0.3 && y < ${f1(Y_ESTILO + 1.15)}) tono *= 0.4;
      // Tejas: juntas que bajan de la cumbrera al alero (se apagan cuando quedan muy juntas).
      float techo = step(0.5, N.y) * step(${f1(Y_CORNISA + 0.02)}, y);
      float q = vMundo.z / 0.16;
      tono *= 1.0 - 0.16 * techo * lineas(q, 0.5) * (1.0 - smoothstep(0.22, 0.45, fwidth(q)));
    #endif
    vec3 H = normalize(LUZ + V);
    float especular = pow(max(dot(N, H), 0.0), 48.0) * 0.14;
    vec3 c = (PIEDRA * (0.14 + 0.86 * clave) + CIELO * (0.5 + 0.5 * N.y)) * tono * sombra;
    c = c * (0.6 + 0.4 * uEnergia) + vec3(0.8, 0.88, 1.0) * especular * sombra;
    // Luces: rebote del chip en la base, canto frío, frente de obra y anillos de datos.
    vec3 fuerte = HIELO * exp(-(uAltura - y) / 0.04) * uObra * 1.5;
    fuerte += mix(AZUL, HIELO, 0.5) * sube * 0.32 * uEnergia * (0.35 + 0.65 * uHecho);
    vec3 suave = AZUL * (exp(-(y - ${f1(Y0)}) * 2.6) * 0.16 * uEnergia * (1.0 - 0.7 * max(N.y, 0.0)) + borde * 0.2);
    c += suave + fuerte;
    gl_FragColor = vec4(c, clamp(lum(fuerte) / max(lum(c), 1e-3), 0.0, 1.0)); // resplandece solo lo fuerte
  }
`;

// Metal del chip: el encapsulado (negro mate, con la marca hundida del pin 1), la tapa (metal
// cepillado) y las patas (plateadas). Bordes fríos por fresnel.
const METAL_FS = /* glsl */ `
  ${UNIFORMES}
  ${TRAZOS}
  varying vec3 vMundo;
  varying vec3 vN;
  #ifdef PATA
    varying float vLlega;
  #endif
  const vec3 LUZ = normalize(vec3(-0.5, 0.82, 0.3));
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vMundo);
    float clave = max(dot(N, LUZ), 0.0);
    float borde = 1.0 - abs(dot(N, V));
    borde *= borde * borde;
    float arriba = step(0.5, N.y);
    vec3 c;
    vec3 brillo = vec3(0.36, 0.46, 0.66) * borde * borde * 0.7;
    #if defined(PATA)
      c = vec3(0.2, 0.24, 0.32) * (0.3 + 0.7 * clave);
      brillo += vec3(0.5, 0.6, 0.8) * borde * 0.4;
      brillo += vec3(0.55, 0.72, 1.0) * vLlega * (0.3 + 0.7 * uEnergia) * 0.2; // recibe un paquete
    #elif defined(TAPA)
      float cepillo = 0.5 + 0.5 * sin(vMundo.x * 46.0 + sin(vMundo.z * 2.0) * 1.5);
      c = vec3(0.055, 0.065, 0.09) * (0.5 + 0.5 * clave) * (0.75 + 0.35 * cepillo * arriba);
    #else
      c = vec3(0.022, 0.026, 0.04) * (0.6 + 0.5 * clave);
      float d = length(vMundo.xz - vec2(${f1(-CHIP / 2 + 0.5)}, ${f1(CHIP / 2 - 0.5)}));
      c *= 1.0 - 0.5 * (1.0 - smoothstep(0.15, 0.17, d)) * arriba;
      brillo += vec3(0.55, 0.66, 0.85) * linea(d - 0.16, 0.4) * arriba * 0.22;
    #endif
    c += brillo;
    gl_FragColor = vec4(c, clamp(lum(brillo) / max(lum(c), 1e-3), 0.0, 1.0));
  }
`;

// Contactos dorados de la placa, bajo cada pata.
const CONTACTO_FS = /* glsl */ `
  ${UNIFORMES}
  varying vec3 vMundo;
  varying vec3 vN;
  void main() {
    vec3 V = normalize(cameraPosition - vMundo);
    float reflejo = 0.4 + 0.6 * pow(1.0 - abs(V.y), 3.0);
    gl_FragColor = vec4(vec3(0.42, 0.3, 0.1) * reflejo * (0.55 + 0.45 * uEnergia), 0.0);
  }
`;

// Grabado del encapsulado.
const MARCA_VS = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const MARCA_FS = /* glsl */ `
  uniform sampler2D uMarca;
  uniform float uEnergia;
  varying vec2 vUv;
  void main() {
    gl_FragColor = vec4(vec3(0.62, 0.72, 0.88), texture2D(uMarca, vUv).a * (0.22 + 0.2 * uEnergia));
  }
`;

// Láminas de vidrio: suman luz, sobre todo por los cantos; bajo el edificio, menos (sombra de contacto).
const VIDRIO_FS = /* glsl */ `
  ${UNIFORMES}
  varying vec3 vMundo;
  varying vec3 vN;
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vMundo);
    float borde = 1.0 - abs(dot(N, V));
    float canto = 1.0 - step(0.5, abs(N.y));
    float bajo = (1.0 - smoothstep(1.8, 2.15, abs(vMundo.x))) * (1.0 - smoothstep(2.4, 2.75, abs(vMundo.z))) * step(0.5, N.y);
    float luz = (0.025 + 0.17 * canto + 0.1 * borde * borde) * (0.2 + 0.8 * uEnergia) * (1.0 - 0.85 * bajo);
    gl_FragColor = vec4(vec3(0.4, 0.6, 0.95), luz);
  }
`;

// Placa de circuito: sin rejilla ni bordes. Una máscara azul casi negra y la serigrafía alrededor
// del chip, que se disuelven en el fondo de la sección; la luz del chip se derrama sobre ella.
const PLACA_FS = /* glsl */ `
  ${UNIFORMES}
  ${TRAZOS}
  varying vec3 vMundo;
  varying vec3 vN;
  void main() {
    float r = length(vMundo.xz);
    float d = max(abs(vMundo.x), abs(vMundo.z));
    vec3 c = vec3(0.008, 0.018, 0.045) * exp(-r * r / 60.0);
    c += vec3(0.45, 0.55, 0.75) * linea(d - ${f1(CHIP / 2 + 0.95)}, 0.5) * 0.09 * exp(-r * r / 90.0);
    c += vec3(0.16, 0.28, 0.6) * exp(-r * r / 30.0) * 0.09 * uEnergia;
    gl_FragColor = vec4(c, 0.0);
  }
`;

// Aristas: las del chip y las láminas siempre; las del edificio, tenues antes de construirse
// (el plano) y firmes una vez construidas.
const ARISTAS_VS = /* glsl */ `
  attribute float aTipo; // 0 chip y láminas, 1 edificio
  varying float vY;
  varying float vTipo;
  void main() {
    vY = position.y;
    vTipo = aTipo;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const ARISTAS_FS = /* glsl */ `
  ${UNIFORMES}
  varying float vY;
  varying float vTipo;
  void main() {
    float frente = exp(-abs(vY - uAltura) / 0.06) * uObra;
    float a;
    if (vTipo < 0.5) a = 0.1 + 0.2 * uEnergia;
    else a = mix(0.06, 0.16, step(vY, uAltura)) + frente * 1.2;
    vec3 col = mix(vec3(0.45, 0.62, 0.95), vec3(0.86, 0.93, 1.0), clamp(frente + 0.25 * vTipo, 0.0, 1.0));
    gl_FragColor = vec4(col, a);
  }
`;

// Pistas del circuito: la energía corre hacia el chip mientras construye.
// Pistas del circuito: vienen desde el fondo y la corriente corre por ellas hacia el chip.
const PISTAS_VS = /* glsl */ `
  attribute vec4 aPista; // distancia al chip, largo, fase, velocidad (unidades por segundo)
  varying vec4 vPista;
  varying vec2 vXZ;
  void main() {
    vPista = aPista;
    vXZ = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const PISTAS_FS = /* glsl */ `
  ${UNIFORMES}
  ${CORRIENTE}
  varying vec4 vPista;
  varying vec2 vXZ;
  void main() {
    float tras = vPista.x - cabezaPaquete(vPista.z, vPista.w, vPista.y, uTime); // > 0: detrás (más lejos del chip)
    float cola = tras > 0.0 ? exp(-tras / 1.5) : exp(tras / 0.05);
    float paquetes = tras > 0.08 ? 0.35 + 0.65 * step(0.42, fract(tras * 3.4)) : 1.0;
    float corriente = cola * paquetes * (0.35 + 0.65 * uEnergia) * (1.0 + 0.7 * uObra);
    float cerca = exp(-dot(vXZ, vXZ) / 170.0);
    vec3 col = mix(vec3(0.26, 0.42, 0.82), vec3(0.86, 0.94, 1.0), clamp(corriente, 0.0, 1.0));
    gl_FragColor = vec4(col, ((0.07 + 0.15 * uEnergia) + corriente * 1.3) * cerca);
  }
`;

// Datos que suben: del chip al frente de obra mientras se construye; después, sobre el techo.
const DATOS_VS = /* glsl */ `
  ${UNIFORMES}
  attribute vec4 aDato; // x, z, velocidad, fase
  varying float vA;
  void main() {
    float k = fract(aDato.w + uTime * aDato.z);
    // En obra: del chip al frente de luz. Terminado: sobre el techo, despacio.
    float yObra = ${f1(Y0)} + k * max(uAltura - ${f1(Y0)}, 0.0);
    float techo = ${f1(Y_CORNISA + TEJA)} + ${f1(SUBIDA)} * (1.0 - abs(aDato.x) / ${f1(ENT_ANCHO / 2)});
    float y = mix(techo + 0.04 + k * 2.1, yObra, uObra);
    vec4 mv = viewMatrix * vec4(aDato.x, y, aDato.y, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (140.0 + 120.0 * fract(aDato.w * 7.31)) / -mv.z * uPx;
    vA = mix((1.0 - k) * (1.0 - k) * 0.2 * uHecho, (0.3 + 0.7 * k) * 0.7, uObra);
  }
`;
const DATOS_FS = /* glsl */ `
  varying float vA;
  void main() {
    vec2 q = gl_PointCoord - 0.5;
    float ancho = 1.0 - smoothstep(0.02, 0.09, abs(q.x));
    float cola = pow(1.0 - gl_PointCoord.y, 1.6); // la cabeza arriba, la cola se apaga abajo
    gl_FragColor = vec4(vec3(0.68, 0.82, 1.0), ancho * cola * vA);
  }
`;

// Isotipo dorado en el tímpano.
const LOGO_VS = /* glsl */ `
  varying vec2 vUv;
  varying float vY;
  void main() {
    vUv = uv;
    vY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const LOGO_FS = /* glsl */ `
  uniform sampler2D uLogo;
  uniform float uAltura;
  varying vec2 vUv;
  varying float vY;
  void main() {
    if (vY > uAltura) discard;
    float a = texture2D(uLogo, vUv).a;
    gl_FragColor = vec4(vec3(1.0, 0.72, 0.26), a * 0.95); // tapa la piedra: el dorado se ve dorado
  }
`;

// Fundido: el borde izquierdo se apaga donde está el texto (pantalla ancha) y los demás bordes
// se funden con el fondo de la sección.
const FUNDIDO = /* glsl */ `
  uniform float uLateral;
  float fundido(vec2 uv) {
    float izq = mix(smoothstep(0.0, 0.06, uv.x), smoothstep(0.03, 0.26, uv.x), uLateral);
    return izq * (1.0 - smoothstep(0.96, 1.0, uv.x)) * smoothstep(0.0, 0.12, uv.y) * (1.0 - smoothstep(0.84, 1.0, uv.y));
  }
`;

/* ───────── Montaje ───────── */

export function montarTemplo3D(seccion, marco, canvas, { quieto = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1.74, 0.5, 120);
  const u = {
    uTime: { value: 0 },
    uAltura: { value: quieto ? Y_CUMBRE + 0.1 : Y0 - 0.02 },
    uObra: { value: 0 },
    uHecho: { value: quieto ? 1 : 0 },
    uEnergia: { value: quieto ? 1 : 0.15 },
    uLogo: { value: null },
    uMarca: { value: null },
  };
  const uFundido = { uLateral: { value: 1 } };
  const material = (fragmentShader, extra) => new THREE.ShaderMaterial({ uniforms: u, vertexShader: MUNDO_VS, fragmentShader, ...extra });
  // Lo sólido queda un poco detrás de sus propias aristas.
  const SOLIDO = { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 };

  /* Placa de circuito */
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(48, 48).rotateX(-Math.PI / 2), material(PLACA_FS, { depthWrite: false }));

  /* Chip: encapsulado biselado, tapa, núcleo de vidrio, patas y contactos */
  const biselado = (lado, alto, bisel, yBase) => {
    const m = lado / 2 - bisel;
    const forma = new THREE.Shape([new THREE.Vector2(-m, -m), new THREE.Vector2(m, -m), new THREE.Vector2(m, m), new THREE.Vector2(-m, m)]);
    return new THREE.ExtrudeGeometry(forma, { depth: alto - 2 * bisel, bevelThickness: bisel, bevelSize: bisel, bevelSegments: 1 })
      .rotateX(-Math.PI / 2)
      .translate(0, yBase + bisel, 0);
  };
  const encapsulado = biselado(CHIP, CHIP_ALTO, 0.05, CHIP_BASE);
  const chip = new THREE.Mesh(encapsulado, material(METAL_FS, SOLIDO));
  const geoTapa = biselado(TAPA, 0.06, 0.02, Y_PAQ);
  const tapa = new THREE.Mesh(geoTapa, material(METAL_FS, { ...SOLIDO, defines: { TAPA: "" } }));
  const geoNucleo = caja(NUCLEO, 0.06, NUCLEO, 0, Y_PAQ + 0.08, 0);
  const vidrio = new THREE.Mesh(geoNucleo, material(VIDRIO_FS, sumaDeLuz(true)));
  // Pata de ala de gaviota: sale del costado, baja y apoya el pie en su contacto.
  const bajada = Math.hypot(0.12, 0.275);
  const geoPata = mergeGeometries(
    [
      new THREE.BoxGeometry(0.14, 0.04, 0.26).translate(0, CHIP_BASE + 0.18, 0.13),
      new THREE.BoxGeometry(0.14, 0.04, bajada).rotateX(Math.atan2(0.275, 0.12)).translate(0, (CHIP_BASE + 0.18 + 0.02) / 2, 0.32),
      new THREE.BoxGeometry(0.14, 0.04, 0.28).translate(0, 0.02, 0.52),
    ].map(soloForma),
  );
  const patas = new THREE.InstancedMesh(geoPata, material(METAL_FS, { ...SOLIDO, defines: { PATA: "", FLUJO: "" } }), PATAS * 4);
  const contactos = new THREE.InstancedMesh(new THREE.BoxGeometry(0.21, 0.01, 0.36).translate(0, 0.005, 0.52), material(CONTACTO_FS), PATAS * 4);
  const m4 = new THREE.Matrix4();
  const rot = new THREE.Matrix4();
  const posPata = (i) => -2.85 + (i * 5.7) / (PATAS - 1);
  let k = 0;
  for (let s = 0; s < 4; s++) {
    rot.makeRotationY((s * Math.PI) / 2);
    for (let i = 0; i < PATAS; i++, k++) {
      m4.makeTranslation(posPata(i), 0, CHIP / 2).premultiply(rot);
      patas.setMatrixAt(k, m4);
      contactos.setMatrixAt(k, m4);
    }
  }
  // Grabado en el borde del encapsulado (se pinta cuando la tipografía está lista).
  const marca = new THREE.Mesh(
    new THREE.PlaneGeometry(3.0, 0.32).rotateX(-Math.PI / 2),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: MARCA_VS, fragmentShader: MARCA_FS, ...sumaDeLuz(false) }),
  );
  marca.position.set(0, Y_PAQ + 0.004, CHIP / 2 - 0.36);
  marca.visible = false;
  {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = 112;
    const pintar = () => {
      const x = c.getContext("2d");
      x.fillStyle = "#fff";
      x.font = "400 62px 'Space Mono', ui-monospace, monospace";
      x.textAlign = "center";
      x.textBaseline = "middle";
      if ("letterSpacing" in x) x.letterSpacing = "14px";
      x.fillText("GOBERNA TECH", 512, 58);
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      u.uMarca.value = tex;
      marca.visible = true;
      if (quieto) lienzo?.dibujar();
    };
    (document.fonts ? document.fonts.load("400 62px 'Space Mono'") : Promise.resolve()).then(pintar, pintar);
  }

  /* Edificio */
  const piezas = [
    caja(ENT_ANCHO + 0.53, ESCALON, ENT_LARGO + 0.53, 0, Y0, 0), // escalinata
    caja(ENT_ANCHO + 0.33, ESCALON, ENT_LARGO + 0.33, 0, Y0 + ESCALON, 0),
    caja(ENT_ANCHO + 0.13, ESCALON, ENT_LARGO + 0.13, 0, Y0 + 2 * ESCALON, 0),
    caja(1.9, COL_ALTO, 3.0, 0, Y_ESTILO, CELLA_FRENTE - 1.5), // cella
    caja(ENT_ANCHO, Y_FRISO - Y_ARQ, ENT_LARGO, 0, Y_ARQ, 0), // arquitrabe
    caja(ENT_ANCHO, Y_CORNISA0 - Y_FRISO, ENT_LARGO, 0, Y_FRISO, 0), // friso
    caja(ENT_ANCHO + 0.14, Y_CORNISA - Y_CORNISA0, ENT_LARGO + 0.14, 0, Y_CORNISA0, 0), // cornisa
    prisma(ENT_ANCHO, SUBIDA, ENT_LARGO, Y_CORNISA), // tímpanos
    faldon(1), // techo
    faldon(-1),
  ].map(soloForma);
  const edificio = new THREE.Mesh(mergeGeometries(piezas), material(PIEDRA_FS, SOLIDO));
  const posiciones = [];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 8; j++) if (i === 0 || i === 5 || j === 0 || j === 7) posiciones.push([(i - 2.5) * PASO, (j - 3.5) * PASO]);
  }
  const columnas = new THREE.InstancedMesh(columna(), material(PIEDRA_FS, { ...SOLIDO, defines: { COLUMNA: "" } }), posiciones.length);
  posiciones.forEach(([x, z], i) => columnas.setMatrixAt(i, m4.makeTranslation(x, Y_ESTILO, z)));

  /* Aristas (chip, láminas y edificio, en un solo dibujo) */
  const listas = [];
  const tipos = [];
  const sumarAristas = (geometria, tipo) => {
    const p = new THREE.EdgesGeometry(geometria, 20).attributes.position.array;
    listas.push(p);
    tipos.push(new Float32Array(p.length / 3).fill(tipo));
  };
  [encapsulado, geoTapa, geoNucleo].forEach((g) => sumarAristas(g, 0));
  piezas.forEach((g, i) => i !== 3 && sumarAristas(g, 1)); // la cella, sin aristas: queda detrás de las columnas
  const geoAristas = new THREE.BufferGeometry();
  geoAristas.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(listas.flatMap((a) => Array.from(a))), 3));
  geoAristas.setAttribute("aTipo", new THREE.BufferAttribute(Float32Array.from(tipos.flatMap((a) => Array.from(a))), 1));
  const aristas = new THREE.LineSegments(geoAristas, new THREE.ShaderMaterial({ uniforms: u, vertexShader: ARISTAS_VS, fragmentShader: ARISTAS_FS, ...sumaDeLuz(true) }));

  /* Pistas del circuito: una por pata. Salen del contacto, se abren en abanico con quiebres a
     45° y siguen hasta perderse en el fondo. */
  let semilla = 11;
  const azar = () => ((semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0) / 4294967296);
  const vertices = [];
  const datosPista = [];
  const flujo = new Float32Array(PATAS * 4 * 3); // por pata: fase, velocidad y largo de su pista
  const v = new THREE.Vector3();
  const salida = CHIP / 2 + 0.7; // borde exterior de los contactos
  const HASTA = 21; // las pistas terminan lejos, donde ya no se ven
  for (let s = 0, n = 0; s < 4; s++) {
    rot.makeRotationY((s * Math.PI) / 2);
    for (let i = 0; i < PATAS; i++, n++) {
      const a = posPata(i);
      const afuera = Math.sign(a) || 1;
      // En coordenadas del lado +z: avanza en z (hacia afuera) y se abre en x.
      const puntos = [[a, salida]];
      const avanza = (dx, dz) => {
        const [x, z] = puntos[puntos.length - 1];
        puntos.push([x + dx, z + dz]);
      };
      avanza(0, 0.3 + azar() * 0.5);
      const l2 = Math.abs(a) * 0.9 + azar() * 0.25; // las de afuera se abren más
      avanza(afuera * l2 * Math.SQRT1_2, l2 * Math.SQRT1_2);
      avanza(0, 0.8 + azar() * 2.6);
      if (azar() < 0.55) {
        const l4 = 0.4 + azar() * 1.4;
        avanza(afuera * l4 * Math.SQRT1_2, l4 * Math.SQRT1_2);
      }
      avanza(0, HASTA - puntos[puntos.length - 1][1]);
      let largo = 0;
      for (let p = 1; p < puntos.length; p++) largo += Math.hypot(puntos[p][0] - puntos[p - 1][0], puntos[p][1] - puntos[p - 1][1]);
      const fase = azar();
      const vel = 3.2 + azar() * 3.2;
      flujo.set([fase, vel, largo], n * 3);
      let recorrido = 0;
      for (let p = 0; p < puntos.length - 1; p++) {
        const [x0, z0] = puntos[p];
        const [x1, z1] = puntos[p + 1];
        v.set(x0, 0.006, z0).applyMatrix4(rot);
        vertices.push(v.x, v.y, v.z);
        datosPista.push(recorrido, largo, fase, vel);
        recorrido += Math.hypot(x1 - x0, z1 - z0);
        v.set(x1, 0.006, z1).applyMatrix4(rot);
        vertices.push(v.x, v.y, v.z);
        datosPista.push(recorrido, largo, fase, vel);
      }
    }
  }
  geoPata.setAttribute("aFlujo", new THREE.InstancedBufferAttribute(flujo, 3));
  const geoPistas = new THREE.BufferGeometry();
  geoPistas.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geoPistas.setAttribute("aPista", new THREE.Float32BufferAttribute(datosPista, 4));
  const pistas = new THREE.LineSegments(geoPistas, new THREE.ShaderMaterial({ uniforms: u, vertexShader: PISTAS_VS, fragmentShader: PISTAS_FS, ...sumaDeLuz(true) }));

  /* Datos que suben */
  const N_DATOS = 200;
  const aDato = new Float32Array(N_DATOS * 4);
  for (let i = 0; i < N_DATOS; i++) aDato.set([(azar() * 2 - 1) * 1.55, (azar() * 2 - 1) * 2.2, 0.22 + azar() * 0.3, azar()], i * 4);
  const geoDatos = new THREE.BufferGeometry();
  geoDatos.setAttribute("aDato", new THREE.BufferAttribute(aDato, 4));
  geoDatos.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N_DATOS * 3), 3));
  const datos = new THREE.Points(geoDatos, new THREE.ShaderMaterial({ uniforms: u, vertexShader: DATOS_VS, fragmentShader: DATOS_FS, ...sumaDeLuz(true) }));

  /* Isotipo en el tímpano (se carga aparte; mientras tanto no se ve) */
  const ALTO_LOGO = 0.34;
  const logo = new THREE.Mesh(
    new THREE.PlaneGeometry(ALTO_LOGO * (80.26 / 92.22), ALTO_LOGO),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: LOGO_VS, fragmentShader: LOGO_FS, transparent: true, depthWrite: false }),
  );
  logo.position.set(0, Y_CORNISA + 0.19, ENT_LARGO / 2 + 0.012);
  logo.visible = false;
  fetch("/isotipo.svg")
    .then((r) => r.text())
    .then((svg) => {
      // Se le da tamaño propio al dibujo (solo trae viewBox) para que todos los navegadores lo pinten.
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 256;
        c.height = 294;
        c.getContext("2d").drawImage(img, 0, 0, 256, 294);
        u.uLogo.value = new THREE.CanvasTexture(c);
        logo.visible = true;
        if (quieto) lienzo?.dibujar();
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg width="256" height="294" '));
    })
    .catch(() => {});

  // Orden: placa, sólidos, luces que se suman.
  [placa, contactos, chip, tapa, patas, edificio, columnas, vidrio, marca, pistas, aristas, logo, datos].forEach((o, i) => {
    o.frustumCulled = false;
    o.renderOrder = i;
    scene.add(o);
  });

  /* Cuándo empieza la obra: cuando se ve al menos un tercio del recuadro. */
  let empezo = quieto;
  new IntersectionObserver(
    ([en]) => {
      if (en.intersectionRatio >= 0.33) empezo = true;
    },
    { threshold: [0, 0.33, 0.6] },
  ).observe(marco);

  /* Puntero: la cámara gira un poco a su alrededor. */
  const puntero = { x: 0, y: 0, sx: 0, sy: 0, dentro: false };
  if (!quieto) {
    seccion.addEventListener("pointermove", (e) => {
      if (e.pointerType === "touch") return;
      const r = marco.getBoundingClientRect();
      puntero.x = THREE.MathUtils.clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1.5, 1.5);
      puntero.y = THREE.MathUtils.clamp(1 - ((e.clientY - r.top) / r.height) * 2, -1.5, 1.5);
      puntero.dentro = true;
    });
    seccion.addEventListener("pointerleave", () => (puntero.dentro = false));
  }

  /* Animación */
  let obra = quieto ? 1.25 : 0; // 0…1 construye; 1…1.25 se asienta
  const suave = (a, b, x) => {
    const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1);
    return t * t * (3 - 2 * t);
  };
  function alAnimar(t, dt) {
    u.uTime.value = quieto ? 20 : t;
    if (empezo && obra < 1.25) obra = Math.min(1.25, obra + dt / DURA);
    u.uEnergia.value = 0.15 + 0.85 * suave(0, 0.18, obra);
    u.uAltura.value = THREE.MathUtils.lerp(Y0 - 0.02, Y_CUMBRE + 0.08, suave(0.15, 1, obra));
    u.uObra.value = suave(0.02, 0.12, obra) * (1 - suave(1, 1.25, obra));
    u.uHecho.value = suave(1, 1.25, obra);

    const sigue = 1 - Math.exp(-dt * 3);
    puntero.sx += ((puntero.dentro ? puntero.x : 0) - puntero.sx) * sigue;
    puntero.sy += ((puntero.dentro ? puntero.y : 0) - puntero.sy) * sigue;
    const az = AZIMUT + puntero.sx * 0.13;
    const el = ALTURA + puntero.sy * 0.05;
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(DISTANCIA).add(OBJETIVO);
    camera.lookAt(OBJETIVO);
    camera.updateMatrixWorld();
  }

  const lienzo = crearLienzo3D({
    canvas,
    marco,
    scene,
    camera,
    u,
    quieto,
    brillo: 0.5,
    muestras: 4,
    exposicion: 1.15,
    maxPixeles: 2.0e6,
    fundido: FUNDIDO,
    uFundido,
    alMedir: () => (uFundido.uLateral.value = innerWidth > 900 ? 1 : 0),
    alAnimar,
  });
  return lienzo;
}
