# 17 · Sprint 1 — Pruebas funcionales

## Estrategia

Cada caso enlaza una historia (HU), un criterio de aceptación (CA) y un identificador de prueba (CP). Los defectos encontrados deben usar la plantilla de bug del repositorio e indicar HU y CP. Las pruebas automatizadas protegen reglas y permisos. El guion puede repetirse manualmente durante la aceptación; en esta rama también se ejecutó completo con un navegador Chromium real y se inspeccionaron visualmente sus capturas.

## Entorno de ejecución

| Dato      | Valor                                              |
| --------- | -------------------------------------------------- |
| Fecha     | 2026-09-07                                         |
| Rama      | `feature/sprint-1-mvp`                             |
| Frontend  | Vue 3/Vite, compilación de producción              |
| Backend   | Hapi, persistencia en memoria y autenticación demo |
| Navegador | Chromium headless mediante Puppeteer 25.9          |

## Datos de prueba locales

- Comercial: `jdiaz` / `1234`
- Contabilidad: `acastro` / `conta2024`
- Cliente ficticio: `Cliente de prueba Sprint 1`
- Los datos demo no deben reutilizarse en producción.

## Casos funcionales: guion manual y ejecución en navegador

| CP    | HU / CA       | Precondición            | Pasos resumidos                                               | Resultado esperado                                                               | Estado                   |
| ----- | ------------- | ----------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------ |
| CP-01 | HU-01 / CA-01 | App abierta sin sesión  | Ingresar credenciales Comercial y seleccionar Entrar          | Abre inicio; muestra rol y módulos permitidos                                    | Aprobado E2E             |
| CP-02 | HU-01 / CA-02 | App abierta sin sesión  | Usar contraseña incorrecta                                    | Muestra error; permanece en login                                                | Aprobado E2E             |
| CP-03 | HU-02 / CA-01 | Sesión activa           | Seleccionar Salir y volver a una URL privada                  | Vuelve al login y no expone pantalla privada                                     | Aprobado E2E             |
| CP-04 | HU-03 / CA-01 | Sesión Comercial        | Intentar acceder a revisión contable                          | Menú no ofrece la acción y API responde 403                                      | Aprobado automáticamente |
| CP-05 | HU-03 / CA-02 | Sesión Contabilidad     | Abrir solicitudes enviadas y decidir                          | Puede aprobar/rechazar y registra responsable                                    | Aprobado E2E             |
| CP-06 | HU-06 / CA-01 | Sesión Comercial        | Abrir Cotizador y cambiar tipo                                | Alturas/brazos corresponden al tipo                                              | Aprobado E2E             |
| CP-07 | HU-06 / CA-02 | API disponible          | Enviar brazo no permitido                                     | API responde 400 con mensaje controlado                                          | Aprobado automáticamente |
| CP-08 | HU-07 / CA-01 | Cotizador abierto       | Configurar Cercha 6 m, brazo 12 m, pintura y calcular         | Presenta pesos, áreas, costos y precio                                           | Aprobado E2E             |
| CP-09 | HU-07 / CA-02 | Resultado calculado     | Completar cliente/vendedor/vigencia y guardar                 | Genera `COT-AAAA-NNNN`, estado borrador e historial                              | Aprobado E2E/API         |
| CP-10 | HU-07 / CA-03 | Cotización guardada     | Descargar PDF                                                 | Descarga documento no vacío con cliente, valores y vigencia                      | Aprobado E2E/API         |
| CP-11 | HU-20 / CA-01 | Sesión Comercial        | Crear solicitud con destino, fechas, motivo y centro de costo | Guarda borrador con consecutivo                                                  | Aprobado E2E             |
| CP-12 | HU-20 / CA-02 | Formulario de solicitud | Poner fecha final anterior a inicial                          | Impide guardar y explica el error                                                | Aprobado E2E             |
| CP-13 | HU-21 / CA-01 | Solicitud nueva         | Añadir dos gastos con valores diferentes                      | Total equivale a la suma; admite eliminar filas                                  | Aprobado E2E             |
| CP-14 | HU-21 / CA-02 | Borrador existente      | Enviar; luego aprobar como Contabilidad                       | Cambia de borrador a enviada y a aprobada                                        | Aprobado E2E             |
| CP-15 | HU-25 / CA-01 | Sesión Comercial        | Cargar JPG/PNG/PDF válido y luego archivo no permitido        | Procesa el válido y rechaza tipo/tamaño inválido                                 | Aprobado E2E             |
| CP-16 | HU-25 / CA-02 | Soporte válido cargado  | Continuar a validación                                        | Muestra proveedor, NIT, documento, fecha, subtotal, impuestos, total y confianza | Aprobado E2E             |
| CP-17 | HU-25 / CA-03 | Datos OCR visibles      | Modificar un campo y guardar                                  | Guarda dato final y registra corrección                                          | Aprobado E2E/API         |

## Resultado automatizado

| Suite               | Cobertura principal                                                 | Resultado 2026-09-07 |
| ------------------- | ------------------------------------------------------------------- | -------------------- |
| Frontend (`Vitest`) | Formato monetario, monedas y fechas                                 | 3/3 aprobadas        |
| Backend viáticos    | OCR, aislamiento, aprobación y exportación                          | Aprobada             |
| Backend solicitudes | Creación, totales, roles, fechas y estados                          | Aprobada             |
| Backend cotizador   | Reglas, parámetros, materiales, roles, historial y PDF              | Aprobada             |
| Total               | 34 pruebas                                                          | 34/34 aprobadas      |
| Navegador E2E       | Login, catálogo, cotización/PDF, solicitud, OCR, aprobación y móvil | 1/1 aprobado         |

## Evidencia visual reproducible

- [Login](../evidencias/sprint-1/ui/01-login.png)
- [Cotización guardada](../evidencias/sprint-1/ui/02-cotizacion-guardada.png)
- [Solicitud en borrador](../evidencias/sprint-1/ui/03-solicitud-borrador.png)
- [Validación y corrección OCR](../evidencias/sprint-1/ui/04-validacion-ocr.png)
- [Solicitud aprobada](../evidencias/sprint-1/ui/05-solicitud-aprobada.png)
- [Dashboard móvil](../evidencias/sprint-1/ui/06-dashboard-movil.png)

Las capturas se regeneran con `npm run test:e2e` después de compilar el frontend.

## Registro de defectos

| Bug                                                                                                | HU    | CP    | Severidad | Estado                 | Evidencia                  |
| -------------------------------------------------------------------------------------------------- | ----- | ----- | --------- | ---------------------- | -------------------------- |
| BUG-LOCAL-01: la corrección OCR se calculaba pero se enviaba con un nombre de variable inexistente | HU-25 | CP-17 | Media     | Corregido y verificado | `ValidationView.vue` + E2E |

## Evidencia requerida para cierre

El recorrido E2E es repetible y sus capturas fueron inspeccionadas. Para la aceptación formal, una persona del equipo debe repetir el guion en el entorno de entrega, registrar navegador/sistema, firmar el resultado y enlazar cualquier bug. La aprobación humana del Product Owner no se reemplaza con automatización.
