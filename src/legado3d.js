// Sección "Tu legado permanece": las tres etapas del servicio —Gestión, Trayectoria y Legado— en 3D
// (three.js), en lugar de la ilustración de paneles.
//   · Legado es la pieza central (el panel más grande, adelante); Gestión y Trayectoria lo
//     acompañan en ángulo, con profundidad.
//   · Una órbita dorada se traza alrededor; su cometa pasa por cada etapa y, a su paso, el panel
//     de esa etapa gira hasta quedar de frente y una luz le cruza el vidrio: Gestión (barras que
//     crecen), Trayectoria (una línea que se dibuja) y, al final, Legado: el sello se abre con un
//     destello de rayos, la órbita se enciende y el palacio del isotipo sale del vidrio en oro
//     macizo (3D) y queda flotando, con un brillo debajo que respira con su vuelo.
//   · Como en la página de los libros: los paneles llegan desenfocados y oscuros y se aclaran al
//     acomodarse, y la escena se abre desde cerca, como un plano de cine, y luego respira.
//   · La línea de tiempo de la derecha se enciende al mismo ritmo (clases en la lista .g-pasos).
//   · Después queda en calma: polvo dorado que flota, los paneles respiran, la cámara se mece
//     despacio, el cometa sigue su órbita y, cada tanto, una luz suave cruza un vidrio.
//   · Al pasar el puntero por una etapa de la línea de tiempo, su panel se destaca.
// El lienzo, el resplandor, el fundido y el cuidado del equipo están en lienzo3d.js.
import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { crearLienzo3D } from "./lienzo3d.js";

const ETAPAS = [
  { num: "01", nombre: "GESTIÓN", pos: [-1.46, -0.5, -0.1], rot: [-0.04, 0.46, 0.02], tam: [1.62, 1.1], llega: 0.4 },
  { num: "02", nombre: "TRAYECTORIA", pos: [-0.2, 0.68, -0.85], rot: [-0.02, 0.16, 0], tam: [1.84, 1.24], llega: 0.72 },
  { num: "03", nombre: "LEGADO", pos: [1.04, -0.22, 0.42], rot: [-0.05, -0.34, -0.01], tam: [2.2, 1.48], llega: 1.06 },
];
const RADIO = 0.09; // esquinas de los paneles
const ORBITA = { centro: new THREE.Vector3(0.0, -0.1, -0.1), a: 2.7, b: 1.55, inclinacion: 0.38, giro: 0.14 };
const SALIDA = 0.14; // el cometa arranca adelante a la derecha (en vueltas de la órbita)
const AVANCE = ["13%", "50%", "100%"]; // hasta dónde se enciende la línea de tiempo en cada etapa
const OBJETIVO = new THREE.Vector3(-0.02, 0.1, -0.1);
const MEDIO_ANCHO = 2.33; // medio ancho de los paneles en pantalla: la cámara se aleja lo necesario para que quepan
const CABE = 0.84; // qué parte del ancho del lienzo ocupan (el resto queda para el fundido de los bordes)

// Suma de luz: el color se suma tal cual y el alfa dice cuánto resplandece (ver lienzo3d.js).
const SUMA = { transparent: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor };

/* ───────── Shaders ───────── */

const PANEL_VS = /* glsl */ `
  varying vec3 vLocal;
  varying vec3 vNl;
  varying vec3 vMundo;
  varying vec3 vN;
  void main() {
    vLocal = position;
    vNl = normal;
    vec4 m = modelMatrix * vec4(position, 1.0);
    vMundo = m.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * m;
  }
`;

