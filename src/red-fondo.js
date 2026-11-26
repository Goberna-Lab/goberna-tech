// Portada: una red de inteligencia de fondo, sutil, detrás del mundo (globo3d.js) y del texto.
//
// Qué se ve
//   · Nodos dorados (la mayoría) y azules, en tres profundidades: los lejanos chicos y tenues, los del medio
//     nítidos y unos pocos cercanos grandes y desenfocados (bokeh).
//   · Líneas finas entre los nodos cercanos entre sí, más visibles cuanto más cerca están.
//   · Cada tanto un pulso de luz recorre una conexión: datos que viajan por la red.
//   · Alrededor del mundo deja un claro: la red se desvanece al acercarse a él (globo3d.js publica su centro y
//     radio en data-globo de la portada), para que el globo se lea limpio y la red quede de ambiente.
// Cómo se mueve
//   · Los nodos derivan muy lento; con el mouse, la red se corre apenas, más los cercanos (paralaje).
// Cuidado del equipo
//   · Canvas 2D (no otra escena WebGL), a 30 cuadros por segundo como mucho, con densidad de píxeles
//     limitada; solo se dibuja con la portada en pantalla y la pestaña visible.
//   · Con "reducir movimiento" se dibuja un único cuadro, quieto.
// La intensidad general y el fundido detrás del texto y hacia los bordes van en CSS (home.css, .g-hero-red-fondo).

const ORO = [255, 196, 92];
const AZUL = [92, 150, 255];
const DIST = 200; // px (a escala 1): hasta dónde se conectan dos nodos
const VEL = 7; // px/s de deriva, a escala 1
const PULSO_CADA = [0.7, 1.6]; // s entre pulsos
const PULSO_DURA = 1.3; // s que tarda un pulso en cruzar su conexión

// Un punto de luz pre-dibujado por color: dibujarlo escalado es mucho más barato que un degradado por nodo.
function sprite([r, g, b]) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  const d = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  d.addColorStop(0, `rgba(255,255,255,1)`);
  d.addColorStop(0.12, `rgba(${r},${g},${b},1)`);
  d.addColorStop(0.35, `rgba(${r},${g},${b},0.35)`);
  d.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = d;
  x.fillRect(0, 0, 64, 64);
  return c;
}

// Bokeh: un disco suave, sin núcleo blanco.
function disco([r, g, b]) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d");
  const d = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  d.addColorStop(0, `rgba(${r},${g},${b},0.55)`);
  d.addColorStop(0.6, `rgba(${r},${g},${b},0.35)`);
  d.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = d;
  x.fillRect(0, 0, 64, 64);
  return c;
}

