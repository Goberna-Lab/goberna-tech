// Escenas vivas de la página general: una demostración interactiva por familia de plataformas.
//   territorio → un teléfono en mano que cambia de app según la plataforma elegida
//   atención   → un tablero de widgets que llegan volando y funcionan
//   seguridad  → una ilustración explicativa: del botón del vecino a la central
//   gestión    → dos widgets: el tablero del presupuesto y el generador de documentos
// Todo son datos de ejemplo. Cada escena corre sola mientras se ve y responde al toque.

const svg = (d) => `<svg viewBox="0 0 24 24" aria-hidden="true">${d}</svg>`;
const IC = {
  check: `<path d="M5 12.500l4.500 4.500L19 7.500"/>`,
  panel: `<path d="M4 19V5M4 19h16M8.500 16v-5M12.500 16V8M16.500 16v-7"/>`,
  equipo: `<circle cx="9" cy="9" r="3"/><path d="M3.500 19c.6-3.200 2.800-5 5.500-5s4.900 1.800 5.500 5"/><circle cx="17" cy="8.500" r="2.300"/><path d="M16.500 13.500c2.200.3 3.600 1.800 4 4"/>`,
  camara: `<path d="M4 8h3.200l1.600-2.500h6.400L16.800 8H20v11H4z"/><circle cx="12" cy="13.200" r="3.200"/>`,
  edificio: `<path d="M3 20h18M5 20V10l7-5 7 5v10M9.500 20v-5h5v5"/>`,
  ficha: `<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>`,
  senal: `<path d="M5 18v-2M9.500 18v-5M14 18v-8M18.500 18V6"/>`,
  semaforo: `<circle cx="6" cy="12" r="2.500"/><circle cx="12" cy="12" r="2.500"/><circle cx="18" cy="12" r="2.500"/>`,
  pin: `<path d="M12 21s-6.500-6.200-6.500-11a6.500 6.500 0 0 1 13 0c0 4.800-6.500 11-6.500 11z"/><circle cx="12" cy="10" r="2.300"/>`,
};
const ic = (n) => svg(IC[n]);
const OK = svg(IC.check);

/* ---------- Línea de tiempo de una demostración ----------
   Avanza de 0 a `pasos` y vuelve a empezar. En cada paso k:
   · los elementos [data-en="n"] con n ≤ k reciben la clase .on
   · los [data-txt='{"0":"a","2":"b"}'] toman el texto del último paso alcanzado
   · la raíz lleva data-paso="k" (para estilos de un paso concreto) */
function linea(raiz, { pasos, ritmo = 1500, final = 2800, quieto = false, alPaso }) {
  let n = 0;
  let reloj = 0;
  let visible = false;
  const textos = [...raiz.querySelectorAll("[data-txt]")].map((el) => [el, JSON.parse(el.dataset.txt)]);
  const poner = (k) => {
    n = k;
    raiz.dataset.paso = k;
    for (const el of raiz.querySelectorAll("[data-en]")) el.classList.toggle("on", Number(el.dataset.en) <= k);
    for (const [el, mapa] of textos) {
      let v;
      for (const paso in mapa) if (Number(paso) <= k) v = mapa[paso];
      if (v != null && el.textContent !== v) el.textContent = v;
    }
    alPaso?.(k);
  };
  const seguir = (espera) => {
    clearTimeout(reloj);
    if (!visible || quieto) return;
    reloj = setTimeout(() => {
      poner(n >= pasos ? 0 : n + 1);
      seguir();
    }, espera ?? (n >= pasos ? final : n === 0 ? 1000 : ritmo));
  };
  poner(quieto ? pasos : 0);
  return {
    get paso() {
      return n;
    },
    // Lo que hace la persona: va a un paso y el avance automático espera un poco más.
    poner(k) {
      poner(k);
      seguir(k >= pasos ? 4200 : 2600);
    },
    avanzar() {
      this.poner(n >= pasos ? 1 : n + 1);
    },
    ver(v) {
      visible = v;
      seguir();
    },
    parar() {
      clearTimeout(reloj);
    },
  };
}

/* ---------- Piezas compartidas ---------- */

