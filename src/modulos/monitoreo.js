// Monitoreo de seguridad ciudadana. Pieza distintiva: la central en miniatura. Los patrulleros se
// mueven por el mapa y la persona puede despachar uno a la incidencia nueva.
import { bloque, datos, DEMO } from "./comun.js";

const calles = () => {
  let s = "";
  for (let i = 1; i < 12; i++) s += `<line x1="${i * 60}" y1="0" x2="${i * 60}" y2="460" class="mo-st"/>`;
  for (let i = 1; i < 8; i++) s += `<line x1="0" y1="${i * 58}" x2="720" y2="${i * 58}" class="mo-st"/>`;
  return s;
};
// Un patrullero que recorre un circuito de calles.
const patrulla = (id, d, dur) =>
  `<g class="mo-car" id="${id}"><rect x="-13" y="-7" width="26" height="14" rx="3"/><animateMotion dur="${dur}s" repeatCount="indefinite" path="${d}"/></g>`;
const camara = (x, y) => `<g class="mo-cam" transform="translate(${x} ${y})"><rect x="-9" y="-6" width="12" height="12" rx="2"/><path d="M3 -3l8 -4v14l-8 -4z"/></g>`;

export default {
  id: "monitoreo-seguridad",
  nombre: "Monitoreo de seguridad ciudadana",
  que: "Panel para la central de serenazgo",
  beneficios: [
    ["Todo en el mapa", "Incidencias, patrulleros y cámaras sobre mapas geoespaciales."],
    ["Despacho ordenado", "El operador envía el auxilio desde el mismo panel."],
    ["Recursos ubicados", "Se ve dónde está cada patrullero y cada cámara."],
    ["Del vecino a la central", "Las alertas de la app llegan directo a monitoreo."],
  ],
  html: () => `
    <header class="m-hero m-hero-dark mo-hero">
      <p class="m-kicker">Panel para la central de serenazgo</p>
      <h1>Todo el distrito en una sola pantalla.</h1>
      <p class="m-lead">El panel de control de la central y de sus operadores: las incidencias reportadas por los vecinos sobre el mapa, los patrulleros y las cámaras ubicados, y el despacho de auxilio.</p>
    </header>

    <section class="mo-central">
      <div class="mo-map">
        <svg viewBox="0 0 720 460" role="img" aria-label="Esquema del mapa de la central con incidencias, patrulleros y cámaras">
          ${calles()}
          <path d="M0 290C160 270 260 320 400 280S620 230 720 240" class="mo-av"/>
          <path d="M300 0C312 170 280 300 330 460" class="mo-av"/>
          ${camara(90, 96)}${camara(630, 80)}${camara(250, 400)}${camara(640, 400)}
          <line class="mo-ruta" x1="420" y1="174" x2="250" y2="210"/>
          ${patrulla("mo-p1", "M120 232H300V116H120Z", 26)}
          ${patrulla("mo-p2", "M480 348H660V232H480Z", 30)}
          <g class="mo-car mo-car-fija"><rect x="407" y="167" width="26" height="14" rx="3"/></g>
          <g class="mo-pin is-new" transform="translate(250 210)"><circle r="22" class="mo-pulse"/><path d="M0 0c-8-10-12-16-12-22a12 12 0 0 1 24 0c0 6-4 12-12 22z"/></g>
          <g class="mo-pin" transform="translate(520 330)"><path d="M0 0c-6-8-9-12-9-17a9 9 0 0 1 18 0c0 5-3 9-9 17z"/></g>
          <g class="mo-pin" transform="translate(560 150)"><path d="M0 0c-6-8-9-12-9-17a9 9 0 0 1 18 0c0 5-3 9-9 17z"/></g>
        </svg>
        <p class="mo-leyenda"><i class="is-pin"></i>Incidencia <i class="is-car"></i>Patrullero <i class="is-cam"></i>Cámara</p>
      </div>
      <div class="mo-panel">
        <h2>Incidencias</h2>
        <ul>
          <li class="is-new"><strong>Alerta vecinal</strong><span class="mo-estado" aria-live="polite">Nueva</span><button class="btn btn-gold" type="button" data-despachar>Despachar patrullero</button></li>
          <li><strong>Reporte con foto</strong><span>Patrulla en camino</span></li>
          <li><strong>Alerta vecinal</strong><span>Atendida</span></li>
        </ul>
        <p class="m-cap">${DEMO} Esquema ilustrativo de la central.</p>
      </div>
    </section>

    ${bloque("Qué ve la central", datos([
      ["Incidencias en el mapa", "Los reportes vecinales se ven sobre mapas geoespaciales."],
      ["Recursos ubicados", "Patrulleros y cámaras aparecen en el mismo mapa."],
      ["Despacho", "El operador gestiona el envío de auxilio desde el panel."],
    ]))}

    ${bloque("Trabaja junto con Alerta vecinal", `<p class="m-text">Las alertas y los reportes con foto que envían los vecinos desde la app llegan a esta central. <a href="#alerta-vecinal">Ver Alerta vecinal</a></p>`)}
  `,
  init(el, { sinMovimiento }) {
    const central = el.querySelector(".mo-central");
    // Con "reducir movimiento" los patrulleros quedan quietos en su zona.
    if (sinMovimiento) {
      el.querySelectorAll("animateMotion").forEach((a) => a.remove());
      el.querySelector("#mo-p1").setAttribute("transform", "translate(120 232)");
      el.querySelector("#mo-p2").setAttribute("transform", "translate(480 348)");
    }
    central.querySelector("[data-despachar]").addEventListener("click", (e) => {
      central.classList.add("is-sent");
      central.querySelector(".mo-estado").textContent = "Patrulla en camino";
      e.currentTarget.remove();
    });
  },
};
