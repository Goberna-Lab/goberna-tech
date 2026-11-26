// Genera goberna-tech.html: la web completa en un solo archivo (CSS, JS, three.js y logo incluidos).
// Uso: npm run standalone
import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";

execSync("npx vite build", { stdio: "inherit" });

let html = readFileSync("dist/index.html", "utf8");
const dataUri = (file) => `data:image/svg+xml;base64,${readFileSync(file).toString("base64")}`;

html = html.replace(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/, (_, href) => {
  // Tipografías: se incrusta solo el woff2 (el woff de respaldo se descarta).
  const css = readFileSync("dist" + href, "utf8")
    .replace(/,\s*url\([^)]+\.woff\)\s*format\(["']woff["']\)/g, "")
    .replace(/url\((\/assets\/[^)]+\.woff2)\)/g, (_, font) => {
      return `url(data:font/woff2;base64,${readFileSync("dist" + font).toString("base64")})`;
    });
  return `<style>${css}</style>`;
});
// El script va al final del body: un módulo en línea se ejecuta al terminar de leer el documento.
let script = "";
html = html.replace(/<script type="module"[^>]*src="(\/assets\/[^"]+\.js)"[^>]*><\/script>/, (_, src) => {
  script = readFileSync("dist" + src, "utf8").replace(/<\/script/gi, "<\\/script");
  return "";
});
html = html.replace("</body>", () => `<script type="module">${script}</script>\n</body>`);
html = html.replace(/"\/([\w-]+\.svg)"/g, (_, name) => `"${dataUri("public/" + name)}"`);
// Imágenes: en el HTML y también dentro del JS de los módulos (src/modulos/img.js), con cualquier comilla.
html = html.replace(/(["'`])\/(img\/[\w-]+\.webp)\1/g, (_, q, name) => {
  return `${q}data:image/webp;base64,${readFileSync("public/" + name).toString("base64")}${q}`;
});
if (/\/img\/[\w-]+\.webp/.test(html)) throw new Error("Quedaron imágenes sin incrustar");

if (/(src|href)="\/[\w-]/.test(html) || /url\(\/assets\//.test(html) || !script) throw new Error("Quedaron referencias sin incrustar");
writeFileSync("goberna-tech.html", html);
console.log("goberna-tech.html", (html.length / 1024).toFixed(0) + " KB");