// Vidrio: un velo de luz más claro arriba, un reflejo en la esquina, el canto encendido por
// fresnel y un filete fino (más claro arriba, donde da la luz). Encima, el contenido de la etapa,
// que se revela a su modo; la luz que cruza el vidrio y, en Legado, los rayos del sello.
const PANEL_FS = /* glsl */ `
  uniform sampler2D uMapa;
  uniform vec2 uTam;
  uniform float uModo;     // 0 barras, 1 línea, 2 sello
  uniform float uAparece;  // 0…1
  uniform float uRevela;   // 0…1
  uniform float uDestaca;  // 0…1
  uniform float uAtenua;   // 1, o menos si se destaca otro
  uniform float uBarrido;  // 0…1: la luz que cruza el vidrio
  uniform float uBarridoFuerza;
  uniform float uRayos;    // 0…1: destello del sello
  uniform float uHalo;     // 0…1: brillo dorado bajo el palacio (respira con su vuelo)
  uniform float uTime;
  varying vec3 vLocal;
  varying vec3 vNl;
  varying vec3 vMundo;
  varying vec3 vN;
  float lum(vec3 c) { return dot(c, vec3(0.333)); }
  float caja(vec2 p, vec2 b, float r) {
    vec2 q = abs(p) - b + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vMundo);
    float fres = 1.0 - abs(dot(N, V));
    fres *= fres * fres;
    float frente = step(0.95, vNl.z); // solo la cara de adelante: el bisel queda para el fresnel
    vec2 uv = vLocal.xy / uTam + 0.5;

    vec3 vidrio = vec3(0.06, 0.095, 0.19) * (0.45 + 0.55 * uv.y) * frente;
    float esquina = max(1.0 - length(uv - vec2(0.0, 1.0)) * 0.95, 0.0);
    vidrio += vec3(0.3, 0.42, 0.7) * esquina * esquina * esquina * 0.14 * frente;
    float d = caja(vLocal.xy, uTam * 0.5, ${RADIO.toFixed(3)});
    float w = max(fwidth(d), 1e-5);
    float filete = (1.0 - smoothstep(0.0, 1.5 * w, abs(d + 0.014))) * frente;
    vec3 canto = vec3(0.55, 0.7, 1.0) * (fres + filete * (0.3 + 0.6 * uv.y)) * (1.0 + 0.8 * uDestaca);

    // Contenido y su revelado.
    vec4 t = texture2D(uMapa, uv, (1.0 - uAparece) * 4.5); // llega desenfocado y se aclara
    float m;
    vec3 extra = vec3(0.0);
    if (uModo < 0.5) {
      float h = uRevela * 1.35 - uv.x * 0.45; // las barras crecen, de izquierda a derecha
      m = 1.0 - smoothstep(h - 0.03, h, uv.y);
    } else if (uModo < 1.5) {
      float x = uRevela * 1.12 - 0.05; // la línea se dibuja con una punta de luz
      m = 1.0 - smoothstep(x - 0.015, x, uv.x);
      float p = (uv.x - x) * 45.0;
      extra = vec3(0.85, 0.92, 1.0) * exp(-p * p) * t.a * (1.0 - smoothstep(0.85, 1.0, uRevela)) * 1.5;
    } else {
      vec2 q = (uv - vec2(0.5, 0.42)) * vec2(uTam.x / uTam.y, 1.0);
      float r = length(q);
      float R = uRevela * 0.85; // el sello se abre desde el centro con un anillo dorado
      m = 1.0 - smoothstep(R - 0.03, R, r);
      float a = (r - R) * 26.0;
      extra = vec3(1.0, 0.74, 0.3) * exp(-a * a) * (1.0 - uRevela) * 0.7 * step(0.001, uRevela) * frente;
      // Rayos y halo del sello.
      float ang = r > 0.001 ? atan(q.y, q.x) : 0.0;
      float haz = 0.5 + 0.5 * cos(ang * 14.0 + uTime * 0.35);
      haz *= haz;
      haz *= haz;
      extra += vec3(1.0, 0.74, 0.32) * (haz * exp(-r * 3.4) * smoothstep(0.2, 0.3, r) * 0.8 + exp(-r * r * 10.0) * 0.3) * uRayos * frente;
      extra += vec3(1.0, 0.72, 0.3) * exp(-r * r * 7.0) * 0.3 * uHalo * frente;
    }
    if (uv.y > 0.78 && uv.x < 0.7) m = smoothstep(0.0, 0.35, uRevela); // el rótulo aparece aparte
    vec3 contenido = t.rgb * t.a * m * frente * (0.85 + 0.5 * uDestaca);

    // La luz que cruza el vidrio (al llegar y, cada tanto, en calma).
    float k = (uv.x * 0.75 + uv.y * 0.35 - (uBarrido * 1.7 - 0.35)) * 12.0;
    vec3 barrido = vec3(0.75, 0.86, 1.0) * exp(-k * k) * sin(3.14159 * clamp(uBarrido, 0.0, 1.0)) * uBarridoFuerza * 0.3 * frente;

    float vivo = uAparece * mix(0.25, 1.0, uAparece) * uAtenua; // de oscuro a encendido
    vec3 c = (vidrio + canto + contenido + extra + barrido) * vivo;
    float resplandor = lum(contenido * 0.7 + extra + canto * 0.4 + barrido) * vivo;
    gl_FragColor = vec4(c, clamp(resplandor / max(lum(c), 1e-3), 0.0, 1.0));
  }
`;