// Teléfono sostenido por una mano (la mano va en dos capas: detrás y delante del teléfono).
const telefono = (pantalla = "") => `
  <div class="tel-grupo">
    <svg class="mano" viewBox="0 0 200 420" aria-hidden="true">
      <path d="M-14 168C-30 236-27 330-5 398C7 432 24 452 30 520V760H176V520C188 470 226 424 232 344C236 302 226 262 204 250L178 238L20 168Z"/>
    </svg>
    <div class="tel"><i class="tel-muesca"></i><div class="tel-pantalla">${pantalla}</div></div>
    <svg class="mano" viewBox="0 0 200 420" aria-hidden="true">
      ${[150, 197, 244, 291].map((y) => `<rect x="-20" y="${y}" width="33" height="42" rx="16.500"/>`).join("")}
      <rect x="186" y="262" width="38" height="96" rx="19" transform="rotate(-8 205 310)"/>
    </svg>
  </div>`;

// Puntos sueltos de fondo, como en una ilustración explicativa.
const deco = () =>
  `<div class="deco" aria-hidden="true">${[
    [7, 12, 0.9, "o"], [90, 9, 0.6, "n"], [95, 58, 1, "o"], [4, 70, 0.6, "n"], [52, 5, 0.5, "n"], [74, 93, 0.7, "o"], [38, 94, 0.5, "n"],
  ]
    .map(([x, y, s, c], i) => `<i class="${c}" style="left:${x}%;top:${y}%;--s:${s};--i:${i}"></i>`)
    .join("")}</div>`;

// Un hilo curvo entre dos puntos (dos trazos: uno dorado y uno fino que lo acompaña).
const hilo = (x0, y0, x1, y1, en) => {
  const dx = (x1 - x0) * 0.5;
  const dy = (y1 - y0) * 0.5;
  const horizontal = Math.abs(x1 - x0) > Math.abs(y1 - y0) * 0.6;
  const c = horizontal ? [x0 + dx, y0, x1 - dx, y1] : [x0, y0 + dy, x1, y1 - dy];
  const d = (k) => `M${x0} ${y0}C${c[0] + k} ${c[1] - k} ${c[2] + k} ${c[3] + k} ${x1} ${y1}`;
  return `<path class="fino" pathLength="1" data-en="${en}" d="${d(14)}"/><path pathLength="1" data-en="${en}" d="${d(0)}"/>`;
};

/* ---------- Territorio: un teléfono, tres apps ---------- */

const CASAS = ["Jr. Los Pinos 120", "Jr. Los Pinos 134", "Pje. San Martín 8", "Av. Central 451"];
const GERENCIAS = ["Limpieza Pública", "Seguridad Ciudadana", "Obras Públicas"];

