// Saca imágenes fijas del mundo 3D (las que acompañan a los ejes de servicio).
// Uso: npx vite --port 5199 &   y luego   node tools/fotos.mjs [carpeta de salida]
import { chromium } from "/opt/npm-tools/node_modules/playwright/index.mjs";
const out = process.argv[2] || "/tmp/fotos";
const FOTOS = JSON.parse(process.argv[3] || "null") || [
  ["palacio", 1100, 1100, { p: [-13, 3.4, 15], l: [1, 5.6, -9], fov: 42 }],
  ["foro", 1100, 1100, { p: [19, 8.5, -101], l: [0, 2.2, -128], fov: 44 }],
  ["distrito", 1600, 760, { p: [22, 15, -34], l: [0, 7, -72], fov: 48 }],
  ["puente", 1600, 900, { p: [14, 6, -138], l: [0, 2, -168], fov: 46 }],
  ["torres", 1600, 900, { p: [-22, 9, -172], l: [0, 8, -205], fov: 46 }],
];
const browser = await chromium.launch({ executablePath: "/usr/bin/google-chrome", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1.5 })).newPage();
await page.addInitScript(() => (window.__foto = { p: [0, 5, 20], l: [0, 5, -9] }));
await page.goto("http://localhost:5199/", { waitUntil: "domcontentloaded", timeout: 90000 });
await page.addStyleTag({ content: ".bar,.hero-copy,.hero-shade{display:none!important}.hero,.hero-stage{height:100vh!important;min-height:0!important}" });
await page.waitForTimeout(5000);
for (const [nombre, w, h, foto] of FOTOS) {
  await page.setViewportSize({ width: w, height: h });
  await page.evaluate((f) => (window.__foto = f), foto);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/${nombre}.png`, timeout: 60000 });
  console.log(nombre);
}
await browser.close();
