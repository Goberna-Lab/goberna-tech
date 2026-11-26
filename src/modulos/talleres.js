// Talleres municipales. Pieza distintiva: la lista de talleres con sus cupos, que se puede usar:
// al inscribirse, el cupo baja; cuando se llena, el taller se cierra solo.
import { bloque, datos, DEMO } from "./comun.js";

const SEDES = ["Sede central", "Polideportivo", "Casa de la cultura"];
const TALLERES = [
  { n: "Fútbol", d: "Martes y jueves", sede: 1, a: 18, t: 20 },
  { n: "Natación", d: "Miércoles y viernes", sede: 1, a: 15, t: 16 },
  { n: "Danza", d: "Lunes y miércoles", sede: 2, a: 12, t: 25 },
  { n: "Pintura", d: "Sábados", sede: 2, a: 15, t: 15 },
  { n: "Ajedrez", d: "Viernes", sede: 0, a: 6, t: 12 },
  { n: "Vóley", d: "Martes y jueves", sede: 0, a: 19, t: 20 },
];

const fila = (t, i) => {
  const lleno = t.a >= t.t;
  return `<li data-sede="${t.sede}">
    <div><strong>${t.n}</strong><span>${t.d} · ${SEDES[t.sede]}</span></div>
    <div class="ta-bar" role="img" aria-label="${t.a} de ${t.t} cupos ocupados"><i style="width:${(t.a / t.t) * 100}%"></i></div>
    <span class="ta-n">${lleno ? "Sin cupos" : `Quedan ${t.t - t.a}`}</span>
    ${t.mio ? `<span class="ta-ok">Inscrito</span>` : lleno ? `<span class="ta-full">Completo</span>` : `<button type="button" data-t="${i}">Inscribirme</button>`}
  </li>`;
};

export default {
  id: "talleres",
  nombre: "Talleres municipales",
  que: "Inscripción y gestión de talleres",
  beneficios: [
    ["Matrícula en línea", "El vecino se inscribe sin ir a la sede."],
    ["Cupos bajo control", "El aforo de cada taller se actualiza solo."],
    ["Pagos integrados", "El sistema admite el pago de la matrícula."],
    ["Inscritos al día", "La lista de cada taller, siempre actualizada."],
  ],
  html: () => `
    <header class="m-hero ta-hero">
      <p class="m-kicker">Inscripción y gestión de talleres</p>
      <h1>Talleres con cupo, sin colas para inscribirse.</h1>
      <p class="m-lead">La oferta, la matrícula y la administración de los talleres deportivos y culturales del distrito en un solo sistema, con control automático de cupos por sede.</p>
    </header>

    <section class="m-block">
      <h2>Pruebe una inscripción</h2>
      <p class="m-intro">Filtre por sede e inscríbase: el cupo se actualiza solo.</p>
      <div class="ta">
        <div class="ta-sedes" role="group" aria-label="Sede">
          <button type="button" data-sede="-1" aria-pressed="true">Todas las sedes</button>
          ${SEDES.map((s, i) => `<button type="button" data-sede="${i}" aria-pressed="false">${s}</button>`).join("")}
        </div>
        <ul class="ta-list"></ul>
      </div>
      <p class="m-cap">${DEMO} No se registra ninguna inscripción.</p>
    </section>

    ${bloque("Qué incluye", datos([
      ["Cupos por sede", "Los cupos y aforos se llevan sede por sede, de forma automática."],
      ["Matrícula y pagos", "El vecino se inscribe en línea y el sistema admite el pago."],
      ["Gestión de inscritos", "La lista de cada taller, siempre al día para quien lo administra."],
    ]))}
  `,
  init(el) {
    const lista = el.querySelector(".ta-list");
    const talleres = TALLERES.map((t) => ({ ...t }));
    let sede = -1;
    const pintar = () => {
      lista.innerHTML = talleres.map((t, i) => (sede < 0 || t.sede === sede ? fila(t, i) : "")).join("");
    };
    el.querySelector(".ta").addEventListener("click", (e) => {
      const s = e.target.closest(".ta-sedes [data-sede]");
      if (s) {
        sede = Number(s.dataset.sede);
        el.querySelectorAll(".ta-sedes button").forEach((b) => b.setAttribute("aria-pressed", String(b === s)));
        return pintar();
      }
      const b = e.target.closest("[data-t]");
      if (!b) return;
      const t = talleres[Number(b.dataset.t)];
      t.a += 1;
      t.mio = true;
      pintar();
    });
    pintar();
  },
};
