# 16 · Sprint 1 — Backlog y trazabilidad

## Objetivo del Sprint

Entregar un MVP ejecutable que permita autenticar usuarios, crear y guardar una cotización de postes, registrar una solicitud de viaje con gastos estimados y procesar un soporte de viático con extracción asistida, con calidad y trazabilidad verificables.

## Alcance acordado

El producto en desarrollo integra **Cotizador de postes + Gestión de viáticos**. La historia [HU-13 Registrar candidato](https://github.com/jdj40211/GalcoProyecto2/issues/17) pertenece al módulo de hojas de vida documentado en Sprint 0, pero no forma parte del producto integrado solicitado para este incremento. Se conserva en el Product Backlog y requiere una decisión explícita del Product Owner para reprogramarse; no se declara terminada.

## Estado del Sprint Backlog

| Historia                               |                                                       Issue | Resultado en el código                                              | Estado técnico                                             |
| -------------------------------------- | ----------------------------------------------------------: | ------------------------------------------------------------------- | ---------------------------------------------------------- |
| HU-01 Iniciar sesión                   |   [#5](https://github.com/jdj40211/GalcoProyecto2/issues/5) | Login Firebase y modo demo local; rutas protegidas                  | Implementada                                               |
| HU-02 Cerrar sesión y controlar sesión |   [#6](https://github.com/jdj40211/GalcoProyecto2/issues/6) | Cierre de sesión, limpieza local y redirección                      | Implementada; expiración real depende de Firebase          |
| HU-03 Acceso por roles                 |   [#7](https://github.com/jdj40211/GalcoProyecto2/issues/7) | Comercial y Contabilidad con permisos de API y menú                 | Implementada para módulos en alcance                       |
| HU-06 Consultar configuraciones        | [#10](https://github.com/jdj40211/GalcoProyecto2/issues/10) | Tipos, alturas, brazos y parámetros disponibles                     | Parcial: falta administración completa del catálogo        |
| HU-07 Crear cotización                 | [#11](https://github.com/jdj40211/GalcoProyecto2/issues/11) | Cálculo, snapshot, borrador, consecutivo, vigencia, historial y PDF | Implementada                                               |
| HU-20 Registrar solicitud de viaje     | [#24](https://github.com/jdj40211/GalcoProyecto2/issues/24) | Borrador con destino, fechas, motivo, centro de costo y flujo       | Implementada                                               |
| HU-21 Registrar gastos estimados       | [#25](https://github.com/jdj40211/GalcoProyecto2/issues/25) | Filas repetibles, validación y total automático                     | Implementada                                               |
| HU-25 Extraer datos de soporte con OCR | [#29](https://github.com/jdj40211/GalcoProyecto2/issues/29) | JPG/PNG/PDF, extracción, confianza y corrección humana              | Parcial: falta preprocesamiento de imagen y bucket privado |
| HU-13 Registrar candidato              | [#17](https://github.com/jdj40211/GalcoProyecto2/issues/17) | Sin implementación por decisión de alcance                          | Reprogramar                                                |

Los issues remotos continúan abiertos hasta que el equipo revise el incremento, fusione el PR y cierre únicamente las historias cuyo criterio de aceptación esté completo.

## Trazabilidad historia → aceptación → prueba

| HU    | Criterio de aceptación (CA)                                       | Caso de prueba (CP)            | Evidencia automatizada                               | Resultado                     |
| ----- | ----------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------- | ----------------------------- |
| HU-01 | CA-01 Credenciales válidas abren la plataforma                    | CP-01 Login válido             | Flujo de autenticación + guardas de router           | Verificación manual requerida |
| HU-01 | CA-02 Credenciales inválidas muestran error y no crean sesión     | CP-02 Login inválido           | Validación Firebase/demo                             | Verificación manual requerida |
| HU-02 | CA-01 Salir elimina sesión y vuelve al login                      | CP-03 Cerrar sesión            | Store de autenticación y router                      | Verificación manual requerida |
| HU-03 | CA-01 Comercial no aprueba solicitudes ni cambia parámetros       | CP-04 Permiso negativo         | `backend/tests/suite.test.js`                        | Aprobado                      |
| HU-03 | CA-02 Contabilidad puede revisar/aprobar y administrar parámetros | CP-05 Permiso contable         | `backend/tests/suite.test.js`, `solicitudes.test.js` | Aprobado                      |
| HU-06 | CA-01 Se muestran configuraciones válidas                         | CP-06 Catálogo inicial         | `backend/tests/suite.test.js`                        | Aprobado                      |
| HU-06 | CA-02 Configuraciones inválidas son rechazadas                    | CP-07 Catálogo inválido        | `backend/tests/suite.test.js`                        | Aprobado                      |
| HU-07 | CA-01 Calcula poste con reglas vigentes                           | CP-08 Cálculo base             | `backend/tests/calculos.test.js`                     | Aprobado                      |
| HU-07 | CA-02 Guarda instantánea, consecutivo, estado y vigencia          | CP-09 Guardar cotización       | `backend/tests/suite.test.js`                        | Aprobado                      |
| HU-07 | CA-03 Genera PDF consultable                                      | CP-10 Descargar PDF            | `backend/tests/suite.test.js`                        | Aprobado                      |
| HU-20 | CA-01 Crea borrador con datos obligatorios                        | CP-11 Crear solicitud          | `backend/tests/solicitudes.test.js`                  | Aprobado                      |
| HU-20 | CA-02 Impide fechas inconsistentes y acceso ajeno                 | CP-12 Validaciones/aislamiento | `backend/tests/solicitudes.test.js`                  | Aprobado                      |
| HU-21 | CA-01 Suma gastos estimados y valida valores                      | CP-13 Gastos y total           | `backend/tests/solicitudes.test.js`                  | Aprobado                      |
| HU-21 | CA-02 Puede enviar y decidir según rol                            | CP-14 Estados y autorización   | `backend/tests/solicitudes.test.js`                  | Aprobado                      |
| HU-25 | CA-01 Acepta JPG/PNG/PDF hasta 10 MB                              | CP-15 Archivo válido/límites   | Validadores backend y frontend                       | Verificación manual requerida |
| HU-25 | CA-02 Extrae campos y nivel de confianza                          | CP-16 OCR                      | `backend/tests/api.test.js`                          | Aprobado en modo demo         |
| HU-25 | CA-03 Conserva las correcciones humanas                           | CP-17 Corregir OCR             | Modelo y servicio de viáticos                        | Verificación manual requerida |

## Definition of Done de Sprint 1

Una historia se considera terminada únicamente cuando:

- sus criterios de aceptación están identificados;
- la funcionalidad opera desde la interfaz y la API;
- existen pruebas positivas y negativas proporcionales al riesgo;
- ESLint, formato, pruebas y compilación pasan;
- no se incorporan vulnerabilidades altas conocidas;
- el PR enlaza la historia y recibe al menos una aprobación de otro integrante;
- la wiki y el manual de prueba reflejan el comportamiento real;
- no quedan secretos ni datos sensibles en el repositorio.

## Deuda priorizada para el siguiente incremento

1. Configurar Firebase, MongoDB y almacenamiento privado en un entorno compartido.
2. Agregar preprocesamiento de imagen y OCR real medido con comprobantes autorizados.
3. Completar administración y búsqueda del catálogo de postes.
4. Añadir pruebas end-to-end automatizadas en navegador.
5. Resolver con Product Owner si Hojas de vida continúa, se separa o se reemplaza formalmente.
6. Medir tiempos y errores antes/después con usuarios de GALCO.

## Cierre operativo

Al cerrar el Sprint, el Product Owner debe aceptar o rechazar cada historia, los responsables deben adjuntar evidencia manual y el equipo debe mover a Done/cerrar solo lo aceptado. Las historias parciales regresan al Product Backlog con el trabajo faltante explícito.
