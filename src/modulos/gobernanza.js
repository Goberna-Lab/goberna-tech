// Gobernanza Municipal. Pieza distintiva: dos herramientas lado a lado (el panel de la oficina y
// la app de la calle); la que se toca se agranda. Debajo, las cinco áreas de trabajo se despliegan.
import { bloque, datos, CAP_ART, CAP_REAL } from "./comun.js";
import { IMG, tag } from "./img.js";

const AREAS = [
  ["Visión general", "Consola de mando, mapa de alertas y encuestas.", "La consola reúne los indicadores del día, el avance de cada brigadista frente a su meta y el mapa de campo en vivo, con rutas, cobertura e incidencias."],
  ["Plan", "Base de datos y mapa territorial.", "Contactos, casas y calles en una sola base. Los sectores se dibujan o se importan, se filtran por estado y se exportan a GeoJSON, KML, PNG y PDF."],
  ["Campo", "Incidencias, asignación, rutas del día y revisitas.", "La asignación automática reparte las viviendas entre promotores con un máximo por persona y por día. Cada ruta se sigue durante la jornada."],
  ["Equipos", "Organigrama, usuarios, brigadas, productividad y reportes.", "Meta diaria, visitas, tendencia de ocho semanas y alertas de bajo rendimiento por cada brigadista."],
  ["Sistema", "Configuración de la municipalidad.", "Cada municipalidad trabaja solo con sus propios datos."],
];

export default {
  id: "gobernanza-municipal",
  nombre: "Gobernanza Municipal",
  que: "Inteligencia territorial",
  beneficios: [
    ["Territorio ordenado", "Sectores, casas y calles en una sola base, con el avance a la vista."],
    ["Trabajo repartido", "La asignación automática reparte las viviendas sin planillas."],
    ["Equipo medido", "Meta diaria, productividad y alertas de bajo rendimiento por brigadista."],
    ["Decisiones con mapa", "Cobertura e incidencias por zona, para saber dónde reforzar."],
    ["Datos propios", "Cada municipalidad trabaja solo con su información."],
    ["Campo sin papel", "El brigadista marca cada visita desde el teléfono."],
  ],
  html: () => `
    <header class="m-hero go-hero">
      <p class="m-kicker">Inteligencia territorial</p>
      <h1>El territorio, casa por casa.</h1>
      <p class="m-lead">Un panel web para el equipo de la municipalidad y una app de campo para las brigadas. El panel planifica, asigna y mide; la app guía al brigadista en cada visita.</p>
    </header>

    <section class="m-block">
      <h2>Dos herramientas, un mismo territorio</h2>
      <p class="m-intro">Toque cada lado para verlo en grande.</p>
      <div class="duo" data-on="0">
        <button class="duo-side" type="button" data-side="0" aria-pressed="true">
          <span class="duo-tag">En la oficina</span>
          <strong>Panel de gestión</strong>
          <span class="duo-media"><span class="art" data-art="gobernanza-panel"></span></span>
          <span class="duo-list">
            <span>Mapa territorial con los sectores del distrito</span>
            <span>Asignación automática de viviendas</span>
            <span>Avance de cada brigada en vivo</span>
            <span>Productividad y reportes</span>
          </span>
          <small>${CAP_ART}</small>
        </button>
        <button class="duo-side" type="button" data-side="1" aria-pressed="false">
          <span class="duo-tag">En la calle</span>
          <strong>App de campo</strong>
          <span class="duo-media is-phone">${tag(IMG.gobApp)}</span>
          <span class="duo-list">
            <span>Su zona en el mapa, con el estado de cada vivienda</span>
            <span>Casas visitadas y por visitar</span>
            <span>Inicio de jornada</span>
            <span>Se instala en el teléfono</span>
          </span>
          <small>${CAP_REAL}</small>
        </button>
      </div>
    </section>

    <section class="m-block">
      <h2>Cinco áreas de trabajo</h2>
      <div class="acc">
        ${AREAS.map(([t, r, d], i) => `
          <details${i === 0 ? " open" : ""}>
            <summary><span>${t}</span><span>${r}</span></summary>
            <p>${d}</p>
          </details>`).join("")}
      </div>
    </section>

    ${bloque("Cada rol ve lo que le corresponde", datos([
      ["Administrador", "Configura la municipalidad, sus usuarios y sus brigadas."],
      ["Supervisor", "Asigna el trabajo y sigue el avance de su equipo."],
      ["Operador", "Registra las visitas y las incidencias de campo."],
      ["Lector", "Consulta los tableros y los reportes, sin modificar nada."],
    ]))}
  `,
  init(el) {
    const duo = el.querySelector(".duo");
    duo.addEventListener("click", (e) => {
      const side = e.target.closest(".duo-side");
      if (!side) return;
      duo.dataset.on = side.dataset.side;
      duo.querySelectorAll(".duo-side").forEach((s) => s.setAttribute("aria-pressed", String(s === side)));
    });
  },
};
