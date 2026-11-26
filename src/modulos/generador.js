// Generador de requerimientos. Pieza distintiva: los tres botones del programa, que se pueden
// pulsar en orden: validar, vista previa y generar. Cada uno muestra qué produce.
import { bloque, datos, DEMO } from "./comun.js";

const DOCS = ["Informe de requerimiento", "Términos de referencia", "Anexos", "Expediente completo"];
const RESULTADO = [
  `<p><strong>Excel revisado.</strong> Todas las filas están completas: se puede continuar.</p><p class="ge-note">Con un solo error en el Excel, no se crea ningún documento.</p>`,
  `<ul class="ge-docs is-draft">${DOCS.map((d) => `<li><i></i><span>${d}</span><small>Borrador</small></li>`).join("")}</ul><p class="ge-note">Documentos de prueba, para revisar antes de imprimir.</p>`,
  `<ul class="ge-docs">${DOCS.map((d, i) => `<li><i></i><span>${d}</span><small>N° 0${14 + i}-2026</small></li>`).join("")}</ul><p class="ge-note">Word y PDF con el formato institucional, numerados sin repetidos.</p>`,
];

export default {
  id: "generador-requerimientos",
  nombre: "Generador de requerimientos",
  que: "Informes, TDR y expedientes de locadores",
  beneficios: [
    ["Documentos en lote", "Informe, TDR, anexos y expediente de una sola vez."],
    ["Numeración sin repetidos", "Por área y por año, con bloqueo entre usuarios."],
    ["Formato institucional", "Word y PDF con el formato de la municipalidad."],
    ["Trabaja sin internet", "Programa de escritorio para Windows."],
    ["Todo con historial", "Quién generó cada documento, cuándo y con qué número."],
  ],
  html: () => `
    <header class="m-hero ge-hero">
      <p class="m-kicker">Informes, TDR y expedientes de locadores</p>
      <h1>Del Excel al expediente, en tres clics.</h1>
      <p class="m-lead">Cada área llena su Excel una sola vez y el programa genera en lote los documentos de contratación, en Word y PDF, con el formato institucional. Es un programa de escritorio para Windows y trabaja sin internet.</p>
    </header>

    <section class="m-block">
      <h2>Los tres botones</h2>
      <p class="m-intro">Púlselos en orden para ver qué hace cada uno.</p>
      <div class="ge" data-step="-1">
        <div class="ge-steps">
          <button type="button" data-g="0"><b>1</b>Validar</button>
          <button type="button" data-g="1" disabled><b>2</b>Vista previa</button>
          <button type="button" data-g="2" disabled><b>3</b>Generar</button>
        </div>
        <div class="ge-out" aria-live="polite"><p class="ge-note">Empiece por validar el Excel del área.</p></div>
      </div>
      <p class="m-cap">${DEMO} La numeración es ilustrativa.</p>
    </section>

    ${bloque("Qué controla solo", datos([
      ["Numeración sin repetidos", "Por área y por año, con bloqueo cuando dos personas generan a la vez."],
      ["Durante el servicio", "Informe de actividades y acta de conformidad de cada entregable."],
      ["Historial", "Quién generó cada documento, cuándo y con qué número. Lo reemplazado no se borra."],
    ]))}
  `,
  init(el) {
    const ge = el.querySelector(".ge");
    const out = ge.querySelector(".ge-out");
    const botones = [...ge.querySelectorAll("[data-g]")];
    ge.addEventListener("click", (e) => {
      const b = e.target.closest("[data-g]");
      if (!b || b.disabled) return;
      const i = Number(b.dataset.g);
      ge.dataset.step = i;
      out.innerHTML = RESULTADO[i];
      botones.forEach((x, j) => {
        x.classList.toggle("is-done", j <= i);
        if (j === i + 1) x.disabled = false;
      });
    });
  },
};
