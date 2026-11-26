// Puntero propio de Goberna Tech (inspirado en los cursores con filtro de Codrops). Desde el 26/11/2026 se ve
// solo sobre el mundo 3D de la portada (para arrastrarlo y tocarlo); en el resto de la página va el puntero del
// sistema. Qué se muestra y dónde lo decide home.css ("Puntero propio").
//   · Un punto dorado pegado al puntero (se mueve en el mismo evento del mouse, con la posición
//     que el navegador predice para el cuadro siguiente) y un aro dorado fino que lo sigue con
//     un retraso corto.
//   · Sobre enlaces y botones el aro crece, se pone de oro pleno y se ondula como un líquido
//     (filtro SVG de turbulencia y desplazamiento) hasta asentarse en un borde apenas orgánico.
//   · Al hacer clic, el aro se contrae un instante.
//   · En campos de texto vuelve el cursor del sistema. No se usa en pantallas táctiles ni con
//     "reducir movimiento".
// Solo se anima mientras hace falta: cuando el aro alcanza al puntero, el ciclo se detiene.

const INTERACTIVOS = "a, button, [role='button'], summary, label, select, .g-pasos li";
const ESCRITURA = "input, textarea, [contenteditable='true']";

export function montarCursor() {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ns = "http://www.w3.org/2000/svg";
  const aro = document.createElementNS(ns, "svg");
  aro.setAttribute("class", "g-cursor");
  aro.setAttribute("viewBox", "0 0 80 80");
  aro.setAttribute("aria-hidden", "true");
  aro.innerHTML = `
    <defs>
      <filter id="g-cursor-filtro" x="-40%" y="-40%" width="180%" height="180%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="1" seed="4" result="ruido" />
        <feDisplacementMap in="SourceGraphic" in2="ruido" scale="0" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <circle class="g-cursor-aro" cx="40" cy="40" r="17" />`;
  aro.classList.add("oculto"); // hasta que el mouse se mueva
  const punto = document.createElement("div");
  punto.className = "g-cursor-punto oculto";
  const puntoForma = document.createElement("i"); // la escala va aparte, con su propia transición
  punto.append(puntoForma);
  document.body.append(aro, punto);
  document.documentElement.classList.add("con-cursor");

  const circulo = aro.querySelector("circle");
  const ruido = aro.querySelector("feTurbulence");
  const desplaza = aro.querySelector("feDisplacementMap");

  const p = { x: -100, y: -100 }; // puntero
  const a = { x: -100, y: -100, s: 1 }; // aro (con retraso)
  let escala = 1; // escala buscada del aro
  const escalarPunto = (s) => (puntoForma.style.transform = `scale(${s})`);
  let encima = false;
  let visible = false;
  let onda = null; // { desde, hasta, inicio, dura } mientras el aro se ondula
  let raf = 0;
  let antes = 0;

  const mostrar = (si) => {
    if (si === visible) return;
    visible = si;
    aro.classList.toggle("oculto", !si);
    punto.classList.toggle("oculto", !si);
  };

  // Ondulación: de una deformación fuerte a una leve (al entrar) o a ninguna (al salir).
  function ondular(fuerza, dura) {
    const ahora = performance.now();
    const actual = onda ? valorOnda(ahora) : 0;
    onda = { desde: actual, hasta: fuerza, inicio: ahora, dura, pico: fuerza > actual ? 20 : actual };
    if (fuerza > 0) circulo.setAttribute("filter", "url(#g-cursor-filtro)");
    pedir();
  }
  function valorOnda(ahora) {
    const k = Math.min((ahora - onda.inicio) / onda.dura, 1);
    const salida = 1 - Math.pow(1 - k, 3);
    // Al entrar, arranca con un golpe de deformación que se asienta en la leve.
    return onda.hasta > onda.desde ? onda.pico + (onda.hasta - onda.pico) * salida : onda.desde + (onda.hasta - onda.desde) * salida;
  }

  function cuadro(ahora) {
    raf = 0;
    const dt = antes ? Math.min((ahora - antes) / 1000, 0.05) : 0.016;
    antes = ahora;
    const k = 1 - Math.exp(-dt * 24); // retraso del aro: corto, apenas se nota la estela
    a.x += (p.x - a.x) * k;
    a.y += (p.y - a.y) * k;
    a.s += (escala - a.s) * (1 - Math.exp(-dt * 12));
    aro.style.transform = `translate3d(${a.x - 40}px, ${a.y - 40}px, 0) scale(${a.s.toFixed(3)})`;

    let sigue = Math.abs(p.x - a.x) > 0.1 || Math.abs(p.y - a.y) > 0.1 || Math.abs(escala - a.s) > 0.002;
    if (onda) {
      const v = valorOnda(ahora);
      desplaza.setAttribute("scale", v.toFixed(2));
      // Mientras está encima, la onda respira apenas.
      ruido.setAttribute("baseFrequency", (0.02 + (encima ? 0.004 * Math.sin(ahora / 420) : 0)).toFixed(4));
      const termino = ahora - onda.inicio >= onda.dura;
      if (termino && onda.hasta === 0) {
        circulo.removeAttribute("filter");
        onda = null;
      } else sigue = sigue || !termino || encima;
    }
    if (sigue) pedir();
    else antes = 0;
  }
  const pedir = () => {
    if (!raf) raf = requestAnimationFrame(cuadro);
  };

  addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType !== "mouse") return;
      // Posición predicha para el próximo cuadro (si el navegador la da): el punto no se atrasa.
      const prevista = e.getPredictedEvents?.();
      const ultimo = prevista?.length ? prevista[prevista.length - 1] : e;
      p.x = ultimo.clientX;
      p.y = ultimo.clientY;
      punto.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      if (!visible) {
        a.x = p.x;
        a.y = p.y;
      }
      mostrar(!e.target.closest?.(ESCRITURA));
      pedir();
    },
    { passive: true },
  );
  document.addEventListener("pointerover", (e) => {
    const sobre = !!e.target.closest?.(INTERACTIVOS);
    if (sobre === encima) return;
    encima = sobre;
    aro.classList.toggle("encima", sobre);
    escala = sobre ? 1.65 : 1;
    escalarPunto(sobre ? 0.5 : 1);
    ondular(sobre ? 4 : 0, sobre ? 800 : 420);
  });
  document.addEventListener("pointerdown", () => {
    escala *= 0.82;
    escalarPunto(1.4);
    pedir();
  });
  document.addEventListener("pointerup", () => {
    escala = encima ? 1.65 : 1;
    escalarPunto(encima ? 0.5 : 1);
    pedir();
  });
  document.documentElement.addEventListener("pointerleave", () => mostrar(false));
  addEventListener("blur", () => mostrar(false));
}
