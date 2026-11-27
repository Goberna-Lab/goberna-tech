# Cambios

## La imagen para compartir es solo el logo (27/11/2026)

Pedido: "el metadato debe ser esto" (el logo del header sobre el fondo oscuro).

- **`public/og-imagen.jpg`**: ahora es solo el logo de Goberna Tech (`public/img/logo-goberna.webp`, el del header),
  grande y centrado sobre el fondo oscuro con estrellas de la portada. Sin lema ni globo.
- **`index.html`**: la dirección de la imagen pasa a `?v=4` para que las redes bajen la nueva.

## Imagen para compartir con el logo del header (27/11/2026)

Pedido: usar el logo real del header en el metadato.

- **`public/og-imagen.jpg`**: regenerada con el mismo archivo del header (`public/img/logo-goberna.webp`), un poco más
  grande (112 px en vez de 96).
- **`index.html`**: la dirección de la imagen pasa a `?v=3` para que WhatsApp, Facebook y LinkedIn bajen la nueva en
  vez de mostrar la vista previa guardada.

## "Del Grupo Goberna" en la portada (27/11/2026)

Pedido: agregar abajo "Del Grupo Goberna", enlazado a https://grupogoberna.com/.

- **Portada** (`index.html`, `src/home.css`): al pie del hero, a la izquierda y alineado con el título (antes estaba en el
  pie de página), con el texto "Del Grupo" y el logo blanco de
  Grupo Goberna (`public/img/logo-grupo-goberna.webp`, tomado de su web). Todo es un solo enlace que abre
  grupogoberna.com en otra pestaña.

## Foto en la tarjeta del primer artículo del blog (27/11/2026)

Pedido: agregar a la tarjeta del 51% una imagen coherente con el tema, que no parezca hecha con IA.

- **Tarjeta** (`index.html`, `src/home.css`): el dato sigue igual, ahora sobre una foto de un público visto de espaldas
  (`public/img/blog-100-dias.webp`, del PDF del foro), con un tinte azul suave y un velo oscuro a la izquierda para que
  el 51% y el texto se lean. Va con la idea del artículo: no perder al electorado.

## Foto del aviso del Foro menos "IA" (27/11/2026)

Pedido: la imagen del podio parecía demasiado generada por IA; algo parecido pero más sutil.

- **Foto** (`public/img/foro-podio.webp`): ahora es la otra foto del PDF del foro (página 10), un expositor frente al
  público (foto real), con un tinte azul suave en vez del duotono marcado. Se conservan algo de color y textura.
- `index.html`: dimensiones de la imagen ajustadas (1200×800).

## Los botones vuelven al dorado (27/11/2026)

Pedido: "solo quería cambiar lo de TECH del logo principal"; los botones, con la paleta anterior.

