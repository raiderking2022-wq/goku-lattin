# Goku lattin

Plugin nativo experimental para Nuvio, versión 0.1.3. Muestra la marca propia «Goku lattin» en el nombre del proveedor y en las etiquetas de los resultados, sin reutilizar títulos de archivo, logotipos ni nombres comerciales del sitio de origen.

## Versión 0.1.3: diagnóstico visible desde el teléfono

El usuario sigue informando que no obtiene fuentes; las últimas capturas muestran fuentes de otros proveedores, pero no una versión instalada ni la causa del fallo. Los éxitos de las pruebas desde el sandbox no demuestran que funcione en el Android del usuario.

Esta versión añade `hasSettings` y `onSettings` para mostrar una comprobación real desde el dispositivo, usando los campos de solo lectura `header` e `info` que admite el [diálogo de ajustes de Nuvio revisado](https://github.com/NuvioMedia/NuvioMobile/blob/cmp-rewrite/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/PluginSettingsDialog.kt). No se presenta como otra reparación ya confirmada.

Para abrirlo:

1. Actualizar el repositorio y comprobar **0.1.3** en la tarjeta del proveedor.
2. En la sección de proveedores, pulsar el engranaje de **Goku lattin**, junto al interruptor. No es el botón azul de prueba.
3. Esperar mientras se consulta Kung Fu Panda 2 desde el dispositivo.
4. Compartir la pantalla de «Resultado» y las filas con «ERROR», si aparecen.

El diagnóstico muestra qué pasos responden, sus códigos HTTP o errores seguros y el tiempo empleado: metadatos de la app, correspondencia de ID, título, búsqueda, ficha y reproductor. También permite distinguir un error HTTP de una consulta sin coincidencias.

No muestra claves, cookies, cuerpos de respuesta, URLs de vídeo ni nombres de dominio del origen. No envía registros a un servicio externo. Ejecuta solamente las consultas normales necesarias para esa película de prueba cuando el usuario abre la configuración; no guarda un historial de búsquedas.

Se verificó desde Node con una simulación de temporizadores nativos: el panel devolvió un resultado y todas las etapas HTTP en aproximadamente 1,2 segundos. Falta observarlo en el teléfono y confirmar allí la causa del problema.

## Actualización 0.1.2: búsqueda de fuentes en Android

La captura más reciente del usuario muestra la pestaña Goku lattin seleccionada y la búsqueda de fuentes pendiente en Kung Fu Panda 2. El proveedor está siendo incluido en esa pantalla; no se trata únicamente de que falte instalar o activar el repositorio.

Cambios de esta versión:

- Límite lógico de 6,5 segundos por petición y 26 segundos por búsqueda, mediante rechazo de la promesa y no solamente mediante `AbortController`.
- Adaptación a los temporizadores de Nuvio: cuando existe `__plugin_sleep`, se usan esperas cortas de hasta 100 ms, en lugar de dejar esperas nativas largas pendientes después de completar una búsqueda.
- Entrega del primer reproductor válido sin esperar a otros servidores lentos.
- No se consulta el CDN HLS durante el descubrimiento. El enlace debe proceder de la configuración validada del reproductor de la película exacta; la aplicación negocia el vídeo al reproducir.
- La etiqueta de calidad pasa a «Auto»: no se afirma 1080p o 720p sin inspeccionar el vídeo.

El [puente de red y los temporizadores de Nuvio revisados](https://github.com/NuvioMedia/NuvioMobile/blob/cmp-rewrite/composeApp/src/fullCommonMain/kotlin/com/nuvio/app/features/plugins/runtime/js/JsBindings.kt) no conectan la señal de `AbortController` con la llamada HTTP nativa. Por ello, el temporizador anterior no garantizaba que terminase la promesa del proveedor.

El límite del plugin no garantiza cancelar un socket que la aplicación haya iniciado ni resolver una espera en la interfaz de la propia app. Las pruebas con temporizadores nativos son simulaciones desde Node, no una ejecución en el teléfono del usuario.

La versión actual es **0.1.3**. El script tiene un parámetro de versión para evitar reutilizar archivos anteriores en caché.

## Corrección de metadatos 0.1.1

La versión 0.1.1 añade una búsqueda alternativa de metadatos cuando la aplicación no inyecta una clave TMDB válida, admite identificadores numéricos sin esa clave y registra códigos de diagnóstico sin guardar URLs ni secretos. También elimina artículos iniciales durante una búsqueda alternativa de títulos, conservando siempre la comprobación exacta de IMDb.

Las capturas del usuario confirmaron la instalación y activación de 0.1.0 en una versión descargada desde GitHub. No demostraron la causa de los resultados vacíos en Android. Esta actualización corrige una dependencia frágil; no se presenta como una reparación ya verificada en el teléfono.

## Estado comprobado

- Veintidós pruebas automatizadas superadas con `npm test`, incluidas peticiones y cuerpos de respuesta que no terminan, cancelación de búsqueda, esperas nativas cortas y panel de diagnóstico con errores HTTP sin secretos.
- Prueba de 0.1.2 con IDs numéricos sin clave y temporizadores similares a Nuvio, sin temporizadores de navegador: una fuente para Nemo (`12`) en aproximadamente 0,85 segundos y una para Kung Fu Panda 2 (`49444`) en aproximadamente 0,54 segundos. La etiqueta es «Latino · Auto». No se ha probado la versión 0.1.2 en el teléfono.
- Prueba de red del 23 de octubre de 2026: la búsqueda de IMDb `tt6685538` encontró una ficha con coincidencia exacta de IMDb, resolvió un reproductor y devolvió un resultado HLS «Latino · 720p» en aproximadamente 3,3 segundos.
- Se pudieron leer la lista HLS principal y una lista secundaria con segmentos anunciados. No se descargaron ni decodificaron los segmentos ni se probó la reproducción en un dispositivo Nuvio.
- Prueba de red adicional con **Buscando a Nemo**, ID TMDB numérico `12`, sin clave TMDB: un resultado HLS latino de 720p; se verificaron el maestro y la lista secundaria. La última ejecución tardó aproximadamente 1,5 segundos.
- El ID numérico `603`, usado por el botón de prueba de la app revisada, devolvió cero coincidencias exactas en las búsquedas inspeccionadas de la fuente. No se sustituyó por una secuela ni por una película con título parecido.
- Publicado con autorización en el [repositorio Goku lattin](https://github.com/raiderking2022-wq/goku-lattin). La reproducción en el dispositivo sigue pendiente de comprobar.

El resultado de una prueba no garantiza que otros títulos, redes o dispositivos funcionen. Los enlaces firmados se resuelven de nuevo en cada consulta, no se guardan en el repositorio.

## Alcance de esta versión

- Películas únicamente, no series ni un catálogo de navegación propio.
- Búsqueda por título traducido y original cuando están disponibles. Cada ficha se valida por IMDb exacto para evitar confundir películas o remakes.
- Resolución de VOE a HLS mediante configuración validada del reproductor; no devuelve páginas HTML como si fueran vídeos. En 0.1.2 no se hace una comprobación de disponibilidad del CDN antes de mostrar la fuente.
- Filemoon/Byse, Doodstream, Mega y enlaces de descarga no están implementados. Una película sin enlace VOE resoluble no devuelve resultados en esta versión.
- Sin claves API incrustadas, dependencias de paquetes, ejecución de scripts del sitio ni uso de `eval`. Sí depende de servicios de red para metadatos, búsqueda y resolución.

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
