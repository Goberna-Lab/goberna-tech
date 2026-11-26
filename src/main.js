import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { buildWorld } from "./world.js";
import { MODULOS } from "./modulos/index.js";
import { familiaDe, infoDe } from "./modulos/familias.js";
import { montarEscena } from "./escenas.js";
import { montarParticulas } from "./particulas.js";
import { montarMapa } from "./mapa.js";
import { montarEfectos } from "./efectos.js";
import { ponerEsquemas, activarExploradores, sinMovimiento, revelar, beneficios } from "./modulos/comun.js";
// Las tipografías van dentro del proyecto (no dependen de Google Fonts ni de tener conexión):
// Schibsted Grotesk para títulos y texto, Space Mono para menú, rótulos y botones.
import "@fontsource/catamaran/latin-400.css";
import "@fontsource/catamaran/latin-500.css";
import "@fontsource/catamaran/latin-600.css";
import "@fontsource/catamaran/latin-700.css";
import "@fontsource/catamaran/latin-800.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/space-mono/latin-700.css";
import "./modulos.css";
import "./escenas.css";
import "./secciones.css";

const { clamp, lerp, smoothstep, smootherstep } = THREE.MathUtils;
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const coarse = matchMedia("(pointer: coarse)").matches; // teléfonos y tabletas
const $ = (s) => document.querySelector(s);

/* ---------- Interfaz ---------- */

const bar = $("#bar");
const hero = $(".hero");
const stage = $(".hero-stage");
const heroCopy = $(".hero-copy");
const heroCue = $(".hero-cue");
const canvas = $("#world");

$("#year").textContent = new Date().getFullYear();

// El titular de la portada se parte en palabras para animarlas una tras otra al cargar.
if (!sinMovimiento) {
  const h1 = document.querySelector(".hero-copy h1");
  if (h1) {
    let i = 0;
    h1.innerHTML = [...h1.childNodes]
      .map((n) =>
        n.nodeType === 3
          ? n.textContent.replace(/\S+/g, (w) => `<span class="w" style="--i:${i++}">${w}</span>`)
          : `<em class="w" style="--i:${i++}">${n.textContent}</em>`,
      )
      .join("");
  }
}

// Menú a pantalla completa (pantallas medianas y chicas)
const menu = $("#menu");
const menuBtn = $(".bar-menu");
function setMenu(open) {
  menu.hidden = !open;
  menuBtn.setAttribute("aria-expanded", String(open));
  menuBtn.textContent = open ? "Cerrar" : "Menú";
  document.documentElement.classList.toggle("menu-open", open);
}
menuBtn.addEventListener("click", () => setMenu(menu.hidden));
menu.addEventListener("click", (e) => e.target.closest("a") && setMenu(false));
addEventListener("keydown", (e) => e.key === "Escape" && !menu.hidden && setMenu(false));
matchMedia("(min-width: 1101px)").addEventListener("change", (e) => e.matches && setMenu(false));

/* ---------- Cómo trabajamos: etapas una a la vez, garantías y requisitos ---------- */

const foroBg = $(".method-bg");
const rollout = $("[data-rollout]");
const etapas = [...rollout.querySelectorAll(".rollout-details li")];
const botonesEtapa = [...rollout.querySelectorAll(".rollout-nav button")];
let etapa = 0;
let rolloutVisible = false;
let movPausado = reduceMotion; // pausa el fondo en movimiento y el avance automático de las etapas

function irEtapa(i) {
  etapa = i;
  etapas.forEach((li, j) => li.classList.toggle("is-on", j === i));
  botonesEtapa.forEach((b, j) => {
    b.classList.toggle("is-on", j === i);
    b.classList.toggle("is-done", j < i);
    b.setAttribute("aria-pressed", String(j === i));
  });
}
// La barra de la etapa activa se llena sola (animación CSS); al terminar, pasa a la siguiente.
const correr = () => rollout.classList.toggle("is-running", rolloutVisible && !movPausado);
rollout.addEventListener("click", (e) => {
  const b = e.target.closest("[data-step]");
  if (b) irEtapa(Number(b.dataset.step));
});
rollout.addEventListener("animationend", (e) => {
  if (e.animationName === "rollout-fill") irEtapa((etapa + 1) % etapas.length);
});
new IntersectionObserver(
  ([en]) => {
    rolloutVisible = en.isIntersecting;
    correr();
  },
  { threshold: 0.3 },
).observe(rollout);

