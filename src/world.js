import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { PERU } from "./peru.js";

const { smoothstep, lerp, clamp } = THREE.MathUtils;

// Colores del manual de marca: azul institucional y dorado tecnológico.
export const BG = "#03142A"; // cielo de noche: el mismo azul profundo de las secciones oscuras
export const ACCENT = "#F5AF31";

/* ---------- Utilidades ---------- */

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(11);
const rr = (a, b) => a + (b - a) * rand();

function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
function vnoise(x, z) {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = x - xi;
  const zf = z - zi;
  const u = xf * xf * (3 - 2 * xf);
  const v = zf * zf * (3 - 2 * zf);
  const a = hash(xi, zi);
  const b = hash(xi + 1, zi);
  const c = hash(xi, zi + 1);
  const d = hash(xi + 1, zi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, z) {
  let s = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < 5; i++) {
    s += a * vnoise(x * f, z * f);
    a *= 0.5;
    f *= 2;
  }
  return s;
}

/* ---------- Materiales: dibujo técnico (relleno del color del fondo + aristas) ----------
   Cada parada tiene su propio juego de materiales con un plano de corte, para que la
   estructura se "construya" (aparezca de abajo hacia arriba) a medida que avanza el scroll. */

const FILLS = []; // todos los rellenos siguen el color de fondo, que cambia de blanco a azul

function kit(planes = []) {
  const clip = { clippingPlanes: planes };
  const f = { color: BG, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1, ...clip };
  const k = {
    fill: new THREE.MeshBasicMaterial(f),
    fillDouble: new THREE.MeshBasicMaterial({ ...f, side: THREE.DoubleSide }),
    line: (opacity, color = "#ffffff") =>
      new THREE.LineBasicMaterial({ color, transparent: true, opacity, ...clip }),
  };
  // Contornos con grosor (en píxeles de pantalla): en pantallas de alta densidad una línea
  // de 1 px queda como un hilo. El detalle secundario (pisos, cables) sigue en trazo fino.
  const fat = (linewidth, opacity, color) =>
    new LineMaterial({ color, linewidth, transparent: true, opacity, fog: true, ...clip });
  k.edge = fat(1.5, 0.9, "#ffffff");
  k.gold = fat(2, 1, ACCENT);
  FILLS.push(k.fill, k.fillDouble);
  return k;
}

function mesh(k, geo, x = 0, y = 0, z = 0, o = {}) {
  const m = new THREE.Mesh(geo, o.fill ?? (o.double ? k.fillDouble : k.fill));
  m.position.set(x, y, z);
  const edges = new THREE.EdgesGeometry(geo, o.angle ?? 25);
  m.add(new LineSegments2(new LineSegmentsGeometry().fromEdgesGeometry(edges), o.accent ? k.gold : k.edge));
  edges.dispose();
  return m;
}

function segments(points, material) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  return new THREE.LineSegments(geo, material);
}

// Líneas de piso alrededor de una torre.
function floors(out, x, z, w, y0, y1, step = 1.3) {
  const h = w / 2;
  for (let y = y0 + step; y < y1; y += step) {
    out.push(x - h, y, z - h, x + h, y, z - h, x + h, y, z - h, x + h, y, z + h);
    out.push(x + h, y, z + h, x - h, y, z + h, x - h, y, z + h, x - h, y, z - h);
  }
}

// Marco dorado que acompaña al plano de corte, como un escáner de obra.
function scanFrame(scene, w, d, cx, cz) {
  const pts = [
    new THREE.Vector3(-w / 2, 0, -d / 2),
    new THREE.Vector3(w / 2, 0, -d / 2),
    new THREE.Vector3(w / 2, 0, d / 2),
    new THREE.Vector3(-w / 2, 0, d / 2),
  ];
  const frame = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints(pts),
    new THREE.LineBasicMaterial({ color: ACCENT }),
  );
  frame.position.set(cx, 0, cz);
  scene.add(frame);
  return frame;
}

function glowTexture() {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 64;
  const ctx = cv.getContext("2d");
  const gr = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, "rgba(255,255,255,1)");
  gr.addColorStop(0.3, "rgba(255,255,255,0.5)");
  gr.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gr;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

