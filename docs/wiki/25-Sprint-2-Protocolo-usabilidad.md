# Sprint 2 — Protocolo de pruebas de usabilidad

**Estado: planeado, sin ejecución ni resultados de usuarios.** Se ejecutará durante Sprint 3, como exige el documento maestro.

## Objetivo y participantes

Evaluar si los usuarios completan tareas de cotización y viáticos, entienden los estados y distinguen una propuesta OCR de un dato confirmado.

Reclutar 5–6 participantes representativos, sujetos a disponibilidad: 2 comerciales, 2 empleados solicitantes y 1–2 personas de Contabilidad. Evitar usar únicamente desarrolladores del producto. Registrar rol, experiencia y dispositivo, con identificador anónimo U01…; no publicar datos personales.

Sesiones moderadas de 30–40 minutos, navegador de escritorio y al menos una revisión en móvil. Entorno de prueba con datos ficticios, cuentas por rol y versión registrada. El moderador no guía los clics; solicita pensar en voz alta. Un observador toma tiempos y notas.

## Preparación y consentimiento

Explicar que se evalúa el producto, no al participante; participación voluntaria y posibilidad de retirarse. Pedir autorización específica antes de grabar. Si no autoriza, usar notas sin grabación. No usar comprobantes ni clientes reales. Definir con la institución acceso y plazo de conservación antes de recoger datos.

Verificar que el entorno tenga una cotización, una solicitud enviada, una aprobada y soportes aprobados. Para OCR, dejar explícito si el entorno es demo o real: no medir precisión OCR sobre resultados simulados.

## Tareas, hipótesis y preguntas

Umbrales propuestos para el piloto, no resultados ni estándares universales.

| Tarea para participante                                                                                                   | Hipótesis                                                 | Pregunta de investigación                                        | Métrica y criterio propuesto                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| T1 Comercial: “Un cliente solicita dos postes Cercha. Prepara una cotización y conserva una alternativa sin pintura.”     | Catálogo y duplicación permiten comparar sin rehacer todo | ¿Distingue original y variante?                                  | Éxito sin ayuda ≥80%; ≤6 min; original sin alteración                                    |
| T2 Comercial: “Prepara la oferta para el correo del cliente indicado.”                                                    | Destinatario y confirmación hacen claro el resultado      | ¿Distingue PDF descargado, envío aceptado y error del proveedor? | ≥80% identifica correctamente estado; ≤3 min; cero destinatarios incorrectos confirmados |
| T3 Solicitante: “Registra un viaje de dos días con transporte y alojamiento y solicita su revisión.”                      | Formularios y total hacen entendible el presupuesto       | ¿Comprende fechas, total y estado?                               | Éxito ≥80%; ≤5 min; ≤2 errores recuperables                                              |
| T4 Solicitante: “Este recibo corresponde al viaje aprobado. Revisa y corrige el total antes de registrarlo.”              | Revisión OCR y selector de viaje evitan datos incorrectos | ¿Detecta y corrige un dato dudoso y lo asocia al viaje correcto? | ≥80% completa; cero asociaciones incorrectas; ≤4 min                                     |
| T5 Contabilidad: “Revisa la solicitud asignada y recházala explicando la información faltante.”                           | Estado y motivo permiten una decisión trazable            | ¿Entiende a quién y por qué devuelve la solicitud?               | Éxito ≥80%; motivo comprensible; ≤3 min                                                  |
| T6 Solicitante: “Consulta la decisión de tu viaje. Para el viaje aprobado, registra el anticipo y legaliza sus soportes.” | Avisos y saldo permiten entender el siguiente paso        | ¿Identifica si debe reintegrar dinero o recibir reembolso?       | ≥80% interpreta saldo correctamente; ≤5 min; cero doble legalización                     |

No ejecutar todas las tareas con todos los perfiles: T1–T2 comerciales, T3–T4–T6 solicitantes y T5 Contabilidad. El denominador de éxito se reporta por tarea y perfil; con muestra pequeña no generalizar estadísticamente.

## Procedimiento

1. Presentación, consentimiento y contexto (5 minutos).
2. Explicar pensamiento en voz alta y tareas del perfil.
3. Entregar cada escenario sin indicar botones; iniciar cronómetro al terminar de leer.
4. Registrar acciones, errores, solicitudes de ayuda y comentarios.
5. Detener al completar, abandonar o superar 8 minutos. Una tarea completada con ayuda se registra separada.
6. Tras cada tarea: dificultad de 1 (muy difícil) a 7 (muy fácil) y pregunta abierta sobre confusión.
7. Cierre: qué cambiaría, confianza en resultados y satisfacción global de 1 a 5.

## Instrumento de registro

| Sesión       | Perfil | Versión/dispositivo | Tarea | Tiempo | Éxito sin ayuda / con ayuda / fallo | Errores | Ayudas | Dificultad 1–7 | Observaciones |
| ------------ | ------ | ------------------- | ----- | ------ | ----------------------------------- | ------- | ------ | -------------- | ------------- |
| Por ejecutar |        |                     |       |        |                                     |         |        |                |               |

Tasa de éxito = completadas sin ayuda / intentadas. Reportar mediana de tiempos, número de errores, ayudas y valoración por tarea. Separar errores de interfaz de fallos de infraestructura. Severidad: crítica (bloquea o causa dato/decisión incorrecta), mayor (requiere ayuda), menor (fricción recuperable).

Cada hallazgo tendrá tarea, evidencia autorizada, severidad, propuesta y issue. Priorizar correcciones con PO y repetir las tareas afectadas. Ningún campo de resultados se completa antes de la sesión.
