# Acta · Sprint Review

- Fecha y hora: `POR CONFIRMAR`
- Asistentes: Felipe Agudelo, Tomás Ospina, Leidy Gallo, Juan David Sierra
- Product Owner o cliente presente: `POR CONFIRMAR`
- Versión/rama demostrada: `feature/sprint-1-mvp`, fusionada a `main` mediante el Pull Request [#32](https://github.com/jdj40211/GalcoProyecto2/pull/32)
- Flujo demostrado: login; cotización y PDF; solicitud y aprobación; soporte OCR y corrección.

## Estado técnico de las historias presentadas

Estado según el código y las pruebas, previo a la aceptación formal del Product Owner.

| Historia                              | Estado técnico | Aceptación del PO |
| ------------------------------------- | -------------- | ----------------- |
| HU-01 Iniciar sesión                  | Implementada   | `POR CONFIRMAR`   |
| HU-02 Cerrar y controlar la sesión    | Implementada   | `POR CONFIRMAR`   |
| HU-03 Controlar accesos por rol       | Implementada   | `POR CONFIRMAR`   |
| HU-07 Crear cotización de postes      | Implementada   | `POR CONFIRMAR`   |
| HU-20 Registrar solicitud de viáticos | Implementada   | `POR CONFIRMAR`   |
| HU-21 Agregar gastos estimados        | Implementada   | `POR CONFIRMAR`   |
| HU-06 Consultar configuraciones       | Parcial        | `POR CONFIRMAR`   |
| HU-25 Extraer soportes con OCR        | Parcial        | `POR CONFIRMAR`   |
| HU-13 Registrar candidato             | Reprogramar    | `POR CONFIRMAR`   |

- Historias devueltas y motivo: `POR CONFIRMAR`
- Feedback del cliente: `POR CONFIRMAR`
- Cambios al Product Backlog: `POR CONFIRMAR`

## Hallazgo posterior a la demostración

Al ejecutar la aplicación desde un clon limpio de `main` se detectó que el frontend no compilaba por un error de sintaxis en `LoginView.vue` introducido en el commit `935f791`. Se corrigió en el Pull Request [#46](https://github.com/jdj40211/GalcoProyecto2/pull/46). Queda registrado como acción de mejora en la retrospectiva.

- Enlace o ruta de grabación/capturas: capturas de interfaz en [`docs/evidencias/sprint-1/ui/`](../../evidencias/sprint-1/ui/). Grabación de la sesión: `POR CONFIRMAR`

> Mientras la columna de aceptación siga en `POR CONFIRMAR`, ninguna historia puede darse por terminada ni cerrarse su issue. Así lo exige la Definition of Done del Sprint.
