// Recorrido en 3D al bajar por la página, con las pantallas reales del sistema.
// Cada captura entra girando cuando llega la cámara, se queda de frente llenando el espacio libre y
// muestra puntos numerados que señalan lo que se puede hacer en esa pantalla; luego sale girando y la
// cámara vuela a la siguiente.
// (Tomado de componentes/Vuelo3D.tsx de las presentaciones de Ticketera y SGTI; aquí va sin React.)
import * as THREE from "three";

const DISTANCIA = 10; // separación en profundidad entre una pantalla y la siguiente
const QUIETO = 0.6; // parte del scroll de cada paso en que la cámara se queda frente a la pantalla

// escenas: [{ src, titulo, texto, ancho, alto, celular?, puntos?: [{ x, y, texto, lado? }] }]  (x, y: fracción de la imagen)
// tema: { fondo, marco, puntos: [colores], rejilla? }
// arriba(): alto en px que tapan las barras fijas de la web (la captura se acomoda debajo)
export function montarVuelo(caja, { escenas, tema, etiqueta, sinMovimiento = false, arriba = () => 0 }) {
  const n = escenas.length;
  caja.className = "vuelo";
  caja.style.height = `${n * 80 + 100}vh`;
  caja.setAttribute("aria-label", etiqueta);
  caja.innerHTML = `
    <div class="vuelo-fijo">
      <div class="vuelo-lienzo" aria-hidden="true"></div>
      <div class="vuelo-cargando">Cargando el recorrido…</div>
      <div class="vuelo-marcas"></div>
      <div class="vuelo-texto"></div>
      <nav class="vuelo-puntos" aria-label="Pasos del recorrido">${escenas
        .map((x, i) => `<button type="button" data-paso="${i}" aria-label="Ir al paso ${i + 1}: ${x.titulo}"></button>`)
        .join("")}</nav>
    </div>`;
  const contenedor = caja.querySelector(".vuelo-lienzo");
  const cargando = caja.querySelector(".vuelo-cargando");
  const capa = caja.querySelector(".vuelo-marcas");
  const cajaTexto = caja.querySelector(".vuelo-texto");
  const botones = [...caja.querySelectorAll(".vuelo-puntos button")];
  let marcas = [];

  // Texto y señales del paso activo. Se vuelven a crear en cada cambio para que su animación de entrada se repita.
  let nodoTexto = cajaTexto;
  const htmlTexto = (i) => {
    const e = escenas[i];
    const puntos = e.puntos ?? [];
    return `<span class="vuelo-paso">${String(i + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}</span><h3>${e.titulo}</h3><p>${e.texto}</p>${
      puntos.length ? `<ol class="vuelo-lista">${puntos.map((p) => `<li>${p.texto}</li>`).join("")}</ol>` : ""
    }${i === 0 ? `<p class="vuelo-sigue">Baje para seguir el recorrido</p>` : ""}`;
  };
  // El panel de texto mide lo mismo en todos los pasos (el del más largo): así no salta al cambiar
  // de paso y la captura se encuadra siempre en el sitio que el panel deja libre.
  const medirTexto = () => {
    const prueba = nodoTexto.cloneNode(false);
    prueba.style.cssText = "visibility:hidden;animation:none;pointer-events:none;min-height:0";
    nodoTexto.after(prueba);
    let alto = 0;
    escenas.forEach((_, i) => {
      prueba.innerHTML = htmlTexto(i);
      alto = Math.max(alto, prueba.offsetHeight);
    });
    prueba.remove();
    caja.style.setProperty("--alto-texto", alto + "px");
  };
  function setActiva(i) {
    const e = escenas[i];
    const puntos = e.puntos ?? [];
    const texto = nodoTexto.cloneNode(false);
    texto.innerHTML = htmlTexto(i);
    nodoTexto.replaceWith(texto);
    nodoTexto = texto;
    capa.innerHTML = puntos
      .map((p, m) => {
        const izq = (p.lado ?? (p.x > 0.62 ? "izquierda" : "derecha")) === "izquierda";
        return `<div class="vuelo-marca${izq ? " izquierda" : ""}" style="--retraso:${0.25 + m * 0.35}s"><span class="vuelo-marca-num">${m + 1}</span><span class="vuelo-marca-texto">${p.texto}</span></div>`;
      })
      .join("");
    marcas = [...capa.children];
    botones.forEach((b, k) => b.setAttribute("aria-current", String(k === i)));
  }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true });
  } catch {
    // Sin WebGL no hay recorrido: las mismas pantallas se ven más abajo, en "Cómo funciona".
    caja.hidden = true;
    return () => {};
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(contenedor.clientWidth, contenedor.clientHeight);
  contenedor.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  escena.background = new THREE.Color(tema.fondo);
  const niebla = new THREE.Fog(tema.fondo, 9, 18);
  escena.fog = niebla;
  const camara = new THREE.PerspectiveCamera(45, contenedor.clientWidth / contenedor.clientHeight, 0.1, 100);

  const manager = new THREE.LoadingManager(() => (cargando.hidden = true));
  const cargador = new THREE.TextureLoader(manager);
  const geometrias = [];
  const materiales = [];
  const texturas = [];
  const paneles = [];
  escenas.forEach((e, i) => {
    const ancho = e.celular ? 2.4 : 6;
    const alto = ancho * (e.alto / e.ancho);
    const lado = i % 2 === 0 ? -1 : 1;
    const grupo = new THREE.Group();
    const base = new THREE.Vector3(lado * 4.5, ((i % 3) - 1) * 0.6, -i * DISTANCIA);
    grupo.position.copy(base);

    const textura = cargador.load(e.src);
    textura.colorSpace = THREE.SRGBColorSpace;
    textura.anisotropy = renderer.capabilities.getMaxAnisotropy();
    texturas.push(textura);
    const gPantalla = new THREE.PlaneGeometry(ancho, alto);
    const mPantalla = new THREE.MeshBasicMaterial({ map: textura, toneMapped: false });
    grupo.add(new THREE.Mesh(gPantalla, mPantalla));

    const borde = e.celular ? 0.12 : 0.06;
    const gMarco = new THREE.PlaneGeometry(ancho + borde * 2, alto + borde * 2);
    const mMarco = new THREE.MeshBasicMaterial({ color: tema.marco });
    const marco = new THREE.Mesh(gMarco, mMarco);
    marco.position.z = -0.01;
    grupo.add(marco);

    geometrias.push(gPantalla, gMarco);
    materiales.push(mPantalla, mMarco);
    escena.add(grupo);
    paneles.push({ grupo, ancho, alto, base, lado });
  });

  // Polvo de luz alrededor del camino
  const cuantos = 900;
  const pos = new Float32Array(cuantos * 3);
  const col = new Float32Array(cuantos * 3);
  const c = new THREE.Color();
  const largo = n * DISTANCIA + 14;
  for (let i = 0; i < cuantos; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 30;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 16;
    pos[i * 3 + 2] = 8 - Math.random() * largo;
    c.set(tema.puntos[i % tema.puntos.length]);
    col.set([c.r, c.g, c.b], i * 3);
  }
  const gPolvo = new THREE.BufferGeometry();
  gPolvo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  gPolvo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mPolvo = new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0.8, depthWrite: false });
  const polvo = new THREE.Points(gPolvo, mPolvo);
  escena.add(polvo);
  geometrias.push(gPolvo);
  materiales.push(mPolvo);

  if (tema.rejilla) {
    const rejilla = new THREE.GridHelper(80, 80, tema.rejilla, tema.rejilla);
    rejilla.position.set(0, -4.5, -largo / 2 + 8);
    rejilla.material.transparent = true;
    rejilla.material.opacity = 0.3;
    escena.add(rejilla);
    geometrias.push(rejilla.geometry);
    materiales.push(rejilla.material);
  }

  // Zona libre de la pantalla donde debe caber la captura (fracciones del ancho y del alto).
  // El borde superior deja sitio a las barras fijas de la web.
  const zonaLibre = (w, h) => {
    const y0 = Math.max(w > 980 ? 0.11 : 0.1, (arriba() + 14) / h);
    const marco = contenedor.getBoundingClientRect();
    const panel = nodoTexto.getBoundingClientRect();
    // texto a la izquierda: la captura empieza donde termina el panel
    if (w > 980) return { x0: Math.max(0.3, (panel.right - marco.left + 28) / w), x1: 0.965, y0, y1: 0.95 };
    // texto abajo: la captura termina donde empieza el panel
    const libre = (h - Math.max(panel.height, parseFloat(caja.style.getPropertyValue("--alto-texto")) || 0) - (marco.bottom - panel.bottom) - 14) / h;
    return { x0: 0.03, x1: 0.97, y0, y1: Math.max(y0 + 0.22, Math.min(0.66, libre)) };
  };

  // Posición de la cámara frente a cada pantalla: de frente, a la distancia que la hace caber en la
  // zona libre, y corrida para que la pantalla quede centrada en esa zona
  const estaciones = paneles.map(() => ({ desde: new THREE.Vector3(), mira: new THREE.Vector3() }));
  const calcularEstaciones = () => {
    const w = contenedor.clientWidth;
    const h = contenedor.clientHeight;
    const z = zonaLibre(w, h);
    const tan = Math.tan(THREE.MathUtils.degToRad(camara.fov / 2));
    const aspecto = w / h;
    const fracW = (z.x1 - z.x0) * 0.95;
    const fracH = (z.y1 - z.y0) * 0.95;
    const centroX = (z.x0 + z.x1) / 2 - 0.5;
    const centroY = 0.5 - (z.y0 + z.y1) / 2;
    paneles.forEach((p, i) => {
      const d = Math.max(p.alto / (fracH * 2 * tan), p.ancho / (fracW * 2 * tan * aspecto));
      const cx = p.base.x - centroX * 2 * d * tan * aspecto;
      const cy = p.base.y - centroY * 2 * d * tan;
      estaciones[i].desde.set(cx, cy, p.base.z + d);
      estaciones[i].mira.set(cx, cy, p.base.z);
    });
  };

  let progreso = 0;
  let aLaVista = true;
  const leerScroll = () => {
    const r = caja.getBoundingClientRect();
    const total = r.height - innerHeight;
    progreso = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : 0;
    aLaVista = r.bottom > 0 && r.top < innerHeight;
  };

  const raton = new THREE.Vector2();
  const ratonSuave = new THREE.Vector2();
  const alMover = (e) => raton.set((e.clientX / innerWidth - 0.5) * 2, (e.clientY / innerHeight - 0.5) * 2);

  // Estado reutilizado en cada cuadro (sin crear objetos nuevos)
  const objetivoPos = new THREE.Vector3();
  const objetivoMira = new THREE.Vector3();
  const miraActual = new THREE.Vector3();
  const punto3d = new THREE.Vector3();
  const suave = (x) => x * x * x * (x * (x * 6 - 15) + 10);
  let posicion = 0; // dónde está la cámara en el camino: 0 = primera pantalla, 1 = segunda…
  let viaje = 0; // 0 quieta, 1 a mitad del viaje
  let enParada = 0; // cuánto avanzó la parada actual (0 a 1)
  let direccion = 1;
  const ubicar = () => {
    const f = Math.min(n - 1e-6, progreso * n);
    const i = Math.floor(f);
    const resto = f - i;
    const t = i >= n - 1 ? 0 : suave(Math.min(1, Math.max(0, (resto - QUIETO) / (1 - QUIETO))));
    enParada = Math.min(1, resto / QUIETO);
    posicion = i + t;
    viaje = Math.sin(t * Math.PI);
    const a = estaciones[i];
    const b = estaciones[Math.min(n - 1, i + 1)];
    direccion = Math.sign(b.desde.x - a.desde.x) || 1;
    objetivoPos.lerpVectors(a.desde, b.desde, t);
    objetivoMira.lerpVectors(a.mira, b.mira, t);
    // Mientras está quieta, la cámara se acerca despacio (sensación de "zoom" continuo)
    const empuje = t === 0 ? (1 - enParada) * 0.9 : 0;
    objetivoPos.z += viaje * 3.2 + empuje;
    // y se desliza un poco de lado
    objetivoPos.x += Math.sin(enParada * Math.PI) * 0.25 * (i % 2 === 0 ? 1 : -1) * (t === 0 ? 1 : 0);
    const d = objetivoPos.z - objetivoMira.z;
    niebla.near = d + 0.5;
    niebla.far = d + 7;
    return t > 0.5 ? i + 1 : i;
  };

  const alRedimensionar = () => {
    const w = contenedor.clientWidth;
    const h = contenedor.clientHeight;
    if (!w || !h) return;
    camara.aspect = w / h;
    camara.fov = w < h ? 55 : 45;
    camara.updateProjectionMatrix();
    renderer.setSize(w, h);
    medirTexto();
    calcularEstaciones();
  };
  alRedimensionar();
  document.fonts?.ready.then(() => contenedor.isConnected && alRedimensionar());
  leerScroll();
  ubicar();
  camara.position.copy(objetivoPos);
  miraActual.copy(objetivoMira);
  camara.lookAt(miraActual);

  const timer = new THREE.Timer();
  timer.connect(document);
  let ultimaActiva = -1;
  renderer.setAnimationLoop(() => {
    timer.update();
    if (!aLaVista) return; // fuera de pantalla no se dibuja
    const dt = Math.min(timer.getDelta(), 0.05);
    const tt = timer.getElapsed();
    const idx = ubicar();
    if (idx !== ultimaActiva) {
      ultimaActiva = idx;
      setActiva(idx);
    }
    const k = sinMovimiento ? 1 : 1 - Math.pow(0.0008, dt);
    ratonSuave.lerp(raton, sinMovimiento ? 0 : 1 - Math.pow(0.02, dt));
    camara.position.lerp(objetivoPos, k);
    miraActual.lerp(objetivoMira, k);
    camara.lookAt(miraActual);
    // Se inclina en las curvas del viaje
    if (!sinMovimiento) camara.rotateZ(viaje * 0.07 * direccion);

    // Cada pantalla gira al entrar y al salir, y la que se mira sigue un poco al mouse
    for (let j = 0; j < paneles.length; j++) {
      const p = paneles[j];
      const delta = Math.max(-1.2, Math.min(1.2, j - posicion)); // >0 aún no llega, <0 ya pasó
      const activaJ = Math.abs(delta) < 0.5;
      const giro = sinMovimiento ? 0 : delta * 0.55 * -p.lado;
      p.grupo.rotation.y = giro + (activaJ && !sinMovimiento ? ratonSuave.x * 0.06 + Math.sin(tt * 0.45 + j) * 0.015 : 0);
      p.grupo.rotation.x = activaJ && !sinMovimiento ? ratonSuave.y * 0.04 : 0;
      p.grupo.position.y = p.base.y + (sinMovimiento ? 0 : Math.sin(tt * 0.5 + j) * 0.04);
      p.grupo.scale.setScalar(1 - Math.min(1, Math.abs(delta)) * 0.12);
    }
    polvo.rotation.z = sinMovimiento ? 0 : tt * 0.01;
    renderer.render(escena, camara);

    // Puntos que señalan lo que se puede hacer: se ubican sobre la captura proyectando su posición 3D
    capa.style.opacity = viaje < 0.08 && ultimaActiva >= 0 ? "1" : "0";
    const p = paneles[ultimaActiva];
    const lista = escenas[ultimaActiva]?.puntos ?? [];
    const w = contenedor.clientWidth;
    const h = contenedor.clientHeight;
    for (let m = 0; m < lista.length; m++) {
      const el = marcas[m];
      if (!el || !p) continue;
      punto3d.set((lista[m].x - 0.5) * p.ancho, (0.5 - lista[m].y) * p.alto, 0.02);
      p.grupo.localToWorld(punto3d);
      punto3d.project(camara);
      el.style.transform = `translate(${((punto3d.x + 1) / 2) * w}px, ${((1 - punto3d.y) / 2) * h}px)`;
    }
  });

  const irA = (i) => {
    const total = caja.offsetHeight - innerHeight;
    const top = caja.getBoundingClientRect().top + scrollY;
    scrollTo({ top: top + total * ((i + QUIETO * 0.7) / n), behavior: sinMovimiento ? "instant" : "smooth" });
  };
  const alPulsar = (e) => {
    const b = e.target.closest("[data-paso]");
    if (b) irA(Number(b.dataset.paso));
  };
  caja.addEventListener("click", alPulsar);
  addEventListener("scroll", leerScroll, { passive: true });
  addEventListener("resize", alRedimensionar);
  addEventListener("pointermove", alMover);

  return () => {
    caja.removeEventListener("click", alPulsar);
    removeEventListener("scroll", leerScroll);
    removeEventListener("resize", alRedimensionar);
    removeEventListener("pointermove", alMover);
    renderer.setAnimationLoop(null);
    timer.dispose();
    texturas.forEach((t) => t.dispose());
    geometrias.forEach((g) => g.dispose());
    materiales.forEach((m) => m.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    renderer.domElement.remove();
  };
}
