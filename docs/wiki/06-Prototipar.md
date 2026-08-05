# 06 · Prototipar

**Momento 4 del Design Thinking.** Materializar la decisión en pantallas concretas para validar el flujo antes de escribir código.

---

## Alcance del prototipo

| Entregable | Estado | Herramienta |
|---|---|---|
| Boceto de dashboard (indicadores clave + tabla de cotizaciones) | Listo | Boceto de baja fidelidad |
| Arquitectura técnica de la solución | Listo | Diagrama de componentes |
| Pantallas de alta fidelidad, desktop y móvil, de todos los módulos | En generación | **Google Stitch** |

Los prompts completos para generar las pantallas de alta fidelidad están en **[[13 Prompt de Google Stitch]]**.

---

## Boceto de dashboard

Pantalla de entrada del sistema. Contiene:

1. **Fila de indicadores clave (KPI)** — cotizaciones del mes, valor cotizado, candidatos activos, viáticos pendientes de aprobación.
2. **Tabla de cotizaciones recientes** — número, cliente, producto, valor, estado, fecha.
3. **Navegación lateral por módulo** — coherente con el sistema interno que GALCO ya usa, para no romper el hábito del usuario.

---

## Inventario de pantallas del prototipo

Total: **24 pantallas**, cada una en versión escritorio y móvil.

### Transversales
| # | Pantalla |
|---|---|
| 1 | Login |
| 2 | Dashboard general |
| 3 | Notificaciones |
| 4 | Perfil de usuario |
| 5 | Administración de usuarios y roles |

### Módulo Cotizador
| # | Pantalla | Release |
|---|---|---|
| 6 | Listado de cotizaciones | 1 |
| 7 | Crear cotización · paso 1: cliente | 1 |
| 8 | Crear cotización · paso 2: productos del catálogo | 1 |
| 9 | Crear cotización · paso 3: resumen y totales | 1 |
| 10 | Catálogo de productos | 2 |
| 11 | Detalle de producto | 2 |
| 12 | Vista previa y envío al cliente | 2 |
| 13 | Seguimiento de estado de cotización | 3 |

### Módulo Hojas de vida
| # | Pantalla | Release |
|---|---|---|
| 14 | Listado de candidatos | 1 |
| 15 | Registrar candidato | 1 |
| 16 | Ficha del candidato | 2 |
| 17 | Búsqueda avanzada con filtros | 2 |
| 18 | Directorio de personal activo | 2 |
| 19 | Reporte de personal | 3 |

### Módulo Viáticos
| # | Pantalla | Release |
|---|---|---|
| 20 | Mis solicitudes de viático | 1 |
| 21 | Nueva solicitud de viático | 1 |
| 22 | Adjuntar soportes (cámara móvil) | 2 |
| 23 | Bandeja de aprobación | 2 |
| 24 | Reporte contable de viáticos | 3 |

---

## Principios de diseño aplicados

Derivados directamente de los **esfuerzos** identificados en el [[03 Empatizar|mapa de empatía]]:

| Principio | Origen en el mapa de empatía |
|---|---|
| **Máximo 3 pasos por tarea** | "Frustración por depender de varias personas para armar una sola cotización" |
| **Cero capacitación previa** | "Miedo a que el cambio tome tiempo de capacitación que el equipo no tiene" |
| **Móvil primero para viáticos** | "Personal de planta y obra con poco manejo de sistemas digitales", viajes fuera de Medellín |
| **Estados siempre visibles** | "Soportes y estados de aprobación visibles para todos" |
| **Identidad GALCO** | Continuidad visual con el sistema interno actual, para que no se sienta una herramienta ajena |

---

**Anterior:** [[05 Decidir]] · **Siguiente:** [[07 Funcionalidades]]