const APPS = {
  "gobernanza-municipal": {
    pasos: 4,
    ritmo: 1500,
    pantalla: `
      <header class="ap-cab"><small>Brigada norte · Sector 3</small><b>Ruta de hoy</b></header>
      <div class="ap-avance"><span>Casas visitadas</span><b data-txt='{"0":"0 de 4","1":"1 de 4","2":"2 de 4","3":"3 de 4","4":"4 de 4"}'>0 de 4</b><div class="ap-barra"><i></i></div></div>
      <ul class="ap-lista">${CASAS.map((c, i) => `<li data-en="${i + 1}"><i>${OK}</i>${c}</li>`).join("")}</ul>
      <button class="ap-boton" type="button" data-accion data-txt='{"0":"Registrar visita","4":"Ruta completa"}'>Registrar visita</button>`,
    burbujas: [
      [1, "check", "El brigadista marca cada visita desde el teléfono"],
      [2, "panel", "La oficina ve el avance de la brigada en vivo"],
      [4, "equipo", "Meta del día cumplida, sin planillas"],
    ],
    alPaso(k, esc) {
      esc.querySelector(".ap-barra i").style.width = `${k * 25}%`;
      esc.querySelectorAll(".ap-lista li").forEach((li, i) => li.classList.toggle("sig", i === k));
    },
  },
  "sgti-municipal": {
    pasos: 5,
    ritmo: 1350,
    pantalla: `
      <header class="ap-cab"><small>Operador de campo</small><b>Nuevo reporte</b></header>
      <div class="ap-chips" role="group" aria-label="Tipo de incidencia">${GERENCIAS.map((g, i) => `<button type="button" data-ger="${i}">${g}</button>`).join("")}</div>
      <div class="ap-foto" data-en="2"><i>${ic("camara")}</i><span data-txt='{"0":"Tomar foto","2":"Foto adjunta"}'>Tomar foto</span></div>
      <p class="ap-dato" data-en="3"><i>${ic("pin")}</i><span data-txt='{"0":"Ubicando…","3":"Sector 2, con GPS"}'>Ubicando…</span></p>
      <p class="ap-hecho" data-en="4"><i>${OK}</i>Reporte enviado</p>
      <button class="ap-boton" type="button" data-accion data-txt='{"0":"Enviar reporte","4":"Nuevo reporte"}'>Enviar reporte</button>`,
    burbujas: [
      [3, "camara", "Cada reporte sale con foto y ubicación"],
      [4, "edificio", "Llega al panel de la Gerencia de Limpieza Pública"],
      [5, "panel", "La alcaldía lo ve en su vista general"],
    ],
    ger: 0,
    alPaso(k, esc) {
      if (k === 0) this.ger = (this.ger + 1) % GERENCIAS.length;
      this.pintar(esc, k);
    },
    pintar(esc, k) {
      esc.querySelectorAll("[data-ger]").forEach((b, i) => b.setAttribute("aria-pressed", String(k >= 1 && i === this.ger)));
      const b = esc.querySelector(".b2 span");
      if (b) b.textContent = `Llega al panel de la Gerencia de ${GERENCIAS[this.ger]}`;
    },
    montar(esc, tl) {
      this.ger = -1;
      esc.querySelector(".ap-chips").addEventListener("click", (e) => {
        const b = e.target.closest("[data-ger]");
        if (!b) return;
        this.ger = Number(b.dataset.ger);
        tl.poner(Math.max(1, Math.min(tl.paso, 3)));
      });
    },
  },
  "sistema-ule": {
    pasos: 4,
    ritmo: 1500,
    pantalla: `
      <header class="ap-cab"><small>Promotora · Zona 4</small><b>Visita al hogar</b></header>
      <div class="ap-hogar"><b>Mz. C, Lt. 8</b><span>Tramo: Crítico</span><small>Su clasificación vence pronto</small></div>
      <ul class="ap-lista">
        <li data-en="1"><i>${OK}</i>Ficha levantada</li>
        <li data-en="2"><i>${OK}</i>Guardada en el teléfono</li>
        <li data-en="3"><i>${OK}</i>Enviada al volver la señal</li>
      </ul>
      <button class="ap-boton" type="button" data-accion data-txt='{"0":"Levantar ficha","1":"Guardar","2":"Enviar","3":"Siguiente hogar"}'>Levantar ficha</button>`,
    burbujas: [
      [1, "ficha", "La promotora levanta la ficha en la visita"],
      [3, "senal", "Sin señal, queda en el teléfono y se envía al reconectar"],
      [4, "semaforo", "El semáforo muestra dónde está cada ficha"],
    ],
    alPaso(k, esc) {
      esc.querySelectorAll(".ap-lista li").forEach((li, i) => li.classList.toggle("sig", i === k));
    },
  },
};

