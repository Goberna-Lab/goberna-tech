// Página principal según el mockup (index.html): el menú del celular, el paso entre páginas
// (inicio, Munitech, plataformas, contacto y la página de cada plataforma), el formulario y el movimiento:
// misión y visión que se encienden al leer, parallax, entrada de los textos y tarjetas que se apilan.
// La versión anterior (escena 3D del palacio y demostraciones) sigue en index-3d.html + src/main.js.
import "@fontsource/catamaran/latin-400.css";
import "@fontsource/catamaran/latin-500.css";
import "@fontsource/catamaran/latin-600.css";
import "@fontsource/catamaran/latin-700.css";
import "@fontsource/catamaran/latin-800.css";
import "@fontsource/space-mono/latin-400.css";
import "@fontsource/montserrat/latin-700.css"; // título de la portada
import "./modulos.css";
import "./home.css";
import { MODULOS } from "./modulos/index.js";
import { FAMILIAS, familiaDe } from "./modulos/familias.js";
import { ponerEsquemas, activarExploradores, sinMovimiento, revelar, beneficios } from "./modulos/comun.js";
import { montarGlobo3D } from "./globo3d.js";
import { montarNiveles } from "./niveles.js";
import { montarLegado3D } from "./legado3d.js";
import { montarCursor } from "./cursor.js";
import { montarCredo } from "./credo.js";
import { montarEfectos } from "./efectos.js";

const $ = (s) => document.querySelector(s);
document.documentElement.classList.add("js");
$("#year").textContent = new Date().getFullYear();

const bar = $("#bar");
const paginas = { home: $("#home"), munitech: $("#munitech"), plataformas: $("#plataformas"), contacto: $("#contacto"), modulo: $("#modulo") };
const modulo = paginas.modulo;
const TITULO = document.title;
let soltar = null; // limpieza del módulo abierto (relojes, observadores)

/* ---------- Menú del celular ---------- */
const menu = $("#g-menu");
const menuBtn = $(".g-menu-btn");
function ponerMenu(abierto) {
  menu.hidden = !abierto;
  menuBtn.setAttribute("aria-expanded", String(abierto));
  menuBtn.textContent = abierto ? "Cerrar" : "Menú";
  document.body.classList.toggle("g-menu-abierto", abierto);
}
menuBtn.addEventListener("click", () => ponerMenu(menu.hidden));
menu.addEventListener("click", (e) => e.target.closest("a") && ponerMenu(false));
addEventListener("keydown", (e) => e.key === "Escape" && ponerMenu(false));

/* ---------- Plataformas para municipalidades, por familia ---------- */
$(".g-fams").innerHTML = FAMILIAS.map(
  (f) => `
  <section class="g-fam">
    <h2>${f.nombre}</h2>
    <ul>${f.ids
      .map((id) => MODULOS.find((m) => m.id === id))
      .map((m) => `<li><a href="#${m.id}"><strong>${m.nombre}</strong><span>${m.que}</span></a></li>`)
      .join("")}</ul>
  </section>`,
).join("");

/* ---------- Puntero propio (solo con mouse y sin "reducir movimiento") ---------- */
montarCursor();

/* ---------- Misión y visión: las frases se encienden palabra por palabra al bajar ---------- */
montarCredo($(".g-credo"), { quieto: sinMovimiento });

/* ---------- Servicios: un eje a la vez, en pestañas ---------- */
// Sin JavaScript los tres ejes se ven uno debajo del otro. Con él, pestañas accesibles (flechas, Inicio, Fin).
const pestanas = [...document.querySelectorAll(".g-svc-tab")];
function elegirEje(tab, enfocar = false) {
  for (const t of pestanas) {
    const si = t === tab;
    t.setAttribute("aria-selected", String(si));
    t.tabIndex = si ? 0 : -1;
    $("#" + t.getAttribute("aria-controls")).hidden = !si;
  }
  if (enfocar) tab.focus();
}
pestanas.forEach((t, i) => {
  t.addEventListener("click", () => elegirEje(t));
  t.addEventListener("keydown", (e) => {
    const n = pestanas.length;
    const j = { ArrowRight: i + 1, ArrowLeft: i - 1 + n, Home: 0, End: n - 1 }[e.key];
    if (j === undefined) return;
    e.preventDefault();
    elegirEje(pestanas[j % n], true);
  });
});
elegirEje(pestanas[0]);
// Un enlace a un eje (#eje-gobierno) o a un servicio (#editorial) abre su pestaña antes de bajar hasta él.
function abrirServicio(hash) {
  const el = hash.length > 1 && document.getElementById(hash.slice(1));
  const panel = el?.closest?.(".g-svc-panel");
  if (!panel) return false;
  elegirEje($("#" + panel.getAttribute("aria-labelledby")));
  requestAnimationFrame(() => el.scrollIntoView({ behavior: sinMovimiento ? "instant" : "smooth" }));
  return true;
}

