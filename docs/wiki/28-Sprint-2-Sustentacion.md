# Sprint 2 — Guion de sustentación

## Cliente: objetivo, demo y deuda (8–10 minutos)

“El objetivo del segundo incremento es gestionar la información que ya creábamos: comparar variantes de cotizaciones y cerrar el ciclo de viáticos con soportes, decisiones y saldos.”

1. Mostrar catálogo: búsqueda y selección.
2. Duplicar cotización, cambiar cantidad o pintura y comparar con original.
3. Mostrar envío integrado. Si no está configurado el proveedor, explicar esa dependencia sin afirmar que llegó un correo.
4. Mostrar solicitud y decisión; abrir la notificación del solicitante.
5. Asociar soporte aprobado y legalizar un anticipo; explicar reintegro/reembolso.
6. Mostrar límites: datos técnicos pendientes, OCR real e infraestructura aún sujetos a validación.

Pregunta final: “¿Estos estados y el cálculo del saldo representan su proceso? ¿Qué requisito falta para autorizar un piloto?”

## Profesor: negocio, usabilidad y pruebas (10–12 minutos)

### Caso de negocio (3 minutos)

“Separamos inversión inicial y operación. El escenario académico estima 14.894.000 COP de preoperación y 824.000 COP mensuales al volumen supuesto. No son cotizaciones ni gastos reales: mostramos unidades, cantidades y supuestos para que puedan validarse. Identificamos diez riesgos y definimos probabilidad, impacto, mitigaciones y RACI.”

### Usabilidad (2 minutos)

“Planeamos sesiones con comerciales, solicitantes y Contabilidad, con tareas reales y métricas de éxito, tiempo, errores y satisfacción. No presentamos resultados: la ejecución corresponde al Sprint 3.”

### Pruebas y demo técnica (4 minutos)

Abrir tabla de estrategia; mostrar una pareja éxito/alternativa por función. Ejecutar `npm test`; mostrar API y E2E. Explicar que proveedores sustituidos permiten probar fallos sin enviar correos y no acreditan el funcionamiento del servicio real.

### Cierre (1 minuto)

Mostrar commit/PR, resultados reales y deuda. No afirmar aceptación, ceremonias ni pruebas humanas aún pendientes.

## Reparto (equipo debe completar)

| Bloque                    | Responsable | Estado                              |
| ------------------------- | ----------- | ----------------------------------- |
| Contexto y demo Cotizador | Por asignar | Guion listo                         |
| Demo Viáticos             | Por asignar | Guion listo                         |
| Finanzas y riesgos        | Por asignar | Validar supuestos                   |
| Usabilidad                | Por asignar | Protocolo planeado                  |
| Pruebas y arquitectura    | Por asignar | Usar resultados de la versión final |

Preparar datos ficticios, verificar descargas y accesos, probar demo en equipo de exposición. Todos los integrantes deben asistir según documento maestro.
