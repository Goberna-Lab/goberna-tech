// Imágenes de los módulos (public/img). Cada ruta aparece una sola vez: el archivo único
// (npm run standalone) incrusta cada imagen en el lugar donde encuentra su ruta.
const img = (src, w, h, alt, phone = false) => ({ src, w, h, alt, phone });

export const IMG = {
  tkDispensador: img("/img/tk-dispensador.webp", 1080, 560, "Dispensador de turnos con las áreas Caja, Rentas y Registro Civil, cada una con turno preferencial y turno general"),
  tkPantalla: img("/img/tk-pantalla.webp", 1440, 810, "Pantalla de llamados con el turno actual, la ventanilla, los últimos llamados y las personas en espera"),
  tkVentanilla: img("/img/tk-ventanilla.webp", 1440, 900, "Pantalla de la ventanilla con el turno en atención, las áreas en espera y los turnos del día"),
  tkEnVivo: img("/img/tk-en-vivo.webp", 1440, 900, "Estado en vivo del panel de administración: personas en espera, atendidos hoy, espera por área y ventanillas"),
  tkEstadisticas: img("/img/tk-estadisticas.webp", 1440, 900, "Estadísticas de la Ticketera: turnos emitidos, atendidos, espera promedio, turnos por día y hora de llegada"),
  sgtiGeneral: img("/img/sgti-vista-general.webp", 1440, 900, "Vista general del alcalde: reportes del período, atención promedio, eficiencia, casos críticos e incidencias por gerencia"),
  sgtiMapa: img("/img/sgti-mapa-territorial.webp", 1440, 900, "Mapa territorial en tiempo real con los sectores del distrito en colores y los reportes marcados"),
  sgtiCalor: img("/img/sgti-mapa-calor.webp", 1440, 900, "Mapa de calor de incidencias georreferenciadas con una zona caliente resaltada"),
  sgtiApp: img("/img/sgti-app-reporte.webp", 520, 1118, "Aplicación de campo: formulario del reporte con prioridad, desplazamiento, descripción y evidencia en foto o video", true),
  tkAreas: img("/img/tk-areas.webp", 1440, 900, "Configuración de áreas con horario y cupo"),
  tkVentanillas: img("/img/tk-ventanillas.webp", 1440, 900, "Configuración de ventanillas"),
  tkAdminPantalla: img("/img/tk-admin-pantalla.webp", 1440, 900, "Contenido de la pantalla de llamados"),
  sgtiDetalle: img("/img/sgti-detalle.webp", 1440, 900, "Vista general: tendencia diaria, pendientes más antiguos y sectores con más reportes"),
  sgtiEquipo: img("/img/sgti-equipo.webp", 1440, 900, "Gestión de equipo: registro de personal y actividad del día"),
  sgtiAppInicio: img("/img/sgti-app-inicio.webp", 520, 1118, "Aplicación de campo de SGTI en el celular", true),
  gobApp: img("/img/gobernanza-app-campo.webp", 398, 852, "App de campo: avance de casas visitadas de una brigadista y mapa de su zona con el estado de cada vivienda", true),
};

export const tag = (i, cls = "") => `<img${cls ? ` class="${cls}"` : ""} src="${i.src}" alt="${i.alt}" width="${i.w}" height="${i.h}" loading="lazy" />`;
