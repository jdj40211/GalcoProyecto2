# Sprint 3 — Resultados de las pruebas de usabilidad

**Estado: preparada para ejecutar; sin sesiones ni resultados registrados.** Esta página aplica el [protocolo del Sprint 2](25-Sprint-2-Protocolo-usabilidad.md), como exige el documento maestro, y deja listos el registro y el análisis. Ningún resultado de esta página se llena antes de que ocurran las sesiones.

> **Pendiente del equipo:** ejecutar las sesiones con usuarios finales de GALCO y completar las secciones 3 a 6. Sin esto el entregable "Resultados de las Pruebas de Usabilidad" (20 % de la nota) no está cubierto.

## Lo que evalúa el documento maestro

| Criterio del documento maestro                                                        | Dónde se responde en esta página |
| ------------------------------------------------------------------------------------- | -------------------------------- |
| ¿Se aplicaron todas las tareas del protocolo tal como estaban planteadas?             | Secciones 2 y 4                  |
| ¿Se reclutaron participantes que representen al público objetivo?                     | Sección 3                        |
| ¿Se formularon las preguntas de seguimiento según el protocolo?                       | Sección 2.3 y 4                  |
| ¿Se recopilaron tiempos, errores, satisfacción y observaciones?                       | Sección 4                        |
| ¿Se analizaron los resultados con conclusiones congruentes?                           | Secciones 5 y 6                  |
| Ajustes sencillos aplicados antes de la entrega; complejos planeados para un Sprint 4 | Sección 6                        |

## 1. Preparación del entorno

