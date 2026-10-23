# Goku lattin

Plugin nativo experimental para Nuvio, versión 0.1.0. Muestra la marca propia «Goku lattin» en el nombre del proveedor y en las etiquetas de los resultados, sin reutilizar títulos de archivo, logotipos ni nombres comerciales del sitio de origen.

## Estado comprobado

- Ocho pruebas automatizadas superadas con `npm test`.
- Prueba de red del 23 de octubre de 2026: la búsqueda de IMDb `tt6685538` encontró una ficha con coincidencia exacta de IMDb, resolvió un reproductor y devolvió un resultado HLS «Latino · 720p» en aproximadamente 3,3 segundos.
- Se pudieron leer la lista HLS principal y una lista secundaria con segmentos anunciados. No se descargaron ni decodificaron los segmentos ni se probó la reproducción en un dispositivo Nuvio.
- Publicado con autorización en el [repositorio Goku lattin](https://github.com/raiderking2022-wq/goku-lattin). La reproducción en el dispositivo sigue pendiente de comprobar.

El resultado de una prueba no garantiza que otros títulos, redes o dispositivos funcionen. Los enlaces firmados se resuelven de nuevo en cada consulta, no se guardan en el repositorio.

## Alcance de esta versión

- Películas únicamente, no series ni un catálogo de navegación propio.
- Búsqueda por título traducido y original cuando están disponibles. Cada ficha se valida por IMDb exacto para evitar confundir películas o remakes.
- Resolución de VOE a HLS; no devuelve páginas HTML como si fueran vídeos.
- Filemoon/Byse, Doodstream, Mega y enlaces de descarga no están implementados. Una película sin enlace VOE resoluble no devuelve resultados en esta versión.
- Sin claves API incrustadas, dependencias externas, ejecución de scripts del sitio ni uso de `eval`.

La distinción entre plugins locales que devuelven streams y addons de catálogo está descrita en la [guía de plugins de Nuvio](https://nuvio.wiki/integrations/plugins).

## Identificadores y metadatos

La función exportada es `getStreams(tmdbId, mediaType, season, episode)`. El contrato de proveedores puede consultarse en el [repositorio de referencia](https://github.com/dustincos/nuvio-plugins).

- Para un ID numérico TMDB necesita la variable global `TMDB_API_KEY`, inyectada por la aplicación. No se envía esa clave al sitio ni a los servidores de vídeo. Si la versión de Nuvio no la proporciona, esta ruta devuelve una lista vacía.
- Acepta además un IMDb `tt...`, para el que consulta Cinemeta. Esta es la ruta usada en la prueba en vivo; la ruta numérica TMDB se probó con respuestas simuladas, no en Nuvio.
- No se ha verificado todavía qué identificadores y variables proporciona la instalación del usuario. Esa comprobación forma parte de la prueba en el dispositivo.

La [respuesta pública de Cinemeta usada en la prueba](https://v3-cinemeta.strem.io/meta/movie/tt6685538.json) proporciona el nombre y el identificador IMDb del título.

## Instalación

Añade esta URL en la sección de plugins de Nuvio:

```text
https://raw.githubusercontent.com/raiderking2022-wq/goku-lattin/main/manifest.json
```

Puedes abrir el [manifiesto público](https://raw.githubusercontent.com/raiderking2022-wq/goku-lattin/main/manifest.json) y el [proveedor publicado](https://raw.githubusercontent.com/raiderking2022-wq/goku-lattin/main/providers/goku-lattin.js) para inspeccionarlos.

El alojamiento debe servir estos dos archivos sin iniciar sesión, conservando sus rutas:

```text
manifest.json
providers/goku-lattin.js
```

En una versión de Nuvio compatible con plugins, se añade la URL HTTPS de `manifest.json` en Configuración > Contenido y descubrimiento > Plugins > Añadir repositorio, se actualiza y se activa «Goku lattin». No se instala en el apartado de addons; consulta los requisitos y pasos de la [guía de Nuvio](https://nuvio.wiki/integrations/plugins).

El manifiesto utiliza el objeto raíz `name`, `version`, `scrapers`, siguiendo el [repositorio de referencia revisado](https://github.com/dustincos/nuvio-plugins).

## Marca y visibilidad del origen

Cambiar las etiquetas no equivale a ocultar técnicamente el origen. El dominio de la fuente figura en el código que Nuvio descarga y las conexiones y cabeceras necesarias para reproducir pueden ser inspeccionadas. El formato de plugin ejecuta la lógica en el dispositivo, según la [documentación de Nuvio](https://nuvio.wiki/integrations/plugins).

No se alteran posibles marcas de agua dentro del vídeo. No se garantiza anonimato, secreto del proveedor ni ausencia absoluta de nombres de origen en diagnósticos internos de la aplicación.

La fuente solicitada es [la web facilitada por el usuario](https://www.cinecalidad.my/). Los campos de reproductor observados proceden de la [ficha revisada](https://www.cinecalidad.my/pelicula/mavka-guardiana-del-bosque-2023-online-descarga/) y de su [script de integración](https://www.cinecalidad.my/wp-content/themes/gridthemeresponsive/scripts.min.js?v=1).

## Desarrollo

Requiere Node.js para las pruebas locales; el proveedor no necesita Node dentro de Nuvio.

```sh
npm test
npm run test:live
```

`test:live` muestra solamente las etiquetas y el host del resultado, no la URL firmada. Un resultado vacío produce un código de salida distinto de cero. Utiliza el plugin únicamente con contenido para el que tengas autorización.
