# Sprint 2 — Caso de negocio V2: finanzas y riesgos

Complementa el [plan de negocio V1](15-Sprint-1-Plan-de-negocio). Alcance: plataforma interna de cotizaciones y viáticos de GALCO.

## 4. Finanzas

### Supuestos y método

Valores en COP, escenario académico de planeación al 20 de octubre de 2026. **Son supuestos de costo, no cotizaciones de proveedores, tarifas verificadas ni gastos incurridos.** El equipo debe validar horas, tarifas e impuestos antes de aprobar presupuesto. El trabajo estudiantil se valora como costo económico aunque no se pague salario. No se atribuyen ahorros medidos al producto.

El escenario contempla 4 integrantes técnicos, infraestructura pequeña y un piloto interno. Los rubros con valor cero tienen justificación; el costo real podría cambiar. No incluye expansión comercial, obligaciones tributarias ni asesoría legal.

### Presupuesto preoperación

| Rubro                                       | Unidad         | Costo unitario | Cantidad |       Subtotal |
| ------------------------------------------- | -------------- | -------------: | -------: | -------------: |
| Desarrollo e integración                    | Hora           |         40.000 |      240 |      9.600.000 |
| Pruebas y calidad                           | Hora           |         35.000 |       40 |      1.400.000 |
| Diseño y documentación                      | Hora           |         35.000 |       24 |        840.000 |
| Coordinación y validación funcional         | Hora           |         50.000 |       16 |        800.000 |
| Uso/depreciación de equipos existentes      | Equipo-mes     |        100.000 |        4 |        400.000 |
| Servicios de desarrollo y activos digitales | Mes            |        150.000 |        2 |        300.000 |
| Transporte para validación                  | Desplazamiento |         50.000 |        4 |        200.000 |
| Registro de propiedad intelectual           | Trámite        |              0 |        0 |              0 |
| Publicidad                                  | Campaña        |              0 |        0 |              0 |
| **Subtotal**                                |                |                |          | **13.540.000** |
| Reserva por incertidumbre, 10% del subtotal | Reserva        |      1.354.000 |        1 |      1.354.000 |
| **Total preoperación**                      |                |                |          | **14.894.000** |

Equipos: se supone uso de computadores existentes, no compra. Registro: pendiente acordar titularidad y necesidad de trámite; cero significa no presupuestado, no ausencia de costo legal. Publicidad: piloto interno, sin adquisición comercial de clientes.

### Presupuesto mensual de operación: costos fijos

| Rubro                           | Valor mensual supuesto | Justificación                         |
| ------------------------------- | ---------------------: | ------------------------------------- |
| Servidor de aplicación          |                120.000 | Disponibilidad del frontend/API       |
| Base de datos y respaldo básico |                100.000 | Persistencia y recuperación           |
| Almacenamiento base             |                 30.000 | Documentos y comprobantes             |
| Dominio, amortización mensual   |                 10.000 | Acceso institucional                  |
| Mantenimiento, 8 horas × 40.000 |                320.000 | Actualizaciones, incidentes y soporte |
| **Total fijo**                  |            **580.000** |                                       |

### Costos variables

| Rubro                    | Unidad            | Valor por unidad supuesto |
| ------------------------ | ----------------- | ------------------------: |
| Extracción OCR           | Comprobante       |                       200 |
| Envío transaccional      | Correo            |                        20 |
| Almacenamiento adicional | GB-mes sobre base |                     2.000 |

Fórmula mensual: **580.000 + 200 × comprobantes + 20 × correos + 2.000 × GB adicionales**.

Escenario de referencia: 1.000 comprobantes, 200 correos, 20 GB adicionales. Variable: 244.000; total mensual: **824.000**; operación anual: **9.888.000**. Preoperación más un año: **24.782.000**.

Sensibilidad: 500 comprobantes, 100 correos y 10 GB adicionales → 702.000/mes. Duplicar esos volúmenes del escenario de referencia → 1.068.000/mes. La reserva de desarrollo no cubre crecimiento indefinido de operación.

### Validación del beneficio

Medir tiempos actuales y del piloto para cotizar/revisar soportes, errores y volumen mensual. Ahorro estimado = horas evitadas × costo hora validado. No se calcula ROI ni punto de equilibrio sin esta línea base. Responsable propuesto: PO valida volúmenes y costo del proceso; equipo técnico valida consumo; administración de GALCO valida presupuesto.

## 5. Riesgos

### Inventario y clasificación

Escalas tomadas del documento maestro: probabilidad Raro, Poco probable, Posible, Muy probable, Seguro; impacto Despreciable, Marginal, Moderado, Crítico, Catastrófico. Los niveles siguientes respetan las celdas de su matriz, sin sustituirlas por una multiplicación numérica.

