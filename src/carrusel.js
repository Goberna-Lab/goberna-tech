// Servicios: cada eje (pestaña) es un carrusel horizontal de tarjetas.
//
// La pista es la propia lista (.g-svc-lista) con scroll horizontal y encaje (scroll-snap, en home.css): en
// escritorio se ven 3 tarjetas y, si hay más, asoma la 4.ª; en tableta 1,6; en el celular 1,1. Aquí se agregan:
//   · Cabecera: el contador ("01 / 05") y las flechas anterior/siguiente, que se apagan en los extremos. Si las
//     tarjetas entran todas, no hay controles.
//   · Barra de progreso: qué parte de la pista se ve y dónde.
//   · Arrastre con el mouse (en táctiles ya se desliza solo): al soltar, encaja en la tarjeta más cercana. Si se
//     arrastró, el clic que sigue no abre el enlace que quedó debajo.
//   · Un fundido en el borde derecho mientras quedan tarjetas por ver.
// Sin JavaScript la lista se ve como grilla (home.css). Con "reducir movimiento" los saltos son instantáneos.

const FLECHA = (d) =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${d === "ant" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"}"/></svg>`;
const dos = (n) => String(n).padStart(2, "0");

export function montarCarrusel(panel, { quieto = false } = {}) {
  const pista = panel.querySelector(".g-svc-lista");
  if (!pista) return;
  const tarjetas = [...pista.children];
  const nombre = panel.querySelector(".g-svc-eje")?.textContent.trim() ?? "Servicios";

  // Cabecera: la intro del eje (si tiene) a la izquierda y los controles a la derecha.
  const cab = document.createElement("div");
  cab.className = "g-car-cab";
  const intro = panel.querySelector(".g-svc-intro");
  if (intro) cab.append(intro);
  const nav = document.createElement("div");
  nav.className = "g-car-nav";
  nav.innerHTML = `
    <p class="g-car-cuenta" aria-hidden="true"><b>01</b> / ${dos(tarjetas.length)}</p>
    <button class="g-car-btn" type="button" data-dir="-1" aria-label="Servicio anterior">${FLECHA("ant")}</button>
    <button class="g-car-btn" type="button" data-dir="1" aria-label="Servicio siguiente">${FLECHA("sig")}</button>`;
  cab.append(nav);
  pista.before(cab);
  const barra = document.createElement("div");
  barra.className = "g-car-barra";
  barra.setAttribute("aria-hidden", "true");
  barra.innerHTML = "<span></span>";
  pista.after(barra);

  pista.setAttribute("tabindex", "0"); // con el foco, las flechas del teclado la desplazan
  pista.setAttribute("aria-label", `${nombre}: servicios`);
  const cuenta = nav.querySelector("b");
  const [ant, sig] = nav.querySelectorAll("button");
  const tramo = barra.firstElementChild;

  const paso = () => {
    const a = tarjetas[0]?.getBoundingClientRect();
    const b = tarjetas[1]?.getBoundingClientRect();
    return a && b ? b.left - a.left : pista.clientWidth;
  };
  const indice = () => Math.round(pista.scrollLeft / Math.max(paso(), 1));
  const ir = (i) => {
    const max = pista.scrollWidth - pista.clientWidth;
    pista.scrollTo({ left: Math.min(Math.max(i * paso(), 0), max), behavior: quieto ? "instant" : "smooth" });
  };

  function pintar() {
    const max = pista.scrollWidth - pista.clientWidth;
    const desliza = max > 2;
    panel.classList.toggle("g-car-desliza", desliza);
    if (!desliza) return;
    const x = pista.scrollLeft;
    ant.disabled = x <= 2;
    sig.disabled = x >= max - 2;
    pista.classList.toggle("g-car-hay-mas", x < max - 2);
    // El contador muestra la última tarjeta que se ve entera.
    const visibles = Math.max(1, Math.floor((pista.clientWidth + 4) / paso()));
    cuenta.textContent = dos(Math.min(tarjetas.length, (x >= max - 2 ? tarjetas.length : indice() + visibles)));
    tramo.style.left = `${(x / pista.scrollWidth) * 100}%`;
    tramo.style.width = `${(pista.clientWidth / pista.scrollWidth) * 100}%`;
  }

  nav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dir]");
    if (b) ir(indice() + Number(b.dataset.dir));
  });
  pista.addEventListener("scroll", () => requestAnimationFrame(pintar), { passive: true });
  new ResizeObserver(pintar).observe(pista); // también al mostrarse su pestaña (antes medía 0)

  /* Arrastre con el mouse */
  let arrastre = null;
  let sinClic = false;
  pista.addEventListener("dragstart", (e) => e.preventDefault()); // enlaces e imágenes no se "arrastran"
  pista.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !panel.classList.contains("g-car-desliza")) return;
    arrastre = { id: e.pointerId, x: e.clientX, desde: pista.scrollLeft, movido: false };
  });
  pista.addEventListener("pointermove", (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const dx = e.clientX - arrastre.x;
    if (!arrastre.movido) {
      if (Math.abs(dx) < 6) return;
      arrastre.movido = true;
      pista.setPointerCapture(e.pointerId);
      pista.classList.add("g-car-arrastrando");
    }
    pista.scrollLeft = arrastre.desde - dx;
  });
  const soltar = (e) => {
    if (!arrastre || e.pointerId !== arrastre.id) return;
    const { movido, desde } = arrastre;
    arrastre = null;
    if (!movido) return;
    pista.classList.remove("g-car-arrastrando");
    // Encaja en la tarjeta más cercana, con un empujón hacia donde se arrastró.
    const p = paso();
    const avance = (pista.scrollLeft - desde) / p;
    const base = desde / p;
    ir(Math.round(base + avance + Math.sign(avance) * 0.25));
    sinClic = true;
    setTimeout(() => (sinClic = false), 0);
  };
  pista.addEventListener("pointerup", soltar);
  pista.addEventListener("pointercancel", soltar);
  pista.addEventListener(
    "click",
    (e) => {
      if (!sinClic) return;
      e.preventDefault();
      e.stopPropagation();
    },
    true,
  );

  pintar();
}