// Oro macizo del palacio: luz desde arriba a la izquierda, un entorno simulado que refleja (cálido
// arriba, azul noche abajo, una franja de luz en el horizonte), brillo especular y borde por fresnel.
// Solo los brillos alimentan el resplandor.
const ORO_VS = /* glsl */ `
  varying vec3 vMundo;
  varying vec3 vN;
  void main() {
    vec4 m = modelMatrix * vec4(position, 1.0);
    vMundo = m.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * m;
  }
`;
const ORO_FS = /* glsl */ `
  uniform float uSale; // 0…1: sale del vidrio y se enciende
  varying vec3 vMundo;
  varying vec3 vN;
  const vec3 LUZ = normalize(vec3(-0.45, 0.75, 0.55));
  const vec3 ORO = vec3(1.0, 0.7, 0.26);
  float lum(vec3 c) { return dot(c, vec3(0.333)); }
  void main() {
    vec3 N = normalize(vN);
    vec3 V = normalize(cameraPosition - vMundo);
    vec3 R = reflect(-V, N);
    float difusa = max(dot(N, LUZ), 0.0);
    float b = (R.y - 0.12) * 6.0;
    vec3 entorno = mix(vec3(0.04, 0.06, 0.14), vec3(1.0, 0.86, 0.62), smoothstep(-0.25, 0.85, R.y)) + vec3(0.9, 0.74, 0.5) * exp(-b * b) * 0.55;
    vec3 H = normalize(LUZ + V);
    float especular = pow(max(dot(N, H), 0.0), 64.0);
    float f = 1.0 - max(dot(N, V), 0.0);
    float fres = f * f * f * f;
    vec3 fuerte = vec3(1.0, 0.93, 0.78) * especular * 0.85 + ORO * fres * 0.35;
    vec3 c = (ORO * (0.1 + 0.5 * difusa) + ORO * entorno * 0.55 + fuerte) * uSale;
    gl_FragColor = vec4(c, clamp(lum(fuerte) / max(lum(c), 1e-3), 0.0, 1.0) * uSale);
  }
`;

// Órbita dorada: se traza al empezar y la recorre un cometa. La mitad de atrás se ve más tenue.
const ORBITA_VS = /* glsl */ `
  uniform vec3 uCentro;
  varying float vT;
  varying float vAdelante;
  void main() {
    vT = uv.x;
    vec4 m = modelMatrix * vec4(position, 1.0);
    vec4 mv = viewMatrix * m;
    vec4 c = viewMatrix * vec4(uCentro, 1.0);
    vAdelante = clamp((mv.z - c.z) / 2.4 + 0.5, 0.0, 1.0);
    gl_Position = projectionMatrix * mv;
  }
`;
const ORBITA_FS = /* glsl */ `
  uniform float uCometa;  // posición del cometa, en vueltas
  uniform float uTrazo;   // cuánto de la órbita está trazado (0…1), desde la salida
  uniform float uFuerza;
  uniform float uDestello; // se enciende cuando llega Legado
  varying float vT;
  varying float vAdelante;
  void main() {
    float desde = fract(vT - ${SALIDA.toFixed(3)});
    if (desde > uTrazo) discard;
    float tras = fract(uCometa - vT); // 0 en la cabeza, crece hacia la cola
    float cola = exp(-tras * 8.0);
    float cabeza = exp(-tras * 160.0);
    vec3 oro = vec3(0.95, 0.68, 0.24);
    vec3 c = oro * (0.3 + 0.9 * cola + 0.8 * uDestello) + vec3(1.0, 0.93, 0.78) * cabeza * 1.3;
    c *= mix(0.4, 1.0, vAdelante) * uFuerza;
    gl_FragColor = vec4(c, clamp((0.4 + cola + uDestello) * uFuerza, 0.0, 1.0));
  }
`;

// Polvo dorado y azul que flota alrededor: da profundidad cuando la cámara se mece.
const POLVO_VS = /* glsl */ `
  uniform float uTime;
  uniform float uPx;
  uniform float uEntrada;
  attribute vec4 aPolvo; // x, y, z, azar
  varying float vA;
  varying float vOro;
  void main() {
    float r = aPolvo.w;
    vec3 p = aPolvo.xyz;
    p.y = mod(p.y + uTime * (0.035 + 0.07 * r) + 1.8, 3.6) - 1.8;
    p.x += sin(uTime * 0.3 + r * 30.0) * 0.12;
    p.z += cos(uTime * 0.25 + r * 20.0) * 0.12;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (12.0 + 34.0 * r * r) / -mv.z * uPx;
    float borde = 1.0 - smoothstep(1.3, 1.8, abs(p.y));
    vA = borde * (0.4 + 0.6 * (0.5 + 0.5 * sin(uTime * (0.8 + r) + r * 40.0))) * uEntrada;
    vOro = step(0.42, fract(r * 13.7));
  }
`;
const POLVO_FS = /* glsl */ `
  varying float vA;
  varying float vOro;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-d * d * 7.0) * (1.0 - smoothstep(0.85, 1.0, d)) * vA;
    vec3 c = mix(vec3(0.55, 0.72, 1.0), vec3(1.0, 0.76, 0.34), vOro);
    gl_FragColor = vec4(c * a * 0.55, a * 0.5);
  }
`;