- **Botones** (`src/home.css`): `.g-btn-oro` (fondo `--g-oro` #c9a46e, hover #b9924a), `.g-btn-linea-oro` y el
  borde blanco del segundo botón de la portada vuelven a como estaban. Se quitó `--g-amarillo`, que solo usaban ellos.
- Sigue en el amarillo del logo (#FCC506) solo "TECH" del título de la portada (el color va en el propio SVG).

## "GOBERNA TECH" en un renglón (27/11/2026)

Pedido: que "GOBERNA" y "TECH" no vayan uno sobre otro sino juntos, como en el header, y un poco más chicos.

- **Portada** (`src/home.css`): el título va en un solo renglón, con el mismo espacio entre palabras que el logo
  (0.157em) y las dos palabras alineadas arriba, como en el .ai. Es un 25% más bajo que antes en escritorio; en
  celular ocupa casi todo el ancho sin desbordar (revisado a 1440, 820, 390 y 320 px).

## Botones en el amarillo del logo (27/11/2026)

Pedido: que los botones usen la misma paleta que el logo y "TECH" de la portada.

- **Nuevo color** (`src/home.css`): `--g-amarillo: #fcc506`, el amarillo del logotipo.
- **Botón principal** (`.g-btn-oro`, en toda la web: "Conoce Goberna Tech", "Regístrate", "Ver servicios",
  "Quiero ver todo", "Agenda una reunión", "Cotiza tu estrategia digital"…): fondo amarillo con texto azul oscuro;
  al pasar el mouse, un amarillo apenas más hondo.
- **Botón de borde dorado** (`.g-btn-linea-oro`, "Ver todo" del blog): borde amarillo; el texto, un amarillo
  oscurecido para que se lea sobre el fondo claro.
- **Portada**: el borde de "Agenda una reunión" pasa del blanco al amarillo.
- El resto de los dorados de la web (`--g-oro`: acentos, la red y los arcos del globo) no cambió.

## Etiquetas para compartir completas (27/11/2026)

Pedido: "el meta dato y meta imagen agrégalo también, no tiene".

- **Arriba del todo** (`index.html`): las etiquetas para compartir van justo después del título y la descripción,
  antes de los íconos. En la versión de un solo archivo (GitHub Pages) quedaban detrás del ícono incrustado y del
  CSS; algunos lectores de enlaces solo leen el comienzo de la página.
- **Agregadas**: `canonical`, `robots`, `og:image:secure_url`, `twitter:title`, `twitter:description`,
  `twitter:image`, `twitter:image:alt` y el ícono para celulares (`public/apple-touch-icon.png`, el isotipo amarillo
  sobre el azul del logo).
- **Cada sitio con su dirección**: antes gobernatech.com decía que su página y su imagen estaban en github.io. Ahora
  las direcciones salen de `VITE_SITIO`: `https://gobernatech.com/` por defecto (archivo `.env`) y la de github.io
  en `.github/workflows/deploy.yml`, que además copia `apple-touch-icon.png` junto a `og-imagen.jpg`.
  El despliegue a gobernatech.com (`.github/workflows/deploy-vps2.yml`) la recibe también como variable, porque
  `.env` no se sube al repo.
- **La imagen lleva `?v=2`**: WhatsApp y Facebook guardan la vista previa por dirección; con la nueva bajan la
  imagen con el logo actual. Subir el número cada vez que se reemplace `public/og-imagen.jpg`.
- **Ícono de la pestaña** (`public/isotipo.svg`): ahora es el isotipo del archivo vectorial del equipo.

## El nombre de la portada con las letras del logo (27/11/2026)

Pedido: "el mismo logo de goberna tech el del header debe ser el mismo que está en el hero".

- **Portada** (`index.html`): el título "GOBERNA / TECH" ya no es texto en Montserrat sino las letras del logotipo,
  en dos SVG sacados del archivo vectorial del equipo (`LOGO-GOBERNA-TECH-.ai` de la carpeta de Drive):
  "GOBERNA" en blanco y "TECH" en el amarillo del logo (`#FCC506`), con su "E" y su "H" cortadas. Cada SVG lleva
  `role="img"` y `aria-label`, así que el h1 se sigue leyendo "Goberna Tech".
- **Tamaño** (`src/home.css`): igual que antes; el tamaño de letra del h1 da la escala y cada palabra mide lo que
  medían sus mayúsculas. Se quitó el degradado plateado de "GOBERNA" y el dorado de "TECH".
- **El mundo** (`src/globo3d.js`): para ubicarse a la derecha medía el texto de la portada; ahora mide también los
  dos SVG del nombre.

## Logo sin dorado (27/11/2026)

Pedido: "usa estos logos (carpeta de Drive del equipo), no uses el dorado, no usamos logo dorado".

- **Header y pie** (`index.html`): ahora usan `public/img/logo-goberna.webp`, la versión horizontal plana de la raíz
  de la carpeta (`02-TECH@3x.png`: "GOBERNA" en blanco, "TECH" y el isotipo en amarillo `#FCC506`, con el lema
  "Consultoría | Gubernamental | Inteligencia"). Es la variante para fondo oscuro, que es el de la barra y el pie.
- Se borró `public/img/logo-goberna-tech.webp` (la dorada con degradado). No usar la carpeta "Dorado" ni los PNG
  de "V1" con degradado metálico.
- **Imagen para compartir** (`public/og-imagen.jpg`): el logo dorado se reemplazó por el plano.
- **Ícono de la pestaña** (`public/isotipo.svg`): del ámbar anterior al mismo amarillo del logo.
- Para fondos claros, la carpeta trae la variante con "GOBERNA" en azul (`04-TECH@3x.png`); hoy no hace falta.

## Aviso del Foro de Alcaldes y Gobernadores (27/11/2026)

Pedido: llevar a la landing el Foro de Alcaldes y Gobernadores (PDF y afiche del evento).

- **Dónde** (`index.html`): una tarjeta justo después de la portada (`<section class="g-foro" id="foro">`), con el
  nombre del foro, los ejes, la fecha (sábado 12 de diciembre, 3:00 p. m.) y el lugar (Av. Rivera Navarrete 395, San Isidro).
- **Botones**: "Regístrate" lleva a la página del foro que ya existe aparte
  (gobernatech.com/foro-de-alcaldes-y-gobernadores/, con su propio formulario). "Más información" abre WhatsApp al
  907 772 155 con un mensaje sobre el foro. No se duplicó la página del foro en este proyecto.
- **Foto** (`public/img/foro-podio.webp`): la del podio del PDF (página 10), en duotono azul como el afiche.
- **Se quita sola** (`src/home.js`): la sección lleva `data-hasta="2026-12-13T00:00:00-05:00"`; pasado ese
  momento, el script la elimina. Sirve para cualquier aviso futuro con fecha de vencimiento.

## Logo original de Goberna Tech (27/11/2026)

Pedido: usar los logos originales de la carpeta de Drive del equipo, no el `logo.svg` anterior.

- **Header y pie** (`index.html`): ahora usan `public/img/logo-goberna-tech.webp`, la versión horizontal dorada
  (carpeta "Dorado", `08-GOBERNA TECH@3x.png`), con el lema "Consultoría | Gubernamental | Inteligencia". Se eligió
  la dorada con degradado y no la amarilla plana porque combina con el dorado menos saturado del sitio.
- **Imagen para compartir** (`public/og-imagen.jpg`): regenerada con el mismo logo.
- `public/logo.svg` queda en el proyecto pero ya no lo usa la portada.

## El formulario pasa al final de la portada (26/11/2026)

Pedido: que el formulario no esté en una página aparte sino abajo, justo antes del pie.

- **Dónde** (`index.html`): la página `#contacto` deja de existir; su contenido es ahora la última sección de la
  portada (`<section class="g-contacto" id="contacto">`), después del blog. Fondo blanco para separarla del blog.
- **La cúpula** que asoma sobre el pie se mudó del blog a esta sección (sigue siendo la última antes del pie); el
  blog recupera un padding inferior normal.
- **Enlaces** (`src/home.js`): todos los `#contacto` ("Agenda una reunión", los servicios, el artículo, las
  plataformas) abren la portada y bajan al formulario; los de servicios siguen dejando elegido el interés.
- **Diseño de tarjeta** (pedido después: "hay demasiado espacio sobrante"): el bloque es ahora una sola tarjeta
  centrada (máx. 1180 px) sobre fondo gris claro. A la izquierda, un panel azul con "Contacto", el título, el texto,
  tres pasos de qué pasa después (revisamos, te escribimos, coordinamos) y abajo el WhatsApp +51 907 772 155; a la
  derecha, el formulario. Las dos mitades miden lo mismo, así que ya no queda el hueco bajo el título. En celular
  y tablet angosta, el panel va arriba y el formulario debajo.
- **Más corto** (pedido: "mucho texto", "no menciones municipalidad"): el panel queda en "Contacto",
  "Conversemos", "Cuéntanos qué necesitas y te contactamos." y el WhatsApp; se quitaron los tres pasos. El hueco
  del panel lo llena el escudo, grande y casi transparente (`isotipo.svg` como fondo).
- **Formulario como el del Foro de Estado** (`Cta.astro` de foro-estado): seis campos en dos columnas con ícono
  (Nombre, Apellido, WhatsApp, Correo, Organización, Cargo), todos obligatorios; botón redondeado "Agenda una
  reunión →" en el dorado nuevo y la nota "Al enviar aceptas ser contactado por el equipo de Goberna Tech".
  Salen "Qué te interesa", "Cuéntanos más" y la casilla de novedades. El interés que dejan los botones de
  servicios sigue viajando, en un campo oculto. A Bravo van `name` (nombre y apellido), `email`, `phone` y, como
  extras, nombre, apellido, organización, cargo e interés.
- **Sin el WhatsApp en el panel** (pedido): se quitó "¿Prefieres WhatsApp? +51 907 772 155". El número sigue en el
  botón flotante y en el aviso de error del formulario.
- **`scripts/build-standalone.mjs`**: ahora también incrusta los SVG que el CSS usa de fondo (`url(/x.svg)`);
  antes no hacía falta y en GitHub Pages el escudo de fondo habría salido roto.

## Dorado menos saturado (26/11/2026)

Pedido: Nat avisa que el amarillo se ve muy saturado en televisores grandes; propuso #C9A46E y #B9924A.

- **Dorado principal → `#C9A46E`** (`--g-oro` en `src/home.css`, `--gold` en `src/style.css` y todos los
  `rgba()` dorados de las dos hojas). Antes `#DFA52E` y `#F5AF31`. Los dos tonos de Nat tienen la misma saturación
  (~45 %, contra 74–91 % de los anteriores); este es el más claro, así que sobre el azul noche se sigue leyendo bien
  (contraste 8,5:1 contra 6,8:1 de `#B9924A`) y no se ve marrón en pantallas oscuras.
- **`#B9924A` para el hover** de los botones dorados (antes se aclaraban a `#EFB94A`/`#FFC452`).
- **Imagen para compartir** (`public/og-imagen.jpg`): "territorios" pasa al dorado nuevo.
- **No cambia**: el logo (sigue con su `#F5AF31`) ni las luces del globo y de la red del fondo (`src/globo3d.js`,
  `src/red-fondo.js`).

## Botón flotante de WhatsApp y formulario conectado a Bravo (26/11/2026)

Pedido: un botón flotante de WhatsApp al +51 907 772 155 y un formulario que funcione, como los que ya hay en Goberna.

- **WhatsApp** (`index.html`, `.g-wsp` en `src/home.css`): círculo verde abajo a la derecha en todas las páginas,
  con el ícono del Foro de Estado. Abre `wa.me/51907772155` con "Hola, quiero información sobre Goberna Tech".
- **Formulario** (`#contacto`): mismo diseño, con dos campos nuevos: "Teléfono o WhatsApp" (obligatorio, como en
  el Foro) y "Cuéntanos más" (opcional). Institución pasa a ocupar todo el ancho.
- **Envío** (`src/home.js`): igual que el Foro, a Bravo (`POST https://bravo.goberna.us/v1/public/contact`) con
  el tenant `goberna-tech`. Van nombre, correo, teléfono y mensaje; cargo, institución, interés y si quiere
  novedades llegan como datos extra. Tiene la trampa para bots del Foro (campo `website` oculto). Si sale bien,
  agradece y limpia el formulario; si falla, avisa y ofrece el enlace a WhatsApp.
- **Pendiente**: el tenant `goberna-tech` hay que crearlo en Bravo
  (`npm run create-tenant -w @goberna/bravo-api -- goberna-tech "Goberna Tech"`). Mientras no exista, Bravo
  responde 404 y todo envío muestra el aviso de error.

## Imagen para compartir el link (26/11/2026)

Pedido: una "metaimagen", la que aparece al pegar el link en WhatsApp, LinkedIn, Facebook o X. Antes salía sin imagen.

- **Imagen** (`public/og-imagen.jpg`, 1200×630, 83 KB): fondo y globo tomados de la portada real (captura del hero
  sin textos), logo de Goberna Tech, "La estrategia transforma territorios" (el título de la página) en Montserrat
  con "territorios" en el dorado de la web (`#f5af31`) y "Tecnología y consultoría para autoridades y líderes."
- **Etiquetas** (`index.html`, en el `<head>`): Open Graph y `twitter:card`. Usan la dirección completa de GitHub
  Pages; si la web pasa a otro dominio hay que cambiar `og:url` y `og:image`.
- **Despliegue** (`.github/workflows/deploy.yml`): además de la página, copia `og-imagen.jpg` al sitio, porque la
  versión de un solo archivo no la incluye y las redes necesitan pedirla por su dirección.

## Primer artículo del blog: "Ganaste, ¿ahora qué?" (26/11/2026)

Pedido: publicar el primer artículo con el texto del documento de Google Docs "Ganaste, ¿ahora qué?".

- **Texto**: la versión redactada del final del documento (título, bajada y cuatro secciones). El resto del documento
  (copys para anuncios, carrusel y un CV) no es parte del artículo y no se usó. Único cambio al texto: "la
  presidente" → "la presidenta", como dice el mismo artículo más abajo.
- **Página** (`index.html`, `#ganaste-ahora-que`; ruta en `src/home.js`): ruta Blog / Comunicación política, título,
  bajada, cuerpo de lectura, el dato de la encuesta como gráfico (51% No · 44% Sí · 5% No sabe, con la fuente) y un
  cierre "Cotiza tu estrategia digital" que lleva a contacto. "Volver al blog" regresa a la sección.
- **Tarjeta** (primera del blog): toda la tarjeta abre el artículo. La portada es el dato del artículo (51%) sobre el
  fondo de la marca, sin foto: las imágenes del proyecto no iban con el tema (la anterior era de inteligencia
  artificial) y una foto de la presidenta o de medios necesitaría derechos.
- Las otras dos tarjetas siguen siendo de muestra.

## La portada pierde la fila de los tres ejes (26/11/2026)

- Se quitó del hero la fila "Gobierno y gestión / Escuela y formación / Estrategia electoral" (`index.html`,
  `src/home.css`). Los ejes siguen en el menú y en su sección. El globo (`src/globo3d.js`) ya contemplaba que la fila
  no estuviera y ahora usa todo el alto.

## La página de servicios, según el diseño de la interna en Adobe XD (26/11/2026)

Pedido: trabajar las internas con el contenido del prototipo de Adobe XD ("GOBERNA-TECH-1920X1080", pantalla 2 de 2).

- **Fuente**: la pantalla interna del XD (banner, un bloque por eje con un servicio a la vez y foto, servicios
  premium en tarjetas de foto, pie con filete dorado) y dos capturas de variantes del carrusel que trae el mismo
  XD (barra segmentada por servicio, "Fin de este eje" en el último). Las fotos se tomaron de los recursos del XD
  (las de los ejes 1 y 3, recortadas de esas capturas) y se guardaron optimizadas en `public/img/sv-*.webp`
  (~1 MB en total).
- **Página** `#nuestros-servicios` (`index.html`, `src/ejes.js`, `src/home.css`, "Página de servicios"):
  - Banner (en el XD estaba vacío): el chip de luz azul del diseño de fondo, "Cómo te acompañamos", una línea y
    accesos a los tres ejes.
  - Un bloque por eje, a lo ancho: claro (Gobierno y gestión), claro más oscuro (Escuela y formación) y oscuro
    (Estrategia electoral). Rótulo "Eje 1. Gobierno y gestión", ícono dorado subrayado, título grande, intro y un
    servicio a la vez con su acción subrayada en oro ("Agenda una reunión ↗"). Debajo, la barra segmentada, el
    contador ("01 / 05"), "Siguiente: …" y las flechas redondas (blanca y dorada). A la derecha, la foto del
    servicio (se funden al cambiar) con "Goberna Tech / 01" al pie y el número del eje gigante de marca de agua.
    Flechas del teclado y deslizamiento del dedo.
  - Servicios Premium en fondo blanco: dos tarjetas de foto a lo ancho (Legado: "Tu gestión termina. Tu legado
    permanece."; Media Training Presidencial) con "Quiero ver todo".
- Los textos de los 12 servicios son los de siempre (el XD trae textos de relleno en algunos lugares).
- Los enlaces a un eje (#eje-gobierno…) o a un servicio (#editorial, #escuela-de-gobierno, #media-training…) abren
  la página en ese eje y en ese servicio. Las pestañas con carrusel de tarjetas (`src/carrusel.js`) quedaron
  guardadas sin usar.
- El pie del sitio lleva el filete dorado arriba, como en el diseño.
- Fotos por servicio: varias son imágenes de apoyo del XD (tecnología, datos) y algunas se repiten entre un
  servicio y los premium (auditorio, conferencia). Conviene reemplazarlas por fotos propias de cada servicio.
- `goberna-tech.html` pasa de ~2,9 MB a ~4,2 MB por las fotos incrustadas.

## Montserrat Bold en todos los títulos (26/11/2026)

Pedido: usar Montserrat Bold (antes solo estaba en el título de la portada y en algunos títulos nuevos).

- `src/home.css`, "Tipografía de títulos" (al final): todos los títulos del sitio (h1–h4, títulos de sección, de
  tarjetas, de las páginas internas y de cada plataforma, las pestañas de servicios y los nombres de las
  plataformas) van en Montserrat 700. Catamaran queda para el texto corrido; los antetítulos dentro de un título
  ("Tu legado", "Media Training") siguen en Catamaran. Auditado en todas las páginas: ningún título visible quedó
  en otra fuente.
- Ajuste: en el celular, cada nivel de gobierno tiene más alto (los textos nuevos, más largos, se pisaban a 360 px).

## Servicios, a su página; Servicios premium, en una sola franja (26/11/2026)

Pedido: el detalle de servicios (pestañas y carrusel) debe ir a una página interna; Servicios premium puede
reducirse a una sola franja para que el inicio no sea tan largo.

- **Página de servicios** `#nuestros-servicios` (`index.html`, `src/home.js`, `src/home.css`): "Cómo te
  acompañamos", una línea de presentación, las pestañas con el carrusel de cada eje y una invitación a agendar una
  reunión. En el inicio quedan las tres tarjetas de ejes; su "Ver servicios" (y los ejes del menú, "Editorial" y
  "Cursos") abren la página en la pestaña del eje y traen el servicio a la vista. "Servicios" del menú y del pie
  lleva a la página.
- **Servicios premium**: una franja con el título y dos tarjetas horizontales lado a lado (imagen a un costado,
  rótulo, título, una línea, y en el legado sus tres etapas en una línea), con la acción como enlace dorado. En
  pantallas medianas, una debajo de la otra; en el celular, la imagen arriba. Se quitó la escena 3D de las etapas
  del legado (`src/legado3d.js`, guardado sin usar): una escena WebGL menos.
- El inicio pasó de 6.756 px a 4.388 px de alto en escritorio (−35 %).
- Arreglo: con pestañas, los paneles 2.º y 3.º ya no arrastran el margen del panel anterior (dejaba un hueco).

## El mundo 3D, rediseñado: globo de puntos con una red mundial viva (26/11/2026)

Pedido: el globo se veía extraño y poco agradable; que sea más llamativo y que no se enfoque solo en el Perú.

- **Diagnóstico**: cuerpo casi negro (más oscuro que el fondo: parecía un agujero recortado), sin luz ni volumen,
  demasiadas líneas (costas, fronteras, arcos rectos y otros que se salían de la silueta) y un armado por teselas
  voladoras que se veía como una falla.
- **Ahora** (`src/globo3d.js`):
  - Esfera azul noche con luz (clara arriba a la izquierda, sombra suave), brillo leve sobre el agua y atmósfera
    en el borde.
  - Continentes en puntos (semitono); un barrido de luz los recorre cada tanto. Costas apenas; sin fronteras.
  - Red mundial: 26 arcos dorados entre capitales de los cinco continentes. Cada uno se traza, lo recorre un
    cometa de luz y se borra, desfasado de los demás. Se apagan al llegar al borde del globo.
  - Nodos (ciudades de la red) dorados que laten con un anillo que se abre.
  - Dos órbitas finas, inclinadas, cada una con un satélite de luz que deja estela.
  - Sin foco en el Perú: Lima es un nodo más. La vista inicial mira al Atlántico.
  - Aparece encendiéndose y creciendo apenas (sin teselas); al bajar se desvanece. Se mantienen el giro, el
    arrastre con inercia y la onda dorada del clic (ahora enciende los puntos).

## "Conocimiento que acompaña": niveles de gobierno para cualquier país (26/11/2026)

Pedido: "Nacional, regional y provincial lo reduce mucho a Perú".

- Los niveles pasan a **Internacional** (organismos multilaterales, cooperación y redes de gobiernos), **Nacional**
  (presidencias, ministerios, parlamentos y candidaturas), **Regional** (gobernaciones, estados, provincias y
  regiones) y **Local** (alcaldías, concejos municipales y candidaturas locales). Fuera las cifras del Perú; en su
  lugar, la escala de cada nivel. El rótulo dice "Acompañamos a todos los niveles de gobierno, en cualquier país".

## Misión y visión, en la página de Nosotros (26/11/2026)

Pedido: que misión y visión vayan a la página interna de Nosotros.

- Nueva página `#quienes-somos` (`index.html`, `src/home.js`, `src/home.css`): rótulo "Nosotros", título
  "Quiénes somos", la presentación, las tarjetas de misión y visión y una invitación a agendar una reunión.
- "Nosotros" y "Quiénes somos" (menú, menú del celular y pie) y el botón "Conoce Goberna Tech" llevan ahí;
  "Misión" y "Visión" abren la página y bajan a su tarjeta. El inicio ya no las tiene.

## El puntero dorado, solo sobre el mundo 3D (26/11/2026)

Pedido: que el puntero propio (aro dorado con punto) se vea solo dentro del mundo 3D; fuera, no.

- **Antes**: el puntero propio reemplazaba al del sistema en toda la página.
- **Ahora** (`src/home.css`, "Puntero propio"; `src/globo3d.js`): aparece solo con el mouse sobre el globo de la
  portada (o mientras se arrastra), punteado para indicar que se puede girar; en el resto de la página vuelve el
  puntero normal del sistema. Al bajar con la rueda sin mover el mouse, el globo deja de contar como "debajo"
  y el puntero propio se apaga. `src/cursor.js` no cambia de lógica (solo su comentario).

## Servicios: cada eje, un carrusel (26/11/2026)

Pedido: un carrusel mejor para las tarjetas de servicios.

- **Antes**: grilla de tarjetas; en "Gobierno y gestión" la 5.ª quedaba sola en una segunda fila, las alturas y los
  botones no calzaban (la 02 traía dos botones apilados) y cada tarjeta repetía un botón con borde.
- **Ahora** (`src/carrusel.js`, `index.html`, `src/home.css`): cada pestaña es una pista horizontal con encaje. En
  escritorio se ven 3 tarjetas y, si hay más, asoma la 4.ª (invita a deslizar); en tableta 1,6; en el celular 1,1.
  Con 3 servicios entran exactas y no hay controles.
  - Cabecera: contador en mono ("03 / 05", la última tarjeta que se ve entera) y flechas circulares que se apagan en
    los extremos. Debajo, una barra de progreso dorada.
  - Arrastre con el mouse que encaja en la tarjeta más cercana (y no dispara el enlace que quedó debajo); en
    táctiles, el deslizamiento propio; con el foco en la pista, las flechas del teclado. Fundido en el borde
    derecho mientras quedan tarjetas por ver.
  - Tarjetas del mismo alto, con la acción al pie como enlace dorado ("Agenda una reunión →", "Inscríbete →",
    "Cotiza el servicio →"…) tras una línea fina, todas a la misma altura. Suben un poco al pasar el mouse.
- Sin JavaScript se ve la grilla de antes. Los enlaces a un servicio (#editorial, #escuela-de-gobierno) siguen
  abriendo su pestaña y llevándolo a la vista.

## Portada: red de inteligencia de fondo (26/11/2026)

Pedido: darle al fondo de la portada una red de inteligencia sutil (referencia: nodos dorados y azules unidos por
líneas, con bokeh), con movimiento si conviene.

- **Qué se ve** (`src/red-fondo.js`, `index.html`, `src/home.css`): nodos dorados (la mayoría) y azules en tres
  profundidades (lejanos chicos y tenues, medios nítidos, unos pocos cercanos grandes y desenfocados), unidos por
  líneas finas cuando están cerca. Va detrás del mundo.
- **Movimiento**: los nodos derivan muy lento (la red se arma y se desarma sola), cada tanto un pulso de luz
  recorre una conexión y, con el mouse, la red se corre apenas por capas (paralaje).
- **Sutil a propósito**: mucho más tenue que la referencia, para no competir con el globo ni con el título. Se
  apaga detrás del texto (a la izquierda; en vertical, arriba) y se funde hacia la barra y la fila de ejes.
- **Liviana**: canvas 2D (no otra escena WebGL), 30 cuadros por segundo como mucho, densidad de píxeles limitada,
  pausada con la portada fuera de pantalla o la pestaña oculta. Con "reducir movimiento" queda quieta.
- **Convive con el mundo**: el globo se achicó (~22 %) y la red deja un claro a su alrededor (se desvanece entre 1 y
  1,7 radios del globo; `globo3d.js` publica su centro y radio en `data-globo` de la portada). Algo menos densa
  (hasta 80 nodos). El globo queda de protagonista y la red, de ambiente.
- **Blindaje**: si la hoja de estilos no llega (pasó en desarrollo: el servidor leyó `home.css` vacío mientras se
  guardaba), los lienzos quedaban dentro de la portada en vez de encima; al medirse la agrandaban y se volvían a
  medir, sin fin (la página llegó a 25 millones de px y colgaba la pestaña). Ahora `red-fondo.js` y `lienzo3d.js`
  no se miden si el lienzo no está posicionado.

## Misión y visión, en dos tarjetas lado a lado (26/11/2026)

Pedido: que misión y visión no estén tan separadas, que algo encasille sus textos y que se vean más chicas
(ocupaban demasiado y se veía desordenado).

- **Antes**: dos bloques apilados, título a la izquierda y frase enorme (hasta 3,2 rem) a la derecha, con 140 px de
  aire arriba y abajo de cada uno: casi dos pantallas.
- **Ahora** (`index.html`, `src/home.css`, "Misión y visión"): un rótulo "Nuestro propósito" y dos tarjetas pares,
  lado a lado, en el mismo vidrio oscuro de la fila de ejes de la portada y de los niveles de gobierno: línea dorada
  arriba (se alarga al pasar el mouse), número en mono ("01", "02") y título en Montserrat Bold. El texto baja a
  1,1–1,7 rem. Las palabras se siguen encendiendo al leer (`src/credo.js`, sin cambios). En celular se apilan.

## "Conocimiento que acompaña": los niveles de gobierno reemplazan al chip del capitolio (26/11/2026)

Pedido: quitar el capitolio sobre el chip (3D) y poner algo relevante en su lugar.

- **Por qué no otra pieza 3D**: era la cuarta escena WebGL de la página (globo, capitolio, legado); competía con el
  globo de la portada, pesaba y no decía nada concreto. El texto de la sección promete asesoría "a políticos y
  autoridades de **todos los niveles de gobierno**": eso es lo que se muestra.
- **Qué se ve** (`index.html`, `src/niveles.js`, `src/home.css`): una pirámide de cuatro placas isométricas de
  vidrio (Nacional, Regional, Provincial y Distrital), de la más chica arriba a la más grande abajo, con la grilla
  cada vez más fina (el territorio que se fragmenta). Las atraviesa un hilo dorado (el acompañamiento) con un pulso
  que baja. Al lado de cada placa, su etiqueta: a quién se acompaña en ese nivel y cuántos gobiernos hay.
- **Movimiento**: los niveles se encienden solos, uno cada 3,2 s, mientras la figura está en pantalla; el nivel
  encendido sube un poco y se vuelve dorado. Al pasar el mouse por una etiqueta o una placa se enciende esa.
  Con "reducir movimiento" no hay recorrido ni pulso.
- Es HTML y CSS (se lee, se indexa y no carga three.js para esta sección).
- **Cifras a confirmar con Goberna**: 1 gobierno nacional, 25 gobiernos regionales, 196 municipalidades provinciales
  y "+1 800" municipalidades distritales.
- **Guardado sin usar**: el chip que construye el edificio (`src/templo3d.js`).
- `goberna-tech.html` regenerado.

## La portada pasa a un hero centrado con el mundo en 3D interactivo (26/11/2026)

Pedido: rediseñar el hero tomando como referencia el de vercel.com, sin perder la paleta de Goberna, y que el mapa
no sea solo el Perú sino el mundo: un globo al que se le pueda hacer clic y se mueva sutilmente con un efecto.

- **Composición** (`index.html`, `src/home.css`, "1. Portada"): el nombre, la frase y los dos botones (el rótulo
  "Inteligencia estratégica" se quitó). Unas guías verticales finas enmarcan la columna y
  abajo va la fila de los tres ejes (Gobierno y gestión, Escuela y formación, Estrategia electoral) en vidrio oscuro,
  con cruces doradas en las esquinas; cada eje lleva a su pestaña de Servicios. Se fue "Desliza para explorar".
- **Portada partida**: el texto a la izquierda y el mundo a la derecha. El nombre va en **Montserrat Bold**
  (`@fontsource/montserrat`, local), en dos renglones: "Goberna" blanco y "Tech" dorado. En pantallas verticales
  el texto va arriba y el globo debajo.
- **El mundo** (`src/globo3d.js`, que estaba guardado sin usar): entero, en el lado derecho, centrado en el alto
  libre entre la barra y la fila de ejes, con aire arriba y abajo, sin pisar el texto. Se arma por teselas al cargar y se desarma con el scroll, como antes.
  Arranca mirando a América con Lima, el nodo de oro, a la vista.
- **Se mueve solo, sutil**: gira de oeste a este (una vuelta cada ~2 min), flota unos píxeles arriba y abajo
  (ciclo de 9 s) y su eje respira apenas (14 s). La cámara se corre un poco hacia el puntero.
- **Interacción**:
  - **Arrastrar** gira el globo (con el mouse, en cualquier dirección; en táctiles, solo de lado para no robarle el
    scroll a la página) y al soltarlo sigue con inercia. La inclinación vuelve sola.
  - **Clic o toque** sobre el planeta: sale una onda dorada desde ese punto que tiñe de oro costas, fronteras y luces
    a su paso; el globo late apenas y gira un poco hacia donde se tocó. Hasta tres ondas a la vez.
  - Sobre el globo, el aro del puntero propio se vuelve punteado (sin puntero propio, la mano de arrastrar).
- **Fundido**: el globo se apaga detrás del texto (caja medida sobre las letras y los botones) y detrás de la fila de
  ejes, y se funde abajo con la sección siguiente.
- Con "reducir movimiento" el globo queda quieto y armado, sin interacción ni pista.
- **Guardado sin usar**: la foto de América Latina con foco en el Perú (`src/portada-mapa.js`; su CSS sigue en
  `home.css`).
- `goberna-tech.html` regenerado.

## La portada pasa a la foto de América Latina del Foro de Estado, con foco en el Perú (25/11/2026)

Pedido: usar en el hero de Goberna Tech el mismo mapa de la landing del Foro de Estado (`Foro-estado2`), pero
con algo que lo haga ver distinto.

- **La foto** (`public/img/hero-mapa.webp`) y el halo detrás del texto (`public/img/hero-brillo.webp`) son los del
  hero del Foro. Lo de encima es propio (`index.html`, `src/portada-mapa.js`, `src/home.css`):
  - **Entrada de cámara**: se ve el continente entero y la cámara se acerca al Perú (3 s).
  - **Foco en el Perú**: el resto del continente queda en penumbra y el Perú se ilumina en dorado, con su silueta
    real (Natural Earth, `src/peru.js`) trazándose encima.
  - **Red**: de Lima a las 23 capitales de región (las de `peru3d.js`). Cada 6 s una onda sale de Lima y enciende
    las capitales a medida que las alcanza.
- **Por qué el Perú y no los arcos a otros países del Foro**: en el Foro los arcos a México, Bogotá, Buenos Aires,
  etc. tienen sentido (se licencia el Foro a otros países); en Goberna Tech darían a entender presencia en esos
  países, y el resto del sitio habla del Perú.
- **Calce**: longitud/latitud se pasan al lienzo de la foto (1920 × 949, el del Foro) con un ajuste a mano sobre
  la foto (Punta Pariñas y el codo de Arica); la silueta coincide con la costa y las fronteras de la foto.
- **Encuadre**: en horizontal se recorta el mar de la izquierda (donde va el texto) y el Perú queda donde está; en
  vertical el texto sube y la cámara deja el Perú abajo.
- **Guardado sin usar**: el Perú en hilos de luz (`src/peru3d.js`), igual que el territorio de montañas y el globo.
- Con "reducir movimiento" se ve directo el estado final, quieto.
- `goberna-tech.html` regenerado.

## Munitech pasa a ser el portal del documento; las plataformas, a su propia página (25/11/2026, 6:00 p. m.)

Pedido: averiguar qué es Munitech y dejar la versión correcta.

- **Qué se averiguó**: el documento "GOBERNA TECH - Información" (25/11) es la única fuente que define Munitech:
  "MUNITECH (Edición Perú)", noticias, artículos especializados y repositorio de leyes y normativas para la gestión
  municipal, con fuente Municipio al Día. En este proyecto, "Munitech" se usó desde el 20/11 para las once
  plataformas por decisión de esa sesión (el menú del mockup traía MUNITECH), sin fuente que las llamara así. En la
  web no aparece Munitech (goberna.pe no lo menciona; goberna.pe/munitech da 404; munitech.pe no existe).
- **Munitech** (`index.html`, `src/home.css`): página con el texto del documento y tres secciones, Noticias,
  Artículos especializados y Leyes y normativas, cada una con "Contenido en preparación" hasta que haya contenido
  propio o con permiso (no se copió nada de Municipio al Día). Al pie, la fuente y un enlace a las plataformas.
- **Plataformas** (`#plataformas`, nueva página): las once plataformas por familia, como antes, ahora como parte del
  servicio "Innovación y transformación digital". Se llega desde ese servicio ("Ver plataformas"), desde Munitech y
  desde la ruta de cada plataforma (que ahora dice "Plataformas" en vez de "Munitech").
- `goberna-tech.html` regenerado.

## Los 12 servicios, menú con submenús, "Agenda una reunión" y una sola tipografía (25/11/2026, 5:30 p. m.)

Pedido: "haz los cambios pendientes", sobre la comparación de la web con el documento "GOBERNA TECH - Información".

- **Los 12 servicios del documento** (`index.html`, `src/home.css`, `src/home.js`): debajo de las tres tarjetas de ejes,
  un bloque con una pestaña por eje (Gobierno y gestión, 5 servicios; Escuela y formación, 3; Estrategia electoral, 4).
  Cada servicio tiene su número, título, frase gancho, descripción (texto literal del documento) y el botón que pide el
  documento: "Agenda una reunión", "Inscríbete", "Revisa nuestro catálogo" o "Cotiza el servicio". El botón lleva al
  formulario con el servicio ya elegido en "Interés" (cada servicio es una opción, agrupada por eje).
  - Pestañas accesibles: flechas, Inicio y Fin; sin JavaScript se ven los tres ejes uno debajo del otro.
  - En teléfono las pestañas bajan de renglón para que se vean las tres.
  - Las tarjetas de ejes pasan de "Quiero saber más" a "Ver servicios" y abren su pestaña.
  - Pendiente: "Revisa nuestro catálogo" (Editorial) e "Inscríbete" (Escuela) llevan por ahora al formulario;
    cuando exista el catálogo o la página de inscripción, cambiar el enlace.
- **Menú con submenús**: Nosotros → Quiénes somos, Misión, Visión; Servicios → los tres ejes. En escritorio se abren al
  pasar el mouse o con el teclado; en el menú del teléfono van debajo de cada uno.
- **Editorial y Cursos ya llevan a algo**: Editorial al servicio Editorial y Cursos a la Escuela de Gobierno y Gestión
  (abren la pestaña de Escuela y el servicio se marca con borde dorado). También en el pie.
- **Portada**: la frase pasa a "Estrategia, tecnología y consultoría política." (la anterior dejaba fuera lo político
  y electoral) y el botón "Solicitar demostración" pasa a "Agenda una reunión" (también en el menú del teléfono).
  Las páginas de plataformas de Munitech mantienen "Solicitar demostración".
- **Una sola tipografía en la portada y la barra**: el menú, el botón Menú, el rótulo "Inteligencia estratégica",
  "Desliza para explorar" y el pie pasan de Space Mono a Catamaran (seminegrita, mayúsculas, con algo de espacio).
- **Sin brillo cobrizo al pie de Misión y Visión** (terminaba en un corte recto contra "Nuestros servicios").
- Sin cambios en Munitech: falta confirmar si es el portal de noticias y normas del documento o las plataformas.
- `goberna-tech.html` regenerado.

## Portada con el Perú en hilos de luz, sin el brillo naranja y con el rótulo más sereno (25/11/2026, 4:45 p. m.)

Pedido: cambiar la montaña genérica por el mapa del Perú y limpiar los detalles que se veían raros.

- **El Perú en vez de la montaña** (`src/peru3d.js`, nuevo; `src/home.js` lo monta en el mismo `<canvas class="g-hero-3d">`):
  - Silueta real del país (Natural Earth, `src/peru.js`) vista en diagonal desde el suroeste, a la derecha del texto.
  - El relieve se dibuja con hilos que siguen los paralelos, con la misma estética que antes: planos en la costa,
    altos y más brillantes en los Andes, bajos en la Amazonía. Es una aproximación hecha a mano (Cordillera
    Occidental y Oriental por su trazado real, Altiplano, meseta de Junín), no un modelo de elevación.
  - Las 23 capitales de región como puntos de oro (sin Callao ni Huacho, pegadas a Lima) y Lima como nodo principal,
    con un pulso. Arcos tenues desde Lima a cada capital, con corrientes de datos.
  - Entrada: el relieve se levanta de sur a norte; después se encienden las capitales (de Lima hacia afuera) y se
    trazan los arcos. El puntero ilumina el terreno y la cámara lo acompaña. Con "reducir movimiento", queda quieto.
  - En teléfono y tableta vertical, el país va centrado detrás del texto, atenuado.
  - Revisado a 1440 × 900, 1920 × 940, 820 × 1180 y 390 × 844, con GPU real (NVIDIA) y por software.
- **Guardado sin usar**: el territorio de montañas (`src/portada3d.js`, `src/relieve.js`) y el globo (`src/globo3d.js`).
  Para volver a uno de ellos, importarlo en `src/home.js` en lugar de `montarPeru3D`.
- **Sin brillo naranja** (`src/home.css`): se quitó el degradado cobrizo de la esquina inferior izquierda de la portada
  y el que lo continuaba arriba a la izquierda de "Conocimiento que acompaña".
- **Rótulo "Inteligencia estratégica" menos espaciado**: `letter-spacing` de 0,32 em a 0,2 em.
- `goberna-tech.html` regenerado.

## Portada: el nombre se queda y lo acompaña una frase corta que dice qué hace Goberna Tech (25/11/2026, 4:15 p. m.)

Pedido: mejorar la portada sin perder el nombre ("el nombre tiene que seguir existiendo"); se eligió la opción en
que "GOBERNA TECH" sigue siendo lo principal.

- **Frase nueva bajo el nombre** (`index.html`): "Tecnología e inteligencia para la gestión pública." en lugar de
  "Integramos estrategia, tecnología y conocimiento especializado para acompañar a autoridades y líderes."
- **Con más presencia** (`src/home.css`, `.g-hero-p`): más grande (hasta 2,15 rem), peso 500, casi blanca
  (`#e4e9f2`) y más angosta (20 em), para que se lea como el subtítulo del nombre. Revisado en escritorio
  (1920 × 907) y teléfono (390 × 844).
- `goberna-tech.html` regenerado.

## Portada otra vez a la izquierda, con "Goberna Tech" como título y las montañas a la derecha (25/11/2026, 12:20 p. m.)

Pedido: "me gustaba más que estaba a la izquierda" (sobre la versión centrada de la entrada siguiente).

- **Texto a la izquierda, montañas a la derecha** (`src/home.css`, `src/portada3d.js`): se quedó lo nuevo del
  título y las letras, pero el bloque vuelve a ir a la izquierda y el territorio de hilos recupera su
  composición original (cordillera a la derecha, la escena se apaga hacia el texto). `src/portada3d.js` se
  restauró tal como estaba antes de recomponerlo para el centro.
  - El nombre va en dos renglones: "GOBERNA" en blanco macizo (800) y "TECH" en dorado y más fino (400). Mide
    unos 7,4 % del ancho de la pantalla, con tope también por el alto de la ventana (14 %): en pantallas bajas
    (portátiles de 1366 × 620) no choca con la barra. En tableta crece (11,5 % del ancho) y en teléfono (16 %).
  - Rótulo "Inteligencia estratégica" en Space Mono con un filete delante, raya dorada bajo el nombre y la frase
    corta de una línea o dos, en gris azulado suave.
  - El bloque arranca siempre por debajo de la barra (`padding-top: barra + 6 px`).
  - Medido en 18 tamaños de pantalla (320 a 2560 px de ancho; 390 a 1300 de alto): sin desbordes, sin choques con
    la barra ni con "Desliza para explorar".
- **Respaldo de la versión centrada** (por si se prefiere después): `goberna-tech-centrada.html` y
  `goberna-tech-web-2026-11-25-centrada.zip`, junto al zip principal.
- `goberna-tech.html` y el zip regenerados.

## Portada con "Goberna Tech" como título, centrada, y las ondas como montañas de vuelta (25/11/2026, 11:50 a. m.)

(Versión centrada, reemplazada a las 12:20 p. m. por la de texto a la izquierda; respaldo: `goberna-tech-centrada.html`.)

Pedidos: "mucha letra a la izquierda; GOBERNA TECH en vez de 'La estrategia transforma territorios';
podemos mejorar cómo está el título y las letras" y, al ver el resultado, "no lo hiciste mal, falta las
ondas como montañas".

- **Menos texto y todo centrado** (`index.html`, `src/home.css`): rótulo, nombre, una frase y dos botones.
  - El título es el nombre: "GOBERNA" en blanco macizo (800) y "TECH" en dorado y más fino (400), como en el
    logotipo. Mayúsculas con algo de separación entre letras; crece con la pantalla (hasta 179 px). En el
    teléfono se apila ("Goberna" sobre "Tech") para no quedar chico.
  - Rótulo "Inteligencia estratégica" en Space Mono (como el menú), con un filete a cada lado, y la misma
    raya dorada de los títulos de sección bajo el nombre.
  - La frase pasó a una línea: "Integramos estrategia, tecnología y conocimiento especializado para acompañar
    a autoridades y líderes." (se quitó "en proyectos de impacto", que ya dice la sección siguiente), en un
    gris azulado más suave para que el título mande.
  - "La estrategia transforma territorios." ya no está en la portada; sigue solo en el título de la pestaña
    del navegador (`<title>`).
  - Medido en 18 tamaños de pantalla (320 a 2560 px): sin desbordes y sin choques con "Desliza para explorar".
- **Las montañas vuelven** (`src/portada3d.js`, `src/relieve.js`, `src/relieve-trabajador.js`): se recuperó el
  territorio de hilos de luz de antes del globo (praderas, cordillera, sierra lejana entre la bruma, corriente
  de datos por los hilos), que se había borrado. Se reconstruyó a partir de los cambios que quedaron
  registrados en la sesión del 23/11 (el archivo escrito y las ediciones posteriores). Se recompuso para el
  título centrado:
  - Una cordillera a cada lado (la derecha, más alta) y un valle en medio; la cámara mira un poco hacia arriba
    para que el horizonte baje y el título quede sobre las montañas.
  - Detrás del texto la escena se oscurece con suavidad (un óvalo del tamaño del texto medido en pantalla): las
    montañas se ven enteras alrededor y las letras quedan limpias.
  - En pantallas verticales (teléfono, tableta) otra composición, con las cumbres a los lados del título.
- **El globo** quedó en `src/globo3d.js` (`montarGlobo3D`), guardado sin usar, con sus datos (`src/mundo-datos.js`).
  Para volver a él: importarlo en `src/home.js` en lugar de `montarPortada3D` (mismo `<canvas class="g-hero-3d">`).
- Copia del HTML con el globo: `goberna-tech-con-globo.html` (junto al zip).
- `goberna-tech.html` y el zip regenerados.

## Portada sin globo y con Misión y Visión (25/11/2026, 10:11 a. m.)

Pedido: "la versión sin la tierra, con la visión y misión", sobre la última versión (la oscura).

- **Portada sin globo**: el fondo de la portada es solo el aura (azules apagados y grano de estrellas). El globo
  sigue guardado (hoy en `src/globo3d.js`; antes `src/portada3d.js`, `src/mundo-datos.js`, `scripts/build-mundo.mjs`) pero ya no se carga, así
  que el HTML pesa unos 270 KB menos. Para volver a ponerlo: agregar el `<canvas class="g-hero-3d">` en
  `index.html` y llamar a `montarPortada3D` desde `src/home.js` (hay comentarios en ambos). El ajuste del texto
  en celular vertical ahora solo se aplica cuando hay globo (`.g-con-globo`).
- **Misión y Visión** (nuevas, entre "Conocimiento que acompaña" y "Nuestros servicios"):
  - Texto oficial del documento "GOBERNA TECH - Información", sin reescribir. En dorado va lo que el
    documento destaca: "generar resultados de alto impacto que trasciendan."
  - Título a la izquierda y la frase grande a la derecha (en celular, una debajo de la otra).
  - Cada frase se enciende palabra por palabra mientras se baja (`src/credo.js`). Con "reducir
    movimiento" queda entera encendida.
  - Tienen ancla propia (`#mision` y `#vision`).
- Copia del HTML anterior, con el globo: `goberna-tech-con-globo.html` (junto al zip).
- `goberna-tech.html` y el zip regenerados.

## El globo se arma y se desarma con el scroll; nueva foto de Media Training (23/11/2026, 6:15 p. m.)

Pedidos: "quiero que con el scroll se construya y se desconstruya", "que el globo se centre más que
nada en América, que no ruede tanto" y, con dos fotos nuevas del ponente, "usa la mejor foto".

- **Globo por piezas** (`src/portada3d.js`): el cuerpo del globo ahora está hecho de teselas de 5°.
  Las costas y las fronteras viajan con su tesela. Un solo reloj de armado ordena todo:
  - Al cargar, las teselas llegan de sur a norte, girando desde afuera; en vuelo son vidrio azul
    tenue con el contorno encendido. Después se encienden las luces, se trazan los arcos de Lima y
    luego la red.
  - Al bajar, todo va hacia atrás: se destrazan los arcos, se apagan las luces y las teselas se
    sueltan de norte a sur. Al subir, el globo se vuelve a armar. Se desarma del todo al bajar
    algo más de la mitad de la portada (suavizado, para que la rueda del mouse no vaya a saltos).
  - Con "reducir movimiento" queda armado y quieto.
- **Centrado en América**: ya no da la vuelta al mundo, solo se mece unos 6° y se inclina apenas
  hacia el puntero. La red se rehízo para la cara que se ve: América con Londres, Madrid, Lisboa,
  Lagos, Tokio y Shanghái, y entre sus grandes ciudades (además de los diez arcos de Lima).
- **Media Training**: se eligió la foto de cerca del ponente con micrófono (`DSC_2913`), más
  nítida y expresiva que la del salón, y además gesticula hacia el texto. Recorte de 1200 × 1282
  (más resolución que antes); el fondo blanco del escenario está apenas atenuado.
- `goberna-tech.html` y el zip regenerados.

## Portada: el mundo conectado (23/11/2026, 5:45 p. m.)

Pedido: "con este estilo podemos hacer la portada de arriba, en vez de que se parezca a los Andes,
que estemos conectando todo el mundo" (con capturas de un globo oscuro con costas de luz).

- **Globo 3D** (`src/portada3d.js`, reemplaza el relieve de los Andes): un globo de noche, con el
  océano casi negro, los continentes en azul acero y costas finas de luz celeste. Las fronteras
  apenas se ven y hay luces de ciudad cálidas y quietas, que se encienden una sola vez al llegar.
  Alrededor tiene una atmósfera suave, más clara del lado del texto.
- **Arcos de datos**: primero salen de Lima (nodo de oro) hacia Bogotá, Ciudad de México, Miami,
  Washington, Madrid, Buenos Aires, São Paulo, Santiago, Panamá y Nueva York. Después se suma una
  red entre continentes. Cada arco se traza una vez y luego lo recorre, cada tanto, una corriente
  lenta (la misma idea que los hilos del chip). En los arcos de Lima la corriente va y viene,
  porque Lima reúne los datos.
- **Movimiento**:
  - El globo llega girando y la cámara se aleja un poco.
  - Después gira muy despacio, como la Tierra (una vuelta cada tres minutos), y se inclina apenas
    hacia el puntero.
  - Con "reducir movimiento" queda quieto, con todo trazado.
- **Composición**:
  - En escritorio, el globo va grande a la derecha, cortado por abajo y sin tapar el texto.
  - En celular y tablet vertical, el texto de la portada sube y el globo asoma abajo como un
    horizonte, con Sudamérica y Lima a la vista (`src/home.css`).
- **Datos**: Natural Earth 1:50 m (dominio público, vía `world-atlas`), simplificados en
  `src/mundo-datos.js` con `node scripts/build-mundo.mjs`.
- **Archivos**:
  - Se quitan `src/relieve.js` y `src/relieve-trabajador.js`.
  - `src/lienzo3d.js` suma el modo `cubre`: el cuerpo del globo tapa las estrellas del fondo.
- `goberna-tech.html` regenerado.

## Escudo de fondo en las tarjetas de servicios: probado y quitado (23/11/2026, 5:50 p. m.)

- Se probó un escudo en tonos plomo detrás de cada tarjeta de servicios; al usuario no le gustó y
  se quitó por completo (las tarjetas quedan como antes).

## El palacio con presencia y los efectos de la página de los libros (23/11/2026, 5:30 p. m.)

Pedido: "manejar la proporción del palacio para que tenga más presencia" y mirar los efectos de las
imágenes de goberna-lab.github.io/Roberthh-libros.

- **Palacio 3D** (`src/legado3d.js`): el templo del isotipo, con volumen y bisel, en oro macizo
  (reflejo cálido arriba, azul noche abajo, brillo y borde de luz). Sale del vidrio de Legado
  después del destello del sello, mucho más grande que antes (casi la mitad del ancho del panel), y
  queda flotando con un giro lento; debajo, un brillo dorado que respira con su vuelo (como la
  sombra del libro). El sello queda detrás, con anillos más amplios. Si el palacio 3D no se puede
  armar, vuelve el isotipo plano.
- **De la página de los libros**:
  - Los paneles llegan desenfocados y oscuros y se aclaran al acomodarse (como las puertas).
  - La escena de Legado se abre desde cerca, como un plano de cine, y después respira muy despacio
    (como la portada del libro). Reemplaza el acercamiento final de antes.
  - Las fotos (Media Training y blog) aparecen desenfocadas y oscuras y se aclaran mientras se
    acomodan; la de Media Training además respira muy despacio dentro de su marco.
- `goberna-tech.html` regenerado.

## Legado, más impactante (23/11/2026, 5 p. m.)

Pedido: "lo podemos hacer mejor, más impactante".

- `src/legado3d.js`: Legado pasa a ser la pieza central (el panel más grande, adelante); Gestión y
  Trayectoria lo acompañan en ángulo, con profundidad. Cada panel llega girando hasta quedar de
  frente, con un leve rebote, y una luz le cruza el vidrio. Al llegar Legado, el sello se abre en
  dorado con un destello de rayos, la órbita se enciende y la cámara se acerca un poco.
- En calma: polvo dorado y azul que flota, luz de escenario bajo los paneles, la cámara se mece
  despacio y, cada tanto, una luz suave cruza uno de los vidrios. El sello conserva un halo.
- Contenido más fino: barras, línea y sello con un brillo propio.
- La escena se extiende hasta el borde izquierdo de la pantalla y la cámara se aleja lo justo para
  que los paneles quepan en cualquier ancho (también en celular).
- Puntero: oculto hasta que se mueve el mouse (antes aparecía en la esquina al cargar).
- `goberna-tech.html` regenerado.

## Puntero propio (23/11/2026, 4:40 p. m.)

- `src/cursor.js`: punto dorado pegado al mouse (se mueve en el mismo evento, con la posición que
  el navegador predice para el cuadro siguiente) y un aro dorado fino que lo sigue con un retraso
  corto. Sobre enlaces y botones el aro crece, se llena apenas de oro y se ondula como un líquido
  (filtro SVG de turbulencia) hasta asentarse. Al hacer clic se contrae. En campos de texto vuelve
  el cursor del sistema; no se usa en pantallas táctiles ni con "reducir movimiento".
  Inspirado en los cursores con filtro de Codrops (sketch 014), con código propio.

## Nueva foto en Media Training (23/11/2026, 4:10 p. m.)

- La foto del ponente señalando la pantalla se reemplazó por la del atril (pedido del jefe):
  recortada para mostrar la bandera con el isotipo, el atril y al ponente, con el público
  desenfocado adelante; color natural apenas menos saturado, sin datos de cámara.
- `goberna-tech.html` regenerado.

## Gestión, Trayectoria y Legado en 3D; rebote de la flecha (23/11/2026, 4:30 p. m.)

- **Tu legado permanece** (`src/legado3d.js`, en lugar de `k-legado.webp`): una órbita dorada se
  traza y su cometa va sacando, en orden, tres paneles de vidrio: 01 Gestión (barras que crecen),
  02 Trayectoria (una línea que se dibuja) y 03 Legado (el isotipo, que se abre en dorado). La
  línea de tiempo de la derecha se enciende al mismo ritmo y Legado queda lleno. Al pasar el
  puntero por una etapa, su panel se destaca. Después, todo en calma: los paneles flotan apenas y
  el cometa sigue despacio. Con "reducir movimiento", queda el cuadro final.
- **Desliza para explorar**: la flecha rebota con suavidad (y se queda quieta con "reducir movimiento").
- `goberna-tech.html` regenerado.

## Calidad del chip, foto nítida, fondo con aura y HTML único (23/11/2026, 4 p. m.)

- **Chip y edificio, menos brillantes y más finos** (`src/templo3d.js`, `src/lienzo3d.js`):
  antialiasing (bordes sin dientes), luces que se comprimen en vez de quemarse en celeste plano,
  mármol gris pizarra con sombras de contacto y un brillo discreto; sin las rayitas que hacían
  muaré. Los brillos van en celeste suave, no en azul puro. Resplandor más contenido.
- **Mancha negra escalonada sobre el edificio** (se veía en el Mac): la cara de arriba de los
  capiteles daba un valor inválido que el resplandor esparcía. Corregido en el origen, y el
  resplandor ahora descarta cualquier valor inválido para que no vuelva a pasar.
- **Foto de Media Training**: nítida, con su color natural, esquinas suaves, filete tenue y sombra;
  sin bordes difuminados ni tinte azul.
- **Fondo con aura** (`src/home.css`, según el mockup): noche casi negra con dos azules apagados que
  se funden (índigo y acero), un toque cálido muy tenue y un grano fino de estrellas, en todas las
  secciones oscuras. El azul de los hilos y del cielo de la portada, algo menos saturado.
- `goberna-tech.html` regenerado con `npm run standalone`.

## Los datos corren por el territorio y el chip los concentra (23/11/2026, 3:30 p. m.)

Concepto del usuario: las líneas de la portada son los datos; que corran como electricidad por el
terreno, y que en la sección siguiente el chip y el edificio concentren esos datos.

- **Portada** (`src/portada3d.js`): por un tercio de los hilos corre una corriente, como
  electricidad: cabeza blanca y cola en paquetes, en ambos sentidos, con un leve titileo. Sin
  barridos ni anillos: solo la corriente, siguiendo el relieve.
- **Chip** (`src/templo3d.js`): una pista por pata que se abre en abanico y viene desde el fondo;
  por ellas corre la misma corriente, siempre hacia el chip. Cada pata se enciende al recibir su
  paquete; los datos suben por las columnas (cada una a su ritmo) y salen por el techo.
  Se quitaron los anillos de las puntas de las pistas.
- También: las normales de las patas giradas se calculaban sin la rotación (luz equivocada en dos
  lados del chip); corregido.

## El chip parece chip; obra más corta (23/11/2026, tarde)

Pedido: "que se demore un poco menos en construirse, que el chip parezca más chip con la placa
combinándose con el fondo".

- La obra dura 2,2 s (antes 3,4 s) y se asienta más rápido.
- Chip (`src/templo3d.js`): encapsulado negro mate biselado que no toca la placa, patas plateadas en
  ala de gaviota (16 por lado) que bajan a contactos dorados, tapa de metal cepillado, núcleo de
  vidrio, marca hundida del pin 1 y el grabado "GOBERNA TECH" en el borde.
- Placa: sin rejilla ni bordes; queda una máscara casi negra con la serigrafía alrededor del chip,
  y una pista por pata que se abre en abanico y se disuelve en el fondo de la sección.

## Fondo 3D que desaparecía, foto en Media Training y edificio pulido (23/11/2026, 1 p. m.)

- **El 3D aparecía y desaparecía al hacer scroll** (pantallas de color amplio, como la de un MacBook):
  el lienzo salía con opacidad 0 y color encima, y Chrome lo descartaba según cómo compusiera la
  página. Ahora cada punto lleva como opacidad su canal más brillante (`src/lienzo3d.js`): se ve
  igual y en cualquier pantalla. Probado forzando un perfil de color P3.
- **Media Training Presidencial**: la ilustración del atril se reemplazó por la foto del ponente
  (`media-training.webp`): recortada para dejarlo señalando y sacar el público borroso y los
  carteles cortados; algo oscurecida hacia el texto, con bordes fundidos y sin datos de cámara.
- **Edificio del chip, pulido** (`src/templo3d.js`), siguiendo las proporciones del orden dórico:
  columnas de unos seis diámetros con éntasis, estrías y collarino; arquitrabe, friso con
  triglifos y cornisa; frontón bajo (15°) con el tímpano hundido bajo el alero y el isotipo; tejas
  en lugar de la grilla de puntos; puerta en la cella; luz más suave, sombra de contacto sobre el
  vidrio y bisel en el chip. Mismo costo: son detalles calculados en el shader.

## Portada más sobria y liviana; chip que construye el edificio (23/11/2026, tarde)

Pedidos: "lo podemos hacer mejor, una versión más avanzada"; luego "está muy lag… necesitamos que
sea menos pesado"; "en la portada los pulsos quítalos y un poco minimalista"; y reemplazar la imagen
del templo por 3D: "un chip tecnológico que construye el edificio".

- **Portada** (`src/portada3d.js`): el territorio es ahora un relieve compuesto (praderas cerca,
  cordillera a la derecha, sierra lejana en la bruma) con luz y sombra; los hilos se dibujan sobre
  él con grosor fijo en píxeles. Al cargar, el relieve se levanta de izquierda a derecha; el puntero
  eleva e ilumina un poco el terreno y la cámara lo acompaña. Sin pulsos: se quitaron el barrido de
  luz, los anillos, la onda del clic, las chispas, las motas y las columnas de puntos.
- **Chip que construye el edificio** (`src/templo3d.js`, en lugar de `k-templo.webp`): un chip
  sobre su placa, con pistas y dos láminas de vidrio. Antes de empezar, el edificio se ve como un
  plano de líneas tenues. Cuando se ve un tercio de la escena, el chip se enciende, la energía
  corre por las pistas y el edificio se levanta capa por capa (escalinata, columnas, cornisa,
  frontón con el isotipo dorado) con un frente de luz y un haz de datos. Ya terminado queda quieto:
  solo suben datos despacio sobre el techo. La cámara gira un poco con el puntero.
- **Rendimiento** (`src/lienzo3d.js`, base común de las dos escenas):
  - El lienzo ya no usa `mix-blend-mode` (era lo que más frenaba): sale transparente y solo suma luz.
  - Cada escena se dibuja una sola vez por cuadro; el resplandor sale de esa misma imagen.
  - Tope de resolución y de 60 cuadros por segundo (en pantallas de 120 Hz dibuja uno de cada dos).
  - Si la tarjeta gráfica tarda, baja la resolución sola. Cada escena se pausa cuando no se ve.
  - El relieve de la portada se calcula en un trabajador (`src/relieve.js`), sin trabar la página.
  - Los shaders se compilan sin bloquear y la escena del chip se monta recién al acercarse a su sección.
  - Medido en un MacBook (M2 Pro): la tarjeta gráfica tarda 1–2 ms por cuadro en cada escena.
- Con "reducir movimiento", las dos escenas quedan como un cuadro fijo (el edificio, terminado).

## Portada 3D: territorio de líneas de luz (23/11/2026, mediodía)

Pedido: rehacer solo la portada; quitar la imagen de fondo y que el 3D la reemplace por completo,
con el estilo y los colores de las ondas, pero que las líneas parezcan montañas y praderas. Sin
transiciones entre secciones por ahora.

- **Se quitó el fondo 3D fijo que cambiaba con el scroll** (`src/fondo3d.js`, el lienzo `#fondo3d`
  y los fondos `.con-3d` de cada sección). Las demás secciones vuelven a su fondo del mockup.
- **Se quitó la imagen de ondas** de la portada (`k-ondas.webp`).
- **Nueva portada 3D** (`src/portada3d.js`, three.js), dentro de la portada y no fija:
  - Hilos azules que cruzan de lado a lado, uno detrás de otro hasta el horizonte: cerca, praderas
    con lomas suaves que se mecen; al fondo y hacia la derecha, una cordillera. Las cumbres brillan más.
  - El terreno avanza muy despacio y un pulso de luz recorre los hilos. Chispas como luces de pueblos
    y columnas de puntos en el cielo, detrás de las montañas.
  - Al cargar, el terreno se levanta. Donde está el puntero el terreno se eleva y la cámara lo sigue un poco.
  - Se apaga hacia la izquierda para no competir con el texto. En celular y tableta vertical el
    horizonte baja y queda debajo de los botones.
  - Solo se dibuja cuando la portada está en pantalla. Con "reducir movimiento" queda un cuadro
    quieto; sin WebGL, el fondo oscuro.
- Se mantienen el parallax, la entrada de los textos y las tarjetas apiladas (no usan three.js).
- Probado en 390, 820, 1288 y 1920 px, sin errores en consola.

## Movimiento sobre la web estática, sección por sección (23/11/2026)

Pedido: sumar el 3D a la web del mockup, por secciones, con un fondo 3D tipo parallax que se
queda arriba mientras se baja.

- **Fondo 3D fijo** (`src/fondo3d.js`, three.js): un lienzo detrás del contenido que no se mueve
  al bajar. Miles de puntos de luz cambian de forma según la sección:
  portada → ondas; conocimiento → anillos y haces bajo el templo; servicios → suelo de puntos
  hacia el horizonte; legado y media training → órbitas alrededor de cada ilustración.
  La cámara se mueve un poco con el puntero. Se detiene en las demás páginas y con la pestaña oculta.
- **Parallax** (`src/efectos.js`): el templo, las dos ilustraciones premium y los numerales
  01 · 02 · 03 se desplazan a distinta velocidad que el texto.
- **Tarjetas de servicios**: cada una se queda arriba y la siguiente sube y la cubre (en pantallas
  de más de 900 px).
- **Textos**: entran suavemente al aparecer en pantalla.
- **Barra**: toma fondo con desenfoque al bajar.
- Con "reducir movimiento" activado, o sin WebGL, la página queda como la versión estática.
- Las imágenes siguen siendo los recortes de las capturas (ver `IMAGENES.md`).

## Web estática según el mockup de Adobe XD (20/11/2026)

Pedido: desarrollar la web en base al mockup, primero como esqueleto estático con las imágenes; el
3D y las animaciones se suman después, sección por sección.

- **`index.html` es ahora la página estática del mockup**, con `src/home.css` y `src/home.js`
  (clases con prefijo `g-`). No carga three.js ni animaciones. Secciones, en el orden del mockup:
  1. Portada: "La estrategia transforma territorios." con las ondas de luz.
  2. Conocimiento que acompaña: "Somos especialistas en estrategia, tecnología y consultoría
     política." con el templo sobre el chip.
  3. Nuestros servicios: tres tarjetas apiladas (01 Gobierno y gestión, 02 Escuela y formación,
     03 Estrategia Electoral).
  4. Servicios premium: Tu legado Permanece (Gestión, Trayectoria, Legado) y Media Training
     Presidencial (Miami, Estados Unidos).
  5. Blog: tres entradas y "Ver todo".
  6. Pie con la cúpula, el logo y el menú.
- **La versión anterior se conserva** en `index-3d.html` + `src/main.js` (escena 3D, partículas,
  mapa, demostraciones interactivas, lista fija). De ahí se toma cada pieza cuando toque animar.
  Para verla: `npx vite` y abrir `/index-3d.html`.
- **Tipografía**: Catamaran (títulos, texto y botones) y Space Mono (menú), elegidas a ojo sobre las
  capturas. Confirmar los nombres exactos en Adobe XD; se cambian en `--sans` y `--mono`.
- **Colores** tomados de las capturas: fondo #020617, pie #091120, dorado #DFA52E, azul #1F3B73.
- **Imágenes**: recortes de las capturas, ampliados. Ver `IMAGENES.md` para reemplazarlas.
- **Munitech** abre una página con las once plataformas por familia; cada una conserva su página.
- **"Solicitar demostración", "Quiero saber más" y "Conoce el servicio"** llevan a una página de
  contacto con el formulario (el envío sigue sin conectar). Los servicios llegan con su interés
  ya elegido.
- **Pendiente de definir**: Editorial y Cursos (hoy llevan a "Nuestros servicios"), "Ver todo" y las
  tres entradas del blog (aún no tienen artículo), y el recuadro blanco del pie del mockup (no se
  sabe qué es; no se incluyó).
- Probado en 390, 820, 1440 y 1920 px, y las once páginas de plataforma: sin errores ni desbordes.

## Estilo del prototipo: letras, botones, cielo oscuro y portada (18/11/2026, 4 p. m.)

- **Tipografía**: toda la web pasa de Montserrat a **Schibsted Grotesk** (títulos y texto) y
  **Space Mono** (menú, rótulos y botones, en mayúsculas). Son las más cercanas a las del
  prototipo entre las de uso libre; si el diseñador confirma los nombres exactos, se cambian en
  `--sans` y `--mono` (`src/style.css`) y en los `import` de `src/main.js`.
  Ojo: el manual de marca indica Montserrat; este cambio sigue el prototipo.
- **Botones**: etiqueta monoespaciada en mayúsculas, esquinas de 4 px; el secundario, con borde fino.
- **Cielo de la escena 3D** y secciones oscuras: del azul #072E51 al azul noche #03142A
  (`BG` en `src/world.js`, `--navy-deep` en `src/style.css`). Las vistas fijas se volvieron a sacar.
- **Mapa del Perú**: ya no se ve el recuadro. La luz ahora solo ilumina los puntos del mapa y no
  pinta el fondo del lienzo (`src/mapa.js`).
- **Portada**: el texto va a media altura y alineado con el logo, con el titular más grande. En la
  página principal el contenido y la barra usan el margen ancho del prototipo.
- **Imágenes**: los espacios están listos para fotos reales; ver `IMAGENES.md`.
- La lista fija de plataformas ahora se activa desde 1280 px de ancho.

## Estructura del prototipo, textos grandes, parallax y lista fija de plataformas (18/11/2026, tarde)

Pedido: tomar del prototipo de Adobe XD la estructura de textos (sin copiar su diseño), usar textos
grandes, dar parallax o luz en movimiento a los elementos visuales y, para las plataformas, una
lista a la izquierda con la pantalla de cada producto apareciendo a la derecha sin hacer clic.

- **Orden y textos de la página principal** (los del prototipo):
  1. Portada: "La estrategia transforma territorios." (se mantiene la escena 3D).
  2. *Conocimiento que acompaña* (`#nosotros`): titular grande, presentación, y Misión y Visión
     desplegables. A su lado siguen las partículas.
  3. *Nuestros servicios* (`#servicios`): "3 ejes estratégicos. Una visión integral."
  4. Eje 1 (Gobierno y gestión), Eje 2 (Escuela y formación), franja "Del territorio a la
     decisión" y Eje 3 (Estrategia electoral), cada uno con su lista numerada de servicios.
  5. *Inteligencia y tecnología para una gestión estratégica* (`#plataformas`): cifras y plataformas.
  6. *Servicios premium* (`#premium`): Legado y Media Training Presidencial.
  7. Cómo trabajamos, preguntas frecuentes y contacto, como estaban.
  Salieron las secciones "Nuestros servicios" (cuatro servicios) y "El ADN que impulsa el futuro",
  reemplazadas por las de arriba.
- **Eje 3**: en el prototipo su lista repite la del Eje 1. Se usó la de la estructura de servicios
  anterior: Campaña 360, Encuestas, Focus groups y Media training para candidatos. Confirmar.
- **Cada servicio lleva al formulario** con su eje ya elegido en "Qué te interesa" (no hay páginas
  de detalle por servicio).
- **Plataformas en lista fija** (pantallas de 1200 px o más): la sección queda en pantalla mientras
  se baja y el scroll recorre las once plataformas. A la izquierda, las cuatro familias en grande
  (la activa despliega sus plataformas); a la derecha aparece la demostración de cada una, sin
  hacer clic. Abajo, un contador "04 / 11" con barra de avance. Un clic en un nombre lleva a su
  tramo; un segundo clic, o el botón "Ver…", entra a su página. En pantallas menores sigue una
  familia debajo de otra. `src/main.js` (bloque "Plataformas") y `src/secciones.css`.
- **Parallax y luz en movimiento** (`src/efectos.js`, `src/secciones.css`): las imágenes se
  deslizan dentro de su marco al bajar; encima llevan dos focos que derivan, un haz que las barre y
  un foco que sigue al puntero. El "3" y el título de la franja se mueven en sentido contrario a
  su imagen.
- **Mapa de los tres ejes** (`src/mapa.js`): el Perú en puntos, con una luz que lo recorre y arcos
  con pulsos que salen de Lima a las capitales regionales.
- **Imágenes**: el prototipo usa fotos y renders que no tenemos. En su lugar van vistas fijas del
  mundo 3D de la portada (palacio, foro, distrito, puente), en `public/img/m-*.webp`. Para usar
  fotos reales basta reemplazar esos archivos: el parallax y la luz se aplican solos. Las vistas
  se regeneran con `npx vite --port 5199` y `node tools/fotos.mjs carpeta`.
- **Menú**: Nosotros, Servicios, Plataformas, Premium y Contacto. Editorial, Cursos y Blog del
  prototipo no se agregaron porque todavía no tienen página.
- Probado en 390, 820, 1024, 1200, 1280, 1440 y 1920 px, y los once módulos: sin errores ni desbordes.

## Página principal viva: storyboard de marketing (18/11/2026)

Pedido: más dinamismo para que la gente se quede, siguiendo el storyboard y las referencias
(app en un teléfono en mano, animación de widgets, ilustración explicativa). Todo está hecho con
código propio y con la marca (azul, dorado, Montserrat): no se usó ningún video ni dibujo ajeno.

- **Frase de marca con animación** (storyboard 02). A la derecha de "Estrategia, tecnología e
  inteligencia…", sobre fondo blanco, unas partículas arman una figura por cada idea: una ruta
  (estrategia), un chip (tecnología), una red (inteligencia) y el palacio del logo (gestión
  pública). La palabra correspondiente se subraya en dorado. Las palabras de la frase entran una
  tras otra. `src/particulas.js`.
- **Cifras con tipografía cinética**: cada dígito de 11 · 5 · 267 · 4 gira hasta su valor y una
  regla dorada crece sobre cada cifra.
- **Una demostración interactiva por familia** (storyboard 03 y 04), en lugar de la imagen fija.
  `src/escenas.js` y `src/escenas.css`:
  - *Territorio y trabajo de campo*: un teléfono en mano. Según la plataforma elegida muestra la
    ruta del brigadista (Gobernanza), un reporte con foto (SGTI) o la visita a un hogar (ULE). Del
    teléfono salen hilos hacia tres burbujas que cuentan qué pasa en la oficina. El botón del
    teléfono se puede pulsar.
  - *Atención al ciudadano*: cuatro widgets que llegan volando y funcionan: sacar un turno, hacer
    una pregunta al asistente, reservar un horario de cancha e inscribirse en un taller.
  - *Seguridad ciudadana*: ilustración explicativa. Al pulsar SOS, la alerta viaja a la central,
    aparece en el mapa y se despacha el patrullero.
  - *Gestión interna*: el tablero del presupuesto (por área o por mes) y el generador, que pasa
    del Excel a los documentos numerados.
  Cada demostración corre sola mientras está en pantalla, se detiene cuando sale y responde al
  toque. Todas dicen "Demostración con datos de ejemplo".
- **Hilo de transición**: una línea dorada baja junto a las familias y se dibuja con el scroll; al
  llegar a cada demostración enciende su nudo. En celular corre por el margen izquierdo.
- En celular los widgets se apilan (se ve el elegido) y las ilustraciones se reacomodan.
- Con "reducir movimiento" activado en el dispositivo, todo queda quieto y en su estado final.
- Probado en 390, 820, 1024 y 1440 px, y los once módulos: sin errores ni desbordes.

Para cambiar textos o datos de las demostraciones: `APPS` (teléfono) y `WIDGETS` en
`src/escenas.js`. Las capturas reales de SGTI y Ticketera siguen en la página de cada módulo.

## Lo mejor de las webs de referencia, llevado a la nuestra (13/11/2026)

Referencias revisadas: OpenGov, Zencity, Iru, incident.io, Stripe, Linear, Softr, Nudge, Basalt y
Anduril (además de Palantir, que ya era la base).

- **Plataformas por familias con vista en vivo** (Iru, Linear, Softr). La lista larga de once
  nombres pasó a cuatro franjas, una por familia. A la izquierda, los nombres en grande; a la
  derecha, la vista de la plataforma elegida: su captura real o su esquema, qué es, tres rasgos y
  el botón a su página. En computadora basta pasar el puntero; en celular, el primer toque la elige.
  SGTI y Gobernanza muestran juntas la vista web y la app de campo. Las familias y lo que se ve de
  cada plataforma están en `src/modulos/familias.js`.
- **Franja de cifras** (OpenGov, Stripe): 11 plataformas, 5 etapas, 267 pruebas automáticas y 4
  niveles de acceso. Cuentan hasta su valor al aparecer. Son cifras de la oferta que ya estaban en
  la web; no son cifras de clientes.
- **Preguntas frecuentes** (OpenGov), antes del contacto: qué se necesita para empezar, cómo es la
  puesta en marcha, quién ve los datos, registro y respaldos, pruebas, demostración y servicios.
  Reúne las "cuatro garantías" y los requisitos, que salieron de "Cómo trabajamos"; esa sección
  queda solo con el escenario y las cinco etapas (Nudge: el proceso paso a paso, sin más texto).
- **Misma armazón en las once páginas de plataforma** (incident.io): la ruta ahora incluye la
  familia ("Plataformas / Atención al ciudadano / Ticketera") y antes del cierre aparece "También
  en…" con las otras plataformas de la familia.
- **Espacio para clientes** (Zencity, OpenGov): la sección `#clientes` de `index.html` está lista
  para logos y citas de funcionarios, pero **oculta** hasta tener datos reales y permiso para
  publicarlos. Para activarla: quitar `hidden` y completar (el formato está en el comentario).
- **Video** (Anduril): sin cambios; el espacio para un video propio sigue en "Cómo trabajamos"
  (`data-video`).

## Ticketera y SGTI adaptados al estilo y a la marca de la web (12/11/2026, noche)

Los dos módulos del compañero ya no van "tal cual": conservan su contenido (textos, capturas reales,
recorrido 3D, sala en vivo de la Ticketera) pero con la forma del resto del sitio.

- **Una sola barra**: se quitó la cabecera propia de cada presentación (duplicaba el menú y el botón
  "Solicitar demostración") y también su cierre y su pie. Ahora usan la barra de la web, la ruta
  "Plataformas / módulo" con los enlaces a sus secciones, y el cierre común ("Vea … funcionando" y
  la plataforma siguiente). `tools/portar.py` hace ese recorte al generar `src/portados/`.
- **Tipografía de marca**: todo en Montserrat (antes Bricolage, Figtree, JetBrains Mono, Barlow
  Condensed e IBM Plex, que ya no se cargan). Títulos en el mismo tamaño y peso que los demás
  módulos, sin mayúsculas sostenidas ni rótulos en monoespaciada.
- **Botones y bordes como los del sitio**: botón principal dorado con texto azul, esquinas de 2 a
  3 px y sin sombras.
- **Paleta**: azul #072E51, azul profundo #04213C, dorado #F5AF31 y blanco. Ticketera va en claro;
  SGTI, sobre el azul profundo de la marca.
- **Misma retícula**: el contenido arranca en el mismo margen que la ruta y que los otros módulos.
- **Recorrido 3D sin nada encima de la captura**: sobre la pantalla solo quedan los puntos
  numerados; sus textos están en el panel de al lado, como lista. El aviso "Baje para seguir el
  recorrido" pasó al panel del primer paso. El panel mide lo mismo en todos los pasos y la captura
  se encuadra en el espacio que el panel deja libre (a su derecha en computadora, encima en celular),
  así que ya no se montan (`src/vuelo.js`: `medirTexto()` y `zonaLibre()`).
- Estas reglas están en `src/modulos.css`, en el bloque "Módulos tomados de las presentaciones",
  bajo `#modulo.module-propio`.
- Probado en 390, 820, 1024, 1280, 1440 y 1920 px de ancho: sin desbordes ni errores.

## Ticketera y SGTI del compañero, y movimiento en toda la web (12/11/2026, tarde)

### Ticketera y SGTI ahora son sus presentaciones
- Los módulos de **Ticketera** y **SGTI Municipal** son las presentaciones que hizo el compañero
  (`presentacion-ticketera` y `presentacion-sgti`), pasadas a la web: sus textos, sus
  capturas reales, su **recorrido 3D** por las pantallas (la cámara vuela de una a otra), la **sala
  en vivo** de la Ticketera, y su **estilo propio** (Ticketera: Bricolage Grotesque, Figtree y
  JetBrains Mono, claro; SGTI: Barlow Condensed e IBM Plex, sala de monitoreo oscura).
- `tools/portar.py` convierte el `app/page.tsx` y el `app/globals.css` de cada presentación en el
  HTML y el CSS de `src/portados/`; el estilo de cada una queda limitado a su módulo (`.mod-ticketera`,
  `.mod-sgti-municipal`), sin afectar al resto. El recorrido 3D está en `src/vuelo.js` (sin React).
- Las capturas se amplían al tocarlas (visor). (La cabecera, el cierre y las tipografías propias de
  cada presentación se cambiaron después por los de la web: ver la entrada de arriba.)

### Movimiento en toda la web
- **Titular de la portada**: sube palabra por palabra al cargar.
- **Revelado al bajar**: los títulos de sección y las filas de datos aparecen (fundido y subida) al
  entrar en pantalla, escalonados. Se aplica a la página general y a los nueve módulos propios de la
  web. Respeta "reducir movimiento".

### Los otros nueve módulos
- Cada uno suma una barra de **beneficios** ("Qué gana la municipalidad"), al estilo de las
  presentaciones del compañero, además de su portada y su pieza interactiva propias.
- Siguen pendientes de llegar al mismo nivel de las dos presentaciones (recorrido 3D con capturas
  reales de cada sistema): para eso hacen falta capturas de demostración de esos nueve, como las que
  el compañero sacó para Ticketera y SGTI.

## "Cómo trabajamos" con movimiento y menos texto (12/11/2026)

- **Escenario con fondo en movimiento**: detrás del título va la escena 3D del foro (escenario,
  graderías y público), con la cámara rodeándolo despacio. Es el mismo lienzo de la portada: se muda
  a esta sección cuando entra en pantalla y vuelve a la portada al subir (`mudar()` en `src/main.js`).
- **Video de fondo (opcional)**: en `index.html`, `<div class="method-bg" data-video="" data-poster="">`.
  Con una ruta en `data-video` se usa el video (sin sonido, en bucle, solo mientras está en pantalla)
  en lugar de la escena 3D. En el archivo único, el video va como archivo aparte junto al html.
- **Etapas una a la vez**: las cinco etapas de la puesta en marcha se muestran de una en una, con su
  número grande; la barra de la etapa activa se llena sola y pasa a la siguiente. Se puede elegir
  cualquiera, y hay un botón "Pausar movimiento" que detiene el fondo y el avance.
- **Cuatro garantías**: solo los títulos; cada una se despliega al tocarla.
- **Qué necesita la municipalidad**: tres filtros (para todas, para SGTI Municipal, para Ticketera)
  en lugar de la lista completa.
- Corregido: en teléfonos el pie de página desbordaba 10 px el ancho de la pantalla.

## Página general y un módulo por plataforma (12/11/2026, tarde)

La web se separa en una **página general** y **once módulos**, uno por plataforma. Todo sigue en un
solo archivo: la general es `#inicio` y cada módulo es una ruta (`#ticketera`, `#sgti-municipal`, …).

### Cómo está organizado
- `index.html`: la página general (portada 3D, frase de marca, índice de plataformas, cómo trabajamos,
  servicios, nosotros, contacto). Ya no contiene las fichas de producto.
- `src/modulos/`: un archivo por plataforma. Cada uno exporta su `html()` y su `init()`.
  - `comun.js`: piezas compartidas (bloques de texto, explorador con anotaciones, esquemas).
  - `img.js`: las capturas reales, cada ruta una sola vez.
  - `index.js`: la lista y el orden de los módulos.
- `src/modulos.css`: estilos de los módulos. `src/main.js`: las rutas ("Rutas: página general y un módulo por plataforma").
- Cada módulo termina con el pedido de demostración y un enlace a la plataforma siguiente.

### La pieza distintiva de cada módulo
| Módulo | Portada | Pieza distintiva |
| --- | --- | --- |
| Ticketera | Azul, con un ticket | La sala de atención en vivo; el ticket muestra el último turno que salió |
| SGTI Municipal | El mapa de calor de fondo | El viaje de un reporte contado con el scroll: la pantalla queda fija y cambia por capítulo |
| Gobernanza Municipal | Gris claro | Panel y app lado a lado (el que se toca se agranda) y cinco áreas desplegables |
| Sistema ULE | Blanca, con los tramos de vencimiento | El semáforo de fichas: una línea de seis estados que se recorre |
| Asistente virtual | Blanca, con el chat | Una conversación de ejemplo que se puede probar |
| Reserva de canchas | Azul, con una cancha dibujada | Un calendario donde se elige y reserva un horario |
| Talleres municipales | Dorada | La lista de talleres con cupos que bajan al inscribirse |
| Alerta vecinal | Azul, con el botón | El botón de pánico y el recorrido de la alerta |
| Monitoreo de seguridad | Azul, central de mando | El mapa con patrulleros en movimiento y el despacho |
| Control presupuestal | Blanca, con una cifra grande | Un tablero con barras por área o por mes |
| Generador de requerimientos | Blanca | Los tres botones (validar, vista previa, generar) y los documentos que producen |

Las piezas interactivas son demostraciones con datos de ejemplo y lo dicen en pantalla: no guardan ni envían nada.

## Manual de marca, capturas reales y sala en acción (12/11/2026)

### Del manual de identidad visual
- **Servicios**: la sección pasa a los cuatro servicios del manual, con sus textos: consultoría
  gubernamental, campañas electorales, Escuela y Editorial (próximamente). Reemplaza a las cuatro
  áreas de la web anterior (Legal, Escuela, Financiamiento, Actualidad).
- **Nosotros**: propósito, misión y visión, tal como están en el manual.
- **Frase de marca** bajo la portada: "Estrategia, tecnología e inteligencia para transformar la gestión pública".
- **Títulos a dos colores** (blanco y dorado) solo sobre fondo azul; sobre blanco el dorado no se lee bien.
- **Logo**: 300 px de ancho en el pie (mínimo digital sugerido por el manual). En la barra superior
  mide 187 px, menos que ese mínimo, porque una barra de navegación no admite más alto.

### De las presentaciones de Ticketera y SGTI
- **Capturas reales de demo** ("Municipalidad Distrital Demo" y "Municipalidad de Ejemplo") en
  `public/img/`: Ticketera con cinco vistas (dispensador, pantalla de llamados, ventanilla, estado
  en vivo, estadísticas) y SGTI con cuatro (vista del alcalde, mapa territorial, mapa de calor, app de campo).
  Sus anotaciones salen de los puntos que ya traían esas presentaciones.
- **La sala en acción** (`src/simulador.js`): la sala de atención que funciona sola, con la misma
  lógica de la presentación de la Ticketera, pasada a JavaScript sin React. Solo avanza mientras está
  en pantalla y tiene botón de pausa.
- **Para quién es** (Ticketera) y **Cada persona ve lo que necesita** (SGTI).
- No se trajo el recorrido 3D por las capturas (`Vuelo3D`): la web ya tiene su escena 3D en la portada.

### Índice de plataformas
- El resumen bajo la portada es ahora una lista con los once nombres en grande; al pasar el puntero
  aparece una imagen de la plataforma. En teléfono, la lista va sin imágenes.

### Quedan con esquema ilustrativo
Gobernanza (panel), Sistema ULE, Asistente virtual, Reserva de canchas, Talleres, Alerta vecinal,
Monitoreo de seguridad, Control presupuestal y Generador de requerimientos.

## Presentación visual de cada plataforma (11/11/2026, tarde)

Cada plataforma tiene ahora un **explorador**: un bloque oscuro con una imagen grande y tres
anotaciones (A, B, C) que señalan partes de la imagen. Al pasar el puntero o tocar una anotación,
la imagen se enfoca en esa zona y se resalta su explicación.

- **Pestañas** donde hay varias vistas: Gobernanza Municipal (panel y app de campo), SGTI Municipal
  (vista del alcalde y app GeoReporte) y Ticketera (dispensador, pantalla de llamados y estadísticas).
- **Capturas reales** (3), rotuladas "Captura del sistema con datos de prueba".
- **Esquemas ilustrativos** (12), rotulados "Esquema ilustrativo": dibujos de línea con los colores de
  la marca que muestran la idea de cada pantalla. No son capturas. Están en `src/art/*.svg` y se
  pueden editar a mano; cuando haya una captura con datos de prueba, se reemplaza el esquema por ella.
- En `index.html`, cada vista es un `<figure class="view">` con sus `<button class="beacon">`
  (posición en porcentaje sobre la imagen) y cada grupo de textos es un `<div class="notes">`.
- La lógica está en `src/main.js` ("Explorador de cada plataforma") y los estilos en `src/style.css`.

## Nueva web informativa (11/11/2026)

La web pasa de un recorrido 3D a una página informativa de productos, más sobria.

### Estructura (`index.html`)
1. **Portada**: la escena 3D queda de fondo. La sección mide 165vh; ese tramo extra mueve la cámara
   del palacio hacia el distrito mientras el texto se despide. El trayecto está en `WAY` (`src/main.js`).
2. **Resumen**: las once plataformas agrupadas en cuatro familias, con enlaces.
3. **Plataformas**: una ficha por producto, con índice lateral que marca la que se está leyendo.
   Las fichas grandes llevan captura, pasos y características; las chicas, tres características.
4. **Cómo trabajamos**: principios, puesta en marcha por etapas y qué necesita la municipalidad.
5. **Consultoría y formación**: las cuatro áreas de la web anterior, en segundo plano.
6. **Contacto**: formulario de solicitud de demostración (todavía sin conectar: `TODO` en `src/main.js`).

### Contenido
- Los textos salen de las cinco presentaciones. No se publica nada interno: pendientes de seguridad,
  arquitectura, puertos, hojas de ruta ni decisiones por tomar.
- Nombres genéricos: "Alerta vecinal", "Asistente virtual municipal". No se menciona a ninguna municipalidad.
- Capturas (`public/img/`), solo con datos de prueba:
  - `sgti-vista-general.webp`: tal cual ("Municipalidad de Ejemplo").
  - `ticketera-estadisticas.webp`: recortada la cabecera, que llevaba el nombre de una municipalidad.
  - `gobernanza-app-campo.webp`: app de campo con datos de prueba.

### Técnica
- Montserrat va dentro del proyecto (`@fontsource/montserrat`); ya no depende de Google Fonts.
- `npm run standalone` genera `goberna-tech.html` con CSS, JS, tipografías, logos y capturas incrustados.
- La escena 3D solo se dibuja mientras la portada está en pantalla. La densidad de píxeles baja sola
  si el equipo no llega a un ritmo fluido.
- La barra superior es transparente sobre la portada y blanca, con el logo en azul, sobre el contenido.
  En pantallas de menos de 1100 px el menú pasa a pantalla completa.
- Respeta `prefers-reduced-motion` y, sin WebGL, la portada queda sobre el azul de marca.

### Pendiente
- Conectar el formulario y definir los datos de contacto (correo, teléfono).
- Capturas con datos de prueba para los productos que hoy no tienen imagen.

## Versión anterior (10 y 11/11/2026)
Recorrido 3D por paradas (palacio, distrito, foro, puente, mapa del Perú) con el video de Actualidad
que crecía y se achicaba con el scroll. Esa versión está en el zip entregado el 11/11 por la mañana.
