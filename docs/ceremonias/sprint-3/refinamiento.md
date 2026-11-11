# Acta · Refinamiento Sprint 3

- Fecha y hora: PENDIENTE
- Asistentes: PENDIENTE
- Historias refinadas: HU-28 a HU-33 (issues #66 a #71, creados el 10/11/2026) con tareas, CA, CP y dependencias. HU-13, HU-14, HU-15, HU-16 y HU-18 actualizadas con CA y CP.
- Cambios de alcance registrados en GitHub:
  - HU-34 (#81): surge al cargar las 10 hojas de vida de prueba; la identificación pasa a ser opcional en el flujo desde la hoja de vida (cambia el CA1 de HU-13 solo en ese flujo).
  - HU-33 (#71): cerrada como "not planned" el 11/11/2026; el sistema no enviará correo y la cotización se entrega como PDF descargado. Retirada de EP-02 (#2).
- Quién decidió cada cambio y si el PO lo aceptó: PENDIENTE
- Preguntas al Product Owner / RRHH de GALCO: ratificar etapas del proceso (HU-18), criterios y pesos de referencia (HU-30), aceptación de la entrega de la cotización por PDF descargado.
- Compromisos/responsables/fecha: PENDIENTE
- Enlace o ruta de evidencia: PENDIENTE

## Cierre del backlog del Sprint 3

- Fecha: 10 de noviembre de 2026
- Responsable: Scrum Master (persona 5 del reparto)
- Medio: revisión directa del backlog en GitHub (issues y milestones). No fue una reunión; las decisiones se ratifican en la [retrospectiva](retrospectiva.md).

Cada issue abierto se contrastó con el código de `main`, con los PR fusionados y con sus propios comentarios de estado. No se cerró ninguna historia sin evidencia. Lo que no se terminó pasó al milestone nuevo **Sprint 4 (hipotético)**, porque el curso termina con el Sprint 3. Cada issue movido tiene un comentario con el motivo.

| Issue | Historia                                  | Decisión         | Motivo                                                                                                        |
| ----- | ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------- |
| #19   | HU-15 Buscar y filtrar candidatos         | Pasa al Sprint 4 | `GET /candidatos` no recibe búsqueda ni filtros                                                               |
| #20   | HU-16 Consultar perfil                    | Pasa al Sprint 4 | Existe el detalle en el API; falta validarlo contra los criterios de aceptación                               |
| #22   | HU-18 Gestionar etapa de selección        | Pasa al Sprint 4 | No hay cambio de etapa ni historial                                                                           |
| #21   | HU-17 Actualizar candidato                | Pasa al Sprint 4 | Sin milestone hasta ahora y sin implementar                                                                   |
| #23   | HU-19 Reportar candidatos                 | Pasa al Sprint 4 | Sin milestone hasta ahora y sin implementar                                                                   |
| #8    | HU-04 Recuperar contraseña                | Pasa al Sprint 4 | Implementada; falta evidencia de la prueba real con Firebase en la nube                                       |
| #10   | HU-06 Consultar configuraciones de postes | Pasa al Sprint 4 | Faltan diámetro, espesor y material: depende de la ficha técnica de GALCO                                     |
| #29   | HU-25 Extraer soportes con OCR/IA         | Pasa al Sprint 4 | Falta validar con comprobantes reales y autorizados                                                           |
| #63   | BUG: PDF con la nota de AIU sin cifras    | Pasa al Sprint 4 | Al revisar el backlog no había ningún commit que lo corrigiera. Existe el PR #83 con el arreglo, sin fusionar |
| #70   | HU-32 Desplegar en una nube pública       | Sigue abierta    | Desplegada y con health check correcto; faltan CP-01 a CP-04 registrados (CA1, CA2, CA4)                      |
| #65   | EP-05 Plataforma, despliegue y operación  | Sigue abierta    | Depende de #70                                                                                                |

Estado de los milestones: **Sprint 2** cerrado; **Sprint 3** abierto solo por #70 y #65, para cerrarlo cuando se registre la verificación del despliegue; **Sprint 4 (hipotético)** con los nueve issues movidos. Si el PR #83 se fusiona, el issue #63 puede cerrarse y salir del Sprint 4.
