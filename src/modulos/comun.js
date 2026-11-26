// Piezas que comparten los módulos de plataforma: bloques de texto, el explorador de imágenes
// con anotaciones y los esquemas ilustrativos. Cada módulo (un archivo por plataforma en esta
// carpeta) arma su propia página con estas piezas y le suma su pieza distintiva.

export const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export const CAP_REAL = "Pantalla real del sistema, con datos de ejemplo.";
export const CAP_ART = "Esquema ilustrativo.";
export const DEMO = "Demostración con datos de ejemplo.";

/* ---------- Bloques de texto ---------- */

// Pasos numerados: solo para secuencias reales.
export const pasos = (items) =>
  `<ol class="steps${items.length === 3 ? " steps-3" : ""}">${items.map(([t, d]) => `<li><h4>${t}</h4><p>${d}</p></li>`).join("")}</ol>`;

export const datos = (items, cols = items.length === 3 ? 3 : 4) =>
  `<dl class="facts${cols === 3 ? " facts-3" : ""}">${items.map(([t, d]) => `<div><dt>${t}</dt><dd>${d}</dd></div>`).join("")}</dl>`;

export const bloque = (titulo, contenido, intro = "") =>
  `<section class="m-block"><h2>${titulo}</h2>${intro ? `<p class="m-intro">${intro}</p>` : ""}${contenido}</section>`;

/* ---------- Explorador: imagen grande, pestañas y anotaciones A, B, C, D ---------- */

// vistas: [{ tab, img?: {src, w, h, alt, phone}, art?: "nombre", cap?, puntos: [[x%, y%, título, texto], …] }]
export function explorador(nombre, vistas, clase = "") {
  const L = "ABCD";
  const tabs =
    vistas.length > 1
      ? `<div class="tabs" role="tablist" aria-label="Vistas de ${esc(nombre)}">${vistas
          .map((v, i) => `<button type="button" role="tab" data-tab="${i}" aria-selected="${i === 0}">${v.tab}</button>`)
          .join("")}</div>`
      : "";
  const stage = vistas
    .map((v, i) => {
      const media = v.img
        ? `<img src="${v.img.src}" alt="${esc(v.img.alt)}" width="${v.img.w}" height="${v.img.h}" loading="lazy" />`
        : `<div class="art" data-art="${v.art}"></div>`;
      const cls = v.img ? (v.img.phone ? "media media-phone" : "media media-shot") : "media media-art";
      const beacons = v.puntos
        .map((p, j) => `<button class="beacon" type="button" data-beacon="${j}" style="left:${p[0]}%;top:${p[1]}%" aria-label="${L[j]}: ${esc(p[2])}">${L[j]}</button>`)
        .join("");
      return `<figure class="view" data-view="${i}"${i ? " hidden" : ""}><div class="${cls}">${media}${beacons}</div><figcaption>${
        v.cap ?? (v.img ? CAP_REAL : CAP_ART)
      }</figcaption></figure>`;
    })
    .join("");
  const notes = vistas
    .map(
      (v, i) =>
        `<div class="notes${v.puntos.length === 4 ? " notes-4" : ""}" data-notes="${i}"${i ? " hidden" : ""}>${v.puntos
          .map((p, j) => `<button class="note" type="button" data-beacon="${j}"><b>${L[j]}</b><span><strong>${p[2]}</strong>${p[3]}</span></button>`)
          .join("")}</div>`,
    )
    .join("");
  return `<div class="explorer ${clase}" data-explorer>${tabs}<div class="stage">${stage}</div>${notes}</div>`;
}

// Los esquemas ilustrativos son SVG de src/art; se insertan en línea para que usen la tipografía y los colores de la página.
const arts = import.meta.glob("../art/*.svg", { query: "?raw", import: "default", eager: true });
export function ponerEsquemas(root = document) {
  for (const el of root.querySelectorAll("[data-art]")) el.innerHTML = arts[`../art/${el.dataset.art}.svg`] ?? "";
}

// Al entrar en pantalla, las anotaciones aparecen una tras otra (una sola vez).
const visto = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("is-in");
      setTimeout(() => en.target.classList.add("is-settled"), 900);
      visto.unobserve(en.target);
    }
  },
  { threshold: 0.25 },
);

export function activarExploradores(root = document) {
  for (const ex of root.querySelectorAll("[data-explorer]")) {
    const tabs = [...ex.querySelectorAll("[data-tab]")];
    const views = [...ex.querySelectorAll("[data-view]")];
    const notes = [...ex.querySelectorAll("[data-notes]")];
    let current = 0;

    // Activa la anotación i de la vista actual: resalta su punto, su texto y enfoca esa zona de la imagen.
    const focus = (i) => {
      const media = views[current].querySelector(".media");
      const beacons = [...views[current].querySelectorAll(".beacon")];
      beacons.forEach((b, j) => b.setAttribute("aria-pressed", String(j === i)));
      notes[current].querySelectorAll(".note").forEach((n, j) => n.setAttribute("aria-pressed", String(j === i)));
      media.style.setProperty("--bx", beacons[i].style.left);
      media.style.setProperty("--by", beacons[i].style.top);
      media.classList.add("has-focus");
    };
    const show = (n) => {
      current = n;
      tabs.forEach((t, j) => t.setAttribute("aria-selected", String(j === n)));
      views.forEach((v, j) => (v.hidden = j !== n));
      notes.forEach((v, j) => (v.hidden = j !== n));
      focus(0);
    };
    const pick = (e) => {
      const tab = e.target.closest("[data-tab]");
      if (tab) return e.type === "click" && show(Number(tab.dataset.tab));
      const b = e.target.closest("[data-beacon]");
      if (b) focus(Number(b.dataset.beacon));
    };
    ex.addEventListener("click", pick);
    ex.addEventListener("pointerover", (e) => e.pointerType === "mouse" && pick(e));
    focus(0);
    visto.observe(ex);
  }
}

