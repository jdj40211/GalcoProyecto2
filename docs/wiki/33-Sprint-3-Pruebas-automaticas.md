# Sprint 3 — Pruebas automáticas de software

Continúa la estrategia del [Sprint 2](24-Sprint-2-Pruebas-automaticas.md) con el módulo de Hojas de vida y el despliegue.

## Inventario en `main` (`5adce73`)

Conteo hecho leyendo los archivos (llamadas `test(` / `it(` de primer nivel).

| Capa                 | Herramienta                               | Archivos                                                               |          Pruebas |
| -------------------- | ----------------------------------------- | ---------------------------------------------------------------------- | ---------------: |
| Backend              | `node --test` (`backend/package.json:10`) | 15 archivos en `backend/tests/`                                        |              119 |
| Frontend             | Vitest (`frontend/package.json:13`)       | 5 archivos en `frontend/src/services/*.test.js`                        |               25 |
| Navegador (E2E)      | Puppeteer + Chromium (`package.json:21`)  | `backend/scripts/e2e-smoke.js`, `e2e-sprint2.js`, `e2e-hojasdevida.js` |     3 recorridos |
| Después de desplegar | Node (`package.json:20`)                  | `backend/scripts/smoke-deploy.js`                                      | 6 comprobaciones |

Detalle del backend:

