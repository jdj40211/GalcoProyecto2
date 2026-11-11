# Sprint 3 — Alcance y trazabilidad

## Objetivo

Cerrar el producto con el módulo de **Hojas de vida** (épica EP-03, #3) y su analizador con IA, y **desplegar la aplicación en una nube pública** (EP-05, #65). El documento maestro del Sprint 3 pide "concluir y pulir la implementación" con "avances menores a nivel de desarrollo"; el equipo, además, retomó el módulo de Hojas de vida que en los Sprint 1 y 2 había quedado en el Product Backlog ([16](16-Sprint-1-Backlog-y-trazabilidad.md), [22](22-Sprint-2-Alcance-y-trazabilidad.md)).

Base: `main` en `5adce73` (11 de noviembre de 2026), con los PR #72 a #80 y #82 fusionados. Aplicación: https://galco-suite.onrender.com ([29 · Despliegue](29-Sprint-3-Despliegue.md)).

> **Aviso sobre la versión desplegada:** al cerrar esta página, Render todavía sirve una versión anterior a HU-34 (PR #82). Hasta un nuevo despliegue desde `main`, HU-34 está comprobada en local (pruebas automáticas y E2E), **no en la nube**.

## Principios del analizador de hojas de vida

Estos principios son parte del alcance y se verifican en el código y en las pruebas, no solo en la interfaz:

| Principio                                                                                                                             | Dónde se cumple                                                                                                                                                                                  | Prueba                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **La IA solo propone; RRHH confirma.** Nada llega a la ficha del candidato antes de la confirmación.                                  | `POST /api/candidatos/{id}/analisis/{analisisId}/confirmar` (`backend/modules/hojasdevida/hojasdevida.plugin.js:117`)                                                                            | `backend/tests/analisis-candidato.test.js:112` y `:134`                                                                                     |
| **La evaluación es un apoyo:** no cambia la etapa ni descarta a nadie.                                                                | `backend/modules/hojasdevida/services/evaluaciones.service.js:3-5` y `:310`                                                                                                                      | `backend/tests/evaluaciones.test.js:205`                                                                                                    |
| **Datos excluidos** de la IA y del puntaje: edad, género, estado civil, foto, origen, religión, discapacidad, salud e identificación. | Instrucciones de extracción (`analisis.service.js:30`); a la evaluación solo llega el perfil profesional, sin nombre, identificación, contacto ni ciudad (`evaluaciones.service.js:117`, `:141`) | `backend/tests/evaluaciones.test.js:253`                                                                                                    |
| **Autorización de tratamiento de datos (Ley 1581 de 2012)** antes de enviar cualquier cosa a la IA.                                   | `candidatos.service.js:44` y `:57-60`; `analisis.service.js:269-272`; `evaluaciones.service.js:209`                                                                                              | `backend/tests/analisis-candidato.test.js:182`, `backend/tests/registro-hv.test.js:84`                                                      |
| **OpenAI con `store: false`:** el proveedor no conserva el contenido.                                                                 | `backend/utils/openai.js:38` y `:49`                                                                                                                                                             | `backend/tests/analisis-candidato.test.js:242`                                                                                              |
| **Solo RRHH y administración** acceden al módulo.                                                                                     | `scope: ['rrhh', 'admin']` (`hojasdevida.plugin.js:15`); rutas del frontend (`frontend/src/router/index.js`)                                                                                     | `candidatos.test.js:109`, `documentos-candidato.test.js:120`, `vacantes.test.js:139`, `evaluaciones.test.js:297`, `registro-hv.test.js:182` |

## Alcance del Sprint y estado verificado en GitHub

Estado de los issues consultado el 11 de noviembre de 2026 (`gh issue list --state all`).

| HU / issue    | Historia                                             | SP  | PR       | Estado en GitHub                    | Estado del incremento                                                                                                                                   |
| ------------- | ---------------------------------------------------- | --- | -------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HU-31 / #69   | Habilitar el rol Recursos Humanos                    | 2   | #74      | Cerrado                             | Implementada                                                                                                                                            |
| HU-13 / #17   | Registrar candidato                                  | 5   | #74      | Cerrado                             | Implementada (registro manual)                                                                                                                          |
| HU-14 / #18   | Adjuntar hoja de vida                                | 3   | #75      | Cerrado                             | Implementada; archivos en GridFS                                                                                                                        |
| HU-28 / #66   | Analizar hoja de vida con IA                         | 8   | #76      | Cerrado                             | Implementada; pruebas con OpenAI simulado. Prueba manual con OpenAI real: ver [32](32-Sprint-3-Pruebas-funcionales.md)                                  |
| HU-29 / #67   | Definir el perfil de la vacante                      | 3   | #77      | Cerrado                             | Implementada                                                                                                                                            |
| HU-30 / #68   | Evaluar el ajuste del candidato a una vacante        | 8   | #78      | Cerrado                             | Implementada; con el proveedor demo las habilidades se valoran por coincidencia de texto                                                                |
| HU-34 / #81   | Registrar candidatos desde la hoja de vida           | 5   | #82      | Cerrado (fusionado el 11/11/2026)   | Implementada en `main`; **pendiente de verificar en la nube** (la URL aún sirve una versión anterior)                                                   |
| HU-32 / #70   | Desplegar la aplicación en una nube pública          | 5   | #79, #80 | **Abierto**                         | Desplegada en Render + MongoDB Atlas; prueba de humo aprobada (PR #80). Falta la verificación manual con cuentas reales (CA1, CA2, CA4) antes de cerrar |
| Bug #62       | La interfaz respondía 403 con `npm start`            | —   | #72      | Cerrado                             | Corregido; prueba `backend/tests/frontend.test.js`                                                                                                      |
| — (sin issue) | Alertas altas de dependencias                        | —   | #73, #79 | —                                   | Corregidas; `mongoose` 8.24.8                                                                                                                           |
| HU-33 / #71   | Enviar cotizaciones con un proveedor de correo real  | 3   | —        | **Cerrado como "not planned"**      | **Descartada por decisión del equipo.** El sistema no envía correo; la cotización se entrega descargando el PDF. Retirada de EP-02 (#2) y del Sprint 3  |
| HU-15 / #19   | Buscar y filtrar candidatos                          | 5   | —        | Abierto (hito Sprint 4, hipotético) | No implementada                                                                                                                                         |
| HU-16 / #20   | Consultar perfil                                     | 3   | —        | Abierto (hito Sprint 4, hipotético) | No implementada                                                                                                                                         |
| HU-18 / #22   | Gestionar etapa de selección                         | 5   | —        | Abierto (hito Sprint 4, hipotético) | No implementada. Mientras no exista, ningún flujo cambia la etapa del candidato                                                                         |
| Bug #63       | PDF con la nota de AIU sin cifras y "Versión:" vacío | —   | #83      | Cerrado (hito Sprint 3)             | Corregido: la nota muestra los porcentajes de AIU aplicados y el PDF muestra la versión. Pruebas en `backend/tests/pdf-cotizacion.test.js`              |

**Resumen en puntos de historia** (SP del issue): implementados y fusionados 34 SP (HU-13, 14, 28, 29, 30, 31, 34); en verificación 5 SP (HU-32); no implementados, movidos al Sprint 4 (hipotético): 13 SP (HU-15, 16, 18); descartados 3 SP (HU-33).

### Decisiones de alcance durante el Sprint

1. **HU-34 surgió en el Sprint** (#81, creada el 11 de noviembre) al cargar las 10 hojas de vida de prueba: registrar cada candidato a mano y luego adjuntar, analizar y evaluar resultaba lento. Cambia el CA1 de HU-13 **solo en el flujo desde la hoja de vida**: la identificación pasa a ser opcional (el registro manual la sigue exigiendo, `backend/tests/candidatos.test.js:92`).
2. **HU-33 se descartó** (#71, "not planned"): por ahora el sistema no enviará correo. Consecuencias que el equipo debe tener presentes:
   - El botón **"Enviar por correo"** del historial de cotizaciones sigue en la interfaz (`frontend/src/views/QuoteHistoryView.vue:121-127`) y, sin `MAIL_ENDPOINT` y `MAIL_TOKEN`, el servidor responde que el correo no está configurado (`backend/modules/cotizador/services/envio.service.js:11`). Ver la propuesta de ajuste en [34](34-Sprint-3-Pruebas-usabilidad.md).
   - La [Wiki 07](07-Funcionalidades.md) y el README siguen describiendo el envío por correo como función del producto.
3. **HU-15, HU-16 y HU-18** conservan el hito "Sprint 3" en GitHub, pero no se implementaron. Se proponen para un hipotético Sprint 4 (ver [36](36-Sprint-3-Ceremonias-y-cierre.md)).

> **Pendiente del equipo:** registrar en el acta de la planning o de la review quién tomó cada decisión (incluir HU-34 en el Sprint, descartar HU-33, dejar HU-15/16/18 fuera) y si el Product Owner/cliente las aceptó.

## Trazabilidad HU → criterio → prueba → evidencia

Los criterios (CA) y casos (CP) son los de cada issue; no se renumeran. Las pruebas automáticas se detallan en [33](33-Sprint-3-Pruebas-automaticas.md) y los casos funcionales manuales en [32](32-Sprint-3-Pruebas-funcionales.md).

| HU    | CA cubiertos por prueba automática       | Prueba de API (`backend/tests/`)                                          | Recorrido E2E (`backend/scripts/e2e-hojasdevida.js`)             | Evidencia visual (`docs/evidencias/sprint-3/ui/`)        |
| ----- | ---------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------- |
| HU-31 | CA1, CA2, CA3                            | `candidatos.test.js:109`, `:117`, `:127`                                  | `:73` (RRHH entra a candidatos), `:335` (permisos cruzados)      | `01-candidatos-vacio.png`                                |
| HU-13 | CA1 a CA6                                | `candidatos.test.js:45`, `:68`, `:74`, `:92`, `:109`                      | `:83` a `:126`                                                   | `02-candidato-registrado.png`, `03-candidatos-movil.png` |
| HU-14 | CA1 a CA6                                | `documentos-candidato.test.js:56`, `:82`, `:89`, `:106`, `:114`, `:120`   | `:135`                                                           | `04-documentos-candidato.png`                            |
| HU-28 | CA1 a CA7                                | `analisis-candidato.test.js:85` a `:276` (11 pruebas)                     | `:167`                                                           | `05-revision-analisis.png`                               |
| HU-29 | CA1 a CA5                                | `vacantes.test.js:41`, `:60`, `:78`, `:92`, `:118`, `:139`                | `:196`                                                           | `06-vacantes.png`                                        |
| HU-30 | CA1 a CA7; además HU-29 CP-03            | `evaluaciones.test.js:88` a `:297` (11 pruebas)                           | `:225`, `:330`                                                   | `07-ranking-detalle.png`                                 |
| HU-34 | CA1 a CA7 (CA7 solo en E2E)              | `registro-hv.test.js:67` a `:182` (9 pruebas); `evaluaciones.test.js:113` | `:254` a `:293`                                                  | `08-registro-desde-hv.png`, `09-revision-pendiente.png`  |
| HU-32 | CA5 automatizado; CA1, CA2, CA4 manuales | `frontend.test.js:30`, `:50` (servir la interfaz)                         | `backend/scripts/smoke-deploy.js` contra la URL pública (PR #80) | Salida de la prueba de humo en PR #80                    |

Las capturas las genera el recorrido E2E con datos ficticios (`backend/scripts/e2e-hojasdevida.js:61`). Algunas muestran varios avisos superpuestos en la esquina superior derecha porque el recorrido encadena acciones rápidamente; no es el comportamiento que verá un usuario.

## Deuda y dependencias al cierre

- Verificación manual de HU-32 en la nube con cuentas reales (CA1, CA2, CA4 de #70) y nuevo despliegue que incluya HU-34.
- Prueba manual del analizador con OpenAI real y las 10 hojas de vida ficticias de prueba (`10_hojas_de_vida_individuales`, marcadas "documento ficticio — uso exclusivo en pruebas de software").
- Bug #63 (PDF incompleto), ahora más visible porque el PDF descargado es el canal de entrega.
- HU-15, HU-16, HU-18 sin implementar; HU-17 y HU-19 sin refinar.
- GitHub Actions no ejecuta trabajos: la cuenta dueña del repositorio está bloqueada por facturación (registrado en los PR #73 a #79). No hay CI ni bloqueo de merge efectivo.
- Ningún PR del Sprint 3 (#72 a #82) tiene revisiones registradas en GitHub; la plantilla de PR deja sin marcar "Otro integrante revisó y aprobó el cambio".
- Plan gratuito: Render se suspende tras 15 minutos sin tráfico y Atlas M0 no tiene copias automáticas ([29](29-Sprint-3-Despliegue.md), sección 8).
