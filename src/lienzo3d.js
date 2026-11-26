// Base común de las escenas 3D de la página (three.js). Cada escena aporta su mundo (scene, camera,
// uniformes) y esta base se ocupa de lo demás, cuidando que pese poco:
//   · Lienzo transparente compuesto como una capa normal, sin modos de mezcla: cada punto lleva
//     como opacidad su canal más brillante. Sobre el fondo oscuro de la página se ve como luz que
//     se suma, y es un dato válido para cualquier navegador y pantalla (antes salía con opacidad 0
//     y color encima: en pantallas de color amplio, Chrome lo descartaba al hacer scroll).
//   · La escena se dibuja UNA vez por cuadro, a una textura. Cada material deja en el canal alfa
//     cuánto resplandece ese punto (0 nada … 1 todo); de ahí sale el resplandor (bloom), reducido
//     y desenfocado en cadena. Una única pasada final junta escena + resplandor, aplica el
//     fundido que define cada escena (función GLSL `fundido(uv)`) y manda el resultado al lienzo.
//   · Resolución con tope: nunca más píxeles de los que hacen falta, por grande que sea la
//     ventana. Si aun así la tarjeta gráfica tarda, se baja sola (se mide el tiempo real de
//     dibujo cuando el navegador lo permite).
//   · Opcional, por escena: antialiasing (muestras) y un rango de luz que no se quema
//     (exposicion): la escena se dibuja con más rango y las luces fuertes se comprimen con
//     suavidad en vez de saturarse en un color plano.
//   · Opcional (cubre): la escena tapa lo que tiene detrás donde es opaca (por ejemplo, el cuerpo
//     de un globo tapa las estrellas del fondo). Entonces el alfa de la escena es cuánto cubre y el
//     resplandor sale de lo brillante (umbral), no del alfa.
//   · Como mucho 60 cuadros por segundo, aunque la pantalla sea de 120 Hz.
//   · Solo dibuja con el marco en pantalla y la pestaña visible.
//   · Con `quieto` (reducir movimiento) dibuja un único cuadro, y otro si cambia el tamaño.
import * as THREE from "three";

const PASE_VS = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = position.xy * 0.5 + 0.5;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;
// Desenfoque en cadena ("dual Kawase"): al reducir, 5 muestras; al ampliar, 8.
// La primera reducción toma de la escena solo lo que resplandece (color × alfa).
// Un valor inválido (NaN o infinito) que una tarjeta gráfica deje en la escena se descarta aquí:
// si no, el desenfoque lo esparce y aparece como una mancha negra escalonada.
const SANO = /* glsl */ `
  float sano(float v) { return v >= 0.0 && v < 1e4 ? v : 0.0; }
  vec3 sano(vec3 c) { return vec3(sano(c.r), sano(c.g), sano(c.b)); }
`;
const bajarFS = (primera, cubre) => /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uPaso;
  varying vec2 vUv;
  ${SANO}
  vec3 leer(vec2 uv) {
    vec4 c = texture2D(uTex, uv);
    return ${!primera ? "c.rgb" : cubre ? "max(sano(c.rgb) - 0.2, 0.0) * 1.25" : "sano(c.rgb) * min(sano(c.a), 1.0)"};
  }
  void main() {
    vec3 c = leer(vUv) * 4.0;
    c += leer(vUv - uPaso);
    c += leer(vUv + uPaso);
    c += leer(vUv + vec2(uPaso.x, -uPaso.y));
    c += leer(vUv - vec2(uPaso.x, -uPaso.y));
    gl_FragColor = vec4(c / 8.0, 1.0);
  }
