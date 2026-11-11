# Sprint 3 — Caso de negocio, versión final

Versión final del caso de negocio de la Suite GALCO. Consolida el [plan de negocio V1](15-Sprint-1-Plan-de-negocio.md) (secciones 1 a 3), el [caso de negocio V2](23-Sprint-2-Caso-de-negocio.md) (secciones 4 y 5) y agrega la **Sección 6. Viabilidad del proyecto**, que es lo que el documento maestro exige terminar en este Sprint.

> **Numeración.** El Sprint 1 trabajó un "Esquema del Plan de Negocio" (1 Resumen ejecutivo, 2 Descripción del negocio, 3 Análisis del mercado, 4 Producto o servicio, 5 Implementación) y el Sprint 2 un "Esquema del Caso de Negocio" con 4 Finanzas y 5 Riesgos. Esta página sigue la numeración del caso de negocio (la del Sprint 2 y la de la Sección 6 del Sprint 3) y resume en las secciones 1 a 3 el contenido del Sprint 1.
>
> **Pendiente del equipo:** confirmar con el profesor el "Esquema del Caso de Negocio" oficial (no está en el repositorio) y ajustar los títulos de las secciones 1 a 3 si difieren.

Valores en COP. Igual que en el Sprint 2, **los costos son supuestos de planeación, no cotizaciones de proveedores ni gastos incurridos**, salvo donde se indica que el dato es verificable (planes gratuitos efectivamente usados en el despliegue).

## 1. Resumen ejecutivo

GALCO opera tres procesos internos sobre Excel, correo y carpetas: cotizar postes metálicos, gestionar viáticos y reclutar personal ([02](02-Problematica-y-cifras.md)). La Suite GALCO los reúne en una aplicación web con una sola sesión, roles e identidad visual GALCO.

Al cierre del Sprint 3 el producto tiene tres módulos en código:

