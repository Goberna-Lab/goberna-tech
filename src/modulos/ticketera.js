// Ticketera: parte de la presentación hecha para este sistema (presentacion-ticketera): sus textos,
// sus capturas, su recorrido 3D por las pantallas y su sala en vivo. Va adaptada a la web: sin su
// cabecera ni su cierre (la web ya los tiene) y con la tipografía, los botones y los bordes de la
// marca (ver "Módulos tomados de las presentaciones" en src/modulos.css). El HTML y el CSS de
// src/portados se generan con tools/portar.py a partir de app/page.tsx y app/globals.css.
import html from "../portados/ticketera.html?raw";
import "../portados/ticketera.css";
import { IMG } from "./img.js";
import { ponerImagenes, activarVisor, altoBarras } from "./comun.js";
import { montarVuelo } from "../vuelo.js";
import { montarSimulador } from "../simulador.js";

const CAPTURAS = {
  "01-dispensador": IMG.tkDispensador,
  "02-pantalla-de-llamados": IMG.tkPantalla,
  "04-ventanilla": IMG.tkVentanilla,
  "05-admin-en-vivo": IMG.tkEnVivo,
  "06-admin-estadisticas": IMG.tkEstadisticas,
  "07-admin-areas": IMG.tkAreas,
  "08-admin-ventanillas": IMG.tkVentanillas,
  "10-admin-pantalla": IMG.tkAdminPantalla,
};
const escena = (clave, titulo, texto, puntos) => ({ src: CAPTURAS[clave].src, ancho: CAPTURAS[clave].w, alto: CAPTURAS[clave].h, titulo, texto, puntos });

const RECORRIDO = () => [
  escena("01-dispensador", "El vecino saca su turno", "Toca el área a la que va, elige turno preferencial o general y recibe su ticket con su código.", [
    { x: 0.19, y: 0.57, texto: "Turno preferencial: pasa primero" }, { x: 0.5, y: 0.76, texto: "Turno general" }, { x: 0.5, y: 0.44, texto: "Cuántas personas esperan" }, { x: 0.92, y: 0.09, texto: "Fecha y hora" }]),
  escena("02-pantalla-de-llamados", "Espera mirando la pantalla", "La pantalla muestra en grande el turno que se llama y a qué ventanilla ir, con sonido y mensajes de la municipalidad.", [
    { x: 0.66, y: 0.27, texto: "El turno que se llama, en grande" }, { x: 0.66, y: 0.55, texto: "Últimos llamados" }, { x: 0.66, y: 0.855, texto: "Personas en espera" }, { x: 0.31, y: 0.45, texto: "Videos e imágenes propias" }, { x: 0.62, y: 0.965, texto: "Mensajes de la municipalidad" }]),
  escena("04-ventanilla", "La ventanilla lo atiende", "El personal llama con un botón, atiende, finaliza o deriva a otra área sin que el vecino pierda su lugar.", [
    { x: 0.34, y: 0.23, texto: "Turno en atención" }, { x: 0.34, y: 0.43, texto: "Finalizar con un clic" }, { x: 0.42, y: 0.513, texto: "Derivar a otra área" }, { x: 0.75, y: 0.2, texto: "Cuántos esperan por área" }, { x: 0.5, y: 0.75, texto: "Historial del día" }]),
  escena("05-admin-en-vivo", "El jefe lo ve todo en vivo", "Cuántos esperan, cuántos se atendieron, qué atiende cada ventanilla y dónde se acumula la gente.", [
    { x: 0.28, y: 0.235, texto: "Personas en espera" }, { x: 0.48, y: 0.235, texto: "Atendidos hoy" }, { x: 0.36, y: 0.395, texto: "Espera por área" }, { x: 0.3, y: 0.6, texto: "Qué atiende cada ventanilla" }]),
  escena("06-admin-estadisticas", "Y se mejora con datos", "Espera promedio, horas de más público y resultados por área, con descarga en Excel.", [
    { x: 0.68, y: 0.35, texto: "Espera promedio" }, { x: 0.78, y: 0.6, texto: "¿A qué hora llega la gente?" }, { x: 0.58, y: 0.87, texto: "Resultados por área" }, { x: 0.733, y: 0.235, texto: "Descarga en Excel" }]),
];
const TEMA = { fondo: "#ffffff", marco: "#b4c2d1", puntos: ["#072e51", "#f5af31", "#b4c2d1"] };

export default {
  id: "ticketera",
  nombre: "Ticketera",
  que: "Turnos de atención al público",
  propio: true, // viene de una presentación: usa las clases y el CSS de src/portados
  secciones: [["recorrido", "Recorrido"], ["para-que", "Para qué sirve"], ["como-funciona", "Cómo funciona"], ["pruebela", "Véala en acción"], ["beneficios", "Beneficios"]],
  html: () => html,
  init(el, { sinMovimiento }) {
    ponerImagenes(el, CAPTURAS);
    const fin = [
      activarVisor(el),
      montarVuelo(el.querySelector("[data-vuelo]"), { escenas: RECORRIDO(), tema: TEMA, etiqueta: "Recorrido en 3D por las pantallas de la Ticketera", sinMovimiento, arriba: altoBarras(el) }),
      montarSimulador(el.querySelector("[data-simulador]"), { autoplay: !sinMovimiento }),
    ];
    return () => fin.forEach((f) => f());
  },
};
