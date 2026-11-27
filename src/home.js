// Página principal según el mockup (index.html): el menú del celular, el paso entre páginas
// (inicio, Munitech, plataformas y la página de cada plataforma), el formulario y el movimiento:
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
import { montarRedFondo } from "./red-fondo.js";
import { montarNiveles } from "./niveles.js";
import { montarEjes } from "./ejes.js";
import { montarCursor } from "./cursor.js";
import { montarCredo } from "./credo.js";
import { montarEfectos } from "./efectos.js";

const $ = (s) => document.querySelector(s);
document.documentElement.classList.add("js");
$("#year").textContent = new Date().getFullYear();

const bar = $("#bar");
const paginas = { home: $("#home"), servicios: $("#nuestros-servicios"), nosotros: $("#quienes-somos"), munitech: $("#munitech"), plataformas: $("#plataformas"), articulo: $("#ganaste-ahora-que"), modulo: $("#modulo") };
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

/* ---------- Servicios: su página, un bloque por eje con un servicio a la vez (ejes.js) ---------- */
// Las pestañas con carrusel de tarjetas (carrusel.js) quedaron guardadas sin usar.
montarEjes(paginas.servicios);
// Un enlace a un eje (#eje-gobierno) o a un servicio (#editorial) abre la página de servicios, baja hasta su eje y,
// si es un servicio, lo muestra en el carrusel del eje.
function abrirServicio(hash) {
  const el = hash.length > 1 && document.getElementById(hash.slice(1));
  const eje = el?.closest?.("[data-eje]");
  if (!eje) return false;
  const venia = paginas.servicios.hidden;
  mostrar("servicios");
  if (el !== eje) eje.irA?.([...eje.querySelectorAll(".g-ejed-svc")].indexOf(el));
  requestAnimationFrame(() => eje.scrollIntoView({ behavior: venia || sinMovimiento ? "instant" : "smooth", block: "start" }));
  return true;
}

/* ---------- Escenas 3D (con "reducir movimiento" quedan quietas) ---------- */
// Se montan cuando el navegador queda libre: primero se pinta el texto.
const cuandoLibre = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 700 }) : setTimeout(f, 80));
// La portada lleva el mundo en 3D (globo3d.js): se arrastra para girarlo y un clic lanza una onda dorada.
// Quedaron guardados sin usar: el mapa de América Latina con foco en el Perú (portada-mapa.js, montarPortadaMapa),
// el Perú en hilos de luz (peru3d.js) y el territorio de montañas (portada3d.js).
montarGlobo3D($(".g-hero"), $(".g-hero-3d"), { quieto: sinMovimiento });
// Detrás del mundo, una red de inteligencia sutil (red-fondo.js).
montarRedFondo($(".g-hero"), $(".g-hero-red-fondo"), { quieto: sinMovimiento });
// "Conocimiento que acompaña": los niveles de gobierno (niveles.js). El chip que construye el edificio
// (templo3d.js, montarTemplo3D) quedó guardado sin usar.
montarNiveles($(".g-niveles"), { quieto: sinMovimiento });
// Las etapas del legado en 3D (legado3d.js, montarLegado3D) quedaron guardadas sin usar: Servicios premium es una franja.

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
  const grupos = [".g-hero-in > *", ".g-saber .g-kicker", ".g-titulo", ".g-credo-t", ".g-saber-txt > *", ".g-niveles", ".g-prem-cab", ".g-premc", ".g-blog-cab", ".g-post"];
  for (const sel of grupos) {
    paginas.home.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add("g-rev");
      el.style.setProperty("--d", `${Math.min(i, 5) * 90}ms`);
      entra.observe(el);
    });
  }
  // Las fotos se revelan (desenfocadas y oscuras → nítidas), una tras otra.
  paginas.home.querySelectorAll(".g-premc-img, .g-post > img").forEach((el, i) => {
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
  // Nosotros: su página; Misión y Visión bajan a su tarjeta.
  if (hash === "#quienes-somos" || hash === "#mision" || hash === "#vision") {
    mostrar("nosotros");
    const destino = hash !== "#quienes-somos" && document.getElementById(hash.slice(1));
    requestAnimationFrame(() => (destino ? destino.scrollIntoView({ behavior: "instant", block: "center" }) : scrollTo({ top: 0, behavior: "instant" })));
    return;
  }
  if (abrirServicio(hash)) return;
  if (hash === "#nuestros-servicios") {
    mostrar("servicios");
    scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  if (hash === "#munitech" || hash === "#plataformas") {
    mostrar(hash.slice(1));
    scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  // Artículo del blog: su propia página.
  if (hash === "#ganaste-ahora-que") {
    mostrar("articulo");
    document.title = `${paginas.articulo.querySelector("h1").textContent} | Goberna Tech`;
    scrollTo({ top: 0, behavior: "instant" });
    return;
  }
  const venia = paginas.home.hidden;
  mostrar("home");
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
  if (a && location.hash === a.getAttribute("href") && abrirServicio(location.hash)) e.preventDefault();
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
// Los datos van a Bravo, el panel de Goberna, igual que en el Foro de Estado. El tenant "goberna-tech" tiene que
// existir en Bravo (npm run create-tenant -w @goberna/bravo-api -- goberna-tech "Goberna Tech"); si no, Bravo
// responde 404 y la persona ve el aviso de error con el enlace a WhatsApp.
const BRAVO_CONTACTO = "https://bravo.goberna.us/v1/public/contact";
const BRAVO_TENANT = "goberna-tech";
const WSP_VENTAS = "https://wa.me/51907772155";

$("#contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const nota = form.querySelector(".form-note");
  const boton = form.querySelector('button[type="submit"]');
  const avisar = (html, error) => {
    nota.hidden = false;
    nota.classList.toggle("es-error", error);
    nota.innerHTML = html;
  };
  if (!form.checkValidity()) {
    avisar("Completa todos los campos con un correo válido.", true);
    form.querySelector(":invalid")?.focus();
    return;
  }
  const v = (nombre) => form.elements[nombre].value.trim();
  const datos = {
    tenant: BRAVO_TENANT,
    name: `${v("nombre")} ${v("apellido")}`,
    email: v("correo"),
    phone: v("whatsapp"),
    website: form.elements.website.value,
    nombre: v("nombre"),
    apellido: v("apellido"),
    organizacion: v("organizacion"),
    cargo: v("cargo"),
    interes: v("interes"),
  };
  const texto = boton.textContent;
  boton.disabled = true;
  boton.textContent = "Enviando…";
  try {
    const res = await fetch(BRAVO_CONTACTO, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!res.ok) throw new Error(`Bravo respondió ${res.status}`);
    form.reset();
    form.elements.interes.value = "";
    avisar(`Gracias, ${datos.nombre}. Recibimos tu solicitud y te escribiremos pronto.`, false);
  } catch (err) {
    console.warn("[contacto]", err);
    avisar(
      `No pudimos enviar tus datos. Intenta de nuevo en unos minutos o <a href="${WSP_VENTAS}" target="_blank" rel="noopener">escríbenos por WhatsApp</a>.`,
      true,
    );
  } finally {
    boton.disabled = false;
    boton.textContent = texto;
  }
});