/* ---------- Escenas 3D (con "reducir movimiento" quedan quietas) ---------- */
// Se montan cuando el navegador queda libre: primero se pinta el texto.
const cuandoLibre = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 700 }) : setTimeout(f, 80));
// La portada lleva el mundo en 3D (globo3d.js): se arrastra para girarlo y un clic lanza una onda dorada.
// Quedaron guardados sin usar: el mapa de América Latina con foco en el Perú (portada-mapa.js, montarPortadaMapa),
// el Perú en hilos de luz (peru3d.js) y el territorio de montañas (portada3d.js).
montarGlobo3D($(".g-hero"), $(".g-hero-3d"), { quieto: sinMovimiento });
// "Conocimiento que acompaña": los niveles de gobierno (niveles.js). El chip que construye el edificio
// (templo3d.js, montarTemplo3D) quedó guardado sin usar.
montarNiveles($(".g-niveles"), { quieto: sinMovimiento });
// Las tres etapas de "Tu legado permanece", igual: se montan al acercarse.
new IntersectionObserver(
  ([en], obs) => {
    if (!en.isIntersecting) return;
    obs.disconnect();
    cuandoLibre(() => montarLegado3D($(".g-premium .g-prem"), $(".g-legado-3d"), $(".g-legado-3d canvas"), $(".g-premium .g-pasos"), { quieto: sinMovimiento }));
  },
  { rootMargin: "700px 0px" },
).observe($(".g-legado-3d"));

/* ---------- Movimiento (solo si el dispositivo no pide reducirlo) ---------- */
if (!sinMovimiento) {
  // Parallax de imágenes y numerales.
  montarEfectos(paginas.home, {});
  // Los textos entran al aparecer en pantalla.
  const entra = new IntersectionObserver(
    (entradas) => {
      for (const en of entradas) {
        if (!en.isIntersecting) continue;
        en.target.classList.add("in");
        entra.unobserve(en.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px" },
  );
  const grupos = [".g-hero-in > *", ".g-saber .g-kicker", ".g-titulo", ".g-credo-t", ".g-saber-txt > *", ".g-niveles", ".g-prem h3", ".g-prem p", ".g-pasos", ".g-prem .g-btn", ".g-blog-cab", ".g-post"];
  for (const sel of grupos) {
    paginas.home.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("g-rev");
      el.style.setProperty("--d", `${Math.min(i, 5) * 90}ms`);
      entra.observe(el);
    });
  }
  // Las fotos se revelan (desenfocadas y oscuras → nítidas), una tras otra.
  paginas.home.querySelectorAll(".g-prem-foto, .g-post > img").forEach((el, i) => {
    el.classList.add("g-unveil");
    el.style.setProperty("--d", `${(i % 3) * 140}ms`);
    entra.observe(el);
  });
}

/* ---------- Páginas ---------- */
function mostrar(cual) {
  for (const [nombre, el] of Object.entries(paginas)) el.hidden = nombre !== cual;
  document.body.dataset.pagina = cual;
  pintarBarra();
}

function abrirModulo(m) {
  const sig = MODULOS[(MODULOS.indexOf(m) + 1) % MODULOS.length];
  soltar?.();
  mostrar("modulo");
  modulo.className = "module mod-" + m.id + (m.propio ? " module-propio" : "");
  modulo.dataset.theme = "light";
  const secciones = m.secciones ? `<span class="m-secs">${m.secciones.map(([id, t]) => `<a href="#${id}">${t}</a>`).join("")}</span>` : "";
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
  document.title = `${m.nombre} | Goberna Tech`;
  scrollTo({ top: 0, behavior: "instant" });
}

function ruta() {
  const hash = location.hash;
  const m = MODULOS.find((x) => hash === "#" + x.id);
  if (m) return abrirModulo(m);
  if (!modulo.hidden) {
    soltar?.();
    soltar = null;
    modulo.innerHTML = "";
  }
  document.title = TITULO;
  if (hash === "#munitech" || hash === "#plataformas" || hash === "#contacto") {
    mostrar(hash.slice(1));
    scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  const venia = paginas.home.hidden;
  mostrar("home");
  if (abrirServicio(hash)) return;
  // Al volver de otra página, el salto al ancla se hace a mano (la sección estaba oculta).
  if (venia) {
    const destino = hash.length > 1 && document.getElementById(hash.slice(1));
    requestAnimationFrame(() => (destino ? destino.scrollIntoView({ behavior: "instant" }) : scrollTo({ top: 0, behavior: "instant" })));
  }
}
addEventListener("hashchange", ruta);
// Volver a pulsar un enlace a un servicio ya abierto no cambia el hash: se abre a mano.
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (a && !paginas.home.hidden && location.hash === a.getAttribute("href") && abrirServicio(location.hash)) e.preventDefault();
});

// Dentro de una plataforma, un enlace a una de sus propias secciones baja hasta ella sin cambiar
// de página. Los marcados con data-general van a otra página del sitio.
modulo.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const href = a.getAttribute("href");
  const destino = !("general" in a.dataset) && href.length > 1 && modulo.querySelector("#" + CSS.escape(href.slice(1)));
  if (destino) {
    e.preventDefault();
    destino.scrollIntoView({ behavior: sinMovimiento ? "instant" : "smooth" });
  } else if (location.hash === href) {
    e.preventDefault();
    ruta();
  }
});

// La barra va transparente sobre la portada y toma fondo al bajar o en las demás páginas.
function pintarBarra() {
  bar.classList.toggle("es-solida", document.body.dataset.pagina !== "home" || scrollY > 24);
}
addEventListener("scroll", pintarBarra, { passive: true });
ruta();

/* ---------- Formulario ---------- */
// Un servicio lleva al formulario con su interés ya elegido.
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-interes]");
  if (a) $('#contact-form [name="interes"]').value = a.dataset.interes;
});
// TODO: conectar el formulario con el correo o el CRM de Goberna Tech. Hoy no envía nada.
$("#contact-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const nota = e.target.querySelector(".form-note");
  nota.hidden = false;
  nota.textContent = e.target.checkValidity()
    ? "Formulario de demostración: el envío todavía no está conectado."
    : "Completa tu nombre y un correo válido.";
});