function escenaTelefono(el, ctx) {
  el.innerHTML = `
    <div class="esc esc-tel" role="group" aria-label="Demostración interactiva con datos de ejemplo">
      ${deco()}
      <i class="tel-disco" aria-hidden="true"></i>
      <svg class="hilos" aria-hidden="true"></svg>
      ${telefono()}
      <div class="burbujas"></div>
      <p class="esc-nota">Demostración con datos de ejemplo. Pruebe el botón del teléfono.</p>
    </div>`;
  const esc = el.firstElementChild;
  const grupo = esc.querySelector(".tel-grupo");
  const pantalla = esc.querySelector(".tel-pantalla");
  const burbujas = esc.querySelector(".burbujas");
  const hilos = esc.querySelector(".hilos");
  let tl = null;
  let app = null;
  let visible = false;

  const trazar = () => {
    if (!app) return;
    const x0 = grupo.offsetLeft + grupo.offsetWidth - 6;
    hilos.innerHTML = [...burbujas.children]
      .map((b, n) => {
        const i = b.firstElementChild;
        const y0 = grupo.offsetTop + grupo.offsetHeight * (0.2 + n * 0.22);
        return hilo(x0, y0, burbujas.offsetLeft + i.offsetLeft + 2, burbujas.offsetTop + i.offsetTop + i.offsetHeight / 2, app.burbujas[n][0]);
      })
      .join("");
    for (const p of hilos.children) p.classList.toggle("on", Number(p.dataset.en) <= (tl?.paso ?? 0));
  };

  function elegir(id) {
    tl?.parar();
    app = APPS[id];
    pantalla.innerHTML = app.pantalla;
    pantalla.classList.remove("entra");
    void pantalla.offsetWidth;
    pantalla.classList.add("entra");
    burbujas.innerHTML = app.burbujas.map(([en, i, t], n) => `<div class="burb b${n + 1}" data-en="${en}"><i>${ic(i)}</i><span>${t}</span></div>`).join("");
    tl = null;
    trazar();
    app.montar?.(esc, { poner: (k) => tl.poner(k), get paso() { return tl.paso; } });
    tl = linea(esc, { pasos: app.pasos, ritmo: app.ritmo, quieto: ctx.quieto, alPaso: (k) => app.alPaso?.(k, esc) });
    tl.ver(visible);
  }

  esc.addEventListener("click", (e) => {
    const b = e.target.closest("[data-accion]");
    if (!b || !tl) return;
    tl.avanzar();
  });
  new ResizeObserver(trazar).observe(esc);
  return {
    elegir,
    ver(v) {
      visible = v;
      tl?.ver(v);
    },
  };
}

/* ---------- Tablero de widgets (atención al ciudadano y gestión interna) ---------- */

const PREGUNTAS = [
  ["¿Cómo pago mis arbitrios?", "Te explico los pasos y los canales de pago habilitados.", "Arbitrios"],
  ["Quiero ver mi estado de cuenta", "Te pido tus datos y te muestro tu estado de cuenta.", "Estado de cuenta"],
  ["Quiero reportar un problema en mi calle", "Registro tu solicitud y la derivo al área que corresponde.", "Reportar un problema"],
];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const DIAS_LARGO = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"];
const HORAS = ["16:00", "18:00", "20:00"];
const ocupado = (h, d) => (h * 3 + d * 5 + ((h + 1) * d) % 4) % 5 < 2;
const AREAS = [["Obras", 54], ["Servicios a la ciudad", 78], ["Seguridad ciudadana", 70], ["Administración", 86], ["Desarrollo social", 61]];
const MESES = [["Enero", 6], ["Marzo", 19], ["Mayo", 33], ["Julio", 47], ["Setiembre", 59], ["Noviembre", 68]];
const DOCS = ["Informe de requerimiento", "Términos de referencia", "Anexos", "Expediente completo"];

