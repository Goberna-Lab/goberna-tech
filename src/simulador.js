// Sala de atención que funciona sola, para ver el proceso completo de la Ticketera:
// llega el vecino y saca su turno → espera en la cola → la ventanilla lo llama (sale en la pantalla)
// → lo atiende → termina o lo deriva a otra área. Mismas reglas que la Ticketera real: códigos por
// área (C001, RC001), la P marca el preferencial (CP001), primero los preferenciales, luego los
// derivados y luego por orden de llegada; cada ventanilla atiende solo sus áreas. Datos de ejemplo.
// (Lógica tomada de la presentación de la Ticketera; aquí va sin React.)

const AREAS = [
  { id: 1, nombre: "Caja", prefijo: "C" },
  { id: 2, nombre: "Rentas", prefijo: "R" },
  { id: 3, nombre: "Registro Civil", prefijo: "RC" },
];
const area = (id) => AREAS.find((a) => a.id === id);
const ordenar = (a, b) => Number(b.pref) - Number(a.pref) || Number(b.deriv) - Number(a.deriv) || a.llegada - b.llegada;

const PASO_MS = 2200; // cada cuánto pasa algo en la sala
const TOPE_ESPERA = 6; // la sala no se llena más que esto
const LLEGA_CADA = 3; // llega un vecino cada 3 pasos (si hay lugar)

function reductor(s, a) {
  const n = s.n + 1;
  const avisar = (texto, tipo) => [{ n, texto, tipo }, ...s.avisos].slice(0, 7);
  if (a.tipo === "emitir") {
    const ar = area(a.areaId);
    const clave = `${a.areaId}:${a.pref}`;
    const numero = (s.numeros[clave] || 0) + 1;
    const reloj = s.reloj + 1;
    const codigo = `${ar.prefijo}${a.pref ? "P" : ""}${String(numero).padStart(3, "0")}`;
    const t = { id: reloj, codigo, areaId: a.areaId, pref: a.pref, deriv: false, llegada: reloj };
    const cola = [...s.cola, t].sort(ordenar);
    const delante = cola.filter((x) => x.areaId === a.areaId).findIndex((x) => x.id === t.id);
    return {
      ...s,
      n,
      cola,
      reloj,
      numeros: { ...s.numeros, [clave]: numero },
      emitidos: s.emitidos + 1,
      ticket: { codigo, area: ar.nombre, pref: a.pref, delante, n },
      avisos: avisar(`Llega un vecino a ${ar.nombre} y saca el turno ${a.pref ? "preferencial " : ""}${codigo}.`, "llega"),
    };
  }
  const v = s.ventanillas.find((x) => x.id === a.vid);
  if (!v) return s;
  const con = (actual, extra) => ({
    ...s,
    n,
    ...extra,
    ventanillas: s.ventanillas.map((x) => (x.id === v.id ? { ...x, actual } : x)),
  });
  if (a.tipo === "llamar") {
    if (v.actual) return s;
    const t = s.cola.find((x) => v.areas.includes(x.areaId));
    if (!t) return s;
    const porque = t.pref ? " (es preferencial: pasa primero)" : t.deriv ? " (viene derivado: no pierde su lugar)" : "";
    return con(
      { turno: t, estado: "llamado", desde: a.t },
      {
        cola: s.cola.filter((x) => x.id !== t.id),
        llamados: [{ codigo: t.codigo, ventanilla: v.nombre, n }, ...s.llamados].slice(0, 5),
        avisos: avisar(`${v.nombre} llama al ${t.codigo}${porque}. Aparece en la pantalla.`, "llama"),
      },
    );
  }
  if (a.tipo === "iniciar") {
    if (!v.actual || v.actual.estado !== "llamado") return s;
    return con(
      { ...v.actual, estado: "atendiendo", desde: a.t },
      { avisos: avisar(`El vecino del ${v.actual.turno.codigo} llega a ${v.nombre} y empieza su trámite.`, "atiende") },
    );
  }
  if (a.tipo === "finalizar") {
    if (!v.actual || v.actual.estado !== "atendiendo") return s;
    return con(null, {
      atendidos: s.atendidos + 1,
      avisos: avisar(`${v.nombre} termina de atender el ${v.actual.turno.codigo}. Queda libre.`, "termina"),
    });
  }
  if (a.tipo === "derivar") {
    if (!v.actual || v.actual.estado !== "atendiendo") return s;
    const t = v.actual.turno;
    const destino = AREAS.find((x) => x.id !== t.areaId && !v.areas.includes(x.id)) ?? AREAS.find((x) => x.id !== t.areaId);
    const reloj = s.reloj + 1;
    return con(null, {
      reloj,
      cola: [...s.cola, { ...t, areaId: destino.id, deriv: true, llegada: reloj }].sort(ordenar),
      avisos: avisar(`${v.nombre} deriva el ${t.codigo} a ${destino.nombre}. Vuelve a la cola con prioridad.`, "deriva"),
    });
  }
  return s;
}

