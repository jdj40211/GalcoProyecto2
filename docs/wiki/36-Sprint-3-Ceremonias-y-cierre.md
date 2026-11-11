# Sprint 3 — Ceremonias, backlog y cierre

El documento maestro pide evidencias de las ceremonias (grabaciones, fotos o actas) y el **backlog al día, con los Sprints cerrados**. Esta página organiza ambas cosas. **No acredita reuniones realizadas**: las actas de `docs/ceremonias/sprint-3/` tienen los hechos verificables del repositorio y dejan en blanco lo que solo el equipo sabe.

## Ceremonias

| Ceremonia     | Acta                                        | Hechos verificables ya registrados                                                       | Estado                       |
| ------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------- |
| Planning      | `docs/ceremonias/sprint-3/planning.md`      | Historias con hito Sprint 3 y sus SP; épicas EP-03 y EP-05                               | Pendiente del equipo         |
| Refinamiento  | `docs/ceremonias/sprint-3/refinamiento.md`  | Creación de HU-28 a HU-33 y de HU-34 (fechas en UTC en el acta); cambio del CA1 de HU-13 | Pendiente del equipo         |
| Dailies       | `docs/ceremonias/sprint-3/dailies.md`       | Secuencia de PR #72 a #82                                                                | Pendiente del equipo         |
| Review        | `docs/ceremonias/sprint-3/review.md`        | Incremento en `main` (`5adce73`) y URL desplegada                                        | Pendiente del equipo/cliente |
| Retrospectiva | `docs/ceremonias/sprint-3/retrospectiva.md` | Hechos de proceso observables (CI bloqueado, PR sin revisión)                            | Pendiente del equipo         |

> **Pendiente del equipo:** para cada ceremonia, completar fecha, duración, medio, asistentes y ausentes, decisiones y compromisos, y enlazar una evidencia auténtica (grabación autorizada, foto o captura). No se deben reconstruir reuniones que no ocurrieron. Las ceremonias de Sprint 1 y Sprint 2 siguen con el mismo pendiente ([19](19-Ceremonias-Sprint-1.md), [27](27-Sprint-2-Ceremonias-y-cierre.md)).

## Backlog al día

Estado en GitHub al 10 de noviembre de 2026 (hora de Colombia), después de que el Scrum Master revisó y actualizó el backlog. El detalle de cada decisión está en [`refinamiento.md`](../ceremonias/sprint-3/refinamiento.md).

### Milestones

| Milestone             | Estado  | Contenido                                                                              |
| --------------------- | ------- | -------------------------------------------------------------------------------------- |
| Sprint 2              | Cerrado | Sin issues abiertos                                                                    |
| Sprint 3              | Abierto | Solo #70 (HU-32) y #65 (EP-05); se cierra cuando se registre la verificación manual    |
| Sprint 4 (hipotético) | Abierto | #19, #20, #21, #22, #23 (Hojas de vida), #8, #10, #29 (deuda del Sprint 2) y #63 (bug) |

### Sprint 3

| Issue                    | Estado actual                        | Acción para cerrar el Sprint                                                                                                           |
| ------------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| #17, #18, #66 a #69, #81 | Cerrados (fusionados)                | Enlazar en cada issue el caso manual ejecutado (S3-CP de [32](32-Sprint-3-Pruebas-funcionales.md)) y la aceptación del PO              |
| #70 HU-32                | Abierto, con comentario de evidencia | Ejecutar S3-CP34 a S3-CP37 sobre la URL desplegada y cerrar si pasan                                                                   |
| #71 HU-33                | Cerrado "not planned"                | Ninguna. La decisión está registrada en el acta de refinamiento                                                                        |
| #19, #20, #22            | Movidos al Sprint 4                  | Ninguna                                                                                                                                |
| #63 bug PDF              | Movido al Sprint 4                   | Existe el PR #83 con el arreglo, sin fusionar. Si se fusiona, cerrar el issue y sacarlo del Sprint 4                                   |
| #65 EP-05                | Abierto                              | Cerrar cuando se cierre #70                                                                                                            |
| #3 EP-03                 | Abierto                              | Sigue abierto (HU-15 a HU-19 pendientes). Su único comentario corresponde al cierre de HU-03 y parece publicado en el issue equivocado |

### Arrastre de Sprints anteriores

| Issue                                | Estado              | Acción                                                                                                  |
| ------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------- |
| #8 HU-04, #10 HU-06, #29 HU-25       | Movidos al Sprint 4 | Cada uno tiene un comentario con lo que falta                                                           |
| #21 HU-17, #23 HU-19                 | Movidos al Sprint 4 | Ninguna                                                                                                 |
| PR #61 (casos manuales del Sprint 2) | Abierto             | Fusionarlo o cerrarlo: contiene la ejecución manual del Sprint 2 y las evidencias citadas por #62 y #63 |

### Propuesta de Sprint 4 (hipotético)

HU-15 (#19), HU-16 (#20), HU-18 (#22), bug #63 y las historias que salgan de las pruebas de usabilidad ([34](34-Sprint-3-Pruebas-usabilidad.md), sección 6).

## Checklist de cierre

- [ ] Ceremonias del Sprint 3 documentadas con evidencia auténtica.
- [ ] Nuevo despliegue desde `main` con HU-34 y verificación manual de HU-32 (#70).
- [ ] Casos funcionales manuales ejecutados por una persona distinta al autor ([32](32-Sprint-3-Pruebas-funcionales.md)).
- [ ] Pruebas de usabilidad ejecutadas, analizadas y con ajustes decididos ([34](34-Sprint-3-Pruebas-usabilidad.md)).
- [ ] Ajustes sencillos de usabilidad aplicados antes de la entrega.
- [ ] Caso de negocio final revisado y pendientes de cifras completados ([31](31-Sprint-3-Caso-de-negocio-final.md)).
- [ ] Manual de usuario revisado con un usuario de GALCO ([35](35-Manual-de-usuario.md)).
- [ ] `npm run verify` sobre la versión presentada y salida guardada en `docs/evidencias/sprint-3/RESULTADOS.md`.
- [ ] Decisión registrada sobre el bug #63.
- [x] Backlog actualizado y milestone Sprint 2 cerrado (10 de noviembre de 2026). Falta cerrar el milestone Sprint 3 cuando se cierre #70.
- [x] README actualizado a Sprint 3 (módulo de Hojas de vida, enlaces y estado de cierre).
- [ ] Sustentación repartida y ensayada; asistencia de todos ([37](37-Sprint-3-Sustentacion.md)).

No marcar este checklist automáticamente.

## Gestión técnica observada en el repositorio

Hechos útiles para la retrospectiva y para el criterio "¿Se usaron adecuadamente las herramientas de desarrollo como Git?":

- **A favor:** una rama y un PR por historia (#74 a #78, #82), con descripción, trazabilidad a issue y criterios, verificación ejecutada y capturas; los PR encadenados declaran su orden de fusión; las correcciones transversales van en PR propios (#72, #73).
- **Por mejorar:** ningún PR del Sprint 3 tiene revisiones registradas en GitHub; GitHub Actions no corre por el bloqueo de facturación; los commits no merge del Sprint 3 los hizo una sola cuenta (`git log --since=2026-10-21 --no-merges`), así que la distribución del trabajo no se ve en Git.

> **Pendiente del equipo:** si otros integrantes trabajaron en pareja o fuera del repositorio (diseño, pruebas, documentación, gestión), registrarlo en las actas para que la contribución individual sea verificable.
