# Sprint 2 — Casos funcionales para ejecución manual

Estado: **17 casos diseñados; ejecución técnica registrada el 20 de octubre de 2026**.
Los pasos humanos y de servicios reales continúan pendientes. Los resultados automatizados
también están resumidos en la página 24.

Precondiciones: versión de entrega compilada, backend en ejecución, datos ficticios, usuario Comercial/Contabilidad/Admin. En demo se pierden registros al reiniciar. No enviar correos reales sin autorización.

| CP      | HU / criterio     | Pasos y datos                                                                   | Resultado esperado                                                   |
| ------- | ----------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| S2-CP01 | HU-04 / S2-04-1   | Solicitar recuperación con correo autorizado y Firebase configurado             | Mensaje genérico; recepción y enlace comprobados por dueño de cuenta |
| S2-CP02 | HU-04 / S2-04-2   | Correo inválido y entorno demo sin Firebase                                     | Validación o explicación, nunca falso correo enviado                 |
| S2-CP03 | HU-05 / S2-05-1   | Admin crea comercial con correo único y contraseña ≥12 caracteres               | Cuenta aparece y puede ingresar                                      |
| S2-CP04 | HU-05 / S2-05-2/3 | Desactivar cuenta; intentar usar su sesión; intentar administrar como comercial | Acceso revocado y administración denegada                            |
| S2-CP05 | HU-06 / S2-06-1   | Buscar “cercha-6-12” y seleccionar                                              | Se muestra configuración y se traslada al cotizador                  |
| S2-CP06 | HU-06 / S2-06-2/3 | Desactivar como Contabilidad, buscar como Comercial; buscar inexistente         | No seleccionable; mensaje sin resultados                             |
| S2-CP07 | HU-09 / S2-09-1/2 | Duplicar cotización; editar cantidad a 2 y guardar                              | Original intacto; variante recalculada                               |
| S2-CP08 | HU-09 / S2-09-3   | Editar cantidad cero o cotización enviada                                       | Operación bloqueada                                                  |
| S2-CP09 | HU-10 / S2-10-1   | Enviar a buzón autorizado con proveedor configurado                             | PDF correcto, id del proveedor y estado enviada; confirmar recepción |
| S2-CP10 | HU-10 / S2-10-2/3 | Correo inválido o proveedor no disponible                                       | Error y cotización permanece borrador                                |
| S2-CP11 | HU-24 / S2-24-1   | Aprobar/rechazar solicitud y entrar como solicitante                            | Aviso en bandeja, motivo visible si rechazo                          |
| S2-CP12 | HU-24 / S2-24-2   | Marcar leída; consultar como otro usuario                                       | Estado persiste y otro usuario no ve el aviso                        |
| S2-CP13 | HU-25 / S2-25-1/2 | Rotar/recortar imagen, comprobar preview y procesar                             | Datos completos en preparación; original conservado                  |
| S2-CP14 | HU-25 / S2-25-3   | Asociar soporte a viaje aprobado; intentar asociación ajena por API             | Asociación propia conservada, ajena denegada                         |
| S2-CP15 | HU-26 / S2-26-1/2 | Anticipo 200.000, soportes aprobados por 150.000                                | Reintegro 50.000 y viaje legalizado                                  |
| S2-CP16 | HU-26 / S2-26-3/4 | Soporte pendiente/ajeno o segundo cierre                                        | Bloqueo sin modificar saldos                                         |
| S2-CP17 | HU-23 / S2-23-1/2 | Aprobar enviada como Contabilidad; repetir como Comercial                       | Aprobación autorizada; acción indebida rechazada                     |

## Registro de ejecución técnica

Responsable técnico: Codex, ejecución reproducible solicitada por el equipo. Fecha: 20 de
octubre de 2026. Versión: `dba0fb4`, Windows, Node.js, persistencia en memoria y dobles para
servicios externos. Comando: `npm run verify`.

| CP      | Resultado observado                                                  | Estado técnico      | Evidencia / pendiente                                         |
| ------- | -------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| S2-CP01 | El contrato de Firebase está cubierto, pero no se usó un buzón real  | Pendiente externo   | `password-reset.test.js`; falta recepción real                |
| S2-CP02 | Validación y modo sin Firebase respondieron sin declarar envío falso | Aprobado automático | 25 pruebas frontend                                           |
| S2-CP03 | Alta de comercial y acceso posterior aprobados                       | Aprobado automático | `sprint2.test.js` y E2E Sprint 2                              |
| S2-CP04 | Revocación y control de rol aprobados                                | Aprobado automático | `sprint2.test.js`                                             |
| S2-CP05 | Búsqueda y selección de catálogo aprobadas                           | Aprobado automático | API y captura `01-catalogo.png`                               |
| S2-CP06 | Inactivo y consulta sin resultados bloqueados correctamente          | Aprobado automático | `sprint2.test.js`                                             |
| S2-CP07 | Original intacto y variante recalculada                              | Aprobado automático | API y captura `02-variante.png`                               |
| S2-CP08 | Cantidad inválida y edición de enviada rechazadas                    | Aprobado automático | `sprint2.test.js`                                             |
| S2-CP09 | El doble de proveedor registró id, fecha y estado                    | Pendiente externo   | Falta confirmar recepción en buzón real                       |
| S2-CP10 | Correo inválido y fallo conservaron el borrador                      | Aprobado automático | `sprint2.test.js`                                             |
| S2-CP11 | La decisión creó aviso con motivo                                    | Aprobado automático | API y captura `03-notificaciones.png`                         |
| S2-CP12 | Lectura personal e aislamiento aprobados                             | Aprobado automático | `sprint2.test.js`                                             |
| S2-CP13 | Preprocesamiento y datos de ajuste cubiertos por pruebas             | Parcial             | `receipt-image.test.js`; falta inspección manual del original |
| S2-CP14 | Vínculo propio aceptado y vínculo ajeno rechazado                    | Aprobado automático | `sprint2.test.js`                                             |
| S2-CP15 | 200.000 − 150.000 produjo reintegro de 50.000                        | Aprobado automático | E2E y captura `04-legalizacion.png`                           |
| S2-CP16 | Soportes inválidos y doble cierre fueron bloqueados                  | Aprobado automático | Incluye prueba concurrente                                    |
| S2-CP17 | Aprobación autorizada y acción comercial indebida rechazadas         | Aprobado automático | Regresión API y E2E                                           |

Resumen: 14 casos aprobados automáticamente, 1 parcial y 2 pendientes de integración real.
La suite completa aprobó 92 pruebas, dos E2E, compilación, formato y lint. La auditoría no
detectó vulnerabilidades altas o críticas; reportó 8 moderadas transitivas de Firebase.

## Firma de ejecución manual

| Persona         | Fecha           | Navegador / entorno | Casos repetidos | Resultado | Evidencia / bug |
| --------------- | --------------- | ------------------- | --------------- | --------- | --------------- |
| `POR CONFIRMAR` | `POR CONFIRMAR` | `POR CONFIRMAR`     | `POR CONFIRMAR` | Pendiente | `POR ADJUNTAR`  |

No convertir los estados automáticos en aprobación humana. S2-CP01 y S2-CP09 permanecen
pendientes mientras no se disponga de credenciales y cuentas autorizadas.