export function montarRedFondo(seccion, canvas, { quieto = false } = {}) {
  if (!seccion || !canvas) return;
  const g = canvas.getContext("2d");
  if (!g) return;
  const luces = { oro: sprite(ORO), azul: sprite(AZUL) };
  const bokeh = { oro: disco(ORO), azul: disco(AZUL) };

  let W = 0;
  let H = 0;
  let escala = 1;
  let nodos = [];
  const pulsos = [];
  let proximoPulso = 1;
  const puntero = { x: 0, y: 0, sx: 0, sy: 0 };

  function sembrar() {
    // Cantidad según el área, con tope.
    const n = Math.round(Math.min(80, Math.max(30, (W * H) / 17000)));
    nodos = Array.from({ length: n }, () => {
      const z = Math.random(); // 0 lejos … 1 cerca
      const capa = z < 0.4 ? 0 : z < 0.9 ? 1 : 2;
      const ang = Math.random() * Math.PI * 2;
      const v = VEL * escala * (0.4 + 0.6 * Math.random()) * (0.5 + z);
      return {
        x: Math.random() * W,
        y: Math.random() * H,
        vx: Math.cos(ang) * v,
        vy: Math.sin(ang) * v,
        z,
        capa,
        color: Math.random() < 0.68 ? "oro" : "azul",
        fase: Math.random() * Math.PI * 2,
      };
    });
  }

  function medir() {
    // Sin la hoja de estilos el lienzo no queda encima de la portada sino dentro de ella: si se midiera igual,
    // agrandarlo agrandaría la portada y así sin fin (la página crecía a millones de píxeles y colgaba la pestaña).
    if (getComputedStyle(canvas).position !== "absolute") return;
    const r = seccion.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    W = r.width;
    H = r.height;
    if (!W || !H) return;
    escala = Math.min(Math.max(W / 1440, 0.6), 1.4);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    sembrar();
    if (quieto) dibujar(0, 0);
  }

  // Posición en pantalla con el paralaje del puntero (más en los cercanos).
  const px = (n) => n.x + puntero.sx * (6 + 28 * n.z) * escala;
  const py = (n) => n.y + puntero.sy * (4 + 18 * n.z) * escala;

  // El claro alrededor del globo: 0 dentro y en su borde, 1 desde 1,7 radios hacia afuera.
  let claro = null;
  const leerClaro = () => {
    const v = seccion.dataset.globo?.split(",").map(Number);
    claro = v?.length === 3 && v[2] > 0 ? v : null;
  };
  const lejosDelGlobo = (x, y) => {
    if (!claro) return 1;
    const d = Math.hypot(x - claro[0], y - claro[1]) / claro[2];
    const k = Math.min(Math.max((d - 1.08) / 0.62, 0), 1);
    return k * k * (3 - 2 * k);
  };

  function dibujar(t, dt) {
    g.clearRect(0, 0, W, H);
    leerClaro();
    const dist = DIST * escala;
    const d2 = dist * dist;

    // Deriva (con vuelta por los bordes).
    const m = 40;
    for (const n of nodos) {
      n.x += n.vx * dt;
      n.y += n.vy * dt;
      if (n.x < -m) n.x = W + m;
      else if (n.x > W + m) n.x = -m;
      if (n.y < -m) n.y = H + m;
      else if (n.y > H + m) n.y = -m;
    }

    // Conexiones: solo dentro de la misma profundidad o entre vecinas, para que la red tenga capas.
    const aristas = [];
    g.lineCap = "round";
    for (let i = 0; i < nodos.length; i++) {
      const a = nodos[i];
      if (a.capa === 2) continue;
      const ax = px(a);
      const ay = py(a);
      for (let j = i + 1; j < nodos.length; j++) {
        const b = nodos[j];
        if (b.capa === 2 || Math.abs(a.z - b.z) > 0.45) continue;
        const bx = px(b);
        const by = py(b);
        const dx = bx - ax;
        const dy = by - ay;
        const q = dx * dx + dy * dy;
        if (q > d2) continue;
        const cerca = 1 - Math.sqrt(q) / dist;
        const z = (a.z + b.z) / 2;
        const alfa = cerca * (0.22 + 0.55 * z) * Math.min(lejosDelGlobo(ax, ay), lejosDelGlobo(bx, by));
        if (alfa < 0.01) continue;
        const [r, gg, bb] = a.color === "azul" && b.color === "azul" ? AZUL : ORO;
        g.strokeStyle = `rgba(${r},${gg},${bb},${alfa.toFixed(3)})`;
        g.lineWidth = 0.6 + z * 1.1;
        g.beginPath();
        g.moveTo(ax, ay);
        g.lineTo(bx, by);
        g.stroke();
        if (cerca > 0.25) aristas.push([a, b]);
      }
    }

    // Nodos: lejos → cerca.
    for (const n of nodos) {
      const x = px(n);
      const y = py(n);
      const brillo = (0.75 + 0.25 * Math.sin(t * 0.9 + n.fase)) * lejosDelGlobo(x, y);
      if (brillo < 0.01) continue;
      if (n.capa === 2) {
        const s = (26 + 30 * n.z) * escala;
        g.globalAlpha = 0.28 * brillo;
        g.drawImage(bokeh[n.color], x - s / 2, y - s / 2, s, s);
      } else {
        const s = (7 + 18 * n.z) * escala;
        g.globalAlpha = (0.4 + 0.6 * n.z) * brillo;
        g.drawImage(luces[n.color], x - s / 2, y - s / 2, s, s);
      }
    }
    g.globalAlpha = 1;

    // Pulsos: un punto claro que cruza una conexión.
    if (!quieto) {
      proximoPulso -= dt;
      if (proximoPulso <= 0 && aristas.length && pulsos.length < 4) {
        const [a, b] = aristas[Math.floor(Math.random() * aristas.length)];
        pulsos.push({ a, b, k: 0 });
        proximoPulso = PULSO_CADA[0] + Math.random() * (PULSO_CADA[1] - PULSO_CADA[0]);
      }
      for (let i = pulsos.length - 1; i >= 0; i--) {
        const p = pulsos[i];
        p.k += dt / PULSO_DURA;
        if (p.k >= 1) {
          pulsos.splice(i, 1);
          continue;
        }
        const e = p.k * p.k * (3 - 2 * p.k);
        const x = px(p.a) + (px(p.b) - px(p.a)) * e;
        const y = py(p.a) + (py(p.b) - py(p.a)) * e;
        const s = 14 * escala;
        g.globalAlpha = Math.sin(Math.PI * p.k) * lejosDelGlobo(x, y);
        g.drawImage(luces.oro, x - s / 2, y - s / 2, s, s);
      }
      g.globalAlpha = 1;
    }
  }

  /* Reloj: 30 cuadros por segundo como mucho, solo con la portada a la vista. */
  let raf = 0;
  let antes = 0;
  let t = 0;
  let visible = false;
  function cuadro(ms) {
    raf = requestAnimationFrame(cuadro);
    if (antes && ms - antes < 31) return;
    const dt = antes ? Math.min((ms - antes) / 1000, 0.1) : 0;
    antes = ms;
    t += dt;
    const k = 1 - Math.exp(-dt * 2.5);
    puntero.sx += (puntero.x - puntero.sx) * k;
    puntero.sy += (puntero.y - puntero.sy) * k;
    dibujar(t, dt);
  }
  function seguir() {
    const debe = !quieto && visible && !document.hidden;
    if (debe && !raf) {
      antes = 0;
      raf = requestAnimationFrame(cuadro);
    } else if (!debe && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  if (!quieto && matchMedia("(pointer: fine)").matches) {
    seccion.addEventListener("pointermove", (e) => {
      const r = seccion.getBoundingClientRect();
      puntero.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      puntero.y = ((e.clientY - r.top) / r.height) * 2 - 1;
    });
    seccion.addEventListener("pointerleave", () => (puntero.x = puntero.y = 0));
  }

  new ResizeObserver(medir).observe(seccion);
  medir();
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    seguir();
  }).observe(seccion);
  document.addEventListener("visibilitychange", seguir);
  canvas.classList.add("lista");
}
