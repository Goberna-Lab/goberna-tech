// El mapa de "Nuestros servicios": el Perú dibujado con puntos, con una luz que lo recorre y
// arcos que salen de Lima hacia las capitales regionales. Corre solo mientras se ve.
import { PERU } from "./peru.js";
import { CITIES } from "./world.js";

const LON = [-81.6, -68.4];
const LAT = [-18.6, 0.2];
const ANCHO = (LON[1] - LON[0]) * 0.986;
const ALTO = LAT[1] - LAT[0];

function dentro(lon, lat) {
  let si = false;
  for (let i = 0, j = PERU.length - 1; i < PERU.length; j = i++) {
    const [xi, yi] = PERU[i];
    const [xj, yj] = PERU[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) si = !si;
  }
  return si;
}
// De grados a un cuadro de 0–1 (x) por 0–1 (y).
const pos = (lon, lat) => [((lon - LON[0]) * 0.986) / ANCHO, (LAT[1] - lat) / ALTO];

export function montarMapa(canvas, { quieto = false } = {}) {
  const ctx = canvas.getContext("2d");
  const puntos = [];
  for (let lat = LAT[1]; lat > LAT[0]; lat -= 0.3) for (let lon = LON[0]; lon < LON[1]; lon += 0.3) if (dentro(lon, lat)) puntos.push(pos(lon, lat));
  const borde = PERU.map(([lon, lat]) => pos(lon, lat));
  const ciudades = CITIES.map(([nombre, lon, lat, rotulo]) => ({ nombre, p: pos(lon, lat), rotulo }));
  const lima = ciudades[0].p;
  const arcos = ciudades.slice(1).map((c, i) => {
    const mx = (lima[0] + c.p[0]) / 2;
    const my = (lima[1] + c.p[1]) / 2;
    const d = Math.hypot(c.p[0] - lima[0], c.p[1] - lima[1]);
    // El punto de control se aparta de la recta: el arco "se levanta".
    return { a: lima, b: c.p, c: [mx - (c.p[1] - lima[1]) * 0.22, my + (c.p[0] - lima[0]) * 0.22 - d * 0.12], fase: (i * 0.37) % 1 };
  });
  const enArco = (k, t) => [
    (1 - t) * (1 - t) * k.a[0] + 2 * (1 - t) * t * k.c[0] + t * t * k.b[0],
    (1 - t) * (1 - t) * k.a[1] + 2 * (1 - t) * t * k.c[1] + t * t * k.b[1],
  ];

  let W = 0;
  let H = 0;
  let dpr = 1;
  let raf = 0;
  let enVista = false;
  const puntero = { x: 0, y: 0, sx: 0, sy: 0 };

  function medir() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
  }

  function pintar(ms) {
    const t = quieto ? 2.4 : ms / 1000;
    const alto = Math.min(H, (W / ANCHO) * ALTO) * 0.94;
    const ancho = (alto / ALTO) * ANCHO;
    const ox = (W - ancho) / 2;
    const oy = (H - alto) / 2;
    puntero.sx += (puntero.x - puntero.sx) * 0.06;
    puntero.sy += (puntero.y - puntero.sy) * 0.06;
    // Dos planos que se mueven distinto con el puntero: los puntos (fondo) y los arcos (frente).
    const X = (p, k) => ox + p[0] * ancho + puntero.sx * k;
    const Y = (p, k) => oy + p[1] * alto + puntero.sy * k;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    // La luz: un foco que recorre el mapa de norte a sur y vuelve. Solo ilumina los puntos del
    // mapa (no pinta el fondo), para que el lienzo no se note sobre la sección.
    const luz = [0.5 + Math.sin(t * 0.33) * 0.3, 0.5 + Math.sin(t * 0.21 + 1) * 0.42];

    const r = Math.max(1, ancho / 190);
    for (const p of puntos) {
      const d = Math.hypot(p[0] - luz[0], (p[1] - luz[1]) * (ALTO / ANCHO));
      const b = Math.exp(-(d * d) / 0.07);
      ctx.fillStyle = `rgba(${150 + 105 * b},${185 + 70 * b},${225 + 30 * b},${0.22 + 0.78 * b})`;
      ctx.beginPath();
      ctx.arc(X(p, 6), Y(p, 6), r * (0.8 + 0.7 * b), 0, 7);
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.28)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    borde.forEach((p, i) => (i ? ctx.lineTo(X(p, 6), Y(p, 6)) : ctx.moveTo(X(p, 6), Y(p, 6))));
    ctx.closePath();
    ctx.stroke();

    ctx.lineWidth = 1.2;
    for (const k of arcos) {
      ctx.strokeStyle = "rgba(245,175,49,0.34)";
      ctx.beginPath();
      ctx.moveTo(X(k.a, 14), Y(k.a, 14));
      ctx.quadraticCurveTo(X(k.c, 14), Y(k.c, 14), X(k.b, 14), Y(k.b, 14));
      ctx.stroke();
      // Un pulso de luz viaja por cada arco.
      const q = enArco(k, (t * 0.16 + k.fase) % 1);
      const g = ctx.createRadialGradient(X(q, 14), Y(q, 14), 0, X(q, 14), Y(q, 14), r * 6);
      g.addColorStop(0, "rgba(255,226,160,0.95)");
      g.addColorStop(1, "rgba(245,175,49,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(X(q, 14), Y(q, 14), r * 6, 0, 7);
      ctx.fill();
    }
    ctx.font = `600 ${Math.max(10, ancho / 34)}px "Schibsted Grotesk", sans-serif`;
    ctx.textBaseline = "middle";
    ciudades.forEach((c, i) => {
      const late = 1 + 0.25 * Math.sin(t * 2 + i);
      ctx.fillStyle = "#f5af31";
      ctx.beginPath();
      ctx.arc(X(c.p, 14), Y(c.p, 14), (i ? r * 1.7 : r * 3) * late, 0, 7);
      ctx.fill();
      if (c.rotulo && ancho > 240) {
        // Los rótulos del este van a la izquierda de su punto para no salirse del lienzo.
        const alEste = c.p[0] > 0.66;
        ctx.textAlign = alEste ? "right" : "left";
        ctx.fillStyle = "rgba(255,255,255,0.78)";
        ctx.fillText(c.nombre, X(c.p, 14) + (alEste ? -r * 5 : r * 5), Y(c.p, 14));
      }
    });
  }

  function cuadro(ms) {
    raf = 0;
    if (!enVista || document.hidden) return;
    pintar(ms);
    raf = requestAnimationFrame(cuadro);
  }

  medir();
  new ResizeObserver(() => {
    medir();
    if (quieto || !raf) pintar(performance.now());
  }).observe(canvas);
  if (quieto) return;
  const revisar = () => {
    if (enVista && !document.hidden && !raf) raf = requestAnimationFrame(cuadro);
  };
  new IntersectionObserver(([en]) => {
    enVista = en.isIntersecting;
    revisar();
  }).observe(canvas);
  document.addEventListener("visibilitychange", revisar);
  if (matchMedia("(hover: hover)").matches) {
    addEventListener(
      "pointermove",
      (e) => {
        puntero.x = e.clientX / innerWidth - 0.5;
        puntero.y = e.clientY / innerHeight - 0.5;
      },
      { passive: true },
    );
  }
}
