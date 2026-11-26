// "Conocimiento que acompaña": los cuatro niveles de gobierno (nacional, regional, provincial y distrital) en una
// pirámide de placas isométricas, una por nivel, con la grilla cada vez más fina hacia abajo (el territorio que se
// fragmenta). Un hilo dorado las atraviesa: el acompañamiento. Cada placa tiene al lado su etiqueta: quién es
// atendido en ese nivel y cuántos gobiernos hay. El dibujo y el movimiento son CSS (home.css, "2. Conocimiento").
//
// Aquí solo se elige qué nivel está encendido: se recorren solos, uno cada RITMO ms, mientras la figura está en
// pantalla; al pasar el mouse (o el dedo) por una etiqueta o una placa se enciende esa y el recorrido se detiene
// hasta salir. Con "reducir movimiento" no hay recorrido: se enciende la que se señala.

const RITMO = 3200;

export function montarNiveles(figura, { quieto = false } = {}) {
  if (!figura) return;
  const placas = [...figura.querySelectorAll(".g-niv-placa")];
  const items = [...figura.querySelectorAll(".g-niv-lista li")];
  let activo = 0;
  let reloj = 0;
  let visible = false;
  let encima = false;

  const encender = (i) => {
    activo = i;
    figura.style.setProperty("--activo", i);
    placas.forEach((p, j) => p.classList.toggle("es-activa", j === i));
    items.forEach((li, j) => li.classList.toggle("es-activo", j === i));
  };
  const seguir = () => {
    clearInterval(reloj);
    reloj = 0;
    if (!quieto && visible && !encima && !document.hidden) reloj = setInterval(() => encender((activo + 1) % items.length), RITMO);
  };

  // Señalar un nivel: por su etiqueta o por su placa.
  const señalar = (i) => {
    encima = true;
    encender(i);
    seguir();
  };
  items.forEach((li, i) => li.addEventListener("pointerenter", () => señalar(i)));
  placas.forEach((p, i) => p.addEventListener("pointerenter", () => señalar(i)));
  figura.addEventListener("pointerleave", () => {
    encima = false;
    seguir();
  });

  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    seguir();
  }).observe(figura);
  document.addEventListener("visibilitychange", seguir);
  encender(0);
}
