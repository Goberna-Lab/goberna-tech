// Asistente virtual municipal. Pieza distintiva: una conversación de ejemplo que se puede probar:
// la persona elige una pregunta y el asistente responde en el chat.
import { bloque, datos, explorador } from "./comun.js";

const PREGUNTAS = [
  ["¿Cómo pago mis arbitrios?", "Te explico los pasos y los canales de pago que tiene habilitados la municipalidad."],
  ["Quiero ver mi estado de cuenta", "Te pido tus datos y te muestro tu estado de cuenta."],
  ["Quiero reportar un problema en mi calle", "Registro tu solicitud y la derivo al área que corresponde. Te aviso cuando la reciban."],
];

export default {
  id: "asistente-virtual",
  nombre: "Asistente virtual municipal",
  que: "Chat en la web de la municipalidad",
  beneficios: [
    ["Atención a toda hora", "Responde consultas frecuentes sin esperar a una ventanilla."],
    ["Menos carga para el personal", "Lo repetitivo lo resuelve el asistente."],
    ["Solicitudes encaminadas", "Cada pedido llega al área que corresponde, en tiempo real."],
    ["Encuestas reunidas", "Las respuestas ciudadanas quedan en un solo panel."],
    ["Métricas de atención", "La municipalidad ve qué preguntan y cómo se atiende."],
    ["En su propia web", "El chat vive dentro de la web municipal, con su personaje."],
  ],
  html: () => `
    <header class="m-hero as-hero">
      <div>
        <p class="m-kicker">Chat en la web de la municipalidad</p>
        <h1>Respuestas a cualquier hora, desde la web municipal.</h1>
        <p class="m-lead">Un chat con personaje animado, integrado en la web de la municipalidad, que orienta al ciudadano, resuelve consultas frecuentes y deriva sus solicitudes en tiempo real.</p>
      </div>
      <div class="chat" aria-label="Conversación de ejemplo con el asistente">
        <div class="chat-head"><i aria-hidden="true"></i><span><b>Asistente virtual</b>En línea</span></div>
        <div class="chat-log" aria-live="polite">
          <p class="chat-bot">Hola. Soy el asistente de la municipalidad. ¿En qué te ayudo?</p>
        </div>
        <div class="chat-opts">
          ${PREGUNTAS.map(([q], i) => `<button type="button" data-q="${i}">${q}</button>`).join("")}
        </div>
        <p class="chat-cap">Conversación de ejemplo. Las respuestas reales las define cada municipalidad.</p>
      </div>
    </header>

    ${bloque("Qué resuelve", datos([
      ["Consultas frecuentes", "Responde sobre trámites y estados de cuenta."],
      ["Solicitudes vecinales", "Las recibe en el chat y las deriva al área que corresponde, en tiempo real."],
      ["Orientación", "Guía al ciudadano dentro de la web de la municipalidad."],
    ]))}

    ${bloque(
      "El centro de métricas",
      explorador("Asistente virtual", [{ art: "asistente", puntos: [
        [70.4, 28.5, "El chat", "Va dentro de la web municipal, con su personaje."],
        [82.7, 70.5, "Solicitudes", "Cada solicitud queda registrada y derivada."],
        [56.7, 62.2, "Métricas", "Un panel sigue las conversaciones en tiempo real, reúne las encuestas ciudadanas y centraliza las solicitudes."]] }]),
      "La municipalidad ve qué preguntan los vecinos y cómo se les atiende.",
    )}
  `,
  init(el, { sinMovimiento }) {
    const log = el.querySelector(".chat-log");
    const opts = el.querySelector(".chat-opts");
    let ocupado = false;
    const decir = (clase, texto) => {
      const p = document.createElement("p");
      p.className = clase;
      p.textContent = texto;
      log.appendChild(p);
      log.scrollTop = log.scrollHeight;
      return p;
    };
    opts.addEventListener("click", (e) => {
      const b = e.target.closest("[data-q]");
      if (!b || ocupado) return;
      const [q, r] = PREGUNTAS[Number(b.dataset.q)];
      b.disabled = true;
      decir("chat-user", q);
      if (sinMovimiento) return decir("chat-bot", r);
      ocupado = true;
      const escribiendo = decir("chat-bot is-typing", "Escribiendo…");
      setTimeout(() => {
        escribiendo.classList.remove("is-typing");
        escribiendo.textContent = r;
        log.scrollTop = log.scrollHeight;
        ocupado = false;
      }, 1100);
    });
  },
};