`;
const SUBIR_FS = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uPaso;
  uniform float uFuerza;
  varying vec2 vUv;
  void main() {
    vec2 m = uPaso;
    vec3 c = texture2D(uTex, vUv + vec2(-m.x * 2.0, 0.0)).rgb;
    c += texture2D(uTex, vUv + vec2(-m.x, m.y)).rgb * 2.0;
    c += texture2D(uTex, vUv + vec2(0.0, m.y * 2.0)).rgb;
    c += texture2D(uTex, vUv + vec2(m.x, m.y)).rgb * 2.0;
    c += texture2D(uTex, vUv + vec2(m.x * 2.0, 0.0)).rgb;
    c += texture2D(uTex, vUv + vec2(m.x, -m.y)).rgb * 2.0;
    c += texture2D(uTex, vUv + vec2(0.0, -m.y * 2.0)).rgb;
    c += texture2D(uTex, vUv + vec2(-m.x, -m.y)).rgb * 2.0;
    gl_FragColor = vec4(c / 12.0 * uFuerza, 1.0);
  }
`;
// Pasada final: escena + resplandor, fundido (lo que se apaga vira a azul, no a gris) y un grano
// de menos de un nivel de color para que los degradados oscuros no hagan bandas.
const finalFS = (fundido, cubre) => /* glsl */ `
  uniform sampler2D uEscena;
  uniform sampler2D uResplandor;
  uniform float uFuerza;
  uniform float uExpo;
  varying vec2 vUv;
  ${SANO}
  ${fundido}
  float azar2(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main() {
    vec4 e = texture2D(uEscena, vUv);
    vec3 c = sano(e.rgb) + sano(texture2D(uResplandor, vUv).rgb) * uFuerza;
    if (uExpo > 0.0) c = 1.0 - exp(-c * uExpo); // las luces fuertes se comprimen, no se queman
    float f = clamp(fundido(vUv), 0.0, 1.0);
    c *= f * mix(vec3(0.3, 0.52, 1.0), vec3(1.0), f);
    c = clamp(c + (azar2(gl_FragCoord.xy) - 0.5) / 255.0, 0.0, 1.0);
    float luz = max(c.r, max(c.g, c.b));
    // Color premultiplicado válido: nunca más que la opacidad. Con "cubre", además tapa donde es opaca.
    gl_FragColor = vec4(c, ${cubre ? "max(luz, clamp(sano(e.a), 0.0, 1.0) * f)" : "luz"});
  }
`;

// Mezcla para puntos y halos que suman luz. `resplandece` decide si además alimentan el resplandor.
export const sumaDeLuz = (resplandece) => ({
  transparent: true,
  depthWrite: false,
  blending: THREE.CustomBlending,
  blendSrc: THREE.SrcAlphaFactor,
  blendDst: THREE.OneFactor,
  blendSrcAlpha: resplandece ? THREE.OneFactor : THREE.ZeroFactor,
  blendDstAlpha: THREE.OneFactor,
});

