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

| HU    | Caso exitoso                                         | Caso alternativo                                            | Archivo                                 |
| ----- | ---------------------------------------------------- | ----------------------------------------------------------- | --------------------------------------- |
| HU-04 | Solicitud de recuperación a proveedor                | Correo inválido / servicio sin configurar                   | `frontend/src/services/sprint2.test.js` |
| HU-05 | Crear cuenta y gestionar estado                      | Comercial sin permiso, correo duplicado, autodesactivación  | `backend/tests/sprint2.test.js`         |
| HU-06 | Buscar configuración por código ignorando mayúsculas | Sin resultados / configuración inactiva / rol no autorizado | Mismo archivo                           |
| HU-09 | Duplicar y editar sin alterar original               | Cantidad cero, autor distinto, estado enviada               | Mismo archivo                           |
| HU-10 | Proveedor confirma envío                             | Proveedor falla / correo inválido; conserva borrador        | Mismo archivo                           |
| HU-23 | Aprobar solicitud enviada                            | Rol inválido / edición tras envío                           | `backend/tests/solicitudes.test.js`     |
| HU-24 | Aviso por aprobación y lectura                       | Notificación ajena no visible ni modificable                | `backend/tests/sprint2.test.js`         |
| HU-25 | Asociar soporte y preparar imagen                    | Solicitud ajena/no aprobada; recorte/rotación inválidos     | API Sprint 2 + frontend Sprint 2        |
| HU-26 | Cierre con gasto real y saldo                        | Duplicados, soporte ajeno/no aprobado, doble cierre         | API Sprint 2                            |

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