/* ---------- Relieve ---------- */

const riverZ = (x) => -165 + 6 * Math.sin(x * 0.05);

// Valle plano en el centro (por donde vuela la cámara), cordillera a los lados y un río que lo cruza.
function height(x, z) {
  const valley = smoothstep(Math.abs(x), 30, 115);
  const ridge = Math.pow(fbm(x * 0.014 + 3.1, z * 0.014 + 7.7), 1.5);
  const h = valley * (ridge * 78 + 4);
  const carve = 1 - smoothstep(Math.abs(z - riverZ(x)), 3.5, 9);
  return lerp(h, -3, carve);
}

function buildTerrain(scene, base) {
  const SX = 170;
  const SZ = 230;
  const geo = new THREE.PlaneGeometry(480, 640, SX, SZ);
  geo.rotateX(-Math.PI / 2);
  geo.translate(0, 0, -150);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i)));
  scene.add(new THREE.Mesh(geo, base.fill));

  // Curvas del relieve: una línea por fila, más clara en las cumbres.
  const pts = [];
  const ts = [];
  const put = (i) => {
    const y = pos.getY(i);
    pts.push(pos.getX(i), y, pos.getZ(i));
    // Hacia los bordes del terreno las líneas se disuelven en el fondo,
    // para que desde el aire no se vea un rectángulo recortado.
    const x = pos.getX(i);
    const z = pos.getZ(i) + 150;
    const edge = smoothstep(Math.min(240 - Math.abs(x), 320 - Math.abs(z)), 0, 70);
    ts.push((0.1 + 0.6 * smoothstep(y, 1, 42)) * edge);
  };
  for (let j = 0; j <= SZ; j++) {
    for (let i = 0; i < SX; i++) {
      const a = j * (SX + 1) + i;
      put(a);
      put(a + 1);
    }
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  lg.setAttribute("aT", new THREE.Float32BufferAttribute(ts, 1));

  // Una franja dorada recorre el valle a la altura de lo que mira la cámara;
  // el territorio ya recorrido queda levemente encendido.
  const uniforms = THREE.UniformsUtils.merge([
    THREE.UniformsLib.fog,
    {
      uFront: { value: 0 },
      uGold: { value: new THREE.Color(ACCENT) },
      uBg: { value: new THREE.Color(BG) },
      uMix: { value: 1 },
    },
  ]);
  const material = new THREE.ShaderMaterial({
    uniforms,
    fog: true,
    vertexShader: `
      attribute float aT;
      uniform float uFront;
      uniform vec3 uBg;
      varying vec3 vColor;
      varying float vBand;
      varying float vDone;
      #include <fog_pars_vertex>
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        float d = position.z - uFront;
        vBand = exp(-d * d / 30.0);
        vDone = smoothstep(0.0, 70.0, d);
        vColor = mix(uBg, vec3(1.0), aT);
        #include <fog_vertex>
      }`,
    fragmentShader: `
      uniform vec3 uGold;
      uniform float uMix;
      varying vec3 vColor;
      varying float vBand;
      varying float vDone;
      #include <fog_pars_fragment>
      void main() {
        gl_FragColor = vec4(vColor + uGold * (vBand * 0.9 + vDone * 0.07) * uMix, 1.0);
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  scene.add(new THREE.LineSegments(lg, material));

  // Eje que une todas las paradas.
  scene.add(segments([-1.5, 0.05, -12, -1.5, 0.05, -150, 1.5, 0.05, -12, 1.5, 0.05, -150], base.line(0.35)));
  return uniforms;
}

function buildDust(scene, glow) {
  const N = 700;
  const arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    arr[i * 3] = rr(-130, 130);
    arr[i * 3 + 1] = rr(2, 64);
    arr[i * 3 + 2] = rr(-340, 120);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  scene.add(
    new THREE.Points(
      geo,
      new THREE.PointsMaterial({ map: glow, size: 0.55, transparent: true, opacity: 0.55, depthWrite: false }),
    ),
  );
}

/* ---------- Portada: el isotipo en 3D ----------
   Un óvalo de doble contorno, como el del logo, colocado de modo que desde la cámara de
   portada enmarca el palacio. Al hacer scroll, la cámara lo atraviesa. */

export const PORTAL = { center: new THREE.Vector3(0, 6, 24), eye: new THREE.Vector3(0, 7.26, 50) };

function buildPortal(scene) {
  const g = new THREE.Group();
  const gold = new THREE.MeshBasicMaterial({ color: ACCENT });
  const outer = new THREE.Mesh(new THREE.TorusGeometry(1, 0.036, 10, 180), gold);
  outer.scale.set(4.8, 5.5, 4.8);
  const inner = new THREE.Mesh(new THREE.TorusGeometry(1, 0.012, 8, 180), gold);
  inner.scale.set(4.8 * 0.87, 5.5 * 0.87, 4.8);
  g.add(outer, inner);
  g.position.copy(PORTAL.center);
  g.lookAt(PORTAL.eye);
  scene.add(g);
}

/* ---------- 01 · Municipio ---------- */

function buildTown(scene, k) {
  const g = new THREE.Group();
  g.add(mesh(k, new THREE.CylinderGeometry(11.5, 11.5, 0.3, 48), 0, 0.15, 0));
  g.add(mesh(k, new THREE.CylinderGeometry(1.9, 2.1, 0.6, 24), 0, 0.6, 3.5));
  g.add(mesh(k, new THREE.CylinderGeometry(0.2, 0.3, 0.3, 8), 0, 1.05, 3.5));

  // Palacio municipal, en dorado: es el símbolo del isotipo de la marca.
  const p = new THREE.Group();
  p.position.set(0, 0.3, -9);
  // En la apertura (fondo blanco) el frontón, las columnas y la base son dorado sólido,
  // como el templo del logo; al entrar al mundo azul pasan a ser plano técnico.
  const palaceFill = new THREE.MeshBasicMaterial({
    color: ACCENT,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const A = { accent: true, fill: palaceFill };
  p.add(mesh(k, new THREE.BoxGeometry(13.5, 0.6, 8.5), 0, 0.3, 0, A));
  p.add(mesh(k, new THREE.BoxGeometry(11, 4.2, 5), 0, 2.7, -0.4, { accent: true }));
  for (let i = 0; i < 6; i++) {
    p.add(mesh(k, new THREE.CylinderGeometry(0.32, 0.36, 4.2, 8), -4.75 + i * 1.9, 2.7, 2.9, A));
  }
  p.add(mesh(k, new THREE.BoxGeometry(12.2, 0.5, 7.2), 0, 5.05, 0.2, A));
  const tri = new THREE.Shape();
  tri.moveTo(-6.1, 0);
  tri.lineTo(6.1, 0);
  tri.lineTo(0, 2.2);
  tri.closePath();
  p.add(mesh(k, new THREE.ExtrudeGeometry(tri, { depth: 7.2, bevelEnabled: false }), 0, 5.3, -3.4, A));
  p.add(mesh(k, new THREE.BoxGeometry(2, 2.6, 0.2), 0, 1.9, 2.15, { accent: true }));
  g.add(p);

  // Casas: relleno instanciado + aristas fusionadas en un solo objeto.
  const N = 96;
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), k.fill, N);
  const roofs = new THREE.InstancedMesh(new THREE.ConeGeometry(0.74, 1, 4), k.fill, N);
  const boxE = new THREE.EdgesGeometry(walls.geometry).attributes.position;
  const coneE = new THREE.EdgesGeometry(roofs.geometry).attributes.position;
  const pts = [];
  const v = new THREE.Vector3();
  const push = (src, m) => {
    for (let i = 0; i < src.count; i++) {
      v.fromBufferAttribute(src, i).applyMatrix4(m);
      pts.push(v.x, v.y, v.z);
    }
  };
  const d = new THREE.Object3D();
  let n = 0;
  for (let tries = 0; n < N && tries < 1200; tries++) {
    const a = rand() * Math.PI * 2;
    const r = rr(15, 38);
    const x = Math.sin(a) * r;
    const z = Math.cos(a) * r - 2;
    // Corredor libre frente al palacio: por ahí mira (y entra) la cámara de portada.
    if (Math.abs(x) < 10 && z > 4) continue;
    if (Math.abs(x) < 3.5) continue;
    const w = rr(2.2, 3.6);
    const h = rr(1.8, 3.2);
    const dp = rr(2.2, 3.6);
    const rot = Math.round(rr(0, 3)) * (Math.PI / 2) + rr(-0.15, 0.15);
    const y = height(x, z);
    d.position.set(x, y + h / 2, z);
    d.rotation.set(0, rot, 0);
    d.scale.set(w, h, dp);
    d.updateMatrix();
    walls.setMatrixAt(n, d.matrix);
    push(boxE, d.matrix);
    d.position.set(x, y + h + 0.55, z);
    d.rotation.set(0, rot + Math.PI / 4, 0);
    d.scale.set(w, 1.1, dp);
    d.updateMatrix();
    roofs.setMatrixAt(n, d.matrix);
    push(coneE, d.matrix);
    n++;
  }
  walls.count = roofs.count = n;
  g.add(walls, roofs, segments(pts, k.line(0.6)));
  scene.add(g);
  return palaceFill;
}

/* ---------- 02 · Distrito tecnológico ---------- */

function buildDistrict(scene, glow) {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const k = kit([plane]);
  const g = new THREE.Group();
  const Z = -72;
  const fl = [];
  g.add(mesh(k, new THREE.BoxGeometry(34, 0.3, 32), 0, 0.15, Z));

  const nodes = [];
  for (const x of [-11, -5.5, 5.5, 11]) {
    for (const z of [Z - 10, Z, Z + 10]) {
      const h = rr(4, 11);
      g.add(mesh(k, new THREE.BoxGeometry(4, h, 4), x, h / 2 + 0.3, z));
      floors(fl, x, z, 4, 0.3, h + 0.3);
      nodes.push(new THREE.Vector3(x, h + 1.6, z));
    }
  }
  // Torre central con antena
  g.add(mesh(k, new THREE.BoxGeometry(4.4, 18, 4.4), 0, 9.3, Z));
  floors(fl, 0, Z, 4.4, 0.3, 18.3);
  g.add(mesh(k, new THREE.BoxGeometry(3, 2, 3), 0, 19.3, Z));
  g.add(segments([0, 20.3, Z, 0, 25.4, Z], k.line(0.9)));
  const hub = new THREE.Vector3(0, 25.4, Z);
  g.add(segments(fl, k.line(0.28)));
  scene.add(g);
  const frame = scanFrame(scene, 36, 34, 0, Z);

  // Red de datos: cada edificio con la torre, vecinos entre sí, y la torre con el palacio.
  const links = [];
  nodes.forEach((n, i) => {
    links.push([n, hub]);
    if (i % 3 !== 2) links.push([n, nodes[i + 1]]);
    if (i + 3 < nodes.length) links.push([n, nodes[i + 3]]);
  });
  links.push([hub, new THREE.Vector3(0, 8.1, -9)]);
  const linkMat = new THREE.LineBasicMaterial({ color: ACCENT, transparent: true, opacity: 0 });
  scene.add(segments(links.flatMap(([a, b]) => [...a.toArray(), ...b.toArray()]), linkMat));

  const sprite = { map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 };
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute([...nodes, hub].flatMap((n) => n.toArray()), 3),
  );
  const dotMat = new THREE.PointsMaterial({ ...sprite, color: ACCENT, size: 2.4 });
  scene.add(new THREE.Points(dotGeo, dotMat));

  const pulseGeo = new THREE.BufferGeometry();
  const pulsePos = new Float32Array(links.length * 3);
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
  const pulseMat = new THREE.PointsMaterial({ ...sprite, color: "#ffffff", size: 1.3 });
  const pulses = new THREE.Points(pulseGeo, pulseMat);
  pulses.frustumCulled = false;
  scene.add(pulses);
  const offsets = links.map(() => rand());
  const v = new THREE.Vector3();

  return (f, time) => {
    const r = smoothstep(f, 1.2, 1.8);
    plane.constant = lerp(-1, 27, r);
    frame.position.y = plane.constant;
    frame.visible = r > 0.01 && r < 0.99;
    const on = smoothstep(f, 1.7, 1.95);
    linkMat.opacity = 0.5 * on;
    dotMat.opacity = on;
    pulseMat.opacity = on;
    links.forEach(([a, b], i) => {
      v.lerpVectors(a, b, (time * 0.35 + offsets[i]) % 1).toArray(pulsePos, i * 3);
    });
    pulseGeo.attributes.position.needsUpdate = true;
  };
}

/* ---------- 03 · Foro ---------- */

function buildForum(scene, glow) {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const k = kit([plane]);
  const g = new THREE.Group();
  g.position.set(0, 0, -125);

  // Graderías en media luna (perfil escalonado girado 180°).
  const profile = [];
  for (let i = 0; i < 5; i++) {
    profile.push(new THREE.Vector2(5 + i * 2, i * 0.6), new THREE.Vector2(5 + i * 2, (i + 1) * 0.6));
  }
  profile.push(new THREE.Vector2(15, 3), new THREE.Vector2(15, 0));
  g.add(mesh(k, new THREE.LatheGeometry(profile, 48, Math.PI / 2, Math.PI), 0, 0, 0, { double: true }));
  g.add(mesh(k, new THREE.CylinderGeometry(4.3, 4.5, 0.5, 40), 0, 0.25, 0));
  g.add(mesh(k, new THREE.BoxGeometry(0.9, 1.1, 0.6), 0, 1.05, -0.6));
  for (const x of [-7.5, 7.5]) {
    g.add(segments([x, 0, 3, x, 6, 3], k.line(0.9)));
    g.add(mesh(k, new THREE.BoxGeometry(1.5, 3.6, 0.06), x, 4, 3, { accent: true }));
  }
  scene.add(g);
  const frame = scanFrame(scene, 32, 20, 0, -131);

  // Público: un punto por asistente. Se va llenando grada por grada.
  const N = 220;
  const arr = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const tier = Math.floor((i / N) * 5);
    const r = 6 + tier * 2 + rr(-0.45, 0.45);
    const phi = rr(Math.PI / 2 + 0.12, (3 * Math.PI) / 2 - 0.12);
    arr.set([Math.sin(phi) * r, (tier + 1) * 0.6 + 0.7, Math.cos(phi) * r], i * 3);
  }
  const crowd = new THREE.BufferGeometry();
  crowd.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const sprite = { map: glow, transparent: true, depthWrite: false };
  g.add(new THREE.Points(crowd, new THREE.PointsMaterial({ ...sprite, size: 0.5, opacity: 0.8 })));
  const sp = new THREE.BufferGeometry();
  sp.setAttribute("position", new THREE.Float32BufferAttribute([0, 1.7, 0.5], 3));
  const speaker = new THREE.PointsMaterial({ ...sprite, color: ACCENT, size: 2.8, blending: THREE.AdditiveBlending });
  g.add(new THREE.Points(sp, speaker));

  return (f) => {
    const r = smoothstep(f, 2.25, 2.7);
    plane.constant = lerp(-1, 7.5, r);
    frame.position.y = plane.constant;
    frame.visible = r > 0.01 && r < 0.99;
    crowd.setDrawRange(0, Math.floor(N * smoothstep(f, 2.6, 3.0)));
    speaker.opacity = smoothstep(f, 2.6, 2.8);
  };
}

/* ---------- 04 · Puente y organismos ---------- */

function buildBridge(scene) {
  // El puente se tiende de una orilla a la otra: el plano de corte avanza en Z.
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const k = kit([plane]);
  const g = new THREE.Group();
  const Z = -165;
  g.add(mesh(k, new THREE.BoxGeometry(4.6, 0.5, 34), 0, 0.3, Z));
  for (const z of [Z - 7, Z, Z + 7]) g.add(mesh(k, new THREE.BoxGeometry(3.6, 3.4, 1.1), 0, -1.4, z));
  const cables = [];
  for (const x of [-2.5, 2.5]) {
    g.add(mesh(k, new THREE.BoxGeometry(0.5, 10, 0.7), x, 5, Z));
    cables.push(x * 0.88, 1.25, Z - 17, x * 0.88, 1.25, Z + 17);
    for (let i = 1; i <= 6; i++) {
      for (const s of [-1, 1]) cables.push(x, 9.8, Z, x * 0.88, 1.25, Z + s * i * 2.5);
    }
  }
  g.add(mesh(k, new THREE.BoxGeometry(5.5, 0.5, 0.7), 0, 9.9, Z));
  g.add(segments(cables, k.line(0.55)));
  scene.add(g);

  const front = new THREE.LineLoop(
    new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4, -2, 0),
      new THREE.Vector3(4, -2, 0),
      new THREE.Vector3(4, 11, 0),
      new THREE.Vector3(-4, 11, 0),
    ]),
    new THREE.LineBasicMaterial({ color: ACCENT }),
  );
  scene.add(front);

  return (f) => {
    const r = smoothstep(f, 3.2, 3.7);
    const z = lerp(-146, -184, r);
    plane.constant = -z;
    front.position.z = z;
    front.visible = r > 0.01 && r < 0.99;
  };
}

function buildInstitutions(scene, glow) {
  const plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0);
  const k = kit([plane]);
  const g = new THREE.Group();
  const Z = -205;
  const fl = [];
  g.add(mesh(k, new THREE.BoxGeometry(44, 1, 24), 0, 0.5, Z));
  g.add(mesh(k, new THREE.BoxGeometry(16, 0.5, 4), 0, 0.25, Z + 13));

  // Torre central
  g.add(mesh(k, new THREE.BoxGeometry(7, 20, 7), 0, 11, Z));
  floors(fl, 0, Z, 7, 1, 21);
  g.add(mesh(k, new THREE.BoxGeometry(5, 3, 5), 0, 22.5, Z));
  g.add(mesh(k, new THREE.ConeGeometry(1.6, 4, 4), 0, 26, Z, { accent: true }));
  // Edificio con cúpula
  g.add(mesh(k, new THREE.CylinderGeometry(5, 5.4, 6, 32), -14, 4, Z));
  g.add(mesh(k, new THREE.SphereGeometry(5, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), -14, 7, Z, { angle: 12 }));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const x = -14 + Math.sin(a) * 5.8;
    const z = Z + Math.cos(a) * 5.8;
    g.add(segments([x, 1, z, x, 7, z], k.line(0.7)));
  }
  // Bloque
  g.add(mesh(k, new THREE.BoxGeometry(7, 13, 7), 14, 7.5, Z));
  floors(fl, 14, Z, 7, 1, 14);
  // Astas
  for (let i = 0; i < 8; i++) {
    const x = -15.75 + i * 4.5;
    g.add(segments([x, 1, Z + 11, x, 7, Z + 11], k.line(0.8)));
    g.add(mesh(k, new THREE.BoxGeometry(1.5, 0.9, 0.05), x + 0.8, 6.4, Z + 11));
  }
  g.add(segments(fl, k.line(0.28)));
  scene.add(g);
  const frame = scanFrame(scene, 46, 26, 0, Z);

  // Flujo de financiamiento: de los organismos hacia el municipio.
  const flow = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 3, Z + 12),
    new THREE.Vector3(0, 2.4, -165),
    new THREE.Vector3(0, 2.2, -127),
    new THREE.Vector3(0, 2.6, -72),
    new THREE.Vector3(0, 2, -4),
  ]);
  const N = 54;
  const geo = new THREE.BufferGeometry();
  const arr = new Float32Array(N * 3);
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  const flowMat = new THREE.PointsMaterial({
    map: glow,
    color: ACCENT,
    size: 1.5,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const pts = new THREE.Points(geo, flowMat);
  pts.frustumCulled = false;
  scene.add(pts);
  const v = new THREE.Vector3();

  return (f, time) => {
    const r = smoothstep(f, 3.45, 3.95);
    plane.constant = lerp(-1, 29, r);
    frame.position.y = plane.constant;
    frame.visible = r > 0.01 && r < 0.99;
    flowMat.opacity = smoothstep(f, 3.85, 4.05);
    for (let i = 0; i < N; i++) {
      flow.getPointAt((i / N + time * 0.03) % 1, v);
      v.toArray(arr, i * 3);
    }
    geo.attributes.position.needsUpdate = true;
  };
}

/* ---------- 05 · Red nacional: del municipio al mapa del Perú ---------- */

// Capitales regionales [nombre, longitud, latitud]. Las marcadas con 1 llevan etiqueta.
export const CITIES = [
  ["Lima", -77.04, -12.05, 1],
  ["Tumbes", -80.45, -3.57],
  ["Piura", -80.63, -5.19, 1],
  ["Chiclayo", -79.84, -6.77],
  ["Trujillo", -79.03, -8.11, 1],
  ["Cajamarca", -78.51, -7.16],
  ["Chachapoyas", -77.87, -6.23],
  ["Moyobamba", -76.97, -6.03],
  ["Iquitos", -73.25, -3.75, 1],
  ["Huaraz", -77.53, -9.53],
  ["Huánuco", -76.24, -9.93],
  ["Pucallpa", -74.55, -8.38, 1],
  ["Cerro de Pasco", -76.26, -10.68],
  ["Huancayo", -75.21, -12.07],
  ["Huancavelica", -74.97, -12.79],
  ["Ica", -75.73, -14.07, 1],
  ["Ayacucho", -74.22, -13.16],
  ["Abancay", -72.88, -13.63],
  ["Cusco", -71.97, -13.53, 1],
  ["Puerto Maldonado", -69.19, -12.59, 1],
  ["Puno", -70.02, -15.84, 1],
  ["Arequipa", -71.54, -16.4, 1],
  ["Moquegua", -70.93, -17.19],
  ["Tacna", -70.25, -18.01, 1],
];

const K = 1200; // unidades de escena por grado
const LON0 = -75.7; // el valle del recorrido se ubica en la sierra central
const LAT0 = -11.4;
const MAP_Y = -6;
const proj = (lon, lat) => new THREE.Vector3((lon - LON0) * K * 0.986, MAP_Y, -(lat - LAT0) * K - 100);
export const MAP_CENTER = proj(-75, -9.4);

function inPeru(lon, lat) {
  let inside = false;
  for (let i = 0, j = PERU.length - 1; i < PERU.length; j = i++) {
    const [xi, yi] = PERU[i];
    const [xj, yj] = PERU[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function buildMap(scene, glow) {
  const g = new THREE.Group();
  g.renderOrder = 10;
  const mats = [];
  const reg = (m, opacity) => {
    m.transparent = true;
    m.fog = false;
    m.depthTest = false;
    m.depthWrite = false;
    m.opacity = 0;
    mats.push([m, opacity]);
    return m;
  };

  g.add(
    new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(PERU.map(([lon, lat]) => proj(lon, lat))),
      reg(new THREE.LineBasicMaterial({ color: "#ffffff" }), 0.85),
    ),
  );

  // Territorio como trama de puntos.
  const dots = [];
  for (let lat = -18.3; lat < 0; lat += 0.13) {
    for (let lon = -81.3; lon < -68.6; lon += 0.13) {
      if (inPeru(lon, lat)) dots.push(...proj(lon, lat).toArray());
    }
  }
  const dotGeo = new THREE.BufferGeometry();
  dotGeo.setAttribute("position", new THREE.Float32BufferAttribute(dots, 3));
  g.add(new THREE.Points(dotGeo, reg(new THREE.PointsMaterial({ color: "#ffffff", size: 1.7, sizeAttenuation: false }), 0.32)));

  // Capitales y el municipio del recorrido.
  const home = new THREE.Vector3(0, MAP_Y, -100);
  const cities = CITIES.map(([name, lon, lat, tag]) => ({ name, pos: proj(lon, lat), tag }));
  const cityGeo = new THREE.BufferGeometry().setFromPoints([...cities.map((c) => c.pos), home]);
  const nodeOpts = { map: glow, color: ACCENT, sizeAttenuation: false, blending: THREE.AdditiveBlending };
  g.add(new THREE.Points(cityGeo, reg(new THREE.PointsMaterial({ ...nodeOpts, size: 15 }), 1)));
  const homeMat = reg(new THREE.PointsMaterial({ ...nodeOpts, color: "#ffffff", size: 30 }), 1);
  g.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints([home]), homeMat));

  // Arcos desde el municipio hacia cada capital: la información llega a todo el país.
  const arcMat = reg(new THREE.LineBasicMaterial({ color: ACCENT }), 0.8);
  const SEG = 48;
  const arcs = cities.map((c) => {
    const mid = home.clone().lerp(c.pos, 0.5);
    mid.y += home.distanceTo(c.pos) * 0.28;
    const curve = new THREE.QuadraticBezierCurve3(home, mid, c.pos);
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(curve.getPoints(SEG)), arcMat);
    line.frustumCulled = false;
    line.geometry.setDrawRange(0, 0);
    g.add(line);
    return { curve, line };
  });
  const order = arcs.map((_, i) => i).sort((a, b) => home.distanceTo(cities[a].pos) - home.distanceTo(cities[b].pos));

  const pulseGeo = new THREE.BufferGeometry();
  const pulsePos = new Float32Array(arcs.length * 3);
  pulseGeo.setAttribute("position", new THREE.BufferAttribute(pulsePos, 3));
  const pulseMat = reg(new THREE.PointsMaterial({ ...nodeOpts, color: "#ffffff", size: 9 }), 1);
  const pulses = new THREE.Points(pulseGeo, pulseMat);
  pulses.frustumCulled = false;
  g.add(pulses);
  g.traverse((o) => (o.renderOrder = 10));
  scene.add(g);

  const v = new THREE.Vector3();
  const labels = [{ name: "Tu municipio", pos: home, home: true }, ...cities.filter((c) => c.tag)];

  return {
    labels,
    update(e, time) {
      const alpha = smoothstep(e, 0.42, 0.72);
      g.visible = alpha > 0;
      for (const [m, o] of mats) m.opacity = o * alpha;
      homeMat.opacity = alpha * (0.75 + 0.25 * Math.sin(time * 3));
      const t = smoothstep(e, 0.66, 1);
      order.forEach((idx, rank) => {
        const start = (rank / arcs.length) * 0.6;
        const frac = clamp((t - start) / 0.4, 0, 1);
        arcs[idx].line.geometry.setDrawRange(0, Math.floor(frac * (SEG + 1)));
        arcs[idx].curve.getPoint(frac < 1 ? frac : (time * 0.22 + idx * 0.37) % 1, v);
        v.toArray(pulsePos, idx * 3);
      });
      pulseGeo.attributes.position.needsUpdate = true;
      pulseMat.opacity = t > 0 ? alpha : 0;
      return alpha;
    },
  };
}

/* ---------- Ensamblado ---------- */

export function buildWorld(scene) {
  const glow = glowTexture();
  const WHITE = new THREE.Color("#ffffff");
  const NAVY = new THREE.Color(BG);
  const GOLD = new THREE.Color(ACCENT);
  const bg = new THREE.Color(BG);
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 55, 400);

  const base = kit();
  const terrain = buildTerrain(scene, base);
  buildDust(scene, glow);
  buildPortal(scene);
  const palaceFill = buildTown(scene, base);
  const updaters = [
    buildDistrict(scene, glow),
    buildForum(scene, glow),
    buildBridge(scene),
    buildInstitutions(scene, glow),
  ];
  const map = buildMap(scene, glow);

  return {
    labels: map.labels,
    // m: 0 = apertura en blanco, 1 = mundo azul. f: avance en unidades de parada contado desde
    // la portada (1 = palacio … 5 = red nacional). e: ascenso final (0 a 1).
    update({ m, f, e, time, lookZ, altitude }) {
      // El fondo pasa de blanco a azul. Las líneas son blancas, así que sobre blanco no se ven
      // y aparecen solas a medida que el fondo se oscurece; solo el dorado está siempre presente.
      bg.copy(WHITE).lerp(NAVY, m);
      scene.background.copy(bg);
      scene.fog.color.copy(bg);
      for (const mat of FILLS) mat.color.copy(bg);
      palaceFill.color.copy(GOLD).lerp(bg, smoothstep(m, 0.1, 0.9));
      terrain.uBg.value.copy(bg);
      terrain.uMix.value = m;
      terrain.uFront.value = lookZ;

      for (const u of updaters) u(f, time);
      // Al ascender, la niebla se abre para que el valle se vea encogerse y luego desaparezca.
      const alt = Math.max(0, altitude - 20);
      scene.fog.near = 55 + 0.75 * alt;
      scene.fog.far = 400 + 0.85 * alt;
      return map.update(e, time);
    },
  };
}
