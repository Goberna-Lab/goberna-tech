// SGTI Municipal: parte de la presentación hecha para este sistema (presentacion-sgti): sus textos,
// sus capturas y su recorrido 3D por las pantallas, sobre fondo azul oscuro. Va adaptada a la web:
// sin su cabecera ni su cierre (la web ya los tiene) y con la tipografía, los botones y los bordes
// de la marca (ver "Módulos tomados de las presentaciones" en src/modulos.css). El HTML y el CSS de
// src/portados se generan con tools/portar.py a partir de app/page.tsx y app/globals.css.
import html from "../portados/sgti.html?raw";
import "../portados/sgti.css";
import { IMG } from "./img.js";
import { ponerImagenes, activarVisor, altoBarras } from "./comun.js";
import { montarVuelo } from "../vuelo.js";

const CAPTURAS = {
  "02-vista-general": IMG.sgtiGeneral,
  "02b-vista-general-detalle": IMG.sgtiDetalle,
  "03-mapa-territorial": IMG.sgtiMapa,
  "04-mapa-de-calor": IMG.sgtiCalor,
  "05-equipo": IMG.sgtiEquipo,
  "09-app-campo-inicio": IMG.sgtiAppInicio,
  "10-app-campo-reporte": IMG.sgtiApp,
};
const escena = (clave, titulo, texto, puntos, celular = false) => ({ src: CAPTURAS[clave].src, ancho: CAPTURAS[clave].w, alto: CAPTURAS[clave].h, celular, titulo, texto, puntos });

const RECORRIDO = () => [
  escena("10-app-campo-reporte", "Todo empieza en la calle", "El personal de campo ve un problema y lo reporta desde su celular: ubicación automática, prioridad, descripción, foto y video.", [
    { x: 0.5, y: 0.325, texto: "Elige qué tan urgente es" }, { x: 0.5, y: 0.55, texto: "Indica cómo se desplaza" }, { x: 0.5, y: 0.69, texto: "Describe lo que pasa" }, { x: 0.5, y: 0.84, texto: "Adjunta foto o video" }], true),
  escena("02-vista-general", "Llega al instante a la alcaldía", "El reporte aparece en la Vista General con los casos del periodo, la atención promedio y los casos críticos.", [
    { x: 0.29, y: 0.28, texto: "Reportes del periodo" }, { x: 0.88, y: 0.28, texto: "Casos críticos" }, { x: 0.39, y: 0.56, texto: "Reportes por gerencia", lado: "izquierda" }, { x: 0.8, y: 0.56, texto: "Nuevos, en proceso y atendidos", lado: "derecha" }, { x: 0.82, y: 0.035, texto: "Informe en PDF" }]),
  escena("03-mapa-territorial", "Se ubica en el mapa del distrito", "Cada reporte cae en su sector. Los sectores se ven en colores y cada punto indica su urgencia.", [
    { x: 0.6, y: 0.47, texto: "Sectores del distrito" }, { x: 0.33, y: 0.245, texto: "Registrar una incidencia en el mapa" }, { x: 0.86, y: 0.172, texto: "Vista estándar, satélite o terreno" }, { x: 0.45, y: 0.1, texto: "Filtra por sector, área y fechas" }]),
  escena("04-mapa-de-calor", "Se ven las zonas calientes", "El mapa de calor marca dónde se concentran las incidencias, para decidir dónde reforzar.", [
    { x: 0.38, y: 0.8, texto: "Zona caliente" }, { x: 0.88, y: 0.4, texto: "Cuántos por prioridad" }, { x: 0.88, y: 0.53, texto: "Sectores con más reportes" }, { x: 0.62, y: 0.172, texto: "Descarga el mapa" }]),
  escena("02b-vista-general-detalle", "Se decide con datos", "Tendencia diaria, pendientes más antiguos y sectores con más reportes, con informe en PDF y Excel.", [
    { x: 0.42, y: 0.52, texto: "Tendencia diaria" }, { x: 0.81, y: 0.5, texto: "Casos más antiguos sin atender" }, { x: 0.41, y: 0.87, texto: "Sectores con más reportes" }, { x: 0.816, y: 0.1, texto: "Exporta a Excel" }]),
  escena("05-equipo", "Con el equipo organizado", "Cada gerencia con su personal, su actividad del día y sus supervisores por turno.", [
    { x: 0.35, y: 0.45, texto: "Da de alta al personal" }, { x: 0.78, y: 0.36, texto: "Personal y sus reportes del día" }, { x: 0.59, y: 0.172, texto: "Historial de accesos a la app" }, { x: 0.4, y: 0.87, texto: "Supervisores por turno" }]),
];
const TEMA = { fondo: "#04213c", marco: "#072e51", puntos: ["#f5af31", "#b4c2d1", "#ffffff", "#5d7389"], rejilla: "#5d7389" };

export default {
  id: "sgti-municipal",
  nombre: "SGTI Municipal",
  que: "Incidencias y reportes de campo",
  propio: true, // viene de una presentación: usa las clases y el CSS de src/portados
  secciones: [["recorrido", "Recorrido"], ["para-que", "Para qué sirve"], ["como-funciona", "Cómo funciona"], ["para-quien", "Para quién"], ["beneficios", "Beneficios"]],
  html: () => html,
  init(el, { sinMovimiento }) {
    ponerImagenes(el, CAPTURAS);
    const fin = [
      activarVisor(el),
      montarVuelo(el.querySelector("[data-vuelo]"), { escenas: RECORRIDO(), tema: TEMA, etiqueta: "Recorrido en 3D por las pantallas de SGTI", sinMovimiento, arriba: altoBarras(el) }),
    ];
    return () => fin.forEach((f) => f());
  },
};