| Módulo              | Qué resuelve                                                                                                    | Estado                                                                                |
| ------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Cotizador de postes | Cálculo con reglas centralizadas, parámetros versionados, variantes, historial, indicadores y PDF               | Implementado (Sprint 1 y 2). El envío por correo se descartó (#71); se entrega el PDF |
| Gestión de viáticos | Solicitud, aprobación, soportes con OCR y revisión humana, notificaciones internas y legalización del anticipo  | Implementado (Sprint 1 y 2)                                                           |
| Hojas de vida       | Registro de candidatos desde la hoja de vida, análisis con IA confirmado por RRHH, vacantes con pesos y ranking | Implementado en el Sprint 3, salvo búsqueda (HU-15), perfil (HU-16) y etapas (HU-18)  |

La aplicación está publicada en https://galco-suite.onrender.com (Render + MongoDB Atlas + Firebase + OpenAI).

**Propuesta de valor:** una plataforma GALCO que convierte reglas y documentos dispersos en flujos internos repetibles, auditables y con la IA como asistente que propone, nunca como quien decide.

## 2. Descripción del negocio

Sin cambios de fondo frente al [Sprint 1](15-Sprint-1-Plan-de-negocio.md): GALCO S.A.S. es una empresa metalmecánica de Antioquia; la oportunidad es digitalizar procesos internos que acompañan la venta y la operación, no cambiar su negocio principal. Misión, visión y valores siguen vigentes.

Cambio del Sprint 3: el módulo de Hojas de vida, que en los Sprint 1 y 2 quedó en el Product Backlog, pasó a formar parte del producto. Con él, la Suite cubre los tres procesos que originaron el proyecto.

## 3. Análisis del mercado y producto

El mercado sigue siendo interno (Comercial, empleados viajeros, Contabilidad y ahora Recursos Humanos). Segmentos actualizados:

| Segmento               | Necesidad                                                 | Lo que entrega el producto final                                                                   |
| ---------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Comercial              | Cotizar rápido y sin fórmulas manuales                    | Cotización reproducible, variantes, PDF descargable e indicadores                                  |
| Empleado / solicitante | Registrar viaje y soportes sin duplicar datos             | Solicitud, OCR con revisión, notificaciones y legalización                                         |
| Contabilidad           | Revisar información completa y consistente                | Aprobación con motivo, panel, dashboard y exportación TXT                                          |
| Recursos Humanos       | Comparar candidatos con los mismos criterios, sin digitar | Análisis de hojas de vida con IA, vacantes con criterios y pesos, ranking con desglose y evidencia |
| Administración         | Controlar quién entra y a qué                             | Cuentas por rol, activación y desactivación                                                        |

**Diferenciador frente a las alternativas** ([10](10-Competencia-y-ventaja-competitiva.md)): reglas industriales propias del cotizador y, en Hojas de vida, un analizador que separa lo que calcula con reglas fijas (formación, experiencia, certificaciones) de lo único que valora la IA (habilidades, con evidencia citada), excluye los datos que no deben influir en una selección y deja la decisión en RRHH.

## 4. Finanzas (actualización del Sprint 3)

Se conservan el presupuesto preoperación y el modelo de costos del [Sprint 2](23-Sprint-2-Caso-de-negocio.md). El Sprint 3 agrega tres hechos:

1. **La infraestructura del piloto es gratuita y verificable:** Render plan `free` (`render.yaml:10`) y MongoDB Atlas M0 ([29](29-Sprint-3-Despliegue.md)). Esto reemplaza, solo para el piloto, los supuestos de servidor y base de datos del Sprint 2, pero con límites: suspensión tras 15 minutos sin uso, 512 MB y sin copias automáticas.
2. **Nuevo costo variable:** cada análisis de hoja de vida y cada evaluación de habilidades llama a OpenAI (`gpt-4.1-mini`, `render.yaml:57-58`). Se paga por uso.
3. **Costo evitado:** al descartar HU-33 desaparece el costo variable de correo transaccional (20 COP por correo en el supuesto del Sprint 2).

### Presupuesto preoperación

| Rubro                                                       |                                                         Valor |
| ----------------------------------------------------------- | ------------------------------------------------------------: |
| Total preoperación Sprint 2 (supuesto, incluye reserva 10%) |                                                    14.894.000 |
| Horas adicionales del Sprint 3 (Hojas de vida y despliegue) | **Pendiente del equipo** (horas reales × tarifa del Sprint 2) |

> **Pendiente del equipo:** el presupuesto del Sprint 2 se calculó **sin** el módulo de Hojas de vida (estaba fuera de alcance). Registrar las horas reales invertidas en el Sprint 3 por rubro (desarrollo, pruebas, documentación, coordinación) y multiplicarlas por las tarifas supuestas del Sprint 2 (40.000 / 35.000 / 50.000 COP-hora) para actualizar el total.

### Operación mensual: dos escenarios

| Rubro                                    |         Piloto actual (planes gratuitos) | Operación productiva (supuestos del Sprint 2) |
| ---------------------------------------- | ---------------------------------------: | --------------------------------------------: |
| Servidor de aplicación                   |             0 (Render free, verificable) |                                       120.000 |
| Base de datos y respaldo                 |     0 (Atlas M0, sin copias automáticas) |                                       100.000 |
| Almacenamiento base                      |         0 (incluido en los 512 MB de M0) |                                        30.000 |
| Dominio                                  |            0 (subdominio `onrender.com`) |                                        10.000 |
| Mantenimiento (8 h × 40.000)             |                       320.000 (supuesto) |                                       320.000 |
| **Fijo mensual**                         |                              **320.000** |                                   **580.000** |
| OCR de comprobantes                      |         200 × comprobantes (supuesto S2) |                            200 × comprobantes |
| Análisis IA de hoja de vida + evaluación | **Pendiente del equipo** × hojas de vida |      **Pendiente del equipo** × hojas de vida |
| Correo transaccional                     |                     0 (HU-33 descartada) |                          0 (HU-33 descartada) |

> **Pendiente del equipo:** medir el costo real por hoja de vida en el panel de uso de OpenAI después de analizar y evaluar las 10 hojas de vida de prueba (costo total ÷ 10), y registrar el volumen mensual de hojas de vida que recibe RRHH de GALCO. Para la operación productiva, consultar la tarifa vigente de un plan pago de Render y de un clúster Atlas con copias de seguridad, y reemplazar los supuestos de 120.000 y 100.000.

Fórmula mensual de la operación productiva: **580.000 + 200 × comprobantes + c<sub>HV</sub> × hojas de vida + 2.000 × GB adicionales**. Con el escenario de referencia del Sprint 2 (1.000 comprobantes, 20 GB adicionales, sin correos) y sin hojas de vida: 580.000 + 200.000 + 40.000 = **820.000 COP/mes**. Cada hoja de vida suma c<sub>HV</sub>.

## 5. Riesgos (actualización del Sprint 3)

Se mantienen R1 a R10 del [Sprint 2](23-Sprint-2-Caso-de-negocio.md) con las mismas escalas del documento maestro. Cambios de estado y riesgos nuevos:

### Estado de los riesgos del Sprint 2

| Código | Riesgo                        | Cambio en el Sprint 3                                                                                                                                                                                  |
| ------ | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| R1     | Indisponibilidad de API/BD    | Mitigado en parte: health check en `/api/health`, Render no publica una versión que falla y permite _rollback_. Persiste la suspensión del plan gratuito                                               |
| R3     | Acceso no autorizado          | Mitigado en parte: `NODE_ENV=production` con `AUTH_BYPASS=true` detiene el arranque (`backend/config/index.js:31-32`); secretos solo en Render. Atlas con red abierta `0.0.0.0/0` por el plan gratuito |
| R5     | Falla de un proveedor externo | El correo deja de ser dependencia (HU-33 descartada). OpenAI pasa a ser dependencia de dos módulos                                                                                                     |
| R7     | Pérdida de registros          | Persistencia real en Atlas, pero M0 **no tiene copias automáticas**; la mitigación es `mongodump` antes de cada entrega ([29](29-Sprint-3-Despliegue.md))                                              |
| R8     | Baja adopción                 | Depende de los resultados de usabilidad ([34](34-Sprint-3-Pruebas-usabilidad.md))                                                                                                                      |
| R10    | Evidencias incompletas        | Persiste: ceremonias y pruebas manuales siguen sin evidencia publicada ([36](36-Sprint-3-Ceremonias-y-cierre.md))                                                                                      |

### Riesgos nuevos

| Código | Riesgo y descripción                                                                            | Probabilidad  | Impacto      | Nivel    | Responsable propuesto |
| ------ | ----------------------------------------------------------------------------------------------- | ------------- | ------------ | -------- | --------------------- |
| R11    | Sesgo o discriminación en la selección por apoyarse en la IA                                    | Poco probable | Catastrófico | Alto     | PO + RRHH GALCO       |
| R12    | Tratamiento de datos personales de candidatos sin autorización o fuera de la Ley 1581 de 2012   | Poco probable | Catastrófico | Alto     | PO                    |
| R13    | La IA extrae datos erróneos de la hoja de vida y RRHH los confirma sin revisar                  | Posible       | Moderado     | Moderado | RRHH + Desarrollo     |
| R14    | Plan gratuito: suspensión, memoria o espacio insuficientes durante una demostración o el piloto | Muy probable  | Marginal     | Bajo     | Tech Lead             |
| R15    | Sin CI: un cambio con fallos llega a `main` porque GitHub Actions no corre                      | Muy probable  | Moderado     | Moderado | Scrum Master          |

Los niveles se leen en la matriz del documento maestro del Sprint 2.

| Probabilidad / Impacto | Despreciable | Marginal | Moderado | Crítico | Catastrófico |
| ---------------------- | ------------ | -------- | -------- | ------- | ------------ |
| Muy probable           | —            | R14      | R15      | —       | —            |
| Posible                | —            | —        | R13      | —       | —            |
| Poco probable          | —            | —        | —        | —       | R11, R12     |

### Mitigación de los riesgos nuevos

| Riesgo | Mitigación implementada (comprobable)                                                                                                                                                                                                    | Mitigación propuesta                                                                                  |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| R11    | Reglas fijas para formación, experiencia y certificaciones; la IA solo valora habilidades con evidencia; datos sensibles excluidos; la evaluación no cambia la etapa ni descarta (`evaluaciones.service.js:3-5`, `:117`, `:141`, `:310`) | Validar con RRHH de GALCO los criterios y pesos de referencia; auditar el ranking con casos de prueba |
| R12    | Autorización obligatoria antes de enviar a la IA, con fecha y responsable (`candidatos.service.js:44`, `:57-60`); OpenAI con `store: false`; solo RRHH y administración acceden                                                          | Política de conservación y supresión de hojas de vida acordada con GALCO                              |
| R13    | Confianza por dato, campos dudosos resaltados y confirmación obligatoria (HU-28)                                                                                                                                                         | Medir en usabilidad si RRHH detecta y corrige los datos dudosos (tarea T8)                            |
| R14    | Guía de despliegue con límites y acciones; prueba de humo                                                                                                                                                                                | Abrir la URL antes de cada demostración; plan pago para producción                                    |
| R15    | `npm run verify` documentado para correr en local                                                                                                                                                                                        | Resolver la facturación de la cuenta dueña o mover el repositorio; exigir revisión                    |

## 6. Viabilidad del proyecto

### 6.1 Viabilidad técnica

**Conclusión del análisis: viable, con evidencia.**

| Pregunta                                                     | Evidencia                                                                                                                                                                                         |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ¿El producto funciona con servicios reales, no solo en demo? | Desplegado con Firebase Authentication, MongoDB Atlas y OpenAI; prueba de humo contra la URL pública con 6 comprobaciones en OK y redirección `http` → `https` (PR #80)                           |
| ¿Es mantenible?                                              | Arquitectura modular por dominio (`backend/modules/cotizador`, `viaticos`, `hojasdevida`); infraestructura como código (`Dockerfile`, `render.yaml`); despliegue automático y reversión en Render |
| ¿Tiene control de calidad?                                   | 119 pruebas de backend, 25 de frontend y 3 recorridos E2E en navegador ([33](33-Sprint-3-Pruebas-automaticas.md)); análisis estático y auditoría de dependencias sin alertas altas (PR #79)       |
| ¿La IA es técnicamente controlable?                          | Salidas con esquema JSON estricto, tiempo máximo de 45 s, errores legibles, y un camino manual cuando la IA falla (HU-28 CA5, HU-30 CA7, HU-34 CA3)                                               |
| ¿Cabe en la infraestructura del piloto?                      | El contenedor usa unos 47 MB en reposo frente a 512 MB disponibles; Chromium generó un PDF en 2,6 s dentro del contenedor ([29](29-Sprint-3-Despliegue.md))                                       |

Limitaciones técnicas reconocidas: CI inactivo (R15), plan gratuito (R14) y verificación manual de HU-32 en la nube aún pendiente.

### 6.2 Viabilidad operativa

**Conclusión del análisis: viable de forma condicionada.** El producto cubre los flujos de los cuatro roles, tiene manual de usuario ([35](35-Manual-de-usuario.md)) y no requiere instalación. La operación depende de:

| Condición                                                      | Estado                                                                                                  |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Que los usuarios completen sus tareas sin ayuda                | **Pendiente del equipo:** resultados de usabilidad ([34](34-Sprint-3-Pruebas-usabilidad.md))            |
| Que RRHH de GALCO ratifique criterios, pesos y etapas          | Pendiente (dependencias de HU-30 y HU-18)                                                               |
| Que GALCO acepte entregar la cotización como PDF descargado    | Pendiente: consecuencia de descartar HU-33                                                              |
| Que alguien administre cuentas, respaldos y la clave de OpenAI | Procedimientos documentados ([29](29-Sprint-3-Despliegue.md), secciones 5 a 8); responsable por definir |
| Que las hojas de vida se traten conforme a la Ley 1581 de 2012 | Control técnico implementado; política de GALCO por acordar                                             |

### 6.3 Costo-beneficio

El beneficio no se ha medido en GALCO: el Sprint 2 dejó explícito que no se calcula ROI sin línea base, y esa línea base sigue pendiente. Lo que sí se puede calcular es **cuánto ahorro mensual necesita el producto para cubrir su operación**.

Punto de equilibrio mensual en horas = costo mensual ÷ costo hora del proceso. El costo hora es ilustrativo (no es un dato de GALCO):

| Costo hora del proceso (ilustrativo) | Piloto actual (320.000 + variables) | Operación productiva (820.000 + hojas de vida) |
| ------------------------------------ | ----------------------------------: | ---------------------------------------------: |
| 20.000 COP                           |                16 h/mes + variables |                       41 h/mes + hojas de vida |
| 30.000 COP                           |              10,7 h/mes + variables |                     27,3 h/mes + hojas de vida |
| 40.000 COP                           |                 8 h/mes + variables |                     20,5 h/mes + hojas de vida |

Como referencia externa, no medida en GALCO: la [Wiki 02](02-Problematica-y-cifras.md) cita 12 a 30 minutos por cotización B2B manual y 20 minutos por reporte de gastos manual. Con decenas de cotizaciones, viáticos y hojas de vida al mes entre tres áreas, el umbral de 20 a 41 horas mensuales es alcanzable, **pero solo la medición del piloto lo confirma**.

> **Pendiente del equipo:** con el PO de GALCO, obtener (1) volumen mensual de cotizaciones, viáticos y hojas de vida, (2) tiempo actual por tarea y (3) costo hora del personal. Con eso, reemplazar la tabla ilustrativa por el ahorro estimado = horas evitadas × costo hora.

### 6.4 Conclusión del caso de negocio

1. **Técnicamente el proyecto es viable y está demostrado:** la Suite funciona en una nube pública con servicios reales, tiene pruebas automáticas y procedimientos documentados de despliegue y reversión.
2. **Operativamente es viable bajo condiciones** que no dependen del código: resultados de usabilidad, ratificación de criterios por RRHH, aceptación del PDF descargado como canal de entrega y un responsable de la operación.
3. **Económicamente el costo es bajo y acotado:** 320.000 COP/mes más consumo en el piloto, y unos 820.000 COP/mes más consumo en operación productiva (supuestos). El beneficio requiere entre 20 y 41 horas ahorradas al mes según el costo hora, umbral razonable pero no medido.
4. **Recomendación:** continuar con un **piloto controlado** en GALCO que mida la línea base y el uso real antes de pasar a un plan pago, y resolver antes la verificación de HU-32 y las HU-15/16/18 que completan el módulo de Hojas de vida.

> **Pendiente del equipo:** ajustar los puntos 2 y 4 según los resultados de usabilidad. Si las pruebas muestran fallas críticas, la conclusión operativa debe cambiar a "viable después de los ajustes del Sprint 4".
