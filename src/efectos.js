// Parallax y luz en movimiento para los elementos visuales de la página general.
//   [data-parallax="60"]  el elemento se desplaza hasta ±60 px según por dónde va en la pantalla
//                         (negativo: en sentido contrario, para que texto e imagen se crucen)
//   <i class="luz">       capa de luz sobre una imagen: se mueve sola (CSS) y un foco sigue al puntero
export function montarEfectos(raiz, { quieto = false } = {}) {
  if (quieto) return;
  const capas = [...raiz.querySelectorAll("[data-parallax]")].map((el) => ({ el, k: Number(el.dataset.parallax) || 60, marco: el.closest("section") ?? el }));
  let pendiente = false;
  const pintar = () => {
    pendiente = false;
    const vh = innerHeight;
    for (const { el, k, marco } of capas) {
      // Se mide el marco (la sección), no la capa: así el propio desplazamiento no altera la medida.
      const r = marco.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) continue;
      const centro = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2); // -1 … 1
      el.style.setProperty("--py", `${(-centro * k).toFixed(1)}px`);
    }
  };
  const pedir = () => {
    if (pendiente) return;
    pendiente = true;
    requestAnimationFrame(pintar);
  };
  addEventListener("scroll", pedir, { passive: true });
  addEventListener("resize", pedir);
  pintar();

  if (!matchMedia("(hover: hover)").matches) return;
  for (const luz of raiz.querySelectorAll(".luz")) {
    const caja = luz.parentElement;
    caja.addEventListener("pointermove", (e) => {
      const r = caja.getBoundingClientRect();
      luz.style.setProperty("--mx", `${(((e.clientX - r.left) / r.width) * 100).toFixed(1)}%`);
      luz.style.setProperty("--my", `${(((e.clientY - r.top) / r.height) * 100).toFixed(1)}%`);
      luz.classList.add("sigue");
    });
    caja.addEventListener("pointerleave", () => luz.classList.remove("sigue"));
  }
}