// Luz de escenario bajo los paneles: azul suave con un centro apenas dorado.
const PISO_VS = /* glsl */ `
  varying vec3 vMundo;
  void main() {
    vec4 m = modelMatrix * vec4(position, 1.0);
    vMundo = m.xyz;
    gl_Position = projectionMatrix * viewMatrix * m;
  }
`;
const PISO_FS = /* glsl */ `
  uniform float uEntrada;
  varying vec3 vMundo;
  void main() {
    vec2 q = (vMundo.xz - vec2(0.3, -0.1)) * vec2(0.42, 0.78);
    float r2 = dot(q, q);
    vec3 c = vec3(0.12, 0.22, 0.5) * exp(-r2 * 1.3) * 0.32 + vec3(0.95, 0.66, 0.24) * exp(-r2 * 4.0) * 0.07;
    gl_FragColor = vec4(c * uEntrada, 0.0);
  }
`;

const FUNDIDO = /* glsl */ `
  float fundido(vec2 uv) {
    return smoothstep(0.0, 0.07, uv.x) * (1.0 - smoothstep(0.93, 1.0, uv.x)) * smoothstep(0.0, 0.1, uv.y) * (1.0 - smoothstep(0.9, 1.0, uv.y));
  }
`;

/* ───────── Contenido de los paneles (dibujado en 2D) ───────── */

const ORO = "#dfa52e";
const LINEA = "rgba(220, 232, 255, 0.96)";

function rotulo(x, e, W) {
  x.font = "400 44px 'Space Mono', ui-monospace, monospace";
  x.textBaseline = "alphabetic";
  if ("letterSpacing" in x) x.letterSpacing = "5px";
  x.fillStyle = ORO;
  x.fillText(e.num, 44, 82);
  x.fillStyle = "rgba(230, 238, 255, 0.94)";
  x.fillText(e.nombre, 44 + x.measureText(e.num).width + 26, 82);
  x.fillStyle = "rgba(200, 215, 255, 0.2)";
  x.fillRect(44, 108, W - 88, 2);
}

function barras(x, W, H) {
  const alturas = [0.3, 0.42, 0.37, 0.54, 0.62, 0.76, 0.92];
  const izq = W * 0.12;
  const paso = (W * 0.76) / alturas.length;
  const base = H * 0.86;
  const alto = H * 0.56;
  alturas.forEach((h, i) => {
    const ultima = i === alturas.length - 1;
    const bx = izq + i * paso + paso * 0.2;
    const bw = paso * 0.58;
    const top = base - h * alto;
    const g = x.createLinearGradient(0, top, 0, base);
    g.addColorStop(0, ultima ? "rgba(223, 165, 46, 0.6)" : "rgba(150, 182, 255, 0.55)");
    g.addColorStop(1, ultima ? "rgba(223, 165, 46, 0.04)" : "rgba(80, 118, 235, 0.05)");
    x.fillStyle = g;
    x.fillRect(bx, top, bw, base - top);
    x.save();
    x.shadowColor = ultima ? "rgba(242, 199, 102, 0.9)" : "rgba(170, 200, 255, 0.8)";
    x.shadowBlur = 18;
    x.fillStyle = ultima ? "#f2c766" : LINEA;
    x.fillRect(bx, top, bw, 6);
    x.restore();
  });
  x.fillStyle = "rgba(190, 208, 255, 0.4)";
  x.fillRect(W * 0.1, base, W * 0.8, 2);
}

function linea(x, W, H) {
  const pts = [[0, 0.16], [0.14, 0.27], [0.28, 0.22], [0.43, 0.41], [0.57, 0.45], [0.71, 0.61], [0.86, 0.68], [1, 0.88]];
  const X = (u) => W * 0.11 + u * W * 0.78;
  const Y = (v) => H * 0.86 - v * H * 0.56;
  x.strokeStyle = "rgba(190, 208, 255, 0.14)";
  x.lineWidth = 1.5;
  for (let k = 0; k < 4; k++) {
    x.beginPath();
    x.moveTo(W * 0.1, Y(k / 3));
    x.lineTo(W * 0.9, Y(k / 3));
    x.stroke();
  }
  const g = x.createLinearGradient(0, Y(0.9), 0, Y(0));
  g.addColorStop(0, "rgba(120, 160, 255, 0.4)");
  g.addColorStop(1, "rgba(80, 118, 235, 0.02)");
  x.beginPath();
  x.moveTo(X(0), Y(0));
  pts.forEach(([u, v]) => x.lineTo(X(u), Y(v)));
  x.lineTo(X(1), Y(0));
  x.closePath();
  x.fillStyle = g;
  x.fill();
  x.save();
  x.shadowColor = "rgba(170, 200, 255, 0.9)";
  x.shadowBlur = 16;
  x.beginPath();
  pts.forEach(([u, v], i) => (i ? x.lineTo(X(u), Y(v)) : x.moveTo(X(u), Y(v))));
  x.strokeStyle = LINEA;
  x.lineWidth = 6;
  x.lineJoin = "round";
  x.lineCap = "round";
  x.stroke();
  x.restore();
  pts.forEach(([u, v], i) => {
    const ultima = i === pts.length - 1;
    x.save();
    if (ultima) {
      x.shadowColor = "rgba(242, 199, 102, 0.95)";
      x.shadowBlur = 22;
    }
    x.beginPath();
    x.arc(X(u), Y(v), ultima ? 13 : 9, 0, Math.PI * 2);
    x.fillStyle = ultima ? ORO : "#0b1636";
    x.fill();
    x.restore();
    if (!ultima) {
      x.strokeStyle = LINEA;
      x.lineWidth = 4;
      x.stroke();
    } else {
      x.beginPath();
      x.arc(X(u), Y(v), 24, 0, Math.PI * 2);
      x.strokeStyle = "rgba(223, 165, 46, 0.45)";
      x.lineWidth = 2;
      x.stroke();
    }
  });
}

