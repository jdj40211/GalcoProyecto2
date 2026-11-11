# Defectos y observaciones de la ejecución del Sprint 2

Commit probado: `dba0fb4` (origin/main). Entorno: Node v25.6.0, local demo en memoria. Fecha: 20 de octubre de 2026.
Ningún defecto hizo fallar un caso contra su resultado esperado. No se corrigió nada en el repositorio.

## DEF-01. `npm run preview` y `npm run start` no sirven la interfaz (responden 403)

- Severidad: media (rompe una forma documentada de levantar la aplicación; no afecta `npm run dev` ni las pruebas e2e del repo, que arrancan desde la raíz).
- Pasos para reproducir:
  1. En la raíz del repo: `npm run install:all` y `npm run build`.
  2. `SERVE_FRONTEND=true npm run preview` (o `npm run start` con la configuración de producción). El script ejecuta `npm --prefix backend start`, es decir, con el directorio actual en `backend/`.
  3. Abrir `http://127.0.0.1:3000/login` (o hacer `curl -i`).
- Esperado: la página de login.
- Observado: `HTTP/1.1 403 Forbidden` con `{"statusCode":403,"error":"Forbidden","message":"Forbidden"}`. `/api/health` sí responde 200. Con `node backend/app.js` lanzado desde la raíz, la misma ruta responde 200.
- Reproducido: sí, dos veces (con `npm run preview` y con `node app.js` desde `backend/`).
- Causa probable (no verificada con cambios de código): el manejador estático usa `h.file()` con una ruta absoluta a `frontend/dist`, que queda fuera del directorio de trabajo `backend/`, y `@hapi/inert` restringe por defecto los archivos al directorio base.
- Evidencia: `evidencias/HALLAZGO-npm-run-preview-403.txt`.
- Nota relacionada de documentación: el README dice "Abrir `http://localhost:3000`" después de `npm run dev`, pero en desarrollo el backend no sirve el frontend (en 3000 devuelve 404 y la interfaz está en Vite, puerto 5173).
- Riesgo para la sustentación: si el equipo demuestra con `npm run preview` o `npm run start`, verá una pantalla en blanco o un 403. Conviene ensayar con `npm run dev` y abrir el puerto 5173, o arrancar el backend desde la raíz.

## DEF-02. El PDF de la cotización sale con porcentajes vacíos y con "Versión:" vacío

- Severidad: media (el PDF es lo que recibe el cliente; el texto queda visiblemente incompleto). Afecta el criterio "PDF correcto" de S2-CP09 y S2-10-1.
- Pasos para reproducir:
  1. Iniciar sesión como `jdiaz` y guardar una cotización (por ejemplo la configuración `Cercha-6-12`).
  2. Descargar el PDF desde el historial (botón PDF) o por `GET /api/cotizador/{id}/pdf`.
  3. Leer la nota al pie de "Precios finales con AIU" y el encabezado.
- Esperado: la nota con las cifras de AIU y de costo de pintura en lugar de espacios en blanco, y la versión de la cotización.
- Observado: "Precios calculados con AIU de % sobre materia prima y MO interna, y % sobre pintura. Costo de galvanizado aplicado: $ 3.050 / kg..." (sin cifras) y "Versión:" sin valor en cotizaciones que no son variantes (las variantes sí muestran "Versión: 2").
- Reproducido: sí, en el PDF de la cotización original, en el de la variante y en el PDF que recibió el proveedor local falso.
- Causa (verificada en el código y en los datos): la plantilla `backend/templates/cotizacion.hbs` usa `parametrosAplicados.aiuMateriaPrimaYMOInterna` y `parametrosAplicados.aiuManoObraExterna`, pero la cotización guarda `aiuMateriales`, `aiuMOInterna`, `aiuMOExterna` y `aiuGalvanizado`; los nombres no coinciden, por eso salen vacíos. La versión solo se asigna al duplicar (`version: 1`) o editar, así que las cotizaciones originales no la tienen.
- Evidencia: `evidencias/DEF-PDF-A-original.pdf`, `evidencias/DEF-PDF-A-variante.pdf`, `evidencias/DEF-PDF-parametros-aplicados.txt`, `evidencias/SUPL-pdf-recibido-por-proveedor-local-falso-COT-2026-0001.pdf`.

## OBS-01. Un soporte pendiente asociado a un viaje ya legalizado queda bloqueado

- Severidad: baja (observación de diseño, no contradice el criterio S2-26-3/4, que exige no modificar saldos).
- Observado: si un viaje se legaliza con un soporte mientras otro soporte del mismo viaje sigue "pendiente_revision", ese segundo soporte ya no se puede editar ni borrar ("El soporte forma parte de una legalización cerrada."), y no entra en la legalización. Queda huérfano en el historial.
- Reproducido: sí (soporte "Soporte pendiente QA" tras cerrar VIA-2026-0003).
- Evidencia: `evidencias/OBS-01-soporte-pendiente-huerfano-tras-cierre.txt`.
- Sugerencia: definir con el Product Owner si debe poder desvincularse o rechazarse después del cierre.

## OBS-02. Los mensajes de error de envío muestran detalles técnicos al usuario

- Severidad: baja.
- Observado: con el proveedor sin configurar, el aviso en pantalla dice "Configura MAIL_ENDPOINT y MAIL_TOKEN para enviar correo."; con el proveedor caído, la API responde "No fue posible confirmar el envío con el proveedor.: fetch failed". El comportamiento requerido por S2-10-2 y S2-10-3 se cumple (error visible y cotización en borrador); solo el texto no está pensado para el usuario final.
- Evidencia: `evidencias/S2-CP10-03-proveedor-no-disponible-ui.png`, `evidencias/S2-CP10-06-api-proveedor-caido.txt`.

## OBS-03. Intentar recuperar contraseña con el campo vacío deja visible el mensaje anterior

- Severidad: muy baja.
- Observado: tras un intento previo, si se deja el campo vacío, la validación nativa del navegador impide el envío pero el mensaje de error anterior sigue en pantalla. No muestra información falsa (nunca dice que se envió un correo).
- Evidencia: `evidencias/S2-CP02-04c-resultado.png`.