| Código | Riesgo y descripción                                         | Probabilidad | Impacto      | Nivel    | Responsable propuesto |
| ------ | ------------------------------------------------------------ | ------------ | ------------ | -------- | --------------------- |
| R1     | Indisponibilidad de API/BD impide cotizar o registrar gastos | Posible      | Crítico      | Moderado | Tech Lead             |
| R2     | OCR interpreta incorrectamente total o identificación        | Muy probable | Moderado     | Moderado | Desarrollo + QA       |
| R3     | Acceso no autorizado expone soportes o datos de usuarios     | Posible      | Catastrófico | Alto     | Tech Lead             |
| R4     | Parámetros comerciales desactualizados alteran ofertas       | Posible      | Crítico      | Moderado | PO                    |
| R5     | Dependencia externa falla: correo, Firebase u OCR            | Posible      | Moderado     | Moderado | Desarrollo            |
| R6     | Alcance excede capacidad y se incumplen compromisos          | Muy probable | Crítico      | Moderado | Scrum Master          |
| R7     | Pérdida de registros por reinicio o respaldo insuficiente    | Posible      | Catastrófico | Alto     | Tech Lead             |
| R8     | Baja adopción por dificultad del flujo                       | Posible      | Moderado     | Moderado | PO                    |
| R9     | Consumo de servicios supera presupuesto                      | Posible      | Moderado     | Moderado | PO                    |
| R10    | Evidencias o pruebas incompletas impiden acreditar entrega   | Muy probable | Crítico      | Moderado | Scrum Master          |

### Ubicación en matriz de probabilidad e impacto

| Probabilidad / Impacto | Despreciable | Marginal | Moderado   | Crítico | Catastrófico |
| ---------------------- | ------------ | -------- | ---------- | ------- | ------------ |
| Seguro                 | —            | —        | —          | —       | —            |
| Muy probable           | —            | —        | R2         | R6, R10 | —            |
| Posible                | —            | —        | R5, R8, R9 | R1, R4  | R3, R7       |
| Poco probable          | —            | —        | —          | —       | —            |
| Raro                   | —            | —        | —          | —       | —            |

### RACI para gestión de riesgos

R ejecuta, A responde por la decisión, C es consultado, I es informado. Roles propuestos; completar los nombres reales al ratificar el equipo. Cada actividad tiene un único A.

| Actividad                            | Product Owner | Scrum Master | Tech Lead | Desarrollo/QA | Stakeholder GALCO |
| ------------------------------------ | ------------- | ------------ | --------- | ------------- | ----------------- |
| Identificar riesgos                  | A             | R            | C         | R             | C                 |
| Evaluar impacto empresarial          | A             | C            | C         | I             | R                 |
| Evaluar riesgo técnico               | C             | I            | A         | R             | I                 |
| Priorizar mitigaciones y presupuesto | A             | R            | C         | C             | C                 |
| Implementar controles técnicos       | I             | C            | A         | R             | I                 |
| Probar mitigaciones                  | C             | I            | A         | R             | I                 |
| Revisar riesgos en cada sprint       | C             | A            | R         | R             | I                 |
| Aceptar riesgo residual del piloto   | A             | C            | C         | I             | C                 |
| Gestionar y comunicar incidentes     | C             | A            | R         | R             | I                 |

### Estrategias de mitigación y seguimiento

| Riesgo | Mitigación / contención                                                                             | Señal de seguimiento                                | Momento                        |
| ------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------ |
| R1     | Health check, monitoreo y procedimiento de reinicio; demo local de respaldo                         | Disponibilidad, incidentes y tiempo de recuperación | Antes del piloto y cada semana |
| R2     | Mostrar confianza, preservar original, revisión humana; evaluar recibos legibles y borrosos         | Campos corregidos / campos extraídos                | Cada validación OCR            |
| R3     | Autenticación real, revocación, permisos backend, pruebas de acceso ajeno y secretos fuera del repo | Fallos de autorización y alertas                    | Cada PR y previo a despliegue  |
| R4     | Conservar parámetros de cotización; validar tarifas con dueño del catálogo                          | Fecha de actualización y muestra comparada          | Antes de cotizar en piloto     |
| R5     | Timeout, errores claros, registro manual OCR, no afirmar envío sin confirmación                     | Fallos por proveedor                                | Cada integración               |
| R6     | Refinar CA, priorizar y registrar deuda; ratificar exclusión de candidatos                          | Trabajo pendiente vs capacidad                      | Planning y daily               |
| R7     | Usar MongoDB y respaldos en piloto; probar restauración; señalar volatilidad demo                   | Restauración verificada y antigüedad del backup     | Antes del piloto               |
| R8     | Protocolo de usabilidad con usuarios objetivo y mejoras por hallazgos                               | Éxito, tiempo, errores, satisfacción                | Sprint 3                       |
| R9     | Medir uso y configurar alertas/límites con el proveedor                                             | Consumo vs presupuesto                              | Mensual                        |
| R10    | Matriz HU/CA/CP, evidencia por ejecución y actas reales enlazadas                                   | Criterios sin evidencia                             | Antes de review                |

Las mitigaciones operativas propuestas (respaldos, monitoreo, alertas) no se declaran desplegadas. La aceptación del riesgo residual debe quedar en el acta del PO.
