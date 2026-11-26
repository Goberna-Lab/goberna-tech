// Control presupuestal. Pieza distintiva: un tablero que se arma al verlo, con el avance en una
// cifra grande y barras que cambian entre la vista por área y la vista por mes.
import { bloque, datos, alVer, DEMO } from "./comun.js";

const VISTAS = {
  area: [["Obras", 54], ["Servicios a la ciudad", 78], ["Seguridad ciudadana", 70], ["Administración", 86], ["Desarrollo social", 61]],
  mes: [["Enero", 6], ["Marzo", 19], ["Mayo", 33], ["Julio", 47], ["Setiembre", 59], ["Noviembre", 68]],
};
const filas = (v) => VISTAS[v].map(([n, p]) => `<li><span>${n}</span><div class="pr-bar"><i data-p="${p}"></i></div><b>${p}%</b></li>`).join("");

export default {
  id: "control-presupuestal",
  nombre: "Control presupuestal",
  que: "Presupuesto y gestión municipal",
  beneficios: [
    ["El presupuesto a la vista", "Los indicadores financieros en un solo tablero."],
    ["Ejecución al día", "El avance del gasto frente a lo programado."],
    ["Control por área", "La operación de cada área, en la misma plataforma."],
    ["Decisiones con datos", "Información para planificar y rendir cuentas."],
  ],
  html: () => `
    <header class="m-hero pr-hero">
      <div>
        <p class="m-kicker">Presupuesto y gestión municipal</p>
        <h1>El presupuesto, a la vista de quien decide.</h1>
        <p class="m-lead">Una plataforma web para ver los indicadores financieros, seguir la ejecución del presupuesto y controlar la operación de cada área de la municipalidad.</p>
      </div>
      <div class="pr-cifra">
        <strong><span data-cuenta="68">0</span>%</strong>
        <span>Avance de ejecución</span>
        <small>Cifra de ejemplo</small>
      </div>
    </header>

    <section class="m-block">
      <h2>Un tablero para seguir la ejecución</h2>
      <div class="pr">
        <div class="pr-tabs" role="group" aria-label="Vista">
          <button type="button" data-v="area" aria-pressed="true">Por área</button>
          <button type="button" data-v="mes" aria-pressed="false">Por mes</button>
        </div>
        <ul class="pr-list">${filas("area")}</ul>
      </div>
      <p class="m-cap">${DEMO} Las áreas y los porcentajes son ilustrativos.</p>
    </section>

    ${bloque("Qué incluye", datos([
      ["Indicadores financieros", "El estado del presupuesto en un solo tablero."],
      ["Ejecución presupuestal", "Seguimiento de la ejecución del presupuesto."],
      ["Control por área", "La operación de las distintas áreas de la municipalidad, en la misma plataforma."],
    ]))}
  `,
  init(el, { sinMovimiento }) {
    const lista = el.querySelector(".pr-list");
    const llenar = () => requestAnimationFrame(() => lista.querySelectorAll("[data-p]").forEach((b) => (b.style.width = b.dataset.p + "%")));
    el.querySelector(".pr-tabs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-v]");
      if (!b) return;
      el.querySelectorAll(".pr-tabs button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      lista.innerHTML = filas(b.dataset.v);
      llenar();
    });
    const parar = alVer(lista, llenar, 0.2);
    // La cifra grande cuenta hasta su valor una sola vez.
    const cifra = el.querySelector("[data-cuenta]");
    const meta = Number(cifra.dataset.cuenta);
    if (sinMovimiento) cifra.textContent = meta;
    else {
      const t0 = performance.now();
      const paso = (t) => {
        const k = Math.min(1, (t - t0) / 1200);
        cifra.textContent = Math.round(meta * (1 - (1 - k) ** 3));
        if (k < 1 && cifra.isConnected) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    }
    return parar;
  },
};
