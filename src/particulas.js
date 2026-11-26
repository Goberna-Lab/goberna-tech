// Animación que acompaña a la frase de marca: partículas que se ordenan, una tras otra, en cuatro
// figuras (estrategia, tecnología, inteligencia y gestión pública). Corre solo mientras se ve.

// Las figuras se dibujan con trazos en un lienzo de 100 × 100; de esos trazos salen los puntos.
const FORMAS = [
  // Estrategia: una ruta con hitos que llega a un objetivo.
  (c) => {
    c.beginPath();
    c.moveTo(12, 86);
    c.bezierCurveTo(34, 88, 26, 60, 46, 58);
    c.bezierCurveTo(62, 56, 52, 36, 66, 32);
    c.stroke();
    for (const [x, y] of [[12, 86], [46, 58]]) {
      c.beginPath();
      c.arc(x, y, 4, 0, 7);
      c.fill();
    }
    for (const r of [4, 11, 18]) {
      c.beginPath();
      c.arc(76, 26, r, 0, 7);
      r === 4 ? c.fill() : c.stroke();
    }
  },
  // Tecnología: un chip con sus pines.
  (c) => {
    c.beginPath();
    c.roundRect(27, 27, 46, 46, 7);
    c.stroke();
    c.beginPath();
    c.roundRect(40, 40, 20, 20, 3);
    c.fill();
    for (let i = 0; i < 4; i++) {
      const p = 33 + i * 11.3;
      for (const [x1, y1, x2, y2] of [[p, 27, p, 13], [p, 73, p, 87], [27, p, 13, p], [73, p, 87, p]]) {
        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
        c.beginPath();
        c.arc(x2, y2, 2.2, 0, 7);
        c.fill();
      }
    }
  },
  // Inteligencia: una red de datos alrededor de un centro.
  (c) => {
    const n = 6;
    const pt = (i, r = 34) => [50 + Math.cos((i / n) * 6.283 - 1.57) * r, 50 + Math.sin((i / n) * 6.283 - 1.57) * r];
    for (let i = 0; i < n; i++) {
      const [x, y] = pt(i);
      const [x2, y2] = pt(i + 1);
      c.beginPath();
      c.moveTo(50, 50);
      c.lineTo(x, y);
      if (i % 2 === 0) {
        c.moveTo(x, y);
        c.lineTo(x2, y2);
      }
      c.stroke();
      c.beginPath();
      c.arc(x, y, i % 2 ? 4.5 : 6, 0, 7);
      c.fill();
    }
    c.beginPath();
    c.arc(50, 50, 9, 0, 7);
    c.fill();
  },
  // Gestión pública: el palacio del logotipo.
  (c) => {
    c.beginPath();
    c.moveTo(50, 13);
    c.lineTo(88, 34);
    c.lineTo(12, 34);
    c.closePath();
    c.stroke();
    for (const [y, a] of [[41, 14], [77, 12], [85, 7]]) {
      c.beginPath();
      c.moveTo(a, y);
      c.lineTo(100 - a, y);
      c.stroke();
    }
    c.save();
    c.lineWidth = 5;
    for (const x of [22, 36, 50, 64, 78]) {
      c.beginPath();
      c.moveTo(x, 47);
      c.lineTo(x, 71);
      c.stroke();
    }
    c.restore();
  },
];

// Puntos (0–1) repartidos sobre los trazos de una figura.
function muestrear(dibujar, n) {
  const L = 240;
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = L;
  const c = lienzo.getContext("2d", { willReadFrequently: true });
  c.scale(L / 100, L / 100);
  c.lineWidth = 2.6;
  c.lineCap = c.lineJoin = "round";
  dibujar(c);
  const px = c.getImageData(0, 0, L, L).data;
  const llenos = [];
  for (let y = 0; y < L; y += 2) for (let x = 0; x < L; x += 2) if (px[(y * L + x) * 4 + 3] > 120) llenos.push([x / L, y / L]);
  const out = [];
  for (let i = 0; i < n; i++) {
    const [x, y] = llenos[Math.floor((i / n) * llenos.length + Math.random() * (llenos.length / n)) % llenos.length];
    out.push([x + (Math.random() - 0.5) * 0.006, y + (Math.random() - 0.5) * 0.006]);
  }
  return out;
}