function inicial() {
  let s = {
    cola: [],
    llamados: [],
    avisos: [],
    ticket: null,
    numeros: {},
    reloj: 0,
    emitidos: 0,
    atendidos: 0,
    n: 0,
    ventanillas: [
      { id: 1, nombre: "Ventanilla 1", areas: [1, 2], actual: null },
      { id: 2, nombre: "Ventanilla 2", areas: [3], actual: null },
    ],
  };
  // Al abrir la página ya hay algunos vecinos esperando.
  for (const id of [1, 2, 3]) s = reductor(s, { tipo: "emitir", areaId: id, pref: false, t: 0 });
  return s;
}

// Qué hace la sala en cada paso: una sola cosa a la vez, para que se pueda seguir con la vista.
function siguientePaso(s, t) {
  // 1. Alguien llamado llega a la ventanilla (un paso después del llamado).
  for (const v of s.ventanillas) {
    if (v.actual?.estado === "llamado" && t - v.actual.desde >= 1) return { tipo: "iniciar", vid: v.id, t };
  }
  // 2. Una atención termina (después de 2 a 3 pasos); de vez en cuando se deriva a otra área.
  for (const v of s.ventanillas) {
    if (v.actual?.estado === "atendiendo" && t - v.actual.desde >= 2 + (v.actual.turno.id % 2)) {
      const derivar = !v.actual.turno.deriv && v.actual.turno.id % 5 === 3;
      return { tipo: derivar ? "derivar" : "finalizar", vid: v.id, t };
    }
  }
  // 3. Llega un vecino nuevo.
  if (t % LLEGA_CADA === 0 && s.cola.length < TOPE_ESPERA) {
    return { tipo: "emitir", areaId: 1 + ((t * 7 + s.emitidos) % 3), pref: s.emitidos % 6 === 4, t };
  }
  // 4. Una ventanilla libre llama al siguiente que le toca.
  for (const v of s.ventanillas) {
    if (!v.actual && s.cola.some((x) => v.areas.includes(x.areaId))) return { tipo: "llamar", vid: v.id, t };
  }
  return null;
}

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// La vista usa el mismo marcado y las mismas clases que la presentación de la Ticketera
// (src/portados/ticketera.css). "nuevo" marca lo que cambió en este paso: solo eso se anima.
function vista(s, andando, vistos) {
  const ultimo = s.llamados[0];
  const espera = (id) => s.cola.filter((t) => t.areaId === id).length;
  const quieto = ' style="animation:none"';
  const areas = AREAS.map((a) => {
    const n = espera(a.id);
    return `<div class="area-boton${s.ticket?.area === a.nombre ? " activa" : ""}">${a.nombre}<span class="codigo">${n ? `${n} en espera` : "sin espera"}</span></div>`;
  }).join("");
  const ticket = s.ticket
    ? `<div class="ticket${s.ticket.pref ? " ticket-pref" : ""}"${s.ticket.n === s.n ? "" : quieto}><small>Último ticket · ${esc(s.ticket.area)}${s.ticket.pref ? " · preferencial" : ""}</small><span class="codigo">${s.ticket.codigo}</span><small>${
        s.ticket.delante === 0 ? "Es el siguiente de su área" : `${s.ticket.delante} persona${s.ticket.delante === 1 ? "" : "s"} delante`
      }</small></div>`
    : `<div class="ticket"${quieto}><small>Esperando al primer vecino</small></div>`;
  const cola = s.cola.length
    ? s.cola
        .map((t) => {
          const clave = `${t.id}-${t.llegada}`;
          const nuevo = !vistos.has(clave);
          vistos.add(clave);
          return `<span class="ficha-turno${t.pref ? " pref" : ""}${t.deriv ? " deriv" : ""}" title="${area(t.areaId).nombre}"${nuevo ? "" : quieto}>${t.codigo}</span>`;
        })
        .join("")
    : `<span style="color:var(--suave);font-size:0.9rem">Nadie esperando</span>`;
  const ventanillas = s.ventanillas
    .map((v) => {
      const estado = v.actual ? (v.actual.estado === "llamado" ? "Llamando…" : "Atendiendo") : "Esperando al siguiente";
      return `<div class="ventanilla${v.actual ? ` ocupada ${v.actual.estado}` : ""}"><b>${v.nombre}</b><span class="sirve">Atiende ${v.areas
        .map((a) => area(a).nombre)
        .join(" y ")}</span>${v.actual ? `<span class="actual">${v.actual.turno.codigo}</span>` : `<span class="actual vacio">Libre</span>`}<span class="estado-ventanilla">${estado}</span></div>`;
    })
    .join("");
  const avisos = s.avisos.map((a) => `<li class="aviso-${a.tipo}">${esc(a.texto)}</li>`).join("");
  const recientes = s.llamados
    .slice(1)
    .map((l) => `<li><span class="codigo">${l.codigo}</span><span>${l.ventanilla}</span></li>`)
    .join("");
  return `
    <div class="simulador">
      <div class="bloque" aria-label="Dispensador de turnos">
        <div class="bloque-titulo"><h3>1. Dispensador de turnos</h3><span>en la entrada</span></div>
        <div class="p-areas">${areas}</div>
        ${ticket}
      </div>
      <div class="bloque" aria-label="Cola y ventanillas">
        <div class="bloque-titulo"><h3>2. Cola y ventanillas</h3><span>${s.cola.length} en espera</span></div>
        <div class="cola">${cola}</div>
        <div class="orden"><span><i style="background:var(--trigo-claro);border-color:var(--trigo)"></i>Preferencial</span><span><i style="box-shadow:inset 3px 0 0 var(--barro)"></i>Derivado</span><span>Después, por orden de llegada</span></div>
        <div class="ventanillas">${ventanillas}</div>
        <div class="relato">
          <span class="etiqueta">Qué está pasando</span>
          <ol>${avisos}</ol>
        </div>
      </div>
      <div class="pantalla" aria-label="Pantalla de llamados">
        <div class="bloque-titulo"><h3>3. Pantalla de llamados</h3><span>sala de espera</span></div>
        <div class="llamado-grande${ultimo && ultimo.n === s.n ? " destello" : ""}"><span class="codigo">${ultimo ? ultimo.codigo : "— — —"}</span><div class="donde">${ultimo ? `→ ${ultimo.ventanilla}` : "Esperando el primer llamado"}</div></div>
        <ul class="recientes">${recientes}</ul>
        <div class="marquesina" aria-hidden="true"><span>Bienvenido a la Municipalidad · Los turnos preferenciales son para adultos mayores, gestantes, personas con discapacidad y con niños en brazos · Espere su turno en esta pantalla</span></div>
      </div>
    </div>
    <div class="totales">
      <span>Turnos entregados <b>${s.emitidos}</b></span><span>Atendidos <b>${s.atendidos}</b></span><span>En espera <b>${s.cola.length}</b></span>
      <button type="button" class="boton sim-pausa" style="margin-left:auto">${andando ? "Pausar" : "Continuar"}</button>
    </div>`;
}

