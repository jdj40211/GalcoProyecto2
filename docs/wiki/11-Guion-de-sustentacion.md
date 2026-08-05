# 11 · Guion de sustentación — Sprint 0

**Formato sugerido:** tipo pitch · **Audiencia:** cliente y profesor

---

## Checklist del formato oficial

| # | Requisito | Página de respaldo | Responsable |
|---|---|---|---|
| 1 | Problemática con cifras y estadísticas obligatorias | [[02 Problematica y cifras]] | |
| 2 | Solución propuesta y cómo resuelve la problemática | [[07 Funcionalidades]] | |
| 3 | Arquitectura planteada | [[08 Arquitectura]] | |
| 4 | Tecnologías a usar | [[09 Stack tecnologico]] | |
| 5 | **Principales funcionalidades del sistema** | [[07 Funcionalidades]] | **Juan David** |
| 6 | Prototipos, preferiblemente interactivos | [[06 Prototipar]] | |
| 7 | Aplicaciones similares y ventaja competitiva | [[10 Competencia y ventaja competitiva]] | |

---

# BLOQUE DE FUNCIONALIDADES — Guion detallado

> Duración objetivo: **4 a 5 minutos**. Este es el bloque que sigue después de que se presentó la problemática y antes o después de la arquitectura.

---

## Apertura (20 segundos)

> "Ya vimos que GALCO tiene tres procesos críticos corriendo sobre Excel, correo y WhatsApp. Les voy a mostrar exactamente qué hace el sistema para apagar cada uno de los tres. **Una sola plataforma, un solo login, tres módulos.** Y todo lo que voy a mostrar sale directamente de lo que el usuario nos pidió en el mapa de empatía, no de lo que a nosotros nos pareció bonito."

**Apoyo visual:** diagrama de los tres módulos.

---

## Módulo 1 · Cotizador (90 segundos)

### Frase de entrada
> "El primero es el **cotizador**. Hoy una cotización de bandeja portacable o de estructura metálica se arma a mano, en la plantilla de Excel de cada comercial, preguntándole el precio a otras áreas. Eso toma **entre 12 y 30 minutos por cotización**, y el equipo comercial se va el **27 % de su jornada** en tareas administrativas como esa."

### Las cuatro funcionalidades
> "El módulo tiene cuatro funcionalidades, repartidas en tres releases:
>
> **Crear cotización**, en release 1. Son tres pasos: escojo el cliente, agrego productos del catálogo, reviso y confirmo. El sistema trae solo el precio vigente, la unidad de medida y la ficha técnica, y calcula subtotal, IVA y total.
>
> **Consultar catálogo**, en release 2. Aquí está el punto más importante del módulo: **el precio se actualiza en un solo lugar.** Hoy, cuando sube el acero, hay que avisarle a cada comercial y rezar para que actualice su propia plantilla. Con catálogo central, se cambia una vez y todos cotizan bien desde ese segundo.
>
> **Enviar al cliente**, también release 2. Genera el PDF con la marca de GALCO y lo manda por correo desde el sistema. Queda registro de a quién, cuándo y con qué contenido.
>
> **Ver estado**, en release 3. Borrador, enviada, en negociación, aprobada, rechazada o vencida. Gerencia puede ver en cualquier momento cuántas cotizaciones hay abiertas y por cuánto valor."

### Cierre de impacto
> "El efecto medible: un vendedor cotizando a mano procesa **entre 10 y 20 cotizaciones al día**. Con el cotizador, ese mismo vendedor, en la misma jornada, llega a **entre 40 y 60**. Y en venta B2B industrial, **el que cotiza primero suele ganar el negocio**."

---

## Módulo 2 · Hojas de vida (60 segundos)

### Frase de entrada
> "El segundo es el **gestor de hojas de vida**. El dolor que nos reportó Recursos Humanos fue textual: le llegan hojas de vida en formatos distintos y difíciles de comparar, guardadas en carpetas personales o compartidas desordenadas."

### Las cuatro funcionalidades
> "**Registrar candidato**, release 1. La clave está en que la información se captura **en campos estructurados**, no en un archivo suelto. Formación, experiencia, cargo, certificaciones. Así dos candidatos siempre se pueden comparar bajo el mismo criterio, que es exactamente lo que hoy no se puede hacer.
>
> **Buscar candidatos**, release 2. Filtros por cargo, años de experiencia, formación, certificación, ciudad. Esto convierte la base de candidatos en un **activo reutilizable**: si hace seis meses llegó un buen perfil de soldador, hoy aparece en la búsqueda en vez de tener que volver a publicar la vacante.
>
> **Actualizar hoja de vida**, release 2. El empleado mantiene su propia hoja al día y RRHH valida. Se acaban las carpetas desactualizadas que nadie sabe dónde quedaron.
>
> **Reporte de personal**, release 3. Planta por área y cargo, procesos abiertos, tiempo promedio de contratación y vencimiento de certificaciones."

---

## Módulo 3 · Viáticos (90 segundos)

### Frase de entrada
> "El tercero es el **gestor de viáticos**, y es donde hay una cifra que impresiona. Según la GBTA, procesar **un solo reporte de gastos manual le cuesta a una empresa USD 58 y 20 minutos** de trabajo administrativo. Y **uno de cada cinco llega con error**, y corregirlo cuesta **USD 52 y 18 minutos adicionales**. Eso hoy en GALCO no aparece en ningún estado financiero, pero se está pagando."

