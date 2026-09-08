# 09 · Stack tecnológico implementado

> Versiones y herramientas verificables en `package.json`, configuraciones y flujos de integración continua del repositorio.

## Aplicación

| Área           | Tecnología                                   | Uso                                                    |
| -------------- | -------------------------------------------- | ------------------------------------------------------ |
| Frontend       | Vue 3 + Vite                                 | SPA, componentes, compilación y servidor de desarrollo |
| Estado y rutas | Pinia + Vue Router                           | Sesión, flujos por módulo y navegación protegida       |
| Visualización  | Chart.js                                     | Indicadores y reportes del módulo de viáticos          |
| Backend        | Node.js 22.13+ + Hapi                        | API REST modular y validación de solicitudes           |
| Validación     | Joi                                          | Contratos de entrada y mensajes controlados            |
| Autenticación  | Firebase Admin / Firebase Web                | Identidad, tokens y sesión; modo demo solo local       |
| Persistencia   | MongoDB + Mongoose                           | Cotizaciones, solicitudes, soportes y estados          |
| Documentos     | Handlebars + Puppeteer                       | Cotizaciones en PDF                                    |
| OCR            | Proveedor configurable con modo demostración | Extracción asistida y corrección humana                |

## Calidad y entrega

| Herramienta                       | Propósito                                                      |
| --------------------------------- | -------------------------------------------------------------- |
| Vitest                            | Pruebas unitarias del frontend                                 |
| Node test runner + inyección Hapi | Pruebas de rutas, roles y reglas del backend                   |
| ESLint                            | Errores estáticos y reglas recomendadas de JavaScript/Vue      |
| Prettier                          | Formato determinista                                           |
| GitHub Actions                    | Formato, análisis, pruebas, compilación y auditoría en cada PR |
| CodeQL                            | Análisis de seguridad semanal y por cambio                     |
| Dependabot + npm audit            | Alertas y control de dependencias vulnerables                  |

## Entornos

- **Desarrollo/pruebas:** repositorio en memoria, usuarios demo y OCR simulado; no requiere servicios externos.
- **Integración/producción:** MongoDB, Firebase real, HTTPS y secretos inyectados desde el entorno.
- **Objetivo de despliegue:** contenedor o servicio Node administrado. La elección de proveedor cloud se toma después de validar costos y requisitos de GALCO.

## Por qué cambió respecto a Sprint 0

Sprint 0 proponía React, aplicaciones móviles nativas, microservicios y PostgreSQL. El MVP existente ya utilizaba Vue/Vite, Hapi, MongoDB y Firebase. Se mantuvo esa base para reducir retrabajo, conservar las funcionalidades desarrolladas y entregar un incremento demostrable. La interfaz responsive cubre móvil desde el navegador; una app nativa se evaluará únicamente si aparecen necesidades reales de trabajo sin conexión o acceso avanzado al dispositivo.

## Requisitos locales

- Node.js 22.13 o superior.
- npm 10 o superior.
- MongoDB y Firebase son opcionales para la demostración local y obligatorios para persistencia/autenticación productiva.

**Anterior:** [[08 Arquitectura]] · **Siguiente:** [[10 Competencia y ventaja competitiva]]