// Monta la sala en el elemento dado. Solo avanza mientras está en pantalla.
export function montarSimulador(el, { autoplay = true } = {}) {
  let s = inicial();
  let paso = 1;
  let andando = autoplay;
  let visible = false;
  let reloj = null;
  const vistos = new Set(); // turnos que ya se dibujaron en la cola (para animar solo los nuevos)
  // La marquesina no se vuelve a crear en cada paso: así su texto corre sin cortes.
  const pintar = () => {
    const teniaFoco = document.activeElement?.classList.contains("sim-pausa") && el.contains(document.activeElement);
    const marquesina = el.querySelector(".marquesina");
    el.innerHTML = vista(s, andando, vistos);
    if (marquesina) el.querySelector(".marquesina").replaceWith(marquesina);
    if (teniaFoco) el.querySelector(".sim-pausa").focus();
  };
  const tic = () => {
    const accion = siguientePaso(s, paso++);
    if (!accion) return;
    s = reductor(s, accion);
    pintar();
  };
  const ajustar = () => {
    const debe = andando && visible;
    if (debe && !reloj) reloj = setInterval(tic, PASO_MS);
    if (!debe && reloj) {
      clearInterval(reloj);
      reloj = null;
    }
  };
  el.addEventListener("click", (e) => {
    if (!e.target.closest(".sim-pausa")) return;
    andando = !andando;
    pintar();
    ajustar();
  });
  const ver = new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    ajustar();
  });
  ver.observe(el);
  pintar();
  return () => {
    ver.disconnect();
    clearInterval(reloj);
  };
}
