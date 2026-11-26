// "Misión" y "Visión": cada frase se enciende palabra por palabra mientras se baja, al ritmo en que se lee.
//   · Cada palabra va en un <span class="p">; al encenderse recibe la clase "on" y el CSS hace el
//     cambio de color (home.css). Solo se toca una clase por palabra cuando de verdad cambia.
//   · El cálculo corre únicamente con el bloque a la vista, y a lo sumo una vez por cuadro.
//   · Con "reducir movimiento" el texto queda entero encendido, sin animación.
// El texto sigue siendo texto normal (los lectores de pantalla lo leen de corrido).

// Envuelve cada palabra de un nodo en un <span class="p">, conservando el énfasis (<em>) y los espacios.
function envolver(nodo, palabras) {
  for (const hijo of [...nodo.childNodes]) {
    if (hijo.nodeType === Node.TEXT_NODE) {
      const trozos = hijo.nodeValue.split(/(\s+)/);
      const pieza = document.createDocumentFragment();
      for (const t of trozos) {
        if (!t) continue;
        if (/^\s+$/.test(t)) {
          pieza.append(t);
          continue;
        }
        const span = document.createElement("span");
        span.className = "p";
        span.textContent = t;
        pieza.append(span);
        palabras.push(span);
      }
      hijo.replaceWith(pieza);
    } else if (hijo.nodeType === Node.ELEMENT_NODE) envolver(hijo, palabras);
  }
}

export function montarCredo(seccion, { quieto = false } = {}) {
  if (!seccion) return;
  const bloques = [...seccion.querySelectorAll("[data-credo]")].map((el) => {
    const texto = el.querySelector(".g-credo-txt");
    const palabras = [];
    envolver(texto, palabras);
    return { texto, palabras, encendidas: 0, visible: false };
  });

  if (quieto) {
    for (const b of bloques) for (const p of b.palabras) p.classList.add("on");
    return;
  }

  let pendiente = false;
  function calcular() {
    pendiente = false;
    const alto = innerHeight;
    for (const b of bloques) {
      if (!b.visible) continue;
      const r = b.texto.getBoundingClientRect();
      // Empieza a encenderse cuando el texto asoma por abajo (a 86 % de la pantalla) y termina cuando su
      // final llega a la mitad de la pantalla.
      const avance = Math.min(Math.max((alto * 0.86 - r.top) / (alto * 0.34 + r.height), 0), 1);
      // Un poco antes del final ya están todas encendidas: la última palabra no queda a oscuras.
      const n = Math.min(b.palabras.length, Math.round(avance * 1.08 * b.palabras.length));
      if (n === b.encendidas) continue;
      const enciende = n > b.encendidas;
      for (let i = Math.min(n, b.encendidas); i < Math.max(n, b.encendidas); i++) b.palabras[i].classList.toggle("on", enciende);
      b.encendidas = n;
    }
  }
  const pedir = () => {
    if (!pendiente) {
      pendiente = true;
      requestAnimationFrame(calcular);
    }
  };

  const vigia = new IntersectionObserver(
    (entradas) => {
      for (const en of entradas) bloques.find((b) => b.texto === en.target.querySelector(".g-credo-txt")).visible = en.isIntersecting;
      pedir();
    },
    { rootMargin: "120px 0px" },
  );
  seccion.querySelectorAll("[data-credo]").forEach((el) => vigia.observe(el));
  addEventListener("scroll", pedir, { passive: true });
  addEventListener("resize", pedir);
}
