# Sprint 2 — Estrategia de pruebas automáticas

## Estrategia exigida

| Funcionalidad                         | Tipo de prueba                       | Justificación                                                                 |
| ------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------- |
| Cálculos de postes                    | Unitarias y valores de referencia    | Detectan regresiones en reglas y cantidades sin depender de interfaz          |
| Variantes y catálogo                  | Integración API                      | Verifica validación, estado, persistencia y autorización conjuntamente        |
| Envío de PDF                          | Integración con proveedor sustituido | Comprueba efectos de éxito/fallo sin enviar correos reales ni depender de red |
| Usuarios y sesión                     | Integración API                      | Verifica roles, creación, revocación y errores                                |
| Recuperación de acceso                | Unitaria con proveedor inyectado     | Verifica contrato y mensajes sin revelar usuarios ni enviar correos           |
| Notificaciones                        | Integración API                      | Verifica destinatario, aislamiento y lectura                                  |
| Asociación de soportes y legalización | Integración API                      | Verifica pertenencia, montos, estados y bloqueo de cambios                    |
| Preparación de imagen                 | Unitaria + recorrido de navegador    | Verifica geometría y transformación real en canvas                            |
| Flujo visible del producto            | E2E Chromium                         | Detecta fallos de compilación, rutas, formularios e integración frontend/API  |

## Pares de pruebas por funcionalidad

| HU    | Caso exitoso                                                               | Caso alternativo                                                                                  | Archivo                                                   |
| ----- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| HU-02 | Inactividad cierra la sesión; la actividad la renueva                      | Detener la vigilancia; sesión vencida al reabrir                                                  | `frontend/src/services/session.test.js`                   |
| HU-04 | Solicitud de recuperación con mensaje genérico                             | Dato vacío, demasiadas solicitudes, modo de prueba sin envío                                      | `frontend/src/services/password-reset.test.js`            |
| HU-05 | Crear cuenta y gestionar estado                                            | Comercial sin permiso, correo duplicado, autodesactivación                                        | `backend/tests/sprint2.test.js`                           |
| HU-06 | Buscar configuración por código ignorando mayúsculas                       | Sin resultados / configuración inactiva / rol no autorizado                                       | Mismo archivo                                             |
| HU-09 | Duplicar y editar sin alterar original                                     | Cantidad cero, autor distinto, estado enviada                                                     | Mismo archivo                                             |
| HU-10 | Proveedor confirma envío                                                   | Proveedor falla / correo inválido; conserva borrador                                              | Mismo archivo                                             |
| HU-12 | Indicadores con fechas controladas; envío y aprobación registran historial | Período vacío, fecha inválida (400), variante sin historial heredado, comercial sin decidir (403) | `backend/tests/indicadores.test.js`                       |
| HU-23 | Aprobar solicitud enviada                                                  | Rol inválido / edición tras envío                                                                 | `backend/tests/solicitudes.test.js`                       |
| HU-24 | Aviso por aprobación y lectura                                             | Notificación ajena no visible ni modificable                                                      | `backend/tests/sprint2.test.js`                           |
| HU-25 | Asociar soporte y preparar imagen (automático y manual)                    | Solicitud ajena/no aprobada; fondo con textura no se recorta; recorte/rotación inválidos          | API Sprint 2, `receipt-image.test.js` y `sprint2.test.js` |
| HU-26 | Cierre con gasto real y saldo                                              | Duplicados, soporte ajeno/no aprobado, doble cierre                                               | API Sprint 2                                              |

La matriz usa los criterios `S2-*` del [alcance](22-Sprint-2-Alcance-y-trazabilidad). Los criterios originales no cubiertos siguen como deuda; dos pruebas no equivalen a aceptación completa de una HU parcial.

## Ejecución reproducible

```bash
npm run install:all
npm run verify
npm --prefix backend run test:coverage
```

Entorno automatizado: memoria, usuarios demo y proveedor OCR demo. Las pruebas de envío sustituyen el proveedor; no prueban entrega al buzón. Firebase/MongoDB/proveedores reales requieren pruebas de integración adicionales con autorización y configuración.

El pipeline ejecuta pruebas en PR hacia main. La protección que impide merge requiere configuración remota del repositorio. El reporte de cobertura del backend es diagnóstico; no se presenta un porcentaje como cobertura funcional total.

## Registro y defectos

Resultados actuales en `docs/evidencias/sprint-2/RESULTADOS.md`. Cada fallo debe incluir HU/CA/CP, versión, pasos, esperado, observado, severidad y verificación de corrección. Los resultados automáticos no se etiquetan como pruebas manuales.

Conservar logs del CI y capturas del E2E de la misma versión que se presenta.
