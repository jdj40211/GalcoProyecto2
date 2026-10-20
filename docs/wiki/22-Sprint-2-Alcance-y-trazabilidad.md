# Sprint 2 — Alcance y trazabilidad

## Objetivo

Evolucionar el MVP de Cotizador + Viáticos desde la creación de registros hacia su gestión: variantes, catálogo consultable, envío integrado, notificaciones y legalización, con administración de acceso, pruebas y documentación.

El usuario confirmó mantener **Cotizador + Viáticos** en esta entrega. Hojas de vida (HU-13 a HU-19) queda fuera de esta implementación. Esta decisión de trabajo no se presenta como un acta de aceptación del Product Owner.

Base: `main` en `c9e5c38` (Sprint 1). Rama de desarrollo: `codex/sprint-2-mvp`.

## Alcance implementado y límites

| HU / issue  | Incremento V2                                       | Criterios del incremento                                                                                                                                                          | Evidencia automática                             | Límite / aceptación pendiente                                                                      |
| ----------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| HU-04 / #8  | Recuperación desde login mediante Firebase          | S2-04-1: correo válido solicita recuperación sin revelar existencia; S2-04-2: correo inválido o servicio no configurado muestra error                                             | `frontend/src/services/sprint2.test.js`          | Envío real requiere Firebase y validación con cuenta autorizada                                    |
| HU-05 / #9  | Administrador crea, activa y desactiva cuentas      | S2-05-1: rol admin crea cuenta; S2-05-2: desactivar revoca acceso; S2-05-3: comercial no administra; S2-05-4: no autodesactivación                                                | `backend/tests/sprint2.test.js`                  | Demo en memoria; integración Firebase requiere credenciales                                        |
| HU-06 / #10 | Catálogo buscable e inactivación                    | S2-06-1: código/nombre/tipo sin distinguir mayúsculas; S2-06-2: inactivos no seleccionables ni cotizables; S2-06-3: sin resultados explícito                                      | API Sprint 2                                     | Espesor y grado del acero pendientes de ficha técnica de GALCO; no inventados                      |
| HU-09 / #13 | Duplicar y editar variantes                         | S2-09-1: copia independiente conserva snapshot; S2-09-2: editar borrador propio recalcula con precios vigentes; S2-09-3: inválidos y modificaciones ajenas se rechazan            | API Sprint 2                                     | Comparación mediante historial y variantes independientes; aceptación humana pendiente             |
| HU-10 / #14 | Envío del PDF mediante adaptador de correo          | S2-10-1: éxito del proveedor registra destinatario/id/fecha y estado; S2-10-2: fallo mantiene borrador; S2-10-3: destinatario inválido rechazado                                  | API con proveedor sustituido por doble de prueba | Configurar proveedor real; no se declara entrega efectiva al buzón                                 |
| HU-23 / #27 | Regresión de aprobar/rechazar                       | S2-23-1: rol autorizado decide enviada; S2-23-2: rol/estado inválido bloqueado                                                                                                    | `solicitudes.test.js` y Sprint 2                 | Ya existía en V1: no se cuenta como función nueva                                                  |
| HU-24 / #28 | Bandeja interna personal y marca de lectura         | S2-24-1: cambio de estado genera aviso; S2-24-2: solo destinatario ve/marca; S2-24-3: mensaje incluye motivo de rechazo                                                           | API Sprint 2                                     | Notificaciones internas, sin correo ni WhatsApp                                                    |
| HU-25 / #29 | Preparación de imágenes y vínculo al viaje          | S2-25-1: giro/recorte/contraste antes de extraer; S2-25-2: original preservado; S2-25-3: asociación solo a solicitud aprobada propia                                              | Frontend + API Sprint 2                          | PDF pasa al proveedor sin rasterización. OCR real y calidad de extracción pendientes de validación |
| HU-26 / #30 | Legalización con soportes aprobados                 | S2-26-1: suma soportes COP propios del viaje; S2-26-2: saldo anticipo menos real; S2-26-3: rechaza duplicados/ajenos/no aprobados; S2-26-4: cierre bloquea alteración de soportes | API Sprint 2 + navegador                         | El anticipo ingresado es declarado por solicitante; validar comprobante de desembolso en piloto    |
| HU-02 / #6  | Sesión demo en servidor con expiración y revocación | S2-02-1: logout revoca; S2-02-2: desactivado o token inválido rechazado                                                                                                           | API Sprint 2                                     | Firebase renueva tokens conforme a su SDK; política empresarial adicional por acordar              |

Los identificadores `S2-*` son criterios del incremento propuestos durante refinamiento. **No reemplazan ni renumeran los CA originales** de las issues. En particular, HU-06 y HU-25 no se declaran completas mientras sus criterios originales pendientes sigan abiertos.

## Cierre del backlog

1. Revisar criterios con el equipo y PO.
2. Enlazar PR, pruebas y capturas en cada issue.
3. Ejecutar los casos manuales del entorno de entrega.
4. Registrar decisión por historia: aceptada, devuelta o parcial.
5. Cerrar únicamente las aceptadas; conservar deuda explícita y actualizar Sprint/estado.

No se cierran issues automáticamente por tener pruebas verdes.

## Deuda y dependencias externas

- Credenciales y configuración del entorno Firebase/MongoDB/OCR/correo.
- Fichas técnicas de postes y validación de reglas con GALCO.
- Evidencia de ceremonias, asistentes y aprobación de PO.
- Pruebas de persistencia en MongoDB, correo y recuperación en servicios reales.
- Protección de rama y revisión por pares.
- Validar comportamiento concurrente y operación multiinstancia antes de producción.
