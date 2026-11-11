# Sprint 3 — Guion de sustentación

Dos presentaciones, según el documento maestro: una **review tipo pitch para el cliente** y una **sustentación para el profesor** con cinco áreas. La asistencia de todos los integrantes es obligatoria: quien no asista tiene 0,0 en todo el Sprint.

## Preparación (el día anterior y 15 minutos antes)

- [ ] Desplegar `main` en Render y comprobar con `npm run smoke:deploy -- https://galco-suite.onrender.com` (la URL aún no tiene HU-34).
- [ ] Abrir la URL 5 minutos antes: el plan gratuito tarda cerca de un minuto en despertar.
- [ ] Cuentas listas: Comercial, Contabilidad, RRHH y Administración. No mostrar contraseñas en pantalla.
- [ ] Una vacante abierta (por ejemplo "Soldador") y 2 o 3 hojas de vida ficticias de `10_hojas_de_vida_individuales` a mano. No usar hojas de vida reales.
- [ ] Respaldo: video corto del recorrido de RRHH o la aplicación en local con `npm run dev`, por si la nube o OpenAI fallan.
- [ ] Probar proyector, resolución y zoom del navegador.

## Cliente: review tipo pitch (8–10 minutos)

**Apertura (1 min).** "GALCO cotizaba, gestionaba viáticos y reclutaba con Excel, correo y carpetas. Hoy los tres procesos viven en una sola aplicación en internet, con su usuario y su rol."

**Sprint goal (30 s).** "En este Sprint cerramos el módulo de Hojas de vida con un analizador con IA y publicamos la Suite en la nube."

**Demo (5–6 min).**

1. Abrir https://galco-suite.onrender.com e iniciar sesión como RRHH: el menú solo muestra Candidatos y Vacantes.
2. **Vacantes:** mostrar "Soldador" con sus criterios y pesos que suman 100.
3. **Candidatos:** elegir la vacante, subir dos hojas de vida, marcar la autorización (Ley 1581) y "Analizar hojas de vida".
4. **Revisar:** señalar la confianza por dato y un campo "Pendiente"; corregir un dato; "Confirmar datos". Frase clave: *"La IA propone; ustedes deciden. Nada se guarda sin su confirmación."*
5. **Ranking:** abrir el detalle; mostrar el aporte por criterio, la evidencia de cada habilidad y un requisito obligatorio en rojo. Frase clave: *"El puntaje ordena a quién revisar primero; no descarta a nadie ni cambia su etapa. La IA no ve edad, género, foto ni datos de identificación."*
6. Cambiar a Comercial (30 s): cotización y "Descargar PDF".

**Deudas y pendientes (1 min), dichas con claridad:**