// Fondo con video (opcional): sin sonido y en bucle. Si no hay video, el fondo es la escena 3D del foro.
let foroVideo = null;
if (foroBg.dataset.video) {
  foroVideo = document.createElement("video");
  Object.assign(foroVideo, { src: foroBg.dataset.video, muted: true, loop: true, playsInline: true, preload: "metadata" });
  if (foroBg.dataset.poster) foroVideo.poster = foroBg.dataset.poster;
  foroBg.appendChild(foroVideo);
  // Solo se reproduce mientras está en pantalla.
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !movPausado) foroVideo.play().catch(() => {});
    else foroVideo.pause();
  }).observe(foroBg);
}

const pausa = $(".method-pause");
pausa.addEventListener("click", () => {
  movPausado = !movPausado;
  pausa.textContent = movPausado ? "Reanudar movimiento" : "Pausar movimiento";
  correr();
  if (foroVideo) movPausado ? foroVideo.pause() : foroVideo.play().catch(() => {});
});

/* ---------- Frase de marca: palabras que suben y una figura por idea ---------- */
{
  const frase = $(".intro-lead");
  const claves = [...frase.querySelectorAll(".k")];
  if (!reduceMotion) {
    // Cada palabra va en su propio span para que entren una tras otra.
    let i = 0;
    const partir = (nodo) => {
      for (const n of [...nodo.childNodes]) {
        if (n.nodeType === 3) {
          const tmp = document.createElement("span");
          tmp.innerHTML = n.textContent.replace(/\S+/g, (w) => `<span class="w" style="--i:${i++}">${w}</span>`);
          n.replaceWith(...tmp.childNodes);
        } else partir(n);
      }
    };
    partir(frase);
  }
  // La figura que arman las partículas subraya su palabra en la frase.
  montarParticulas($(".intro-fx canvas"), {
    quieto: reduceMotion,
    alCambiar: (n) => claves.forEach((k) => k.classList.toggle("on", Number(k.dataset.k) === n)),
  });
}

/* ---------- Cifras: cada dígito gira hasta su valor la primera vez que se ve ---------- */
if (!reduceMotion) {
  for (const dt of document.querySelectorAll("[data-cifra]")) {
    const cifra = dt.dataset.cifra;
    dt.setAttribute("aria-label", cifra);
    dt.innerHTML = [...cifra]
      .map((d, i) => `<span class="od" aria-hidden="true" style="--d:${d};--i:${cifra.length - 1 - i}"><span>${"0123456789".split("").join("<br>")}</span></span>`)
      .join("");
  }
}

/* ---------- Plataformas: lista a la izquierda, demostración a la derecha ----------
   Cada familia tiene una demostración viva (src/escenas.js).
   · Pantallas grandes: la sección queda fija mientras se baja y el scroll recorre las once
     plataformas, una por tramo. No hace falta hacer clic: la lista avanza sola y a la derecha
     aparece la demostración de cada producto. Un clic en un nombre lleva a su tramo.
   · Pantallas chicas o bajas: una familia debajo de otra; el primer toque elige la plataforma. */
const sinHover = matchMedia("(hover: none)").matches;
const fijo = matchMedia("(min-width: 1280px) and (min-height: 700px)");
const cajaFams = $(".fams");
const pegado = $(".fams-stick");
const familias = [];
const orden = []; // las once plataformas en el orden de la lista: { f: familia, a: enlace }
let pasoActual = -1;