| Archivo                        | Pruebas | Sprint | Qué cubre                                                  |
| ------------------------------ | ------: | ------ | ---------------------------------------------------------- |
| `calculos.test.js`             |      23 | 1      | Reglas de cálculo de postes                                |
| `sprint2.test.js`              |      18 | 2      | Usuarios, catálogo, variantes, envío, avisos, legalización |
| `ocr.test.js`                  |       9 | 1-2    | OCR de comprobantes                                        |
| `indicadores.test.js`          |       5 | 2      | Indicadores de cotizaciones (HU-12)                        |
| `suite.test.js`                |       4 | 1      | Roles, catálogo, cotización y PDF                          |
| `api.test.js`                  |       3 | 1      | API de viáticos                                            |
| `solicitudes.test.js`          |       3 | 1      | Solicitudes de viaje                                       |
| `auth.test.js`                 |       2 | 2      | Tokens de Firebase y roles                                 |
| `frontend.test.js`             |       2 | **3**  | Servir la interfaz (bug #62)                               |
| `candidatos.test.js`           |       7 | **3**  | HU-13 y HU-31                                              |
| `documentos-candidato.test.js` |       6 | **3**  | HU-14                                                      |
| `analisis-candidato.test.js`   |      11 | **3**  | HU-28                                                      |
| `vacantes.test.js`             |       6 | **3**  | HU-29                                                      |
| `evaluaciones.test.js`         |      11 | **3**  | HU-30 (y una de HU-34)                                     |
| `registro-hv.test.js`          |       9 | **3**  | HU-34                                                      |
| **Total**                      | **119** |        | 52 nuevas en el Sprint 3                                   |

El frontend no agregó pruebas en el Sprint 3 (25 antes y después). Las pantallas nuevas (`CandidatesView`, `VacanciesView`, `RankingView`, `ReviewAnalysisView`) se prueban con el recorrido E2E, no con pruebas de componente.

## Estrategia

| Funcionalidad                                            | Tipo de prueba                                                     | Justificación                                                                                                                                                                |
| -------------------------------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Registro de candidatos y permisos (HU-13, HU-31)         | Integración API (servidor Hapi en memoria con `inject`)            | Valida juntos la validación Joi, la normalización de la identificación, los duplicados y el `scope` por rol, que es donde se aplica la seguridad                             |
| Documentos del candidato (HU-14)                         | Integración API con archivos reales                                | El riesgo está en los bytes: firma del archivo, límite de 10 MB y descarga idéntica; un mock del archivo no lo detectaría                                                    |
| Lectura de DOCX y cálculo de años de experiencia (HU-28) | Unitarias                                                          | Son algoritmos puros (texto de un DOCX real, unión de periodos que se cruzan) con valores esperados calculados a mano                                                        |
| Análisis con IA y confirmación (HU-28)                   | Integración con el proveedor de IA sustituido (`fetch` simulado)   | Permite probar éxito, IA caída, autorización faltante y DOC sin gastar dinero ni depender de la red, y comprobar qué se envía exactamente (`store: false`, PDF como archivo) |
| Vacantes con pesos y versiones (HU-29)                   | Integración API                                                    | Las reglas (suma 100, versión por cambio, cerrada no evalúa) cruzan validador, servicio y permisos                                                                           |
| Puntaje y ranking (HU-30)                                | Escenarios con candidatos de referencia y puntaje calculado a mano | El puntaje es un algoritmo con pesos: los escenarios fijan el resultado exacto por criterio y detectan cualquier cambio en las reglas                                        |
| Exclusión de datos sensibles (HU-30 CA5)                 | Integración con IA sustituida que inspecciona la solicitud         | Es un requisito ético y legal; la prueba falla si a la IA llega nombre, identificación, contacto o ciudad                                                                    |
| Registro desde la hoja de vida (HU-34)                   | Integración API + E2E                                              | Es un flujo de varios pasos (carga, análisis, pendiente, confirmación, evaluación, descarte) donde importa que un fallo no deje registros a medias                           |
| Flujo visible del módulo de Hojas de vida                | E2E en Chromium (`e2e-hojasdevida.js`)                             | Detecta fallos de rutas, formularios, diálogos e integración frontend/API que las pruebas de API no ven; genera las capturas de evidencia                                    |
| Servir la interfaz desde el backend (#62)                | Integración con un directorio temporal                             | Reproduce la causa del bug (directorio de trabajo distinto) sin depender de un build                                                                                         |
| Despliegue (HU-32)                                       | Prueba de humo contra la URL                                       | Confirma lo que solo existe en la nube: MongoDB conectado, interfaz publicada, datos protegidos y nada expuesto fuera de la interfaz                                         |

## Caso exitoso y caso alternativo por funcionalidad

El documento maestro del Sprint 2 exige al menos dos pruebas por funcionalidad: una del camino feliz y otra de un flujo alternativo.

| HU    | Caso exitoso                                                                   | Caso alternativo                                                                                                                                            |
| ----- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HU-31 | `candidatos.test.js:127` admin crea cuenta RRHH que entra con ese rol          | `candidatos.test.js:109` y `:117` comercial y contabilidad reciben 403; RRHH no usa viáticos ni cotizador                                                   |
| HU-13 | `candidatos.test.js:45` registro con fecha, responsable, estado y autorización | `:74` identificación o correo repetidos; `:92` obligatorios y correo inválido; `:68` sin autorización                                                       |
| HU-14 | `documentos-candidato.test.js:56` adjunta PDF y se descarga idéntico           | `:89` formato no permitido o disfrazado; `:106` más de 10 MB; `:114` inexistentes; `:120` sin permiso                                                       |
| HU-28 | `analisis-candidato.test.js:112` y `:134` propone y guarda solo al confirmar   | `:201` IA caída; `:182` sin autorización; `:191` DOC; `:168` confirmación con datos inválidos                                                               |
| HU-29 | `vacantes.test.js:41` crea vacante abierta versión 1                           | `:60` pesos que no suman 100; `:78` obligatorios; `:118` cerrada; `:139` sin permiso                                                                        |
| HU-30 | `evaluaciones.test.js:126` puntaje con desglose y evidencia                    | `:160` obligatorio incumplido; `:239` IA caída; `:253` datos excluidos; `:287` vacante cerrada; `:297` sin permiso                                          |
| HU-34 | `registro-hv.test.js:67` y `:116` pendiente y luego registrado y evaluado      | `:84` sin autorización; `:92` vacante cerrada o formato inválido; `:108` IA caída; `:134` duplicados; `:159` vacante cerrada al confirmar; `:169` descartar |
| #62   | `frontend.test.js:30` sirve la interfaz desde otro directorio                  | `frontend.test.js:50` no publica archivos fuera del frontend y la API inexistente responde 404                                                              |

Coherencia con los casos funcionales: cada fila corresponde a casos de [32](32-Sprint-3-Pruebas-funcionales.md); la columna "Ejecución automatizada" de esa página enlaza la prueba exacta.

## Ejecución

```bash
npm run install:all
npm run test        # frontend (Vitest) + backend (node --test)
npm run build
npm run test:e2e    # e2e-smoke, e2e-sprint2, e2e-hojasdevida
npm run verify      # formato, lint, pruebas, build, E2E y auditoría
npm run smoke:deploy -- https://galco-suite.onrender.com
```

Entorno de las pruebas automáticas: persistencia en memoria, autenticación demo y proveedores de IA sustituidos. **Ninguna prueba automática llama a OpenAI real ni envía correos.**

### Último resultado registrado

| Ejecución                              | Resultado                                                | Fuente |
| -------------------------------------- | -------------------------------------------------------- | ------ |
| `npm test` en la rama de HU-34         | Backend 119/119; frontend 25/25; lint sin errores        | PR #82 |
| `npm run test:e2e` en la rama de HU-34 | `e2e-smoke`, `e2e-sprint2` y `e2e-hojasdevida` aprobados | PR #82 |
| `npm run audit:prod`                   | 0 alertas altas o críticas                               | PR #79 |
| Prueba de humo en la URL pública       | 6/6 OK                                                   | PR #80 |

Son ejecuciones locales del autor de cada PR. **No hay ejecución en CI.**

> **Pendiente del equipo:** correr `npm run verify` sobre `main` (`5adce73` o la versión que se presente) en un equipo distinto al del autor y guardar la salida en `docs/evidencias/sprint-3/RESULTADOS.md`, como se hizo en el Sprint 2. Los PR #74 a #79 indican que `format:check` falla en Windows por finales de línea CRLF en archivos no tocados; conviene ejecutarlo con `git config core.autocrlf false` o en Linux.

## Integración continua

`.github/workflows/ci.yml` y `codeql.yml` siguen configurados, pero **GitHub Actions no ejecuta trabajos en este repositorio porque la cuenta dueña está bloqueada por facturación** ("The job was not started because your account is locked due to a billing issue", registrado en el PR #73). En consecuencia:

- ningún PR del Sprint 3 tiene checks en verde;
- la protección de `main` que impediría fusionar con pruebas fallidas no tiene efecto;
- no hay reporte de cobertura publicado. `npm run test:coverage` funciona en local, y su porcentaje es diagnóstico, no cobertura funcional.

Mitigación propuesta (riesgo R15 en [31](31-Sprint-3-Caso-de-negocio-final.md)): resolver la facturación o trasladar el repositorio a una cuenta sin bloqueo, y relanzar los checks de los PR del Sprint 3.

## Límites

- Las pruebas con IA usan respuestas simuladas: comprueban el contrato y el manejo de errores, no la calidad de la extracción. La calidad con OpenAI real se valida en S3-CP12 y S3-CP36.
- Con el proveedor demo, la valoración de habilidades es por coincidencia de texto (PR #78); no representa el comportamiento de OpenAI.
- Los recorridos E2E activan controles mediante eventos del DOM en Chromium; no certifican la interacción física con ratón o teclado.