- Búsqueda de candidatos, perfil consolidado y etapas del proceso (HU-15, HU-16, HU-18) quedan para el siguiente incremento.
- **El envío de cotizaciones por correo se descartó (HU-33):** la cotización se entrega descargando el PDF.
- Error conocido en el PDF (nota de AIU sin cifras, #63): indicar si ya se corrigió o cuándo se corregirá.
- El despliegue usa planes gratuitos; para operar en serio hace falta un plan pago con copias de seguridad.

**Cierre (30 s).** "¿Los criterios y pesos de las vacantes reflejan cómo seleccionan hoy? ¿Qué necesitarían para usarla en un piloto con un proceso real?"

## Profesor (10–12 minutos)

| Área (documento maestro) | Tiempo | Contenido                                                                                                                                                                                                 | Página de apoyo |
| ------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Desarrollo de código     | 3 min  | Demo del flujo de RRHH (pasos 3–5 del pitch, más rápido). Mostrar un PR (por ejemplo #78) con su trazabilidad HU → CA → pruebas y la tabla de principios del analizador                                    | [30](30-Sprint-3-Alcance-y-trazabilidad.md), [33](33-Sprint-3-Pruebas-automaticas.md) |
| Despliegue               | 2 min  | Abrir la URL pública; explicar Render + Docker + Atlas + Firebase + OpenAI con el diagrama; secretos solo en Render; health check y *rollback*; prueba de humo (6/6, PR #80)                            | [29](29-Sprint-3-Despliegue.md) |
| Caso de negocio          | 2 min  | Sección 6: viabilidad técnica demostrada, operativa condicionada, costo del piloto (320.000 COP/mes de mantenimiento supuesto + consumo) y punto de equilibrio de 20 a 41 horas ahorradas al mes. Conclusión y recomendación de piloto | [31](31-Sprint-3-Caso-de-negocio-final.md) |
| Pruebas de usabilidad    | 2 min  | Participantes, tareas, tasas de éxito, tiempos, satisfacción, hallazgos y ajustes aplicados o planeados                                                                                                  | [34](34-Sprint-3-Pruebas-usabilidad.md) |
| Manual de usuario        | 2 min  | Demostración interactiva: abrir el manual en la Wiki, elegir la sección de RRHH y seguir 4.2–4.3 en la aplicación en vivo                                                                                   | [35](35-Manual-de-usuario.md) |
| Cierre                   | 1 min  | Deuda, backlog actualizado y lo que se haría en un Sprint 4                                                                                                                                               | [36](36-Sprint-3-Ceremonias-y-cierre.md) |

> **Pendiente del equipo:** el bloque de usabilidad solo se puede presentar con resultados reales. Si las sesiones no se hicieron, decirlo explícitamente; no presentar los umbrales del protocolo como resultados.

Qué **no** afirmar:

- Que HU-34 está verificada en la nube, si no se volvió a desplegar.
- Que el CI está en verde: GitHub Actions no corre por el bloqueo de facturación de la cuenta.
- Que la IA "decide" o "selecciona" candidatos.
- Que el sistema envía correos.
- Cifras de ahorro en GALCO: no se han medido.

## Preguntas probables

| Pregunta                                                   | Respuesta corta                                                                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿Cómo evitan que la IA discrimine?                          | Formación, experiencia y certificaciones se calculan con reglas fijas; la IA solo valora habilidades con evidencia y no recibe nombre, identificación, contacto ni ciudad; la evaluación no descarta ni cambia la etapa; hay prueba automática (`evaluaciones.test.js:253`) |
| ¿Qué pasa si OpenAI no responde?                           | El archivo y el candidato quedan intactos; el registro manual sigue disponible; en la evaluación se calculan los criterios medibles y habilidades queda pendiente   |
| ¿OpenAI guarda las hojas de vida?                          | Se envían con `store: false` (`backend/utils/openai.js:49`) y solo con autorización de tratamiento de datos                                                         |
| ¿Por qué Render y no otra nube?                            | Despliegue desde el repositorio con Docker, HTTPS incluido, health check y *rollback*, y plan gratuito suficiente para el piloto (47 MB en reposo de 512 MB)       |
| ¿Por qué descartaron el correo?                            | Decisión del equipo (#71): la cotización se entrega como PDF descargado. *Pendiente del equipo:* explicar el motivo de la decisión                                 |
| ¿Cómo prueban sin gastar en OpenAI?                         | Proveedor de IA sustituido en las pruebas automáticas: se prueba éxito, error, tiempo agotado y qué se envía, sin llamadas reales                                   |

## Reparto (equipo debe completar)

| Bloque                                   | Responsable | Estado          |
| ---------------------------------------- | ----------- | --------------- |
| Pitch al cliente y demo de RRHH          | Por asignar | Guion listo     |
| Desarrollo de código y pruebas           | Por asignar | Guion listo     |
| Despliegue                               | Por asignar | Guion listo     |
| Caso de negocio                          | Por asignar | Completar cifras pendientes |
| Pruebas de usabilidad                    | Por asignar | Requiere resultados reales |
| Manual de usuario (demo interactiva)     | Por asignar | Guion listo     |
