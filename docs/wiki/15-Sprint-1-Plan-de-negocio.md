# 15 · Sprint 1 — Plan de negocio, versión 1

## 1. Resumen ejecutivo

GALCO necesita reducir la dependencia de hojas de cálculo, conversaciones y archivos dispersos para dos procesos internos frecuentes: cotizar postes metálicos y gestionar viajes, anticipos y soportes. La propuesta es una plataforma web interna con identidad visual GALCO que centraliza reglas, documentos, responsables y estados.

El MVP integra:

- un **cotizador de postes** que calcula materiales, pesos, áreas, costos, AIU y precios; conserva la versión de parámetros y genera PDF;
- un **gestor de viáticos** que crea solicitudes de viaje, estima gastos, procesa soportes con OCR, permite corrección humana y soporta revisión contable.

El cliente y usuario objetivo inicial es GALCO S.A.S.; los usuarios son Comercial, Empleado y Contabilidad/Aprobador. El equipo aporta análisis de procesos, diseño de experiencia, desarrollo web y verificación funcional. Las experiencias individuales deben completarse con información confirmada por cada integrante antes de presentar.

La meta de Sprint 1 es pasar de documentación y mockups a un incremento ejecutable y verificable, con trazabilidad desde la historia de usuario hasta la prueba. A mediano plazo, la solución busca reducir reprocesos, tiempos de respuesta y errores de transcripción, y producir datos confiables para decisiones.

## 2. Descripción del negocio

### Antecedentes

GALCO es una organización del sector metalmecánico en Antioquia. Produce y comercializa soluciones galvanizadas y estructuras como postes metálicos. La oportunidad identificada no es cambiar su negocio principal, sino digitalizar procesos internos que acompañan la venta y la operación.

### Misión del producto

Facilitar el trabajo bien hecho mediante flujos internos simples, trazables y coherentes que reduzcan tareas manuales en cotización y viáticos.

### Visión del producto

Consolidarse como la plataforma operativa interna de GALCO para que cada solicitud, cálculo, soporte y aprobación tenga una fuente única de verdad y pueda evolucionar por módulos.

### Valores

| Valor           | Conducta observable en el producto                          |
| --------------- | ----------------------------------------------------------- |
| Exactitud       | Reglas centralizadas, validaciones y parámetros versionados |
| Trazabilidad    | Consecutivos, estados, fechas y responsables                |
| Simplicidad     | Formularios guiados y vocabulario del usuario               |
| Seguridad       | Roles, identidad verificada y mínimos privilegios           |
| Mejora continua | Backlog, métricas, pruebas y deuda visible                  |

## 3. Análisis del mercado

### Alcance del análisis

El mercado inmediato es interno: áreas de GALCO que hoy necesitan coordinación entre Comercial, empleados viajeros y Contabilidad. La expansión a otras empresas metalmecánicas es una hipótesis futura, no una afirmación validada en este Sprint.

### Segmentos y usuario objetivo

| Segmento               | Necesidad                                     | Resultado esperado                            |
| ---------------------- | --------------------------------------------- | --------------------------------------------- |
| Comercial              | Cotizar rápido sin fórmulas manuales          | Cotización reproducible y presentable         |
| Empleado/solicitante   | Registrar viaje y soportes sin duplicar datos | Solicitud clara, total estimado y seguimiento |
| Contabilidad/aprobador | Revisar información completa y consistente    | Decisión trazable y exportación               |
| Gerencia               | Visibilidad del proceso                       | Indicadores y reducción del retrabajo         |

### Alternativas y competencia

| Alternativa                 | Fortaleza                                 | Limitación frente al caso GALCO                                                     |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------- |
| Excel + correo + mensajería | Familiar y de bajo costo inicial          | Versiones duplicadas, cálculos frágiles y poca trazabilidad                         |
| Odoo                        | Suite amplia e integrable                 | Implantación y personalización mayores para reglas específicas                      |
| Zoho One                    | Ecosistema SaaS extenso                   | Dependencia de configuración/licencias y menor ajuste al cálculo industrial         |
| Bitrix24                    | Colaboración y CRM                        | No resuelve de forma nativa la ingeniería del poste ni el flujo contable específico |
| Plataforma GALCO            | Reglas y diseño adaptados al proceso real | Requiere mantenimiento interno y madurez operativa                                  |