export function montarParticulas(canvas, { alCambiar, quieto = false, espera = 3400 } = {}) {
  const ctx = canvas.getContext("2d");
  const N = innerWidth < 700 ? 560 : 900;
  const formas = FORMAS.map((f) => muestrear(f, N));
  const pts = Array.from({ length: N }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: 0,
    vy: 0,
    tx: 0.5,
    ty: 0.5,
    r: 0.7 + Math.random() * 1.1,
    oro: Math.random() < 0.14,
    fase: Math.random() * 6.283,
    demora: 0,
  }));
  // Motas sueltas que cruzan el lienzo y se unen con líneas finas cuando se acercan.
  const motas = Array.from({ length: 22 }, () => ({ x: Math.random(), y: Math.random(), vx: (Math.random() - 0.5) * 0.00035, vy: (Math.random() - 0.5) * 0.00035 }));
  let W = 0;
  let H = 0;
  let dpr = 1;
  let forma = -1;
  let visible = false;
  let raf = 0;
  let proximo = 0;
  let t0 = 0;

  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  function poner(i, ahora) {
    forma = i;
    const destino = formas[i];
    // Los destinos se barajan a medias: el cambio de figura se ve como un remolino corto.
    const orden = destino.map((_, k) => k).sort(() => Math.random() - 0.5);
    pts.forEach((p, k) => {
      [p.tx, p.ty] = destino[orden[k]];
      p.demora = ahora + Math.random() * 420;
    });
    alCambiar?.(i);
  }

  let antes = 0;
  function pintar(ahora) {
    const pasos = Math.max(1, Math.min(8, Math.round((ahora - antes) / 16)));
    antes = ahora;
    const lado = Math.min(W, H) * 0.9;
    const ox = (W - lado) / 2;
    const oy = (H - lado) / 2;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    ctx.lineWidth = 1;
    for (let a = 0; a < motas.length; a++) {
      const m = motas[a];
      if (!quieto) {
        m.x = (m.x + m.vx * 16 * pasos + 1) % 1;
        m.y = (m.y + m.vy * 16 * pasos + 1) % 1;
      }
      for (let b = a + 1; b < motas.length; b++) {
        const d = Math.hypot((m.x - motas[b].x) * W, (m.y - motas[b].y) * H);
        if (d < 110) {
          ctx.strokeStyle = `rgba(7,46,81,${0.13 * (1 - d / 110)})`;
          ctx.beginPath();
          ctx.moveTo(m.x * W, m.y * H);
          ctx.lineTo(motas[b].x * W, motas[b].y * H);
          ctx.stroke();
        }
      }
      ctx.fillStyle = "rgba(7,46,81,0.22)";
      ctx.beginPath();
      ctx.arc(m.x * W, m.y * H, 1.6, 0, 7);
      ctx.fill();
    }

    for (const p of pts) {
      if (!quieto && ahora >= p.demora) {
        // Resorte amortiguado, en pasos de 16 ms para que se vea igual a cualquier ritmo de cuadros.
        for (let k = 0; k < pasos; k++) {
          p.vx = (p.vx + (p.tx - p.x) * 0.05) * 0.8;
          p.vy = (p.vy + (p.ty - p.y) * 0.05) * 0.8;
          p.x += p.vx;
          p.y += p.vy;
        }
      }
      const tiembla = quieto ? 0 : Math.sin(ahora * 0.0016 + p.fase) * 0.0025;
      ctx.fillStyle = p.oro ? "#f5af31" : "rgba(7,46,81,0.86)";
      ctx.beginPath();
      ctx.arc(ox + (p.x + tiembla) * lado, oy + (p.y + Math.cos(ahora * 0.0013 + p.fase) * (quieto ? 0 : 0.0025)) * lado, p.r * (p.oro ? 1.5 : 1), 0, 7);
      ctx.fill();
    }
  }

  function cuadro(ahora) {
    raf = 0;
    if (!visible) return;
    if (!t0) t0 = proximo = ahora;
    if (ahora >= proximo) {
      poner((forma + 1) % formas.length, ahora);
      proximo = ahora + espera;
    }
    pintar(ahora);
    raf = requestAnimationFrame(cuadro);
  }

  medir();
  new ResizeObserver(() => {
    medir();
    if (quieto || !raf) pintar(performance.now());
  }).observe(canvas);

  if (quieto) {
    // Sin movimiento: la última figura, ya armada.
    formas.at(-1).forEach(([x, y], k) => {
      pts[k].x = x;
      pts[k].y = y;
    });
    pintar(0);
    return;
  }
  let enVista = false;
  const revisar = () => {
    visible = enVista && !document.hidden;
    if (visible && !raf) raf = requestAnimationFrame(cuadro);
  };
  new IntersectionObserver(([en]) => {
    enVista = en.isIntersecting;
    revisar();
  }).observe(canvas);
  document.addEventListener("visibilitychange", revisar);
}