export function crearLienzo3D({
  canvas,
  marco, // elemento cuyo tamaño sigue el lienzo
  scene,
  camera,
  u, // uniformes de la escena; aquí se añade uPx (píxeles del lienzo por píxel de pantalla)
  quieto = false,
  brillo = 0.9, // fuerza del resplandor
  muestras = 0, // antialiasing de la escena (0 = sin)
  exposicion = 0, // 0 = sin compresión de luces; si no, la exposición
  cubre = false, // la escena tapa lo de atrás donde es opaca (alfa = cuánto cubre; resplandor por umbral)
  maxPixeles = 2.6e6, // tope de píxeles del lienzo (en táctiles, algo menos)
  fundido = "float fundido(vec2 uv) { return 1.0; }", // GLSL; uv = (0,0) abajo a la izquierda
  uFundido = {}, // uniformes de esa función
  alMedir, // (ancho, alto) al cambiar el tamaño
  alAnimar, // (segundos de escena, segundos del cuadro) antes de dibujar
  alVer, // (se ve o no) cuando el marco entra o sale de la pantalla
}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, depth: false, stencil: false });
  } catch {
    return null; // sin WebGL no hay escena: queda el fondo de la sección
  }
  const gl = renderer.getContext();
  const tactil = !matchMedia("(hover: hover)").matches;
  if (tactil) maxPixeles *= 0.7;
  let escala = 1; // baja si el equipo no llega
  let dpr = 1;
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = false;
  u.uPx = { value: 1 };

  /* Texturas de trabajo y pasadas a pantalla completa */
  const flotantes = renderer.extensions.has("EXT_color_buffer_half_float") || renderer.extensions.has("EXT_color_buffer_float");
  const LINEAL = { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter };
  const escena = new THREE.WebGLRenderTarget(2, 2, {
    ...LINEAL,
    depthBuffer: true,
    samples: muestras,
    type: exposicion && flotantes ? THREE.HalfFloatType : THREE.UnsignedByteType,
  });
  const niveles = [0, 1, 2, 3].map(() => new THREE.WebGLRenderTarget(2, 2, { ...LINEAL, depthBuffer: false, type: flotantes ? THREE.HalfFloatType : THREE.UnsignedByteType }));
  const triangulo = new THREE.BufferGeometry();
  triangulo.setAttribute("position", new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const pase = (fragmentShader, uniforms, extra) => new THREE.ShaderMaterial({ uniforms, vertexShader: PASE_VS, fragmentShader, depthTest: false, depthWrite: false, ...extra });
  const uPase = () => ({ uTex: { value: null }, uPaso: { value: new THREE.Vector2() }, uFuerza: { value: 1 } });
  const brillar = pase(bajarFS(true, cubre), uPase());
  const bajar = pase(bajarFS(false, cubre), uPase());
  const subir = pase(SUBIR_FS, uPase(), { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor });
  const final = pase(finalFS(fundido, cubre), { uEscena: { value: escena.texture }, uResplandor: { value: niveles[0].texture }, uFuerza: { value: brillo }, uExpo: { value: exposicion }, ...uFundido }, { blending: THREE.NoBlending });
  const cuadro = new THREE.Mesh(triangulo, bajar);
  cuadro.frustumCulled = false;
  const camPase = new THREE.Camera();
  const ABRE = 1.6; // cuánto se abre el resplandor al ampliar
  function pasar(material, origen, destino, fuerza = 1) {
    if (origen) {
      const k = material === subir ? 0.25 * ABRE : 1; // medio píxel del destino, medido en el origen
      material.uniforms.uTex.value = origen.texture;
      material.uniforms.uPaso.value.set(k / origen.width, k / origen.height);
      material.uniforms.uFuerza.value = fuerza;
    }
    cuadro.material = material;
    renderer.setRenderTarget(destino);
    if (material !== subir && destino) renderer.clear();
    renderer.render(cuadro, camPase);
  }

  let conBrillo = brillo > 0;
  function dibujar() {
    renderer.setRenderTarget(escena);
    renderer.clear();
    renderer.render(scene, camera);
    if (conBrillo) {
      pasar(brillar, escena, niveles[0]);
      for (let i = 1; i < niveles.length; i++) pasar(bajar, niveles[i - 1], niveles[i]);
      for (let i = niveles.length - 1; i > 0; i--) pasar(subir, niveles[i], niveles[i - 1], 0.85);
    }
    final.uniforms.uFuerza.value = conBrillo ? brillo : 0;
    pasar(final, null, null);
  }

  function medir() {
    // Sin la hoja de estilos el lienzo queda dentro del marco y no encima: medirlo agrandaría el marco sin fin.
    if (getComputedStyle(canvas).position === "static") return;
    const w = marco.clientWidth;
    const h = marco.clientHeight;
    if (!w || !h) return;
    // Densidad: la de la pantalla (hasta 2), con tope de píxeles totales y lo que haya bajado el equipo.
    dpr = Math.max(0.6, Math.min(devicePixelRatio || 1, 2, Math.sqrt(maxPixeles / (w * h))) * escala);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    u.uPx.value = dpr;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    escena.setSize(canvas.width, canvas.height);
    niveles.forEach((rt, i) => rt.setSize(Math.max(canvas.width >> (i + 2), 2), Math.max(canvas.height >> (i + 2), 2)));
    alMedir?.(w, h);
    if (quieto) fijo();
  }
  // Cuadro único, con todo ya en su sitio.
  function fijo() {
    alAnimar?.(1e3, 0);
    dibujar();
    canvas.classList.add("lista");
  }

  /* Vigilancia del rendimiento. Si se puede, se mide lo que tarda la tarjeta gráfica en dibujar;
     si no, se prueba a bajar un paso y se comprueba que de verdad mejora (si no mejora, el freno
     es otro —por ejemplo, el ahorro de batería del navegador— y se vuelve a como estaba). */
  const crono = gl.getExtension("EXT_disjoint_timer_query_webgl2");
  let consulta = null;
  let pesados = 0;
  const intervalos = [];
  let prueba = null; // { antes: mediana previa } mientras se comprueba una bajada sin cronómetro
  let vigilar = true;
  function bajarEscala() {
    if (escala > 0.55) {
      escala *= 0.82;
      medir();
    } else conBrillo = false;
  }
  function vigilarCuadro(intervalo) {
    if (!vigilar) return;
    if (crono) {
      if (consulta && gl.getQueryParameter(consulta, gl.QUERY_RESULT_AVAILABLE)) {
        const ms = gl.getQueryParameter(consulta, gl.QUERY_RESULT) / 1e6;
        const valido = !gl.getParameter(crono.GPU_DISJOINT_EXT);
        gl.deleteQuery(consulta);
        consulta = null;
        if (valido) {
          lienzo.msGrafica = ms;
          pesados = ms > 7 ? pesados + 1 : 0;
          if (pesados >= 3) {
            pesados = 0;
            bajarEscala();
          }
        }
      }
      return;
    }
    intervalos.push(intervalo);
    if (intervalos.length < 90) return;
    const mediana = intervalos.sort((a, b) => a - b)[45];
    intervalos.length = 0;
    if (prueba) {
      if (mediana > prueba.antes * 0.85) {
        // No mejoró: el freno no era la resolución. Se deshace y no se toca más.
        escala /= 0.82;
        medir();
        vigilar = false;
      }
      prueba = null;
    } else if (mediana > 0.024) {
      prueba = { antes: mediana };
      bajarEscala();
    }
  }

  // Reloj propio: el tiempo de la escena solo corre mientras se dibuja (no salta al volver a verla).
  let t = 0;
  let antes = 0;
  let raf = 0;
  let visible = false;
  let cuadros = 0;
  function animar(ms) {
    raf = requestAnimationFrame(animar);
    if (antes && ms - antes < 15) return; // tope de ~60 cuadros por segundo
    const real = antes ? (ms - antes) / 1000 : 0;
    const dt = Math.min(real, 0.05);
    antes = ms;
    t += dt;
    alAnimar?.(t, dt);
    const medirEste = crono && vigilar && !consulta && t > 3 && cuadros % 20 === 0;
    if (medirEste) {
      consulta = gl.createQuery();
      gl.beginQuery(crono.TIME_ELAPSED_EXT, consulta);
    }
    dibujar();
    if (medirEste) gl.endQuery(crono.TIME_ELAPSED_EXT);
    if (++cuadros === 2) canvas.classList.add("lista");
    if (t > 3) vigilarCuadro(real);
  }
  // Los shaders se compilan sin bloquear la página antes del primer cuadro, si el navegador lo
  // permite; si no, se compilan al dibujar.
  let compilado = !renderer.extensions.has("KHR_parallel_shader_compile");
  if (!compilado) {
    renderer
      .compileAsync(scene, camera)
      .catch(() => {})
      .finally(() => {
        compilado = true;
        seguir();
      });
  }
  function seguir() {
    const debe = compilado && !quieto && visible && !document.hidden;
    if (debe && !raf) {
      antes = 0;
      raf = requestAnimationFrame(animar);
    } else if (!debe && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  const lienzo = {
    renderer,
    dibujar,
    quieto,
    msGrafica: 0, // último tiempo de dibujo medido en la tarjeta gráfica (si el navegador lo da)
    // Segundos de escena transcurridos.
    get tiempo() {
      return t;
    },
    // Densidad de píxeles con la que se está dibujando.
    get densidad() {
      return dpr;
    },
  };

  new ResizeObserver(medir).observe(marco);
  medir();
  new IntersectionObserver(([en]) => {
    visible = en.isIntersecting;
    alVer?.(visible);
    seguir();
  }).observe(marco);
  document.addEventListener("visibilitychange", seguir);

  if (import.meta.env?.DEV) (window.__lienzos ??= []).push(lienzo); // solo en desarrollo, para pruebas
  return lienzo;
}
