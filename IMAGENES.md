# Imágenes de la página principal (versión estática del mockup)

Las imágenes de hoy son recortes de las capturas del mockup (1250 px de ancho), ampliados. Sirven
para armar y revisar la estructura, pero se ven suaves en pantallas grandes. Para la versión final,
exporte desde Adobe XD cada imagen en su tamaño original, guárdela en `public/img/` con el mismo
nombre (formato .webp) y ejecute `npm run standalone`.

| Espacio | Archivo | Tamaño sugerido | Fondo |
|---|---|---|---|
| Premium, Media Training: el ponente con micrófono, de cerca, gesticulando hacia el texto (recorte de `DSC_2913.jpg.jpeg`, Nikon, 4979 × 3434; el fondo blanco del escenario, apenas atenuado) | `media-training.webp` | 1200 × 1282 | foto |
| Blog, entradas 1 a 3 | `k-blog-1.webp` … `k-blog-3.webp` | 1100 × 600 | foto |
| Pie: cúpula | `k-cupula.webp` | 1000 × 940 | ver nota |

- La portada y "Conocimiento que acompaña" ya no usan imagen: son 3D (`src/portada3d.js` y
  `src/templo3d.js`).
- Las ilustraciones sobre fondo oscuro se mezclan con el fondo de la sección (modo "aclarar"),
  así que no hace falta recortarlas.
- La cúpula hoy incluye el fondo claro y el oscuro de la captura. Con un PNG o WebP de fondo
  transparente, se puede simplificar su estilo (`.g-cupula` en `src/home.css`).
- Las fotos del blog deben ser propias o tener licencia de uso.