function sello(logo) {
  // logo: el isotipo plano, solo si el palacio 3D no está (si no, sale del vidrio en 3D).
  return (x, W, H) => {
    const cx = W * 0.5;
    const cy = H * 0.58;
    const r = H * 0.3;
    x.strokeStyle = "rgba(190, 208, 255, 0.28)";
    x.lineWidth = 2;
    x.beginPath();
    x.arc(cx, cy, r * 1.2, 0, Math.PI * 2);
    x.stroke();
    x.save();
    x.shadowColor = "rgba(242, 199, 102, 0.8)";
    x.shadowBlur = 14;
    x.strokeStyle = "rgba(223, 165, 46, 0.6)";
    x.lineWidth = 2.5;
    x.beginPath();
    x.arc(cx, cy, r * 1.03, 0, Math.PI * 2);
    x.stroke();
    x.restore();
    // Marcas alrededor, como en un sello.
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * Math.PI * 2;
      const l = i % 5 === 0 ? 13 : 6;
      x.strokeStyle = i % 5 === 0 ? "rgba(223, 165, 46, 0.7)" : "rgba(190, 208, 255, 0.3)";
      x.lineWidth = 2;
      x.beginPath();
      x.moveTo(cx + Math.cos(a) * r * 1.1, cy + Math.sin(a) * r * 1.1);
      x.lineTo(cx + Math.cos(a) * (r * 1.1 + l), cy + Math.sin(a) * (r * 1.1 + l));
      x.stroke();
    }
    if (logo) {
      const alto = r * 1.62;
      const ancho = alto * (80.26 / 92.22);
      x.save();
      x.shadowColor = "rgba(242, 199, 102, 0.85)";
      x.shadowBlur = 26;
      x.drawImage(logo, cx - ancho / 2, cy - alto / 2, ancho, alto);
      x.restore();
    }
  };
}

/* ───────── Montaje ───────── */

