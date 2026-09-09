# Acta · Retrospectiva Sprint 1

- Fecha y hora: `POR CONFIRMAR`
- Asistentes: Felipe Agudelo, Tomás Ospina, Leidy Gallo, Juan David Sierra

> Las observaciones de esta retrospectiva se apoyan en evidencia verificable del repositorio (historial de commits, estado de los issues y resultado de la integración continua), no en percepciones. Cada punto indica su fuente.

## Mantener

- **Cobertura automatizada proporcional al riesgo.** La suite ejecuta 31 pruebas y todas pasan. Cubre el cálculo del cotizador contra valores históricos del libro Excel, el aislamiento de solicitudes por usuario y las transiciones de estado protegidas por rol.
- **Trazabilidad explícita historia → criterio → caso de prueba.** La tabla de [`16-Sprint-1-Backlog-y-trazabilidad.md`](../../wiki/16-Sprint-1-Backlog-y-trazabilidad.md) enlaza cada HU con su archivo de prueba concreto. Permite auditar el incremento sin leer todo el código.
- **Controles de calidad configurados desde el primer Sprint.** ESLint, Prettier, CodeQL y Dependabot quedaron activos. Dependabot ya abrió 13 Pull Requests de actualización de dependencias.
- **Honestidad en el alcance declarado.** El módulo de Hojas de vida no se presentó como terminado; se dejó explícito que requiere decisión del Product Owner.

## Mejorar

- **La implementación se concentró al final del Sprint.** El historial de commits muestra 4 commits el 4 y 5 de agosto (documentación de Sprint 0), 1 commit el 7 de septiembre y 13 commits el 8 de septiembre. Prácticamente todo el incremento entró en las últimas 48 horas, lo que dejó sin margen la revisión por pares y la validación con el Product Owner.
- **Se integró a `main` un cambio que rompía la compilación.** El commit `935f791` dejó la función `submit()` de `LoginView.vue` con las llaves mal cerradas. El frontend no compilaba y la aplicación no arrancaba desde un clon limpio. Se detectó al levantar el proyecto y se corrigió en el PR [#46](https://github.com/jdj40211/GalcoProyecto2/pull/46). Indica que el Pull Request se fusionó sin que otro integrante ejecutara la aplicación.
- **Los issues quedaron abiertos.** Las 31 historias siguen en estado abierto, incluidas las que ya tienen criterios de aceptación cumplidos. El tablero no refleja el avance real.
- **Las ceremonias no se documentaron mientras ocurrían.** Las actas se completaron al cierre, lo que obliga a reconstruir fechas y decisiones en lugar de registrarlas en el momento.

## Probar en el siguiente Sprint

- Fijar un límite de trabajo en curso y cerrar historias de forma continua, en vez de acumular la integración al final.
- Exigir la aprobación de al menos otro integrante antes de fusionar a `main`, tal como ya lo pide la Definition of Done, y activar la protección de rama para que la regla se cumpla sola.
- Añadir al pipeline una verificación que levante la aplicación y compruebe que la pantalla de inicio de sesión responde, para que un error de compilación no llegue nunca a `main`.
- Llenar el acta de cada ceremonia el mismo día, con una plantilla corta de cinco líneas.

## Acciones

| Acción                                                                    | Responsable     | Fecha límite    | Seguimiento                     |
| ------------------------------------------------------------------------- | --------------- | --------------- | ------------------------------- |
| Activar protección de rama en `main` con revisión obligatoria              | `POR CONFIRMAR` | `POR CONFIRMAR` | Configuración del repositorio   |
| Cerrar los issues de las historias aceptadas por el Product Owner          | `POR CONFIRMAR` | `POR CONFIRMAR` | Tablero de issues               |
| Agregar verificación de arranque de la aplicación al pipeline de CI        | `POR CONFIRMAR` | `POR CONFIRMAR` | `.github/workflows/ci.yml`      |
| Registrar cada ceremonia el mismo día en `docs/ceremonias/`                | `POR CONFIRMAR` | `POR CONFIRMAR` | Carpeta de ceremonias           |

- Enlace o ruta de evidencia: `POR CONFIRMAR`