### Posicionamiento

La ventaja diferencial es la integración de reglas industriales específicas —incluido el snapshot de parámetros de cotización— con el flujo interno de viajes y soportes, bajo una misma sesión e identidad visual. No pretende competir por número de funciones, sino por ajuste al proceso y trazabilidad.

### Validación pendiente

Antes de convertir la solución en producto comercial se necesitan entrevistas adicionales, medición del tiempo actual, frecuencia de errores, costo de licencias alternativas y disposición a pagar. En Sprint 1 solo se valida utilidad interna y factibilidad técnica.

## 4. Producto y servicio

### Funcionalidades del MVP

- Inicio y cierre de sesión; navegación y permisos según rol.
- Catálogos de tipos de poste, alturas y brazos permitidos.
- Cálculo, guardado, consecutivo, historial y PDF de cotizaciones.
- Vigencia de la cotización y conservación de los parámetros aplicados.
- Solicitud de viaje con destino, fechas, motivo, centro de costo y gastos estimados.
- Envío, aprobación o rechazo de solicitudes con auditoría.
- Carga de soporte, extracción OCR, confianza por campo y corrección humana.
- Historial de viáticos, tablero contable y exportación TXT.

### Beneficios

- Menos errores por copiar fórmulas o valores.
- Respuesta comercial más consistente.
- Menos digitación de comprobantes.
- Estados y responsables visibles.
- Base verificable para indicadores futuros.

### Propuesta única de valor

**Una plataforma GALCO que convierte reglas dispersas en flujos internos repetibles, auditables y listos para crecer.**

### Ciclo de vida

```mermaid
flowchart LR
    D[Descubrir proceso] --> M[MVP interno]
    M --> V[Validar con usuarios]
    V --> E[Estabilizar y asegurar]
    E --> I[Integrar sistemas]
    I --> X[Evaluar expansión]
```

## 5. Plan de implementación

| Hito           | Resultado                          | Criterio de salida                                                    |
| -------------- | ---------------------------------- | --------------------------------------------------------------------- |
| Sprint 1       | MVP integrado Cotizador + Viáticos | Código ejecutable, pruebas, backlog y documentación                   |
| Estabilización | Piloto con usuarios internos       | Firebase/MongoDB reales, almacenamiento privado y feedback registrado |
| Sprint 2       | Gestión ampliada                   | Envíos, catálogos administrables, flujos y notificaciones priorizados |
| Sprint 3       | Reportes e integración             | Indicadores validados y exportaciones/integraciones requeridas        |
| Producción     | Operación controlada               | Seguridad, respaldo, monitoreo, capacitación y soporte definidos      |

### Recursos

- Equipo de producto/desarrollo y responsable funcional de GALCO.
- Repositorio GitHub con revisión por pares e integración continua.
- Entornos separados de desarrollo y producción.
- Servicios MongoDB, Firebase y almacenamiento privado para producción.
- Tiempo de usuarios reales para pruebas de aceptación.

### Riesgos y respuesta

| Riesgo                               | Respuesta                                                   |
| ------------------------------------ | ----------------------------------------------------------- |
| Parámetros de costos desactualizados | Versionar parámetros y definir dueño del catálogo           |
| OCR incorrecto                       | Mostrar confianza y exigir revisión humana antes de guardar |
| Acceso indebido                      | Autenticación real, roles en backend y pruebas negativas    |
| Documentación desalineada            | Actualizar wiki en el mismo cambio que el código            |
| Falta de adopción                    | Piloto pequeño, medición de tiempos y mejora con feedback   |

### Indicadores iniciales

- Tiempo promedio para generar una cotización.
- Porcentaje de cotizaciones que no requieren corrección manual.
- Tiempo entre envío y decisión de una solicitud de viaje.
- Porcentaje de campos OCR corregidos por el usuario.
- Defectos encontrados antes y después de la demostración.

## Fuentes de contexto

- [Sitio oficial de GALCO](https://galco.com.co/)
- [Odoo](https://www.odoo.com/), [Zoho One](https://www.zoho.com/one/) y [Bitrix24](https://www.bitrix24.com/) para contraste de alternativas.
- [[01 Contexto de la empresa]], [[02 Problematica y cifras]] y [[10 Competencia y ventaja competitiva]].
