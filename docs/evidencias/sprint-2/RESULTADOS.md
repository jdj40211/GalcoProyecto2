# Sprint 2 — Registro de verificación

Fecha: 20 de octubre de 2026. Rama: `codex/sprint-2-mvp`.
Base integrada desde `origin/main`: `c9e5c38`.

## Entorno y alcance

Validación local automatizada con persistencia en memoria, sesiones demo en servidor
y OCR simulado. El envío de correo se prueba con un proveedor sustituido; la recuperación
usa un doble del SDK de Firebase. No se enviaron correos reales.

El recorrido de Sprint 1 cubre login, cotización, PDF, solicitud, carga OCR,
revisión contable y vista móvil. El recorrido de Sprint 2 cubre búsqueda y selección
del catálogo, duplicación/edición de variante, lectura de notificación, legalización
y creación de usuario administrador. Para aislar el flujo de legalización, ese recorrido
inserta un viaje y un soporte aprobados como datos de prueba; las aprobaciones se verifican
por separado en la regresión y en la API.

Los controles del recorrido se activan mediante eventos DOM de Chromium. No certifican
la interacción física con ratón o teclado: esa comprobación sigue incluida en los casos
manuales del entorno de entrega.

## Evidencias visuales

- [Catálogo](ui/01-catalogo.png)
- [Variante](ui/02-variante.png)
- [Notificaciones](ui/03-notificaciones.png)
- [Legalización](ui/04-legalizacion.png)
- [Administración](ui/05-usuarios.png)
- [Administración en móvil](ui/06-usuarios-movil.png)

Las capturas contienen datos ficticios. Las tablas móviles permiten desplazamiento
horizontal. Estas evidencias automáticas no sustituyen pruebas de usabilidad con usuarios.

## Incidencias encontradas y correcciones

| Incidencia                                     | Reproducción / observado                                                       | Corrección y comprobación                                                                  |
| ---------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| D-S2-01: fecha fija vencida en regresión       | El caso de cotización usaba septiembre de 2026 y Guardar quedaba deshabilitado | Vigencia relativa de 30 días; regresión de Sprint 1 aprobada                               |
| D-S2-02: presentación del selector de soportes | Estilos genéricos de input estiraban la casilla de selección                   | Dimensiones explícitas y etiqueta flexible; captura de legalización y recorrido automático |
| D-S2-03: duplicidad de cierre                  | Dos peticiones podían leer la solicitud aprobada antes de escribir             | Transición condicional de estado; prueba concurrente exige un éxito y un conflicto         |
| D-S2-04: dependencias con alertas recientes    | Auditoría detectó alertas en Vue, Handlebars y dependencias transitivas        | Actualización de versiones y nueva auditoría; consultar resultado final de verificación    |

## Límites pendientes

- Validación con MongoDB, Firebase, proveedor OCR y correo reales.
- Prueba manual final en el entorno de entrega, incluido ratón/teclado y permisos reales.
- Revisión por pares, CI del PR y aceptación por historia del Product Owner.
- Evidencias auténticas de ceremonias y ratificación de cifras del caso de negocio.

Los casos manuales y las ceremonias permanecen pendientes; no se presentan como ejecutados.
