# Sprint 2 · Backlog auditado y estado de cierre

Consulta de GitHub realizada el **20 de octubre de 2026**. Versión integrada: `dba0fb4` en `main`, mediante PR #59 y PR #60.

## Backlog comprometido

| HU    | Issue | Estado GitHub | Estado documental recomendado | Observación                                               |
| ----- | ----- | ------------- | ----------------------------- | --------------------------------------------------------- |
| HU-02 | #6    | Cerrada       | Revisar aceptación            | Automatizada; falta enlazar decisión verificable del PO   |
| HU-04 | #8    | Abierta       | Parcial                       | Implementada; prueba con Firebase y correo real pendiente |
| HU-05 | #9    | Cerrada       | Terminada técnicamente        | Pruebas de rol, alta y desactivación aprobadas            |
| HU-06 | #10   | Abierta       | Parcial                       | Búsqueda/inactivación listas; espesor y grado pendientes  |
| HU-09 | #13   | Cerrada       | Terminada técnicamente        | Duplicación, edición y aislamiento aprobados              |
| HU-10 | #14   | Cerrada       | Revisar aceptación            | Adaptador probado; entrega real al buzón pendiente        |
| HU-12 | #16   | Cerrada       | Terminada técnicamente        | Indicadores e historial integrados en PR #60              |
| HU-23 | #27   | Cerrada       | Regresión aprobada            | Función originada en V1, validada en la regresión         |
| HU-24 | #28   | Cerrada       | Terminada técnicamente        | Notificación personal y lectura aprobadas                 |
| HU-25 | #29   | Cerrada       | Revisar como parcial          | Preparación/vínculo probados; calidad OCR real pendiente  |
| HU-26 | #30   | Cerrada       | Terminada técnicamente        | Cálculo, bloqueos y concurrencia aprobados                |

HU-13 a HU-19 permanecen abiertas y fuera del alcance acordado para esta entrega. HU-22 (#26) continúa abierta y conviene aclarar en Review si su cierre pertenece a Sprint 1 o si debe incluirse en el cierre actual.

## Inconsistencias a corregir en GitHub

1. #6 está cerrada aunque su conversación condicionaba el cierre a aceptación del PO.
2. #29 está cerrada aunque la documentación conserva validaciones externas pendientes.
3. #8, #10 y #26 siguen abiertas; este estado es coherente con trabajo o aceptación pendiente, pero deben tener Sprint, responsable y criterio faltante explícitos.
4. Ninguna issue consultada tiene milestone ni etiquetas, por lo que GitHub no permite demostrar por sí solo que el Sprint esté cerrado.

## Estado de cierre

- **Incremento técnico:** integrado en `main`; CI y CodeQL verdes.
- **Pruebas automáticas:** 92 aprobadas y dos recorridos E2E aprobados.
- **Cierre administrativo del Sprint:** pendiente de prueba manual final, Review, aceptación del Product Owner y Retrospectiva firmada.

El Sprint puede presentarse como incremento integrado. Solo debe marcarse formalmente cerrado después de completar los campos humanos y corregir las inconsistencias del backlog.
