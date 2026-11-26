// Alerta vecinal. Pieza distintiva: el botón de pánico. Al pulsarlo se ve el recorrido de la
// alerta: sale del teléfono con la ubicación, llega al despacho y se envía el auxilio.
import { bloque, datos, explorador, DEMO } from "./comun.js";

const ETAPAS = [
  ["Alerta enviada", "Sale del teléfono con la ubicación GPS del vecino."],
  ["Recibida en el despacho", "Aparece en la central, sobre el mapa."],
  ["Auxilio en camino", "El despacho envía la ayuda al lugar."],
];

export default {
  id: "alerta-vecinal",
  nombre: "Alerta vecinal",
  que: "App móvil de emergencias",
  beneficios: [
    ["Auxilio más rápido", "La alerta llega al despacho con la ubicación del vecino."],
    ["Sin escribir la dirección", "El GPS marca dónde está quien pulsa el botón."],
    ["Con evidencia", "El vecino documenta la emergencia con foto."],
    ["Conectada al serenazgo", "Cada alerta entra al sistema de despacho de la municipalidad."],
  ],
  html: () => `
    <header class="m-hero m-hero-dark al-hero">
      <div>
        <p class="m-kicker">App móvil de emergencias</p>
        <h1>Un botón que avisa dónde está el vecino.</h1>
        <p class="m-lead">Una app para el vecino con botón de pánico asistido por GPS y reportes con foto, conectada al despacho de la municipalidad para enviar auxilio de inmediato.</p>
      </div>
      <div class="sos" data-step="-1">
        <button class="sos-btn" type="button" aria-label="Probar el botón de pánico"><span>SOS</span></button>
        <ol class="sos-steps" aria-live="polite">
          ${ETAPAS.map(([t, d]) => `<li><strong>${t}</strong><span>${d}</span></li>`).join("")}
        </ol>
        <p class="sos-cap">Pulse el botón para ver el recorrido de una alerta. ${DEMO} No se envía nada.</p>
      </div>
    </header>

    ${bloque("Qué puede hacer el vecino", datos([
      ["Botón de pánico", "Envía la alerta con la ubicación GPS de quien la pulsa."],
      ["Reportes con foto", "Documenta emergencias y actos delictivos desde su teléfono."],
      ["Conexión con el despacho", "Cada alerta llega al sistema de despacho para enviar auxilio."],
    ]))}

    ${bloque(
      "Del teléfono a la central",
      explorador("Alerta vecinal", [{ art: "alerta", puntos: [
        [31.6, 26.3, "En el teléfono", "El vecino pulsa el botón; no tiene que escribir dónde está."],
        [35.4, 73, "Con evidencia", "También puede enviar un reporte con foto."],
        [92, 20, "En el despacho", "La alerta aparece en la central con su ubicación."]] }]),
    )}
  `,
  init(el, { sinMovimiento }) {
    const sos = el.querySelector(".sos");
    let relojes = [];
    sos.querySelector(".sos-btn").addEventListener("click", () => {
      relojes.forEach(clearTimeout);
      sos.dataset.step = "0";
      relojes = sinMovimiento
        ? [setTimeout(() => (sos.dataset.step = "2"), 0)]
        : [setTimeout(() => (sos.dataset.step = "1"), 1400), setTimeout(() => (sos.dataset.step = "2"), 2900)];
    });
    return () => relojes.forEach(clearTimeout);
  },
};