### Las cuatro funcionalidades
> "**Registrar solicitud**, release 1. Y aquí hay una decisión de diseño importante: este módulo es **móvil desde el día uno**, porque el viaje a obra o a un cliente fuera de Medellín pasa lejos de un computador. Formulario corto: destino, obra o cliente, motivo, fechas y monto estimado por concepto.
>
> **Adjuntar soportes**, release 2. El empleado le toma foto al recibo con el celular y queda pegado a la solicitud al instante. Y el sistema **no deja liquidar si falta un soporte**. Eso apaga directamente el reclamo de Contabilidad por soportes incompletos o tardíos.
>
> **Aprobar o rechazar**, release 2. Al aprobador le llega notificación por correo o WhatsApp, ve la solicitud con los soportes y decide con un comentario. Todo queda con fecha, hora y responsable.
>
> **Reporte contable**, release 3. Consolidado por período, por centro de costo, por obra y por empleado, exportable e integrable con nómina y con la DIAN."

---

## Funcionalidades transversales (30 segundos)

> "Y transversal a los tres módulos: **login único con roles**, o sea que cada persona ve solo su módulo; **dashboard con indicadores** en la pantalla de entrada; **notificaciones** por correo y WhatsApp, que es el canal que ellos ya usan; **acceso móvil real**; y **trazabilidad completa**, toda acción queda con usuario, fecha y hora."

---

## Cierre del bloque (20 segundos)

> "En total son **doce funcionalidades**, organizadas en tres releases con una progresión clara: **release 1 crear, release 2 gestionar, release 3 reportar**. Y eso no es casualidad: garantiza que al terminar el release 1 ya haya algo usable en producción, no media aplicación."

---

# Ayudas de memoria

## La tabla que debes tener a la vista

| Módulo | R1 · Crear | R2 · Gestionar | R3 · Reportar |
|---|---|---|---|
| **Cotizador** | Crear cotización | Consultar catálogo · Enviar al cliente | Ver estado |
| **Hojas de vida** | Registrar candidato | Buscar candidatos · Actualizar HV | Reporte de personal |
| **Viáticos** | Registrar solicitud | Adjuntar soportes · Aprobar-rechazar | Reporte contable |

## Las cuatro cifras que no puedes olvidar

| Cifra | Dónde usarla |
|---|---|
| **12 a 30 minutos** por cotización manual | Apertura del cotizador |
| **10-20 → 40-60** cotizaciones/día | Cierre del cotizador |
| **USD 58 y 20 min** por reporte de gastos | Apertura de viáticos |
| **1 de cada 5** reportes con error (+USD 52) | Refuerzo en viáticos |

## Frases ancla (si te pierdes, vuelve a una de estas)

1. *"Una sola plataforma, un solo login, tres módulos."*
2. *"El precio se actualiza en un solo lugar."*
3. *"La información se captura en campos, no en un archivo suelto."*
4. *"Móvil desde el día uno, porque el viaje pasa lejos del computador."*
5. *"Release 1 crear, release 2 gestionar, release 3 reportar."*

---

# Preguntas probables y cómo responderlas

### "¿Por qué no compran Odoo o Zoho en vez de desarrollarlo?"
> "Tres razones. Una, el costo crece por usuario, y nosotros necesitamos que **todo el mundo** lo use, incluida la gente de obra: la plataforma castigaría justo lo que queremos lograr. Dos, ninguna sabe qué es una bandeja portacable tipo escalera ni cómo se cotiza el galvanizado, o sea que igual habría que configurar todo. Y tres, el usuario nos dijo textualmente que teme el tiempo de capacitación, y Odoo necesita un partner implementador. Sería contradecir el hallazgo principal del mapa de empatía."

### "¿Por qué tres módulos tan distintos en un solo sistema?"
> "Porque el usuario es el mismo. La persona de comercial también pide viáticos. Si le damos tres herramientas separadas, volvemos al problema de la información dispersa que estamos tratando de resolver. Un login, un lugar."

### "¿Qué pasa con el sistema que GALCO ya tiene?"
> "Convive. GALCO ya tiene Metalmecánica, Galvanizado, Inventario, Almacén, Nómina. Nosotros no lo reemplazamos: cubrimos los tres procesos que quedaron por fuera y nos integramos, usando la misma identidad visual para que el usuario no sienta que entra a otra herramienta."

### "¿Por qué microservicios y no algo más simple?"
> "Porque cada módulo es de un área distinta y sale en un release distinto. Si el módulo de viáticos se cae un lunes de cierre contable, el comercial sigue cotizando sin enterarse. Y nos deja desplegar el release 1 de un módulo mientras otro sigue en desarrollo."

### "¿Cómo van a lograr que la gente de planta lo use?"
> "Máximo tres pasos por tarea, botones grandes, y móvil para lo que se hace en campo. El criterio de diseño es que si necesita manual, está mal diseñado. Eso salió directo del mapa de empatía: el miedo declarado fue el tiempo de capacitación."

### "¿Y la seguridad de las hojas de vida, que son datos personales?"
> "Están sujetas a la Ley 1581 de habeas data. Acceso restringido al rol de RRHH, archivos en bucket privado con URLs firmadas de vigencia corta, y auditoría de quién consultó qué y cuándo."

---

# Recomendaciones de entrega

| Recomendación | Por qué |
|---|---|
| Menciona **al menos dos cifras** en tu bloque | El formato lo exige explícitamente y es lo que más peso tiene |
| Nombra siempre el **release** de cada funcionalidad | Demuestra que hay plan, no lista de deseos |
| Conecta cada funcionalidad con una **frase del mapa de empatía** | Demuestra que el Design Thinking se aplicó, no se decoró |
| Habla de **producto real de GALCO** (bandeja portacable, poste, galvanizado) | Al cliente le importa que entendiste su negocio |
| No leas la pantalla | Es un pitch, no una lectura |

---

**Anterior:** [[10 Competencia y ventaja competitiva]] · **Siguiente:** [[12 Manual de marca y diseno]]