for (const fam of document.querySelectorAll(".fam")) {
  const caja = fam.querySelector(".fam-stage");
  caja.innerHTML = `<div class="fam-live"></div><div class="fam-info"></div>`;
  const tabs = [...fam.querySelectorAll("[data-plat]")];
  let actual = null;
  const elegir = (a) => {
    if (a === actual) return;
    actual = a;
    tabs.forEach((x) => x.classList.toggle("is-on", x === a));
    caja.lastElementChild.innerHTML = infoDe(a.dataset.plat, a.querySelector("span").textContent);
    escena.elegir(a.dataset.plat);
  };
  const escena = montarEscena(fam.dataset.fam, caja.firstElementChild, {
    quieto: reduceMotion,
    alElegir: (id) => irA(tabs.find((t) => t.dataset.plat === id)),
  });
  const f = { fam, escena, elegir, tabs };
  familias.push(f);
  fam.classList.add("is-live");
  elegir(tabs[0]);
  let recienTocada = false; // el toque cayó en una plataforma que no era la elegida
  for (const a of tabs) {
    orden.push({ f, a });
    a.addEventListener("pointerenter", (e) => e.pointerType === "mouse" && !fijo.matches && elegir(a));
    a.addEventListener("pointerdown", () => (recienTocada = a !== actual || (fijo.matches && orden[pasoActual]?.a !== a)));
    a.addEventListener("focus", () => irA(a));
    a.addEventListener("click", (e) => {
      // Si el nombre no era el que se estaba viendo, el clic lo muestra; si ya lo era, entra a su página.
      if ((sinHover || fijo.matches) && recienTocada) {
        e.preventDefault();
        irA(a);
      }
      recienTocada = false;
    });
  }
  // En la lista fija, el nombre de la familia lleva a su primera plataforma.
  fam.querySelector("h3").addEventListener("click", () => fijo.matches && irA(tabs[0]));
}
cajaFams.style.setProperty("--pasos", orden.length);
const cuenta = document.createElement("p");
cuenta.className = "fams-cuenta";
cuenta.setAttribute("aria-hidden", "true");
cuenta.innerHTML = `<b>01</b> / ${String(orden.length).padStart(2, "0")}<i></i>`;
pegado.append(cuenta);

// Muestra una plataforma: en la lista fija, baja hasta su tramo; si no, la elige en su familia.
function irA(a) {
  if (!a) return;
  const i = orden.findIndex((o) => o.a === a);
  if (!fijo.matches) return orden[i].f.elegir(a);
  if (i === pasoActual) return;
  const tramo = (cajaFams.offsetHeight - pegado.offsetHeight) / orden.length;
  scrollTo({ top: cajaFams.getBoundingClientRect().top + scrollY - barH() + (i + 0.5) * tramo, behavior: reduceMotion ? "instant" : "smooth" });
}
const barH = () => $("#bar").offsetHeight;

function ponerPaso(i) {
  if (i === pasoActual) return;
  pasoActual = i;
  const { f, a } = orden[i];
  for (const x of familias) {
    x.fam.classList.toggle("es-activa", x === f);
    x.escena.activar(x === f);
  }
  f.elegir(a);
  cuenta.firstElementChild.textContent = String(i + 1).padStart(2, "0");
}
function alBajar() {
  if (!fijo.matches) return;
  const total = cajaFams.offsetHeight - pegado.offsetHeight;
  const p = clamp((barH() - cajaFams.getBoundingClientRect().top) / total, 0, 0.9999);
  ponerPaso(Math.floor(p * orden.length));
  cuenta.style.setProperty("--p", p.toFixed(4));
}
function alCambiarModo() {
  cajaFams.classList.toggle("es-fija", fijo.matches);
  if (fijo.matches) {
    pasoActual = -1;
    alBajar();
  } else {
    pasoActual = -1;
    for (const x of familias) {
      x.fam.classList.remove("es-activa");
      x.escena.activar(true);
    }
  }
}
fijo.addEventListener("change", alCambiarModo);
addEventListener("scroll", alBajar, { passive: true });
addEventListener("resize", alBajar);
alCambiarModo();

