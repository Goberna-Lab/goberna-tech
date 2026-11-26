// Las once plataformas agrupadas en cuatro familias, y el texto de cada una en la página general.
import { MODULOS } from "./index.js";

export const FAMILIAS = [
  { id: "territorio", nombre: "Territorio y trabajo de campo", ids: ["gobernanza-municipal", "sgti-municipal", "sistema-ule"] },
  { id: "atencion", nombre: "Atención al ciudadano", ids: ["ticketera", "asistente-virtual", "reserva-canchas", "talleres"] },
  { id: "seguridad", nombre: "Seguridad ciudadana", ids: ["alerta-vecinal", "monitoreo-seguridad"] },
  { id: "gestion", nombre: "Gestión interna", ids: ["control-presupuestal", "generador-requerimientos"] },
];

export const familiaDe = (id) => FAMILIAS.find((f) => f.ids.includes(id));

// Tres rasgos de las plataformas cuyo módulo no trae beneficios propios.
const PUNTOS = {
  "sgti-municipal": ["App para el personal de campo", "Mapa del distrito por sectores", "Vista general para la alcaldía"],
  ticketera: ["Dispensador de turnos", "Pantalla de llamados", "Ventanilla de atención"],
};

// Texto que acompaña a la demostración de una plataforma en la página general.
export function infoDe(id, desc) {
  const m = MODULOS.find((x) => x.id === id);
  const puntos = PUNTOS[id] ?? (m.beneficios ?? []).slice(0, 3).map(([t]) => t);
  return `
    <div>
      ${desc.startsWith(m.que) ? "" : `<p class="fam-que">${m.que}</p>`}
      <p class="fam-desc">${desc}</p>
      <ul class="fam-puntos">${puntos.map((p) => `<li>${p}</li>`).join("")}</ul>
    </div>
    <a class="btn btn-navy" href="#${id}">Ver ${m.nombre}</a>`;
}