// Ejecuta fn cuando el elemento entra en pantalla por primera vez.
export function alVer(el, fn, threshold = 0.35) {
  const o = new IntersectionObserver(
    ([en]) => {
      if (!en.isIntersecting) return;
      o.disconnect();
      fn();
    },
    { threshold },
  );
  o.observe(el);
  return () => o.disconnect();
}

export const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Módulos tomados de las presentaciones (Ticketera y SGTI) ---------- */

// Las capturas del HTML llevan data-img="nombre"; aquí reciben su imagen.
export function ponerImagenes(root, mapa) {
  for (const im of root.querySelectorAll("img[data-img]")) {
    const i = mapa[im.dataset.img];
    if (!i) continue;
    im.src = i.src;
    im.width = i.w;
    im.height = i.h;
  }
}

// Al tocar una captura se ve en grande; se cierra con un clic o con Escape.
export function activarVisor(root) {
  let visor = null;
  const cerrar = () => {
    visor?.remove();
    visor = null;
  };
  const alPulsar = (e) => {
    if (visor) return cerrar();
    const b = e.target.closest("[data-ver]");
    const im = b?.querySelector("img");
    if (!im) return;
    visor = document.createElement("div");
    visor.className = "visor";
    visor.setAttribute("role", "dialog");
    visor.setAttribute("aria-modal", "true");
    visor.setAttribute("aria-label", im.alt);
    visor.innerHTML = `<img alt="" /><button class="visor-cerrar" type="button">Cerrar</button>`;
    visor.querySelector("img").src = im.src;
    visor.querySelector("img").alt = im.alt;
    root.appendChild(visor);
    visor.querySelector("button").focus();
  };
  const alTeclear = (e) => e.key === "Escape" && cerrar();
  root.addEventListener("click", alPulsar);
  addEventListener("keydown", alTeclear);
  return () => {
    root.removeEventListener("click", alPulsar);
    removeEventListener("keydown", alTeclear);
    cerrar();
  };
}

// Alto que tapan las barras fijas (la de la web y la del módulo), para acomodar el recorrido 3D debajo.
export const altoBarras = (root) => () =>
  (document.querySelector("#bar")?.offsetHeight ?? 0) + (root.querySelector(".cabecera")?.offsetHeight ?? 0);

/* ---------- Movimiento al hacer scroll ----------
   Marca con la clase "reveal" los títulos y las filas de una parte de la página, y los va mostrando
   (fundido y subida) cuando entran en pantalla, uno tras otro. Se aplica a la página general y a
   cada módulo que no trae su propia animación. */
const revelador = new IntersectionObserver(
  (entries) => {
    for (const en of entries) {
      if (!en.isIntersecting) continue;
      en.target.classList.add("in");
      revelador.unobserve(en.target);
    }
  },
  { rootMargin: "0px 0px -8% 0px", threshold: 0.12 },
);

export function revelar(root) {
  if (sinMovimiento) return;
  const titulos = root.querySelectorAll(
    "h2, .m-block > .m-intro, .intro-lead, .know-text, .benef > p, .p-intro, .fam, .foto, .premium-card, .eyebrow, .banda-copy",
  );
  const grupos = root.querySelectorAll(
    ".facts, .steps, .areas, .principles, .index, .figures, .faq-list, .m-family ul, .eje-lista, .ejes-lista, .know-more, .benef-list, .m-block > .explorer, .duo, .acc, .shot, .tres, .personas, .beneficios, .recorrido",
  );
  for (const t of titulos) {
    t.classList.add("reveal");
    revelador.observe(t);
  }
  for (const g of grupos) {
    const hijos = g.matches(".index") ? g.querySelectorAll("li") : g.children;
    [...hijos].forEach((el, i) => {
      el.classList.add("reveal");
      el.style.setProperty("--rev", `${Math.min(i, 8) * 70}ms`);
      revelador.observe(el);
    });
    if (!g.children.length) {
      g.classList.add("reveal");
      revelador.observe(g);
    }
  }
}

// Barra de beneficios: un título y varias tarjetas con filete superior (como en las presentaciones).
export function beneficios(titulo, items) {
  return `<section class="m-block benef"><h2>${titulo}</h2><div class="benef-list">${items
    .map(([t, d]) => `<div><h3>${t}</h3><p>${d}</p></div>`)
    .join("")}</div></section>`;
}