const WIDGETS = {
  ticketera: {
    cls: "w-ticket",
    pasos: 3,
    ritmo: 1500,
    html: `
      <header><b>Ticketera</b><span>Pantalla de llamados</span></header>
      <p class="tk-rot">Turno actual</p>
      <p class="tk-num" data-txt='{"0":"C002","3":"C003"}'>C002</p>
      <p class="tk-vent" data-txt='{"0":"Ventanilla 1","3":"Ventanilla 2"}'>Ventanilla 1</p>
      <div class="tk-papel" aria-hidden="true"><small>Su turno</small><b>C003</b></div>
      <div class="w-pie"><span>En espera: <b data-txt='{"0":"1","1":"2","3":"1"}'>1</b></span><button class="w-btn" type="button" data-accion>Sacar turno</button></div>`,
  },
  "asistente-virtual": {
    cls: "w-chat",
    pasos: 3,
    ritmo: 1300,
    final: 3200,
    html: `
      <header><b>Asistente virtual</b><span>En línea</span></header>
      <div class="ch-log" aria-live="off">
        <p class="ch-b ch-bot ch-hola">Hola. ¿En qué te ayudo?</p>
        <p class="ch-b ch-yo" data-en="1"></p>
        <p class="ch-b ch-bot ch-dots" aria-hidden="true"><i></i><i></i><i></i></p>
        <p class="ch-b ch-bot ch-resp" data-en="3"></p>
      </div>
      <div class="ch-ops">${PREGUNTAS.map(([, , corto], i) => `<button type="button" data-q="${i}">${corto}</button>`).join("")}</div>`,
    montar(nodo, tl, yo) {
      let q = -1;
      yo.elegirPregunta = (i) => {
        q = i;
        nodo.querySelector(".ch-yo").textContent = PREGUNTAS[i][0];
        nodo.querySelector(".ch-resp").textContent = PREGUNTAS[i][1];
        nodo.querySelectorAll("[data-q]").forEach((b, j) => b.setAttribute("aria-pressed", String(i === j)));
      };
      yo.siguiente = () => yo.elegirPregunta((q + 1) % PREGUNTAS.length);
      yo.elegirPregunta(0);
      q = -1;
      nodo.addEventListener("click", (e) => {
        const b = e.target.closest("[data-q]");
        if (!b) return;
        yo.elegirPregunta(Number(b.dataset.q));
        tl().poner(3);
      });
    },
    alPaso(k, nodo, yo) {
      if (k === 0) yo.siguiente();
    },
  },
  "reserva-canchas": {
    cls: "w-cal",
    pasos: 2,
    ritmo: 1300,
    html: `
      <header><b>Reserva de canchas</b><span>Cancha de fútbol</span></header>
      <div class="vcal-g" role="group" aria-label="Horarios de la semana">
        <span></span>${DIAS.map((d) => `<span class="vcal-d">${d}</span>`).join("")}
        ${HORAS.map((h, i) => `<span class="vcal-h">${h}</span>` + DIAS.map((_, d) => (ocupado(i, d) ? `<span class="vcal-x" aria-label="Ocupado"></span>` : `<button type="button" data-h="${i}" data-d="${d}" aria-label="${DIAS_LARGO[d]} ${h}, disponible">${OK}</button>`)).join("")).join("")}
      </div>
      <p class="vcal-res" aria-live="off">Toque un horario libre</p>`,
    montar(nodo, tl, yo) {
      const libres = [...nodo.querySelectorAll(".vcal-g button")];
      const res = nodo.querySelector(".vcal-res");
      let turno = 0;
      yo.obj = null;
      yo.limpiar = () => {
        libres.forEach((c) => c.classList.remove("apunta", "mia"));
        res.innerHTML = "Toque un horario libre";
      };
      yo.apuntar = () => {
        yo.obj = libres[(turno++ * 5 + 4) % libres.length];
        yo.obj.classList.add("apunta");
      };
      yo.reservar = () => {
        if (!yo.obj) return;
        yo.obj.classList.remove("apunta");
        yo.obj.classList.add("mia");
        res.innerHTML = `Reservado: <b>${DIAS_LARGO[yo.obj.dataset.d]}, ${HORAS[yo.obj.dataset.h]}</b>`;
      };
      nodo.addEventListener("click", (e) => {
        const c = e.target.closest(".vcal-g button");
        if (!c) return;
        yo.limpiar();
        yo.obj = c;
        tl().poner(2);
      });
    },
    alPaso(k, nodo, yo) {
      if (k === 0) yo.limpiar();
      if (k === 1) yo.apuntar();
      if (k === 2) yo.reservar();
    },
  },
  talleres: {
    cls: "w-taller",
    pasos: 2,
    ritmo: 1700,
    html: `
      <header><b>Talleres</b><span>Polideportivo</span></header>
      <ul class="vta-l">
        <li><b>Natación</b><span data-txt='{"0":"Queda 1 cupo","2":"Completo"}'>Queda 1 cupo</span><div class="vta-b"><i style="--p:94" data-en="2"></i></div></li>
        <li><b>Fútbol</b><span>Quedan 2</span><div class="vta-b"><i style="--p:90"></i></div></li>
        <li><b>Danza</b><span>Quedan 13</span><div class="vta-b"><i style="--p:48"></i></div></li>
      </ul>
      <div class="w-pie"><span data-en="2" class="vta-ok">${OK}Inscrito en Natación</span><button class="w-btn" type="button" data-accion data-txt='{"0":"Inscribirme","2":"Otra vez"}'>Inscribirme</button></div>`,
  },
  "control-presupuestal": {
    cls: "w-pres",
    pasos: 2,
    ritmo: 3200,
    final: 3200,
    html: `
      <header><b>Control presupuestal</b><span>Cifras de ejemplo</span></header>
      <p class="vpr-cifra"><b data-en="1">68%</b><span>Avance de ejecución</span></p>
      <div class="vpr-tabs" role="group" aria-label="Vista"><button type="button" data-v="1">Por área</button><button type="button" data-v="2">Por mes</button></div>
      <ul class="vpr-l vpr-area">${AREAS.map(([n, p], i) => `<li style="--n:${i}"><span>${n}</span><b>${p}%</b><div class="vpr-b"><i style="--p:${p}" data-en="1"></i></div></li>`).join("")}</ul>
      <ul class="vpr-l vpr-mes">${MESES.map(([n, p], i) => `<li style="--n:${i}"><span>${n}</span><b>${p}%</b><div class="vpr-b"><i style="--p:${p}" data-en="2"></i></div></li>`).join("")}</ul>`,
    montar(nodo, tl) {
      nodo.querySelector(".vpr-tabs").addEventListener("click", (e) => {
        const b = e.target.closest("[data-v]");
        if (b) tl().poner(Number(b.dataset.v));
      });
    },
    alPaso(k, nodo) {
      nodo.querySelectorAll("[data-v]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.v) === Math.max(1, k))));
    },
  },
  "generador-requerimientos": {
    cls: "w-gen",
    pasos: 3,
    ritmo: 1700,
    final: 3400,
    html: `
      <header><b>Generador de requerimientos</b><span>Del Excel al expediente</span></header>
      <div class="vge-xls" aria-hidden="true">
        <span class="vge-tit">Excel del área</span>
        ${["Servicio de limpieza", "Apoyo administrativo", "Mantenimiento"].map((s, i) => `<span class="vge-fila" data-en="1" style="--n:${i}"><i>${i + 2}</i><b>${s}</b><em>${OK}</em></span>`).join("")}
      </div>
      <div class="vge-pasos" role="group" aria-label="Pasos"><button type="button" data-g="1"><i>1</i>Validar</button><button type="button" data-g="2"><i>2</i>Vista previa</button><button type="button" data-g="3"><i>3</i>Generar</button></div>
      <ul class="vge-docs">${DOCS.map((d, i) => `<li data-en="2" style="--n:${i}"><i></i><span>${d}</span><small data-txt='{"0":"Borrador","3":"N° 0${14 + i}-2026"}'>Borrador</small></li>`).join("")}</ul>`,
    montar(nodo, tl) {
      nodo.querySelector(".vge-pasos").addEventListener("click", (e) => {
        const b = e.target.closest("[data-g]");
        if (b) tl().poner(Number(b.dataset.g));
      });
    },
    alPaso(k, nodo) {
      nodo.querySelectorAll("[data-g]").forEach((b) => {
        const g = Number(b.dataset.g);
        b.classList.toggle("hecho", g <= k);
        b.setAttribute("aria-pressed", String(g === k));
      });
    },
  },
};

function escenaWidgets(el, ctx, ids) {
  el.innerHTML = `
    <div class="esc esc-oscura esc-wid tabla-${ids.length}" role="group" aria-label="Demostración interactiva con datos de ejemplo">
      <div class="wid-tabla">
        ${ids.map((id, n) => `<article class="wid ${WIDGETS[id].cls}" data-w="${id}" style="--n:${n};--giro:${n % 2 ? 32 : -32}deg">${WIDGETS[id].html}</article>`).join("")}
      </div>
      <p class="esc-nota">Demostración con datos de ejemplo. Toque cada tarjeta para probarla.</p>
    </div>`;
  const esc = el.firstElementChild;
  const tabla = esc.querySelector(".wid-tabla");
  const lineas = ids.map((id) => {
    const w = WIDGETS[id];
    const nodo = esc.querySelector(`[data-w="${id}"]`);
    const yo = {};
    let tl = null;
    w.montar?.(nodo, () => tl, yo);
    tl = linea(nodo, { pasos: w.pasos, ritmo: w.ritmo, final: w.final, quieto: ctx.quieto, alPaso: (k) => w.alPaso?.(k, nodo, yo) });
    nodo.addEventListener("click", (e) => {
      if (e.target.closest("[data-accion]")) tl.avanzar();
      if (!nodo.classList.contains("foco")) {
        elegir(id);
        ctx.alElegir?.(id);
      }
    });
    return tl;
  });
  function elegir(id) {
    for (const w of esc.querySelectorAll(".wid")) w.classList.toggle("foco", w.dataset.w === id);
  }
  // Con puntero, el tablero se inclina un poco hacia donde está el cursor.
  if (!ctx.quieto && matchMedia("(hover: hover)").matches) {
    esc.addEventListener("pointermove", (e) => {
      const r = esc.getBoundingClientRect();
      tabla.style.setProperty("--ry", `${((e.clientX - r.left) / r.width - 0.5) * 7}deg`);
      tabla.style.setProperty("--rx", `${(0.5 - (e.clientY - r.top) / r.height) * 6}deg`);
    });
    esc.addEventListener("pointerleave", () => {
      tabla.style.setProperty("--ry", "0deg");
      tabla.style.setProperty("--rx", "0deg");
    });
  }
  // Cada tarjeta arranca un poco después que la anterior, cuando ya terminó de llegar.
  let visto = false;
  return {
    elegir,
    ver(v) {
      visto = v;
      lineas.forEach((tl, i) => (v ? setTimeout(() => visto && tl.ver(true), 900 + i * 450) : tl.ver(false)));
    },
  };
}

/* ---------- Seguridad: del botón del vecino a la central ---------- */

const calles = () => {
  let s = "";
  for (let x = 25; x < 200; x += 25) s += `<line x1="${x}" y1="0" x2="${x}" y2="124"/>`;
  for (let y = 22; y < 124; y += 22) s += `<line x1="0" y1="${y}" x2="200" y2="${y}"/>`;
  return s;
};

function escenaSeguridad(el, ctx) {
  el.innerHTML = `
    <div class="esc esc-seg" role="group" aria-label="Demostración interactiva con datos de ejemplo" data-foco="tel">
      ${deco()}
      <svg class="hilos" aria-hidden="true"></svg>
      ${telefono(`
        <header class="ap-cab"><small>Alerta vecinal</small><b>¿Necesita ayuda?</b></header>
        <button class="sos-b" type="button" data-accion="sos" aria-label="Probar el botón de pánico"><i></i><i></i><span>SOS</span></button>
        <p class="ap-dato" data-en="1"><i>${ic("pin")}</i><span>Ubicación enviada</span></p>
        <p class="ap-hecho" data-en="3"><i>${OK}</i>Auxilio en camino</p>`)}
      <ol class="seg-pasos">
        <li data-en="1"><i>1</i><div><b>Alerta enviada</b><span>Sale con la ubicación GPS del vecino.</span></div></li>
        <li data-en="2"><i>2</i><div><b>Recibida en la central</b><span>Aparece sobre el mapa.</span></div></li>
        <li data-en="3"><i>3</i><div><b>Auxilio en camino</b><span>El operador despacha la ayuda.</span></div></li>
      </ol>
      <div class="central">
        <header><b>Central de serenazgo</b><span data-txt='{"0":"Sin alertas","2":"Alerta nueva","3":"Atendida"}'>Sin alertas</span></header>
        <svg viewBox="0 0 200 124" aria-hidden="true">
          <g class="ce-calles">${calles()}</g>
          <path class="ce-ruta" pathLength="1" d="M160 99H100V55H75"/>
          <g class="ce-pin"><circle class="ce-onda" r="10"/><path d="M0 0c-6-8-9-12-9-17a9 9 0 0 1 18 0c0 5-3 9-9 17z"/></g>
          <g class="ce-auto"><rect x="-9" y="-5" width="18" height="10" rx="2.500"/></g>
        </svg>
        <div class="w-pie"><span data-txt='{"0":"Patrullero disponible","2":"Jr. Las Flores 240","3":"Patrullero en camino"}'>Patrullero disponible</span><button class="w-btn" type="button" data-accion="despachar">Despachar</button></div>
      </div>
      <p class="esc-nota">Demostración con datos de ejemplo. Pulse SOS: no se envía nada.</p>
    </div>`;
  const esc = el.firstElementChild;
  const grupo = esc.querySelector(".tel-grupo");
  const central = esc.querySelector(".central");
  const hilos = esc.querySelector(".hilos");
  const tl = linea(esc, { pasos: 3, ritmo: 1800, final: 3200, quieto: ctx.quieto });
  const trazar = () => {
    const alLado = central.offsetLeft >= grupo.offsetLeft + grupo.offsetWidth - 4; // si no, la central va debajo
    hilos.innerHTML = alLado
      ? hilo(grupo.offsetLeft + grupo.offsetWidth - 6, grupo.offsetTop + grupo.offsetHeight * 0.42, central.offsetLeft + 2, central.offsetTop + central.offsetHeight * 0.5, 1)
      : hilo(grupo.offsetLeft + grupo.offsetWidth * 0.75, grupo.offsetTop + grupo.offsetHeight * 0.9, central.offsetLeft + central.offsetWidth * 0.4, central.offsetTop + 2, 1);
    for (const p of hilos.children) p.classList.toggle("on", tl.paso >= 1);
  };
  esc.addEventListener("click", (e) => {
    const b = e.target.closest("[data-accion]");
    if (!b) return;
    if (b.dataset.accion === "sos") tl.poner(tl.paso === 1 ? 2 : 1);
    else tl.poner(3);
  });
  new ResizeObserver(trazar).observe(esc);
  return {
    elegir(id) {
      esc.dataset.foco = id === "alerta-vecinal" ? "tel" : "central";
    },
    ver: (v) => tl.ver(v),
  };
}

/* ---------- Montaje ---------- */

// Monta la escena de una familia dentro de `el`. Devuelve { elegir(idPlataforma) }.
export function montarEscena(familia, el, { quieto = false, alElegir } = {}) {
  const ctx = { quieto, alElegir };
  const escena =
    familia === "territorio"
      ? escenaTelefono(el, ctx)
      : familia === "seguridad"
        ? escenaSeguridad(el, ctx)
        : escenaWidgets(el, ctx, familia === "atencion" ? ["ticketera", "asistente-virtual", "reserva-canchas", "talleres"] : ["control-presupuestal", "generador-requerimientos"]);
  const esc = el.firstElementChild;
  escena.activar = () => {};
  if (quieto) {
    esc.classList.add("viva", "lista");
    return escena;
  }
  // La escena entra la primera vez que se ve y se detiene cuando sale de la pantalla. Cuando las
  // familias comparten el mismo sitio (lista fija), solo corre la de la familia activa.
  let alcanza = false;
  let asoma = false;
  let activa = true;
  const aplicar = () => {
    const v = alcanza && activa;
    if (v && !esc.classList.contains("viva")) {
      esc.classList.add("viva");
      setTimeout(() => esc.classList.add("lista"), 1700);
    }
    esc.classList.toggle("en-vista", asoma && activa);
    escena.ver(v);
  };
  escena.activar = (si) => {
    if (si === activa) return;
    activa = si;
    aplicar();
  };
  new IntersectionObserver(
    ([en]) => {
      asoma = en.isIntersecting;
      alcanza = asoma && en.intersectionRatio >= 0.3;
      aplicar();
    },
    { threshold: [0, 0.3] },
  ).observe(esc);
  return escena;
}