/* ---------- Hilo de transición (solo cuando las familias van una debajo de otra) ----------
   Una línea baja junto a las familias y se va dibujando con el scroll; al llegar a cada
   demostración enciende su nudo. En pantallas angostas corre por el margen izquierdo. */
{
  const svg = $(".hilo");
  const intro = svg.parentElement;
  const [base, oro] = svg.querySelectorAll("path");
  const nudos = svg.querySelector("g");
  const fams = [...intro.querySelectorAll(".fam")];
  let largo = 0;
  let puntos = [];
  // Posición de un elemento dentro de la sección, sea cual sea su offsetParent.
  const pos = (el) => {
    let x = 0;
    let y = 0;
    for (; el && el !== intro; el = el.offsetParent) {
      x += el.offsetLeft;
      y += el.offsetTop;
    }
    return { x, y };
  };
  const medir = () => {
    svg.style.display = fijo.matches ? "none" : "";
    if (fijo.matches) return;
    const arriba = pos(fams[0]).y;
    const ultima = fams.at(-1);
    const alto = pos(ultima).y + ultima.offsetHeight - arriba;
    const cab = fams[0].querySelector(".fam-head");
    const e0 = pos(fams[0].querySelector(".fam-live"));
    const finCab = pos(cab).x + cab.offsetWidth;
    const enColumnas = e0.x > finCab; // en pantallas angostas la demostración va debajo
    const x = enColumnas ? (finCab + e0.x) / 2 : Math.max(8, pos(fams[0]).x / 2);
    svg.style.top = `${arriba}px`;
    svg.style.height = `${alto}px`;
    svg.setAttribute("viewBox", `0 0 ${intro.offsetWidth} ${alto}`);
    puntos = fams.map((f) => {
      const e = f.querySelector(".fam-live");
      const p = pos(e);
      return { y: p.y - arriba + (enColumnas ? e.offsetHeight * 0.5 : 22), hasta: enColumnas ? p.x : pos(f).x };
    });
    largo = puntos.at(-1).y;
    const d = `M${x} 0V${largo}`;
    base.setAttribute("d", d);
    oro.setAttribute("d", d);
    oro.style.strokeDasharray = largo;
    nudos.innerHTML = puntos.map((p) => `<g><path d="M${x} ${p.y}H${p.hasta}"/><circle cx="${x}" cy="${p.y}" r="6"/></g>`).join("");
    pintar();
  };
  const pintar = () => {
    if (fijo.matches || !puntos.length) return;
    const cabeza = reduceMotion ? largo : clamp(innerHeight * 0.62 - svg.getBoundingClientRect().top, 0, largo);
    oro.style.strokeDashoffset = largo - cabeza;
    [...nudos.children].forEach((g, i) => g.classList.toggle("on", cabeza >= puntos[i].y - 1));
  };
  new ResizeObserver(medir).observe(intro);
  fijo.addEventListener("change", medir);
  if (!reduceMotion) addEventListener("scroll", pintar, { passive: true });
}

/* ---------- Mapa de los tres ejes, parallax y luces ---------- */
montarMapa($(".ejes-mapa canvas"), { quieto: reduceMotion });
montarEfectos($("#home"), { quieto: reduceMotion });

// Un servicio lleva al formulario con su interés ya elegido.
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-interes]");
  if (a) $('#contact-form [name="interes"]').value = a.dataset.interes;
});

// TODO: conectar el formulario (correo o CRM). Por ahora no envía nada.
$("#contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const note = e.target.querySelector(".form-note");
  note.hidden = false;
  note.textContent = "Formulario de demostración: el envío todavía no está conectado.";
});

/* ---------- Rutas: página general y un módulo por plataforma ----------
   Todo va en un solo archivo. La página general es #inicio (y sus secciones: #servicios, #contacto…);
   cada plataforma es un módulo aparte en #su-id (por ejemplo #ticketera), definido en src/modulos. */

document.documentElement.classList.add("js");
const home = $("#home");
const modulo = $("#modulo");
const TITULO = document.title;
let enModulo = false;
let soltar = null; // limpieza del módulo abierto (relojes, observadores)

function abrirModulo(m) {
  const i = MODULOS.indexOf(m);
  const sig = MODULOS[(i + 1) % MODULOS.length];
  soltar?.();
  home.hidden = true;
  modulo.hidden = false;
  modulo.className = "module mod-" + m.id + (m.propio ? " module-propio" : "");
  modulo.dataset.theme = "light";
  // Los módulos que vienen de una presentación suman a la ruta los enlaces a sus secciones.
  const secciones = m.secciones
    ? `<span class="m-secs">${m.secciones.map(([id, t]) => `<a href="#${id}">${t}</a>`).join("")}</span>`
    : "";
  // Todas las páginas de plataforma comparten la misma armazón: ruta con su familia, contenido
  // propio, beneficios, las otras plataformas de la familia y el cierre.
  const fam = familiaDe(m.id);
  const hermanas = fam.ids.filter((id) => id !== m.id).map((id) => MODULOS.find((x) => x.id === id));
  modulo.innerHTML = `
    <nav class="m-crumb" aria-label="Ruta"><a href="#plataformas" data-general>Plataformas</a><span aria-hidden="true">/</span><span>${fam.nombre}</span><span aria-hidden="true">/</span><span>${m.nombre}</span>${secciones}</nav>
    ${m.html()}
    ${m.beneficios ? beneficios("Qué gana la municipalidad", m.beneficios) : ""}
    <section class="m-family">
      <h2>También en ${fam.nombre.toLowerCase()}</h2>
      <ul>${hermanas.map((h) => `<li><a href="#${h.id}"><strong>${h.nombre}</strong><span>${h.que}</span></a></li>`).join("")}</ul>
    </section>
    <section class="m-cta">
      <div>
        <h2>Vea ${m.nombre} funcionando</h2>
        <p>Coordinamos una demostración con el equipo de Goberna Tech.</p>
        <a class="btn btn-gold btn-lg" href="#contacto" data-general>Solicitar demostración</a>
      </div>
      <a class="m-next" href="#${sig.id}"><span>Siguiente plataforma</span><strong>${sig.nombre}</strong><em>${sig.que}</em></a>
    </section>`;
  ponerEsquemas(modulo);
  activarExploradores(modulo);
  revelar(modulo);
  soltar = m.init?.(modulo, { sinMovimiento }) ?? null;
  enModulo = true;
  document.title = `${m.nombre} | Goberna Tech`;
  scrollTo({ top: 0, behavior: "instant" });
  paintBar();
}

