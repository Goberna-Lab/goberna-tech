// Sistema ULE. Pieza distintiva: el semáforo de fichas como una línea de seis estados que se
// puede recorrer; una ficha de ejemplo avanza sola por ella.
import { bloque, datos, pasos, explorador, alVer } from "./comun.js";

const ESTADOS = [
  ["Levantada", "La promotora levantó la ficha en la visita al hogar."],
  ["En oficina", "La ficha llegó a la oficina de la unidad de empadronamiento."],
  ["Escaneada", "La ficha ya está digitalizada."],
  ["En Drive", "El archivo quedó guardado y ordenado."],
  ["Enviada", "La ficha se envió al ministerio. Desde aquí se cuentan los días que faltan para la respuesta."],
  ["Respondida", "Llegó la respuesta del ministerio. El hogar tiene su clasificación."],
];
const TRAMOS = ["Vencido", "Crítico", "Alto", "Medio", "Planificable", "Vigente"];

export default {
  id: "sistema-ule",
  nombre: "Sistema ULE",
  que: "Unidad Local de Empadronamiento",
  beneficios: [
    ["Nada se vence sin aviso", "Cada hogar se ordena por tramos y recibe una prioridad."],
    ["Trabajo repartido", "Los hogares se asignan por semana, zona o polígono en el mapa."],
    ["Cada ficha ubicada", "Un semáforo muestra dónde está cada ficha hasta la respuesta."],
    ["Plazo a la vista", "Los días que faltan para la respuesta del ministerio, siempre visibles."],
    ["Campo sin señal", "La visita queda en el teléfono y se envía al volver la conexión."],
    ["El vecino consulta solo", "Con su DNI ve el estado de su trámite, sin exponer datos."],
  ],
  html: () => `
    <header class="m-hero ul-hero">
      <p class="m-kicker">Unidad Local de Empadronamiento</p>
      <h1>Cada hogar, hasta la respuesta del ministerio.</h1>
      <p class="m-lead">El sistema sigue la clasificación socioeconómica de cada hogar: detecta cuándo vence, organiza la visita y acompaña la ficha hasta que llega la respuesta.</p>
      <div class="ul-tramos" role="img" aria-label="Tramos de vencimiento, de vencido a vigente">
        ${TRAMOS.map((t, i) => `<span style="--i:${i}">${t}</span>`).join("")}
      </div>
      <p class="ul-tramos-cap">Cada hogar se ubica en un tramo según cuándo vence su clasificación, y recibe una prioridad.</p>
    </header>

    <section class="m-block">
      <h2>El semáforo de fichas</h2>
      <p class="m-intro">Seis estados muestran dónde está cada ficha. Toque un estado para ver qué significa.</p>
      <div class="pipe" data-on="0">
        <ol>
          ${ESTADOS.map(([t], i) => `<li><button type="button" data-st="${i}" aria-pressed="${i === 0}"><i></i>${t}</button></li>`).join("")}
        </ol>
        <p class="pipe-text" aria-live="polite">${ESTADOS[0][1]}</p>
        <p class="pipe-cap">Ficha de ejemplo.</p>
      </div>
    </section>

    ${bloque(
      "Tres piezas",
      datos([
        ["Panel de gestión", "Avance del empadronamiento por promotora, semáforo de vencimientos, mapa de hogares, asignación y reportes."],
        ["App de campo", "La promotora ve sus hogares del día y registra cada visita con foto y GPS. Sin señal, la visita espera en el teléfono."],
        ["Consulta ciudadana", "La persona escribe su DNI y ve el estado de su trámite, sin nombres ni otros datos."],
      ]) +
        explorador("Sistema ULE", [{ art: "ule", puntos: [
          [37.5, 26, "Asignación en el mapa", "Los hogares se asignan por semana, en bloque, por zona o dibujando un polígono."],
          [93.7, 17.8, "Semáforo de fichas", "Dónde está cada ficha, de levantada a respondida."],
          [93.7, 74, "Consulta ciudadana", "El estado del trámite con solo el DNI."]] }]),
    )}

    ${bloque("Del vencimiento a la respuesta", pasos([
      ["Se detecta el vencimiento", "Cada hogar se ordena por tramos, de vencido a planificable, y recibe una prioridad."],
      ["Se asigna", "La coordinación reparte los hogares entre las promotoras."],
      ["Se visita", "La promotora registra el resultado con foto y GPS."],
      ["Se sigue la ficha", "Hasta que llega la respuesta del ministerio."],
    ]))}
  `,
  init(el, { sinMovimiento }) {
    const pipe = el.querySelector(".pipe");
    const texto = pipe.querySelector(".pipe-text");
    const botones = [...pipe.querySelectorAll("button")];
    let reloj = null;
    const ir = (i) => {
      pipe.dataset.on = i;
      pipe.style.setProperty("--on", i);
      botones.forEach((b, j) => {
        b.setAttribute("aria-pressed", String(j === i));
        b.classList.toggle("is-done", j <= i);
      });
      texto.textContent = ESTADOS[i][1];
    };
    pipe.addEventListener("click", (e) => {
      const b = e.target.closest("[data-st]");
      if (!b) return;
      clearInterval(reloj); // si la persona elige un estado, la ficha deja de avanzar sola
      ir(Number(b.dataset.st));
    });
    ir(0);
    const parar = alVer(pipe, () => {
      if (sinMovimiento) return;
      reloj = setInterval(() => ir((Number(pipe.dataset.on) + 1) % ESTADOS.length), 2600);
    });
    return () => {
      clearInterval(reloj);
      parar();
    };
  },
};
