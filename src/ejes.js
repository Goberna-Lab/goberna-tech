// Página de servicios (#nuestros-servicios), según el diseño de Adobe XD de la interna: cada eje es un bloque con un
// servicio a la vez (texto a la izquierda, foto a la derecha) y una foto por servicio.
//
// Aquí se agrega, por eje:
//   · La navegación bajo el servicio: una barra con un tramo por servicio (el actual en oro), el contador
//     ("01 / 05"), el nombre del siguiente servicio ("Fin de este eje" en el último) y las flechas anterior/siguiente,
//     que se apagan en los extremos.
//   · El cambio de servicio: el texto y la foto se funden de uno al otro; el pie de la foto dice su número.
//   · Flechas del teclado (con el foco dentro del eje) y deslizamiento del dedo sobre la foto o el texto.
// Cada bloque expone irA(i) para que el enrutado (home.js) abra un servicio concreto (#editorial, #campana-360…).
// Sin JavaScript se ven todos los servicios uno debajo del otro (home.css). Con "reducir movimiento", sin fundidos.

const FLECHA = (izq) => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${izq ? "M19 12H5M11 6l-6 6 6 6" : "M5 12h14M13 6l6 6-6 6"}"/></svg>`;
const dos = (n) => String(n).padStart(2, "0");
const titulo = (li) => li.querySelector("h3").textContent.replace(/^\s*\d+\.\s*/, "").trim();

export function montarEjes(pagina) {
  for (const sec of pagina.querySelectorAll("[data-eje]")) montarEje(sec);
}

function montarEje(sec) {
  const servicios = [...sec.querySelectorAll(".g-ejed-svc")];
  const fotos = [...sec.querySelectorAll(".g-ejed-foto img")];
  const pieFoto = sec.querySelector(".g-ejed-foto figcaption b");
  const n = servicios.length;
  sec.classList.add("g-ejed-js");

  const nav = document.createElement("div");
  nav.className = "g-ejed-nav";
  nav.innerHTML = `
    <div class="g-ejed-barra" aria-hidden="true">${servicios.map(() => "<span></span>").join("")}</div>
    <div class="g-ejed-pie">
      <p class="g-ejed-cuenta"><b>01</b> / ${dos(n)}</p>
      <p class="g-ejed-sig"><small>Siguiente</small><span></span></p>
      <div class="g-ejed-btns">
        <button class="g-ejed-btn" type="button" data-dir="-1" aria-label="Servicio anterior">${FLECHA(true)}</button>
        <button class="g-ejed-btn g-ejed-btn-sig" type="button" data-dir="1" aria-label="Servicio siguiente">${FLECHA(false)}</button>
      </div>
    </div>`;
  sec.querySelector(".g-ejed-lista").after(nav);
  const tramos = [...nav.querySelectorAll(".g-ejed-barra span")];
  const cuenta = nav.querySelector(".g-ejed-cuenta b");
  const siguiente = nav.querySelector(".g-ejed-sig span");
  const [ant, sig] = nav.querySelectorAll("button");
  let actual = -1;

  function irA(i) {
    i = Math.min(Math.max(i, 0), n - 1);
    if (i === actual) return;
    actual = i;
    servicios.forEach((li, j) => {
      li.classList.toggle("es-activo", j === i);
      li.inert = j !== i; // los ocultos no reciben foco ni los leen los lectores de pantalla
    });
    fotos.forEach((img, j) => {
      img.classList.toggle("es-activa", j === i);
      if (Math.abs(j - i) <= 1) img.loading = "eager"; // la vecina ya cargada: el cambio no parpadea
    });
    tramos.forEach((t, j) => t.classList.toggle("es-activo", j === i));
    cuenta.textContent = dos(i + 1);
    if (pieFoto) pieFoto.textContent = dos(i + 1);
    siguiente.textContent = i < n - 1 ? titulo(servicios[i + 1]) : "Fin de este eje";
    ant.disabled = i === 0;
    sig.disabled = i === n - 1;
  }
  sec.irA = irA;

  nav.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dir]");
    if (b) irA(actual + Number(b.dataset.dir));
  });
  sec.addEventListener("keydown", (e) => {
    if (e.target.closest("input, textarea, select")) return;
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (!d) return;
    e.preventDefault();
    irA(actual + d);
  });

  // Deslizar el dedo (de lado) sobre el bloque.
  let toque = null;
  sec.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse") return;
    toque = { x: e.clientX, y: e.clientY };
  });
  sec.addEventListener("pointerup", (e) => {
    if (!toque) return;
    const dx = e.clientX - toque.x;
    const dy = e.clientY - toque.y;
    toque = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) irA(actual + (dx < 0 ? 1 : -1));
  });
  sec.addEventListener("pointercancel", () => (toque = null));

  irA(0);
}