function abrirGeneral(hash) {
  if (enModulo) {
    soltar?.();
    soltar = null;
    modulo.hidden = true;
    modulo.innerHTML = "";
    home.hidden = false;
    enModulo = false;
    document.title = TITULO;
    dispatchEvent(new Event("resize")); // la portada vuelve a medir
    const destino = hash.length > 1 && document.getElementById(hash.slice(1));
    // Al volver desde un módulo, el salto al ancla se hace a mano (la sección estaba oculta).
    requestAnimationFrame(() => (destino ? destino.scrollIntoView({ behavior: "instant" }) : scrollTo({ top: 0, behavior: "instant" })));
  }
  paintBar();
}

// Dentro de un módulo, un enlace a una de sus propias secciones (#recorrido, #beneficios…) baja
// hasta ella sin cambiar de página. Los marcados con data-general van a la página general.
modulo.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute("href");
  const destino = !("general" in a.dataset) && href.length > 1 && modulo.querySelector("#" + CSS.escape(href.slice(1)));
  if (destino) {
    e.preventDefault();
    destino.scrollIntoView({ behavior: reduceMotion ? "instant" : "smooth" });
  } else if (location.hash === href) {
    e.preventDefault();
    ruta(); // el enlace repite la dirección actual: se resuelve a mano
  }
});

function ruta() {
  const m = MODULOS.find((x) => location.hash === "#" + x.id);
  if (m) abrirModulo(m);
  else abrirGeneral(location.hash);
}
addEventListener("hashchange", ruta);
revelar(home); // movimiento al bajar por la página general

/* ---------- Scroll de la portada ---------- */

// La portada mide más que la pantalla. Ese tramo extra (heroSpan) es el recorrido de la cámara.
let heroSpan = 1;
let heroEnd = 1;
function measure() {
  heroSpan = Math.max(1, hero.offsetHeight - stage.offsetHeight);
  heroEnd = hero.offsetTop + hero.offsetHeight;
}
const heroProgress = () => clamp((scrollY - hero.offsetTop) / heroSpan, 0, 1);

// La barra pasa a blanca cuando la portada termina de salir.
function paintBar() {
  bar.classList.toggle("is-solid", enModulo || scrollY > heroEnd - bar.offsetHeight);
}
measure();
ruta();
addEventListener("scroll", paintBar, { passive: true });
addEventListener("load", () => {
  measure();
  paintBar();
});

/* ---------- Escena 3D: portada y fondo de "Cómo trabajamos" ----------
   Hay un solo lienzo. Vive en la portada y, cuando "Cómo trabajamos" entra en pantalla, se muda
   a esa sección y la cámara pasa a rodear el foro. Las dos secciones nunca se ven a la vez. */

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
} catch {
  document.documentElement.classList.add("no-webgl");
  addEventListener("resize", () => {
    measure();
    paintBar();
  });
}

