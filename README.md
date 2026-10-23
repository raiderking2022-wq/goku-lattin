# Goku lattin

Plugin nativo experimental para Nuvio, versión 0.1.1. Muestra la marca propia «Goku lattin» en el nombre del proveedor y en las etiquetas de los resultados, sin reutilizar títulos de archivo, logotipos ni nombres comerciales del sitio de origen.

## Actualización para Android

La versión 0.1.1 añade una búsqueda alternativa de metadatos cuando la aplicación no inyecta una clave TMDB válida, admite identificadores numéricos sin esa clave y registra códigos de diagnóstico sin guardar URLs ni secretos. También elimina artículos iniciales durante una búsqueda alternativa de títulos, conservando siempre la comprobación exacta de IMDb.

Después de actualizar el repositorio en Nuvio, tanto la tarjeta del repositorio como la del proveedor deben mostrar **0.1.1**. Se cambió también la URL del script con un parámetro de versión para evitar reutilizar el archivo 0.1.0 en caché.

Las capturas del usuario confirmaron la instalación y activación de 0.1.0 en una versión descargada desde GitHub. No demostraron la causa de los resultados vacíos en Android. Esta actualización corrige una dependencia frágil; no se presenta como una reparación ya verificada en el teléfono.

## Estado comprobado

- Doce pruebas automatizadas superadas con `npm test`.
- Prueba de red del 23 de octubre de 2026: la búsqueda de IMDb `tt6685538` encontró una ficha con coincidencia exacta de IMDb, resolvió un reproductor y devolvió un resultado HLS «Latino · 720p» en aproximadamente 3,3 segundos.
- Se pudieron leer la lista HLS principal y una lista secundaria con segmentos anunciados. No se descargaron ni decodificaron los segmentos ni se probó la reproducción en un dispositivo Nuvio.
- Prueba de red adicional con **Buscando a Nemo**, ID TMDB numérico `12`, sin clave TMDB: un resultado HLS latino de 720p; se verificaron el maestro y la lista secundaria. La última ejecución tardó aproximadamente 1,5 segundos.
- El ID numérico `603`, usado por el botón de prueba de la app revisada, devolvió cero coincidencias exactas en las búsquedas inspeccionadas de la fuente. No se sustituyó por una secuela ni por una película con título parecido.
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

- Para un ID numérico TMDB intenta primero la variable global `TMDB_API_KEY`, si la aplicación la proporciona. No se envía esa clave al sitio ni a los servidores de vídeo. Si falta, falla o no entrega un IMDb válido, consulta la correspondencia pública TMDB–IMDb de Wikidata y obtiene el título en Cinemeta.
- Acepta además un IMDb `tt...`, para el que consulta Cinemeta. Se han probado con red real tanto esta ruta como la numérica sin clave; la consulta TMDB con una clave válida se verificó mediante respuestas simuladas.
- La correspondencia pública puede estar incompleta o no estar disponible para un título. En tal caso no se inventan resultados.
- No se ha verificado todavía qué identificadores y variables proporciona la instalación del usuario. La ruta numérica sin clave ya se comprobó con red real desde Node; la prueba en el teléfono sigue pendiente.

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
npm run test:numeric:live -- 12
```

`test:live` muestra solamente las etiquetas y el host del resultado, no la URL firmada. Un resultado vacío produce un código de salida distinto de cero. Utiliza el plugin únicamente con contenido para el que tengas autorización.

`test:numeric:live` ejercita IDs TMDB sin clave inyectada. Por defecto prueba `12` y `603`; también acepta IDs específicos. Un título sin coincidencias produce código de salida 2, aunque el transporte y el código funcionen correctamente.
