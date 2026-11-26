// Relieve del territorio de la portada. Se calcula una vez, fuera del hilo principal
// (relieve-trabajador.js), para que la página no se trabe al cargar. Si el navegador no permite
// trabajadores, portada3d.js lo calcula aquí mismo.
// El ruido lleva una semilla fija: el territorio sale igual en todos los equipos.

// Ruido simplex 2D con semilla.
function crearRuido(semilla) {
  const perm = new Uint8Array(512);
  const base = Array.from({ length: 256 }, (_, i) => i);
  let s = semilla >>> 0;
  const azar = () => (s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296;
  for (let i = 255; i > 0; i--) {
    const j = (azar() * (i + 1)) | 0;
    [base[i], base[j]] = [base[j], base[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = base[i & 255];
  const GX = [1, -1, 1, -1, 1, -1, 0, 0];
  const GY = [1, 1, -1, -1, 0, 0, 1, -1];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;
  return (x, y) => {
    const sk = (x + y) * F2;
    const i = Math.floor(x + sk);
    const j = Math.floor(y + sk);
    const t = (i + j) * G2;
    const x0 = x - i + t;
    const y0 = y - j + t;
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = 1 - i1;
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;
    const ii = i & 255;
    const jj = j & 255;
    let n = 0;
    let a = 0.5 - x0 * x0 - y0 * y0;
    if (a > 0) {
      const g = perm[ii + perm[jj]] & 7;
      a *= a;
      n += a * a * (GX[g] * x0 + GY[g] * y0);
    }
    a = 0.5 - x1 * x1 - y1 * y1;
    if (a > 0) {
      const g = perm[ii + i1 + perm[jj + j1]] & 7;
      a *= a;
      n += a * a * (GX[g] * x1 + GY[g] * y1);
    }
    a = 0.5 - x2 * x2 - y2 * y2;
    if (a > 0) {
      const g = perm[ii + 1 + perm[jj + 1]] & 7;
      a *= a;
      n += a * a * (GX[g] * x2 + GY[g] * y2);
    }
    return 70 * n; // entre -1 y 1, aprox.
  };
}

// Función de altura del territorio. Deja en `.monte` cuánto es montaña (0…1).
// Macizos: [x, d, radio a lo largo, radio a lo ancho, altura, giro].
function crearAltura(macizos) {
  const n = crearRuido(20261123);
  const M = macizos.map(([x, d, ra, rb, alto, giro]) => ({ x, d, ra, rb, alto, c: Math.cos(giro), s: Math.sin(giro) }));
  const altura = (x, d) => {
    // Praderas: lomas amplias y suaves.
    let h = 0.75 * n(x * 0.04, d * 0.045) + 0.3 * n(x * 0.09 + 17.3, d * 0.1 + 9.1) + 0.08 * n(x * 0.22 - 5.7, d * 0.24 + 31.4) + 0.35;
    // Macizos: dónde hay montaña y cuánto sube.
    let m = 0;
    for (const k of M) {
      const dx = x - k.x;
      const dd = d - k.d;
      const a = (dx * k.c + dd * k.s) / k.ra;
      const b = (dd * k.c - dx * k.s) / k.rb;
      const e = a * a + b * b;
      if (e < 7) m += k.alto * Math.exp(-e);
    }
    altura.monte = Math.min(1, m / 3.5);
    if (m > 0.04) {
      // Crestas: ruido "plegado" sobre coordenadas deformadas, para que no salgan rectas.
      const wx = x + 5 * n(x * 0.021 + 5.2, d * 0.021 + 1.3);
      const wd = d + 5 * n(x * 0.021 - 3.1, d * 0.021 + 8.7);
      let c = 0;
      let amp = 0.56;
      let f = 0.05;
      let peso = 1;
      for (let o = 0; o < 4; o++) {
        let r = 1 - Math.abs(n(wx * f + o * 19.7, wd * f - o * 7.3));
        r *= r;
        c += amp * r * peso;
        peso = Math.min(1, r * 1.5);
        f *= 2.03;
        amp *= 0.4;
      }
      h = h * (1 - 0.6 * altura.monte) + m * (0.4 + 0.66 * c);
    }
    return h;
  };
  altura.monte = 0;
  return altura;
}

// Número de 32 bits a 16 bits ("half float"), el formato de la textura.
const f32 = new Float32Array(1);
const u32 = new Uint32Array(f32.buffer);
function aMedio(v) {
  f32[0] = v;
  const x = u32[0];
  const signo = (x >>> 16) & 0x8000;
  const e = ((x >>> 23) & 0xff) - 127 + 15;
  let m = x & 0x7fffff;
  if (e >= 0x1f) return signo | 0x7c00;
  if (e <= 0) {
    if (e < -10) return signo;
    m = (m | 0x800000) >> (1 - e);
    return signo | ((m + 0x1000) >> 13);
  }
  return signo | ((e << 10) + ((m + 0x1000) >> 13));
}

// Hornea el relieve en un mapa alineado con la vista: columnas de lado a lado (x = u·d·K, con
// u de -1 a 1) y filas de cerca (D0) al horizonte (D1), más juntas cerca.
// Devuelve la altura (para saber dónde toca el puntero) y la textura: altura, pendiente en x,
// pendiente en d y cuánto es montaña.
export function hornearRelieve({ macizos, RW, RH, D0, D1, PM, KMAPA }) {
  const altura = crearAltura(macizos);
  const alt = new Float32Array(RW * RH);
  const mon = new Float32Array(RW * RH);
  const dist = new Float32Array(RH);
  for (let j = 0; j < RH; j++) {
    const d = (dist[j] = D0 + (D1 - D0) * Math.pow(j / (RH - 1), PM));
    for (let i = 0; i < RW; i++) {
      alt[j * RW + i] = altura(((i / (RW - 1)) * 2 - 1) * d * KMAPA, d);
      mon[j * RW + i] = altura.monte;
    }
  }
  const datos = new Uint16Array(RW * RH * 4);
  for (let j = 0; j < RH; j++) {
    const ja = Math.max(j - 1, 0);
    const jb = Math.min(j + 1, RH - 1);
    const pasoX = (2 * dist[j] * KMAPA) / (RW - 1);
    for (let i = 0; i < RW; i++) {
      const ia = Math.max(i - 1, 0);
      const ib = Math.min(i + 1, RW - 1);
      const u = (i / (RW - 1)) * 2 - 1;
      const hx = (alt[j * RW + ib] - alt[j * RW + ia]) / ((ib - ia) * pasoX);
      // De una fila a la siguiente cambia d y también x (x = u·d·K): se descuenta esa parte.
      const hd = (alt[jb * RW + i] - alt[ja * RW + i]) / (dist[jb] - dist[ja]) - hx * u * KMAPA;
      const k = (j * RW + i) * 4;
      datos[k] = aMedio(alt[j * RW + i]);
      datos[k + 1] = aMedio(hx);
      datos[k + 2] = aMedio(hd);
      datos[k + 3] = aMedio(mon[j * RW + i]);
    }
  }
  return { alt, datos };
}
