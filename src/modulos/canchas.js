// Reserva de canchas. Pieza distintiva: un calendario que se puede usar. La persona elige una
// cancha y un horario libre, y ve cómo quedaría su reserva.
import { bloque, datos, DEMO } from "./comun.js";

const CANCHAS = ["Cancha de fútbol", "Losa multiusos 1", "Losa multiusos 2"];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const HORAS = ["8:00", "10:00", "12:00", "14:00", "16:00", "18:00"];
// Ocupación de ejemplo, distinta en cada cancha (se calcula, no se guarda).
const ocupado = (c, h, d) => (c * 5 + h * 3 + d * 7 + ((h * d) % 4)) % 5 < 2;

const grilla = (c) =>
  `<div class="cal-grid" role="group" aria-label="Horarios de ${CANCHAS[c]}"><span></span>${DIAS.map((d) => `<span class="cal-d">${d}</span>`).join("")}${HORAS.map(
    (h, i) =>
      `<span class="cal-h">${h}</span>` +
      DIAS.map((_, d) =>
        ocupado(c, i, d)
          ? `<span class="cal-x" aria-label="Ocupado"></span>`
          : `<button type="button" data-h="${i}" data-d="${d}" aria-label="${DIAS_LARGO[d]} ${h}, disponible"></button>`,
      ).join(""),
  ).join("")}</div>`;

export default {
  id: "reserva-canchas",
  nombre: "Reserva de canchas",
  que: "Canchas y losas deportivas",
  beneficios: [
    ["Reservas sin cola", "El vecino reserva desde la web, a cualquier hora."],
    ["Espacios aprovechados", "Los horarios libres se llenan y se ve el uso de cada cancha."],
    ["Control de uso", "La administración sabe quién usa cada espacio y cuándo."],
    ["Menos trabajo manual", "La agenda de cada cancha se gestiona sola."],
  ],
  html: () => `
    <header class="m-hero m-hero-dark ca-hero">
      <p class="m-kicker">Canchas y losas deportivas</p>
      <h1>La cancha, reservada desde el teléfono.</h1>
      <p class="m-lead">Los vecinos consultan los horarios disponibles y reservan los espacios deportivos municipales desde la web. La municipalidad gestiona los turnos y controla el uso de cada espacio.</p>
    </header>

    <section class="m-block">
      <h2>Pruebe una reserva</h2>
      <p class="m-intro">Elija un espacio y toque un horario libre.</p>
      <div class="cal">
        <div class="cal-side">
          ${CANCHAS.map((n, i) => `<button type="button" data-c="${i}" aria-pressed="${i === 0}">${n}</button>`).join("")}
          <p class="cal-key"><i></i>Disponible <i class="is-x"></i>Ocupado</p>
        </div>
        <div class="cal-main">${grilla(0)}</div>
        <div class="cal-foot">
          <p class="cal-msg" aria-live="polite">Ningún horario elegido.</p>
          <button class="btn btn-gold" type="button" data-reservar disabled>Reservar</button>
        </div>
      </div>
      <p class="m-cap">${DEMO} No se guarda ninguna reserva.</p>
    </section>

    ${bloque("Qué incluye", datos([
      ["Horarios a la vista", "Cada cancha de fútbol o losa multiusos muestra sus turnos libres y ocupados."],
      ["Reserva en línea", "El vecino elige la fecha y el horario, y confirma su reserva."],
      ["Control de uso", "La administración gestiona los turnos y sabe quién usa cada espacio."],
    ]))}
  `,
  init(el) {
    const cal = el.querySelector(".cal");
    const main = cal.querySelector(".cal-main");
    const msg = cal.querySelector(".cal-msg");
    const boton = cal.querySelector("[data-reservar]");
    let cancha = 0;
    let elegido = null;
    cal.addEventListener("click", (e) => {
      const c = e.target.closest("[data-c]");
      if (c) {
        cancha = Number(c.dataset.c);
        cal.querySelectorAll("[data-c]").forEach((b) => b.setAttribute("aria-pressed", String(b === c)));
        main.innerHTML = grilla(cancha);
        elegido = null;
        boton.disabled = true;
        msg.textContent = "Ningún horario elegido.";
        return;
      }
      const s = e.target.closest("[data-h]");
      if (s) {
        main.querySelectorAll("[aria-pressed]").forEach((b) => b.removeAttribute("aria-pressed"));
        s.setAttribute("aria-pressed", "true");
        elegido = s;
        boton.disabled = false;
        msg.textContent = `${CANCHAS[cancha]}, ${DIAS_LARGO[s.dataset.d]} a las ${HORAS[s.dataset.h]}.`;
        return;
      }
      if (e.target.closest("[data-reservar]") && elegido) {
        elegido.classList.add("is-mine");
        elegido.disabled = true;
        msg.textContent = `Reserva de ejemplo registrada: ${CANCHAS[cancha]}, ${DIAS_LARGO[elegido.dataset.d]} a las ${HORAS[elegido.dataset.h]}.`;
        elegido = null;
        boton.disabled = true;
      }
    });
  },
};