if (renderer) {
  let host = stage; // dónde está el lienzo ahora: la portada o el fondo de "Cómo trabajamos"
  let W = host.clientWidth;
  let H = host.clientHeight;

  // Densidad de píxeles: tope más bajo en el teléfono, y baja sola si el equipo no llega (ver el bucle).
  const DPR_MAX = Math.min(devicePixelRatio, coarse ? 1.5 : 2);
  const DPR_MIN = Math.min(1, DPR_MAX);
  let dpr = DPR_MAX;
  renderer.setPixelRatio(dpr);
  renderer.localClippingEnabled = true;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 90000);
  const world = buildWorld(scene);

  const composer = new EffectComposer(
    renderer,
    new THREE.WebGLRenderTarget(W * dpr, H * dpr, { type: THREE.HalfFloatType, samples: coarse ? 2 : 4 }),
  );
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(W, H), 0.3, 0.55, 0.5));
  composer.addPass(new OutputPass());

  /* Trayecto de la cámara: del palacio (portada) hacia el distrito, mientras la portada se despide.
     Cada punto tiene posición (p) y hacia dónde mira (l). */
  const WAY = [
    { p: [-8.5, 5.6, 22], l: [2, 4.9, -9] }, // portada: el palacio de tres cuartos
    { p: [-3, 7.6, 12], l: [2, 5.4, -22] }, //       se acerca y sube sobre la plaza
    { p: [9, 10.5, -10], l: [0, 6.5, -52] }, //     pasa junto al frontón
    { p: [20, 14.5, -36], l: [0, 8, -72] }, //      el distrito y su red de datos
  ];
  const vec = (a) => new THREE.Vector3(...a);
  const posCurve = new THREE.CatmullRomCurve3(WAY.map((w) => vec(w.p)), false, "centripetal");
  const lookCurve = new THREE.CatmullRomCurve3(WAY.map((w) => vec(w.l)), false, "centripetal");

  const lookAt = new THREE.Vector3();
  const right = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  let fovBase = 50;
  let shiftX = 0; // desplazamiento del encuadre (px): deja libre el lado del texto
  let shiftY = 0;

  function resize(force) {
    if (enModulo) return; // la portada está oculta: no hay nada que medir
    const w = host.clientWidth;
    const h = host.clientHeight;
    measure();
    paintBar();
    if (force !== true && w === W && h === H) return;
    W = w;
    H = h;
    renderer.setSize(W, H, false);
    composer.setSize(W, H);
    camera.aspect = W / H;
    // En pantallas verticales se abre el campo visual para que la escena quepa a lo ancho.
    fovBase = camera.aspect >= 1 ? 50 : lerp(50, 76, clamp((1 - camera.aspect) / 0.55, 0, 1));
    const wide = W >= 760;
    shiftX = wide ? 0.25 * W : 0; //  en escritorio el texto va a la izquierda: la escena, a la derecha
    shiftY = wide ? 0 : -0.2 * H; //  en el teléfono el texto va abajo: la escena, arriba
  }
  addEventListener("resize", resize);
  resize(true);

  function mudar(a) {
    if (host === a) return;
    host = a;
    a.prepend(canvas);
    resize(true);
  }
  let foroT = 0; // tiempo del recorrido alrededor del foro (se detiene con "Pausar movimiento")

  // El puntero mueve apenas la cámara: da profundidad sin cambiar el encuadre.
  const pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  if (!coarse && !reduceMotion) {
    addEventListener(
      "pointermove",
      (e) => {
        pointer.x = (e.clientX / innerWidth) * 2 - 1;
        pointer.y = (e.clientY / innerHeight) * 2 - 1;
      },
      { passive: true },
    );
  }

  const timer = new THREE.Timer();
  timer.connect(document);
  let progress = heroProgress();
  let built = reduceMotion ? 5 : 0; // la ciudad se construye al cargar (0 → 5), una sola vez
  let first = true;
  let frames = 0;
  let slowSum = 0;
  let slowN = 0;
  let idle = false;

  renderer.setAnimationLoop(() => {
    timer.update();
    const dt = Math.min(timer.getDelta(), 0.1);
    const time = reduceMotion ? 0 : timer.getElapsed();

    // Qué se ve ahora: la portada, el fondo de "Cómo trabajamos" o ninguna de las dos (no se dibuja nada).
    const enPortada = !enModulo && scrollY < heroEnd;
    let fr = null;
    if (!enModulo && !enPortada && !foroVideo) {
      fr = foroBg.getBoundingClientRect();
      if (fr.bottom <= 0 || fr.top >= innerHeight) fr = null;
    }
    if (!enPortada && !fr) {
      idle = true;
      return;
    }
    mudar(fr ? foroBg : stage);
    const target = heroProgress();
    if (idle) {
      idle = false;
      progress = target;
    }

    // Si el equipo no llega a un ritmo fluido, baja la densidad de píxeles un escalón.
    // (dt va acotado: una pausa larga, como cambiar de pestaña, cuenta como un solo cuadro lento.)
    if (++frames > 10 && dpr > DPR_MIN) {
      slowSum += dt;
      if (++slowN === 24) {
        const avg = slowSum / slowN;
        if (avg > 0.026) {
          dpr = avg > 0.05 ? DPR_MIN : Math.max(DPR_MIN, dpr - 0.25);
          renderer.setPixelRatio(dpr);
          composer.setPixelRatio(dpr);
        }
        slowSum = slowN = 0;
      }
    }

    // Solo en desarrollo: cámara fija para sacar las imágenes fijas del mundo (tools/fotos.mjs).
    if (import.meta.env.DEV && window.__foto) {
      const F = window.__foto;
      camera.position.set(...F.p);
      lookAt.set(...F.l);
      camera.lookAt(lookAt);
      camera.fov = F.fov ?? 50;
      camera.clearViewOffset();
      world.update({ m: 1, f: 5, e: 0, time: F.t ?? 3, lookZ: F.lookZ ?? lookAt.z, altitude: camera.position.y });
      composer.render();
      document.documentElement.classList.add("ready");
      return;
    }

    const ease = 1 - Math.exp(-dt * 3);
    pointer.sx += (pointer.x - pointer.sx) * ease;
    pointer.sy += (pointer.y - pointer.sy) * ease;

    if (fr) {
      // Fondo de "Cómo trabajamos": la cámara rodea despacio el foro (escenario, graderías y público)
      // y baja un poco a medida que la sección sube por la pantalla.
      if (!movPausado) foroT += dt;
      const paso = clamp(1 - fr.bottom / (innerHeight + fr.height), 0, 1);
      const a = Math.sin(foroT * 0.11) * 0.62;
      camera.position.set(Math.sin(a) * 30 + pointer.sx * 0.8, 10.5 - paso * 4 - pointer.sy * 0.4, -125 + Math.cos(a) * 30);
      lookAt.set(0, 2.6, -128);
      camera.lookAt(lookAt);
      camera.fov = fovBase;
      const ancho = W >= 760;
      camera.setViewOffset(W, H, ancho ? -0.2 * W : 0, ancho ? 0.05 * H : 0.02 * H, W, H);
      world.update({ m: 1, f: 5, e: 0, time, lookZ: lookAt.z, altitude: camera.position.y });
      composer.render();
      if (first) {
        first = false;
        document.documentElement.classList.add("ready");
      }
      return;
    }

    progress = reduceMotion ? target : progress + (target - progress) * (1 - Math.exp(-dt * 4.5));
    built = Math.min(5, built + dt * 1.1);

    // Cámara
    const u = smootherstep(progress, 0, 1);
    posCurve.getPoint(u, camera.position);
    lookCurve.getPoint(u, lookAt);
    if (!reduceMotion) camera.position.y += Math.sin(time * 0.5) * 0.12;

    right.subVectors(lookAt, camera.position).cross(UP).normalize();
    camera.position.addScaledVector(right, pointer.sx * 0.7);
    camera.position.y -= pointer.sy * 0.3;

    camera.lookAt(lookAt);
    camera.fov = fovBase;
    // El encuadre vuelve al centro a medida que el texto se va.
    const k = 1 - smoothstep(progress, 0.15, 0.8);
    camera.setViewOffset(W, H, -shiftX * k, -shiftY * k, W, H);

    world.update({ m: 1, f: built, e: 0, time, lookZ: lookAt.z, altitude: camera.position.y });
    composer.render();

    // El texto de la portada se despide con el scroll.
    const out = smoothstep(progress, 0.04, 0.38);
    heroCopy.style.opacity = (1 - out).toFixed(3);
    heroCopy.style.transform = `translateY(${(-40 * out).toFixed(1)}px)`;
    heroCopy.style.visibility = out > 0.98 ? "hidden" : "visible";
    heroCue.style.opacity = (1 - smoothstep(progress, 0.01, 0.12)).toFixed(3);
    heroCue.style.visibility = progress > 0.12 ? "hidden" : "visible";

    if (first) {
      first = false;
      document.documentElement.classList.add("ready");
    }
  });
}