export function montarLegado3D(seccion, marco, canvas, pasos, { quieto = false } = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1.3, 0.5, 60);
  const u = { uTime: { value: 0 }, uEntrada: { value: quieto ? 1 : 0 } };

  /* Paneles de vidrio */
  const placa = (w, h) => {
    const r = RADIO;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -h / 2);
    s.lineTo(w / 2 - r, -h / 2);
    s.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
    s.lineTo(w / 2, h / 2 - r);
    s.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
    s.lineTo(-w / 2 + r, h / 2);
    s.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
    s.lineTo(-w / 2, -h / 2 + r);
    s.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
    return new THREE.ExtrudeGeometry(s, { depth: 0.035, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.014, bevelSegments: 2, curveSegments: 8 }).translate(0, 0, -0.018);
  };
  let logo = null;
  const paneles = ETAPAS.map((e, i) => {
    const H = 600;
    const W = Math.round((H * e.tam[0]) / e.tam[1]);
    const lienzo2d = document.createElement("canvas");
    lienzo2d.width = W;
    lienzo2d.height = H;
    const tex = new THREE.CanvasTexture(lienzo2d);
    tex.anisotropy = 8;
    const dibujo = [barras, linea, null][i];
    const pintar = () => {
      const x = lienzo2d.getContext("2d");
      x.clearRect(0, 0, W, H);
      rotulo(x, e, W);
      (dibujo ?? sello(logo))(x, W, H);
      tex.needsUpdate = true;
    };
    pintar();
    const uni = {
      uMapa: { value: tex },
      uTam: { value: new THREE.Vector2(...e.tam) },
      uModo: { value: i },
      uAparece: { value: quieto ? 1 : 0 },
      uRevela: { value: quieto ? 1 : 0 },
      uDestaca: { value: 0 },
      uAtenua: { value: 1 },
      uBarrido: { value: 0 },
      uBarridoFuerza: { value: 0 },
      uRayos: { value: quieto && i === 2 ? 0.2 : 0 },
      uHalo: { value: quieto && i === 2 ? 0.8 : 0 },
      uTime: u.uTime,
    };
    const malla = new THREE.Mesh(placa(...e.tam), new THREE.ShaderMaterial({ uniforms: uni, vertexShader: PANEL_VS, fragmentShader: PANEL_FS, ...SUMA, depthWrite: true }));
    malla.rotation.set(...e.rot);
    malla.position.set(...e.pos);
    return { e, malla, uni, pintar, aparece: quieto ? 1 : 0, revela: quieto ? 1 : 0, salio: quieto ? 0 : -1, destaca: 0, barrido: null };
  });
  // Se dibujan de atrás hacia adelante: el vidrio de adelante deja ver el de atrás.
  [...paneles].sort((p, q) => p.e.pos[2] - q.e.pos[2]).forEach((p, i) => (p.malla.renderOrder = 2 + i));

  // Tipografía y logo: cuando están listos, se vuelve a pintar el contenido.
  const repintar = () => {
    paneles.forEach((p) => p.pintar());
    if (quieto) lienzo?.dibujar();
  };
  (document.fonts ? document.fonts.load("400 44px 'Space Mono'") : Promise.resolve()).then(repintar, repintar);
  const legado = paneles[2];
  const uPalacio = { uSale: { value: quieto ? 1 : 0 } };
  let palacio = null;
  const ANCHO_PALACIO = 1.0; // en el panel de Legado (2,2 de ancho): el palacio manda
  fetch("/isotipo.svg")
    .then((r) => r.text())
    .then((svg) => {
      try {
        palacio = crearPalacio(svg);
      } catch {
        palacio = null;
      }
      if (palacio) {
        legado.malla.add(palacio);
        if (quieto) lienzo?.dibujar();
        return;
      }
      // Sin palacio 3D: el isotipo plano dentro del sello.
      const img = new Image();
      img.onload = () => {
        logo = img;
        repintar();
      };
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg width="402" height="462" '));
    })
    .catch(() => {});
  // Los tres trazos del templo (frontón, capiteles y columnas con su base), con volumen y bisel.
  function crearPalacio(svg) {
    const { paths } = new SVGLoader().parse(svg);
    const partes = paths
      .slice(2)
      .flatMap((p) => p.toShapes()) // respeta la regla de relleno del SVG: los huecos entre columnas quedan huecos
      .map((forma) => {
        const g = new THREE.ExtrudeGeometry(forma, { depth: 5, bevelEnabled: true, bevelThickness: 0.7, bevelSize: 0.4, bevelSegments: 2, curveSegments: 6 });
        g.deleteAttribute("uv");
        return g.index ? g.toNonIndexed() : g;
      });
    if (!partes.length) return null;
    const g = mergeGeometries(partes);
    g.rotateX(Math.PI); // el SVG tiene la y hacia abajo; el giro conserva el sentido de las caras
    g.computeBoundingBox();
    const caja = g.boundingBox;
    const centro = caja.getCenter(new THREE.Vector3());
    g.translate(-centro.x, -centro.y, -caja.min.z); // apoyado en el vidrio, hacia quien mira
    const escala = ANCHO_PALACIO / (caja.max.x - caja.min.x);
    const malla = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: uPalacio, vertexShader: ORO_VS, fragmentShader: ORO_FS }));
    malla.userData.escala = escala;
    malla.scale.setScalar(escala);
    malla.position.set(0, (0.42 - 0.5) * ETAPAS[2].tam[1], quieto ? 0.05 : -0.12);
    malla.visible = quieto;
    malla.frustumCulled = false;
    return malla;
  }

  /* Órbita dorada */
  const giro = new THREE.Matrix4().makeRotationZ(ORBITA.giro).multiply(new THREE.Matrix4().makeRotationX(ORBITA.inclinacion));
  class Elipse extends THREE.Curve {
    getPoint(t, destino = new THREE.Vector3()) {
      const a = t * Math.PI * 2;
      return destino.set(ORBITA.a * Math.cos(a), 0, ORBITA.b * Math.sin(a)).applyMatrix4(giro).add(ORBITA.centro);
    }
  }
  const geoOrbita = new THREE.TubeGeometry(new Elipse(), 440, 0.015, 8, true);
  const uOrbita = { uCentro: { value: ORBITA.centro }, uCometa: { value: SALIDA }, uTrazo: { value: quieto ? 1 : 0 }, uDestello: { value: 0 } };
  const orbitaMat = (fuerza, profundidad) =>
    new THREE.ShaderMaterial({ uniforms: { ...uOrbita, uFuerza: { value: fuerza } }, vertexShader: ORBITA_VS, fragmentShader: ORBITA_FS, ...SUMA, depthWrite: false, depthTest: profundidad });
  const orbita = new THREE.Mesh(geoOrbita, orbitaMat(1, true));
  const orbitaTras = new THREE.Mesh(geoOrbita, orbitaMat(0.22, false)); // tenue, la que pasa detrás del vidrio
  orbita.renderOrder = 10;
  orbitaTras.renderOrder = 11;

  /* Polvo y luz de escenario */
  let semilla = 23;
  const azar = () => ((semilla = (Math.imul(semilla, 1664525) + 1013904223) >>> 0) / 4294967296);
  const N_POLVO = 170;
  const aPolvo = new Float32Array(N_POLVO * 4);
  for (let i = 0; i < N_POLVO; i++) aPolvo.set([-3.2 + azar() * 6.4, -1.8 + azar() * 3.6, -2.4 + azar() * 3.8, azar()], i * 4);
  const geoPolvo = new THREE.BufferGeometry();
  geoPolvo.setAttribute("aPolvo", new THREE.BufferAttribute(aPolvo, 4));
  geoPolvo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(N_POLVO * 3), 3));
  const polvo = new THREE.Points(geoPolvo, new THREE.ShaderMaterial({ uniforms: u, vertexShader: POLVO_VS, fragmentShader: POLVO_FS, ...SUMA, depthWrite: false }));
  polvo.renderOrder = 12;
  const piso = new THREE.Mesh(
    new THREE.PlaneGeometry(10, 7).rotateX(-Math.PI / 2).translate(0, -1.3, -0.2),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: PISO_VS, fragmentShader: PISO_FS, ...SUMA, depthWrite: false }),
  );
  piso.renderOrder = 1;

  [piso, ...paneles.map((p) => p.malla), orbita, orbitaTras, polvo].forEach((o) => {
    o.frustumCulled = false;
    scene.add(o);
  });

  /* Línea de tiempo: se enciende con cada etapa; al pasar el puntero, se destaca su panel. */
  const items = pasos ? [...pasos.querySelectorAll("li")] : [];
  pasos?.classList.add("animada");
  const encender = (i) => {
    items[i]?.classList.add("encendido");
    pasos?.style.setProperty("--avance", AVANCE[i]);
  };
  if (quieto) ETAPAS.forEach((_, i) => encender(i));
  let destacada = -1;
  items.forEach((li, i) => {
    li.addEventListener("pointerenter", () => (destacada = i));
    li.addEventListener("pointerleave", () => (destacada = -1));
  });

  /* Cuándo empieza: cuando se ve al menos un tercio del recuadro. */
  let empezo = quieto;
  new IntersectionObserver(
    ([en]) => {
      if (en.intersectionRatio >= 0.35) empezo = true;
    },
    { threshold: [0, 0.35, 0.6] },
  ).observe(marco);

  /* Puntero: la cámara gira un poco a su alrededor. */
  const puntero = { x: 0, y: 0, sx: 0, sy: 0, dentro: false };
  if (!quieto) {
    seccion.addEventListener("pointermove", (ev) => {
      if (ev.pointerType === "touch") return;
      const r = marco.getBoundingClientRect();
      puntero.x = THREE.MathUtils.clamp(((ev.clientX - r.left) / r.width) * 2 - 1, -1.5, 1.5);
      puntero.y = THREE.MathUtils.clamp(1 - ((ev.clientY - r.top) / r.height) * 2, -1.5, 1.5);
      puntero.dentro = true;
    });
    seccion.addEventListener("pointerleave", () => (puntero.dentro = false));
  }

  /* Animación */
  let cometa = SALIDA;
  let tObra = 0;
  let llegoLegado = quieto ? 0 : -1;
  let proximoBarrido = 6;
  const clamp01 = (x) => THREE.MathUtils.clamp(x, 0, 1);
  const suave = (x) => x * x * (3 - 2 * x);
  const conRebote = (x) => 1 + 2.2 * Math.pow(x - 1, 3) + 1.2 * Math.pow(x - 1, 2); // se pasa apenas y vuelve
  const barrer = (p, fuerza) => (p.barrido = { inicio: tObra, fuerza });
  function alAnimar(t, dt) {
    u.uTime.value = quieto ? 10 : t;
    if (empezo && !quieto) {
      tObra += dt;
      u.uEntrada.value = suave(clamp01(tObra / 0.8));
      // El cometa arranca rápido (va sacando las etapas) y se calma.
      cometa += (0.085 + 0.27 * Math.exp(-Math.max(tObra - 2.2, 0) / 0.7)) * dt;
      uOrbita.uTrazo.value = Math.min(cometa - SALIDA, 1);
    }
    uOrbita.uCometa.value = cometa % 1;

    paneles.forEach((p, i) => {
      if (p.salio < 0 && cometa >= p.e.llega) {
        p.salio = tObra;
        encender(i);
        barrer(p, 1);
        if (i === 2) llegoLegado = tObra;
      }
      if (p.salio >= 0 && !quieto) {
        const s = tObra - p.salio;
        p.aparece = clamp01(s / 0.75);
        p.revela = suave(clamp01((s - 0.25) / 1.0));
      }
      // Luz que cruza el vidrio.
      let barrido = 0;
      let fuerza = 0;
      if (p.barrido) {
        const s = (tObra - p.barrido.inicio) / 1.1;
        if (s >= 1) p.barrido = null;
        else {
          barrido = s;
          fuerza = p.barrido.fuerza;
        }
      }
      const meta = destacada === i ? 1 : 0;
      p.destaca += (meta - p.destaca) * (1 - Math.exp(-dt * 6));
      const ap = conRebote(p.aparece); // giro con un leve rebote al llegar de frente
      p.uni.uAparece.value = suave(p.aparece);
      p.uni.uRevela.value = p.revela;
      p.uni.uDestaca.value = p.destaca;
      p.uni.uAtenua.value = 1 - 0.4 * (destacada >= 0 && destacada !== i ? 1 : 0) * (1 - p.destaca);
      p.uni.uBarrido.value = barrido;
      p.uni.uBarridoFuerza.value = fuerza;
      const [x, y, z] = p.e.pos;
      const [rx, ry, rz] = p.e.rot;
      const flota = quieto ? 0 : Math.sin(t * 0.6 + i * 2.1) * 0.035;
      p.malla.position.set(x, y + flota - (1 - ap) * 0.35 + p.destaca * 0.05, z - (1 - ap) * 0.6 + p.destaca * 0.14);
      p.malla.rotation.set(rx - (1 - ap) * 0.45, ry + (1 - ap) * 1.25, rz);
      p.malla.scale.setScalar(0.85 + 0.15 * ap);
    });

    // Legado: destello del sello, la órbita se enciende y el palacio sale del vidrio.
    if (llegoLegado >= 0) {
      const s = tObra - llegoLegado;
      legado.uni.uRayos.value = quieto ? 0.2 : s < 0.3 ? s / 0.3 : 0.2 + 0.8 * Math.exp(-(s - 0.3) * 1.3);
      uOrbita.uDestello.value = quieto ? 0 : Math.exp(-s * 2.0);
      const sale = quieto ? 1 : clamp01((s - 0.3) / 1.1);
      const vuelo = quieto ? 0 : Math.sin(t * 0.9);
      uPalacio.uSale.value = suave(sale);
      legado.uni.uHalo.value = suave(sale) * (0.8 - 0.25 * vuelo); // como la sombra del libro: más tenue cuando sube
      if (palacio) {
        const e = conRebote(sale);
        palacio.visible = sale > 0.001;
        palacio.position.z = -0.12 + 0.17 * e + 0.02 * vuelo;
        palacio.position.y = (0.42 - 0.5) * ETAPAS[2].tam[1] + 0.012 * Math.sin(t * 0.9 + 1.0);
        palacio.rotation.set(-0.04 + (quieto ? 0 : 0.03 * Math.sin(t * 0.5)), quieto ? 0 : 0.12 * Math.sin(t * 0.32), 0);
        palacio.scale.setScalar(palacio.userData.escala * (0.7 + 0.3 * e));
      }
      // Cada tanto, una luz suave cruza uno de los vidrios.
      if (!quieto && tObra > proximoBarrido + llegoLegado) {
        proximoBarrido += 6.5;
        const p = paneles[Math.floor(proximoBarrido / 6.5) % 3];
        if (!p.barrido) barrer(p, 0.5);
      }
    }

    // Cámara: se mece despacio y sigue al puntero.
    const sigue = 1 - Math.exp(-dt * 3);
    puntero.sx += ((puntero.dentro ? puntero.x : 0) - puntero.sx) * sigue;
    puntero.sy += ((puntero.dentro ? puntero.y : 0) - puntero.sy) * sigue;
    const az = puntero.sx * 0.14 + (quieto ? 0 : Math.sin(t * 0.11) * 0.08);
    const el = 0.24 + puntero.sy * 0.05 + (quieto ? 0 : Math.sin(t * 0.09 + 1) * 0.015);
    const base = Math.max(6.6, MEDIO_ANCHO / (Math.tan(THREE.MathUtils.degToRad(15)) * camera.aspect * CABE));
    const abre = quieto ? 1 : 1 - Math.pow(1 - clamp01(tObra / 3.4), 3); // se abre desde cerca, como un plano de cine
    const distancia = base * (0.84 + 0.16 * abre) * (1 + (quieto ? 0 : 0.012 * Math.sin(t * 0.28))); // y respira
    camera.position.set(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el)).multiplyScalar(distancia).add(OBJETIVO);
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
    brillo: 0.7,
    muestras: 4,
    exposicion: 1.1,
    maxPixeles: 1.7e6,
    fundido: FUNDIDO,
    alAnimar,
  });
  if (!lienzo) {
    // Sin WebGL: la línea de tiempo vuelve a su versión fija.
    pasos?.classList.remove("animada");
  }
  return lienzo;
}