| Elemento                      | Valor                                                                                                                                                                                     |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URL                           | https://galco-suite.onrender.com. Abrirla unos minutos antes: el plan gratuito tarda cerca de un minuto en despertar ([29](29-Sprint-3-Despliegue.md))                                    |
| Versión                       | `main` en `5adce73` o posterior. **Volver a desplegar antes de las sesiones:** la URL aún no incluye HU-34. Registrar el commit desplegado en el instrumento                              |
| Cuentas                       | Una cuenta de Firebase por perfil (comercial, contabilidad, RRHH). No compartir contraseñas reales en grabaciones                                                                         |
| Datos de cotizador y viáticos | Una cotización en borrador, una solicitud enviada, una aprobada y soportes aprobados, como pide el protocolo                                                                              |
| Datos de Hojas de vida        | Vacantes de prueba abiertas y las hojas de vida ficticias HV_01 a HV_10 (leyenda "documento ficticio — uso exclusivo en pruebas de software")                                             |
| IA                            | El entorno usa OpenAI real (`OCR_PROVIDER=openai`, `render.yaml:53-54`). Por eso sí se puede observar la calidad de lo que propone la IA, pero no se mide su precisión con pocas muestras |
| Correo                        | El sistema no envía correo (HU-33 descartada, #71). Ver T2                                                                                                                                |

## 2. Tareas aplicadas

### 2.1 Tareas del protocolo (sin cambios)

Se aplican T1 a T6 del [protocolo](25-Sprint-2-Protocolo-usabilidad.md) con su redacción, hipótesis, preguntas y umbrales originales. T1–T2 a comerciales, T3–T4–T6 a solicitantes y T5 a Contabilidad.

**T2 y el descarte de HU-33.** La tarea se mantiene tal cual ("Prepara la oferta para el correo del cliente indicado") porque su pregunta de investigación sigue siendo válida: _¿distingue PDF descargado, envío aceptado y error del proveedor?_ Hoy el botón "Enviar por correo" sigue visible y el servidor responde que el correo no está configurado. Se registra qué hace el participante: si descarga el PDF y lo adjunta por su cuenta, si intenta enviar y entiende el error, o si cree que el correo salió. El criterio "cero destinatarios incorrectos confirmados" se mantiene. Cualquier desviación se anota como tal en el instrumento.

### 2.2 Extensión del Sprint 3: Recursos Humanos

El protocolo del Sprint 2 se escribió cuando Hojas de vida estaba fuera de alcance. Para cubrir el módulo nuevo se agregan tres tareas con el mismo formato. Se reportan **aparte** de T1–T6 para no alterar el protocolo planeado. Umbrales propuestos, no resultados.

| Tarea para participante (RRHH)                                                                                                                                    | Hipótesis                                                                                    | Pregunta de investigación                                                                        | Métrica y criterio propuesto                                                                                         |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| T7: "Abriremos un proceso para Soldador. Crea la vacante con formación técnica, 3 años de experiencia y la certificación de trabajo en alturas como obligatoria." | El total de pesos en vivo y el mensaje de diferencia evitan errores al ponderar              | ¿Entiende que los pesos deben sumar 100 y qué significa cada criterio?                           | Éxito ≥80 %; ≤5 min; ≤1 intento rechazado por pesos                                                                  |
| T8: "Recibiste tres hojas de vida para esa vacante. Regístralas y revisa los datos antes de dejarlos guardados."                                                  | La carga múltiple y la revisión con confianza por dato ahorran digitación sin perder control | ¿Marca la autorización de datos? ¿Detecta y corrige los datos resaltados antes de confirmar?     | Éxito ≥80 %; ≤8 min para tres hojas de vida; 100 % de datos "Pendiente" revisados antes de confirmar                 |
| T9: "Decide a qué dos candidatos llamarías primero para entrevista y explica por qué."                                                                            | El ranking con desglose y requisitos obligatorios orienta sin decidir por RRHH               | ¿Usa el desglose y los requisitos incumplidos, o solo el puntaje? ¿Entiende que la IA no decide? | ≥80 % justifica con al menos un criterio del desglose; ≤4 min; nadie afirma que "el sistema descartó" a un candidato |

Reclutamiento adicional: 1–2 personas de Recursos Humanos de GALCO.

### 2.3 Preguntas de seguimiento (según el protocolo)

- Después de cada tarea: dificultad de 1 (muy difícil) a 7 (muy fácil) y "¿Qué fue lo más confuso?".
- Al cierre: "¿Qué cambiarías?", "¿Qué tanta confianza te da el resultado?" y satisfacción global de 1 a 5.
- Solo en T8 y T9: "¿Quién decide si un candidato sigue en el proceso: tú o el sistema?" (comprueba que se entiende el principio "la IA propone, RRHH decide").

## 3. Participantes

> **Pendiente del equipo:** completar con los participantes reales. Usar identificadores anónimos; no publicar nombres, correos ni cargos que permitan identificarlos.

| Id  | Perfil           | Experiencia en el proceso | Dispositivo / navegador | Fecha | Consentimiento de grabación | Tareas aplicadas |
| --- | ---------------- | ------------------------- | ----------------------- | ----- | --------------------------- | ---------------- |
| U01 | Comercial        |                           |                         |       | Sí / No                     | T1, T2           |
| U02 | Comercial        |                           |                         |       |                             | T1, T2           |
| U03 | Solicitante      |                           |                         |       |                             | T3, T4, T6       |
| U04 | Solicitante      |                           |                         |       |                             | T3, T4, T6       |
| U05 | Contabilidad     |                           |                         |       |                             | T5               |
| U06 | Recursos Humanos |                           |                         |       |                             | T7, T8, T9       |

Si no se consiguen usuarios de GALCO para un perfil, se registra quién los reemplazó y por qué; el protocolo pide evitar que todos sean desarrolladores del producto.

## 4. Registro por sesión

> **Pendiente del equipo:** una fila por participante y tarea, llenada durante la sesión.

| Sesión | Participante | Versión / dispositivo | Tarea | Tiempo (min:s) | Sin ayuda / con ayuda / fallo | Errores | Ayudas | Dificultad 1–7 | Observaciones y citas |
| ------ | ------------ | --------------------- | ----- | -------------- | ----------------------------- | ------- | ------ | -------------- | --------------------- |
| S01    |              |                       |       |                |                               |         |        |                |                       |

Satisfacción global por participante (1–5) y respuestas de cierre:

| Participante | Satisfacción 1–5 | ¿Qué cambiaría? | Confianza en los resultados |
| ------------ | ---------------- | --------------- | --------------------------- |
|              |                  |                 |                             |

Evidencia: grabaciones o notas en almacenamiento institucional con acceso restringido; en el repositorio solo el enlace y capturas sin datos personales.

## 5. Análisis

Cálculos, iguales a los del protocolo:

- Tasa de éxito por tarea = completadas sin ayuda ÷ intentadas (reportar n; con muestras de 1 a 3 personas no se generaliza).
- Mediana del tiempo por tarea; total de errores y de ayudas; mediana de dificultad.
- Errores de interfaz separados de fallos de infraestructura (suspensión de Render, tiempo de la IA).
- Severidad de cada hallazgo: crítica (bloquea o produce un dato o decisión incorrectos), mayor (requiere ayuda), menor (fricción recuperable).

> **Pendiente del equipo:** llenar con los datos de la sección 4.

| Tarea | n   | Éxito sin ayuda | Mediana de tiempo | Errores | Ayudas | Dificultad (mediana) | ¿Cumple el umbral? |
| ----- | --- | --------------- | ----------------- | ------- | ------ | -------------------- | ------------------ |
| T1    |     |                 |                   |         |        |                      |                    |
| T2    |     |                 |                   |         |        |                      |                    |
| T3    |     |                 |                   |         |        |                      |                    |
| T4    |     |                 |                   |         |        |                      |                    |
| T5    |     |                 |                   |         |        |                      |                    |
| T6    |     |                 |                   |         |        |                      |                    |
| T7    |     |                 |                   |         |        |                      |                    |
| T8    |     |                 |                   |         |        |                      |                    |
| T9    |     |                 |                   |         |        |                      |                    |

### Hallazgos

| Id   | Tarea | Hallazgo observado | Participantes | Severidad | Propuesta | Complejidad | Decisión (aplicado / Sprint 4) | Issue |
| ---- | ----- | ------------------ | ------------- | --------- | --------- | ----------- | ------------------------------ | ----- |
| H-01 |       |                    |               |           |           |             |                                |       |

### Observaciones previas de inspección (no son resultados de usuarios)

Al preparar las pruebas se identificaron puntos que conviene observar en las sesiones. **No se cuentan como hallazgos** hasta que un participante los encuentre:

| Punto                                                                                                          | Fuente                                                 | Tarea donde se observa |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ---------------------- |
| El botón "Enviar por correo" sigue visible aunque el sistema ya no envía correo                                | `frontend/src/views/QuoteHistoryView.vue:121-127`, #71 | T2                     |
| El inicio de sesión dice "Viáticos y cotización de postes" y no menciona Hojas de vida                         | `frontend/src/views/LoginView.vue:7`                   | Inicio de T7           |
| Algunos errores de validación del servidor llegan en inglés                                                    | Nota del PR #74                                        | T7, T8                 |
| El botón de envío del formulario queda pegado al título de la sección siguiente                                | Nota del PR #74; `06-vacantes.png`                     | T7                     |
| Los avisos de confirmación se acumulan en la esquina superior derecha cuando se hacen varias acciones seguidas | Capturas `07` a `09` (generadas por el E2E)            | T8                     |
| No hay búsqueda ni filtros de candidatos (HU-15 sin implementar): con muchos candidatos, la lista solo crece   | #19                                                    | T8, T9                 |
| El PDF de la cotización sale con la nota de AIU sin cifras y "Versión:" vacío                                  | Bug #63                                                | T2                     |

## 6. Ajustes a la interfaz y conclusiones

Regla del documento maestro: los ajustes **sencillos** se aplican antes de la entrega final; los **complejos** se planean como historias de usuario de un hipotético Sprint 4.

> **Pendiente del equipo:** clasificar cada hallazgo real de la sección 5 y completar las dos tablas. Las filas siguientes son candidatas a partir de la inspección; confirmar o eliminar según lo que muestren las sesiones.

### Ajustes sencillos (aplicar antes de la entrega)

| Ajuste candidato                                                        | Hallazgo que lo justifica | Estado    |
| ----------------------------------------------------------------------- | ------------------------- | --------- |
| Ocultar "Enviar por correo" y dejar "PDF" como acción de entrega        | Por confirmar en T2       | Pendiente |
| Actualizar el subtítulo del inicio de sesión para incluir Hojas de vida | Por confirmar             | Pendiente |
| Traducir los mensajes de validación que llegan en inglés                | Por confirmar en T7–T8    | Pendiente |

### Historias para un Sprint 4 (complejas)

| Historia candidata                                          | Origen                                    |
| ----------------------------------------------------------- | ----------------------------------------- |
| HU-15 Buscar y filtrar candidatos (#19)                     | Backlog; confirmar con T8–T9              |
| HU-16 Consultar perfil consolidado (#20)                    | Backlog                                   |
| HU-18 Gestionar etapa de selección (#22)                    | Backlog; necesaria para cerrar el proceso |
| Corregir el PDF de la cotización (bug #63)                  | Corregido en el PR #83                    |
| Historias nuevas que salgan de hallazgos críticos o mayores | Sección 5                                 |

### Conclusiones

> **Pendiente del equipo:** redactar 3 a 5 conclusiones congruentes con la tabla de la sección 5: qué hipótesis se confirmaron, cuáles no, qué tareas no alcanzaron el umbral y por qué, y qué cambia en el producto. Trasladar la conclusión operativa al caso de negocio ([31](31-Sprint-3-Caso-de-negocio-final.md), sección 6.2).
