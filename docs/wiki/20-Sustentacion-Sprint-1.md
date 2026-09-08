# 20 · Sprint 1 — Guion de sustentación

## Parte 1 · Presentación al cliente (8–10 minutos)

### 1. Objetivo (1 minuto)

“En Sprint 1 convertimos la propuesta de Sprint 0 en un MVP integrado para dos procesos que estamos desarrollando con GALCO: cotización de postes y gestión de viáticos. El objetivo es disminuir reprocesos y dar trazabilidad sin obligar al usuario a saltar entre aplicaciones.”

### 2. Progreso y valor (2 minutos)

- Una sesión y una identidad visual GALCO para ambos módulos.
- Cálculo técnico/comercial con parámetros conservados, consecutivo y PDF.
- Solicitud de viaje con presupuesto y flujo de decisión.
- Extracción asistida de soportes con confianza y corrección humana.
- Roles, validaciones, pruebas e integración continua.

### 3. Demostración (4 minutos)

1. Entrar como Comercial.
2. Crear una cotización Cercha, mostrar cálculo, vigencia, guardado e historial/PDF.
3. Crear una solicitud de viaje con dos gastos y enviarla.
4. Cargar un soporte y mostrar los campos OCR editables.
5. Entrar como Contabilidad y aprobar/rechazar una solicitud.

### 4. Deuda y siguiente decisión (2 minutos)

- Configurar servicios productivos: Firebase, MongoDB y bucket privado.
- Medir OCR real con documentos autorizados y agregar preprocesamiento.
- Completar catálogo administrable y pruebas end-to-end.
- Confirmar si Hojas de vida continúa como tercer módulo o se reprograma fuera del producto actual.

### 5. Pregunta al cliente (1 minuto)

“¿Este flujo representa cómo trabajan hoy y cuál de estas deudas bloquea primero un piloto con usuarios reales?”

## Parte 2 · Sustentación técnica y académica (10–12 minutos)

### Código y arquitectura

- Mostrar separación `frontend/` y `backend/`.
- Explicar el monolito modular y los límites Cotizador/Viáticos.
- Mostrar validadores, servicio de negocio y repositorio de una solicitud.
- Mostrar snapshot de parámetros de cotización y control de roles en API.

### Pruebas

- Abrir `docs/wiki/16-Sprint-1-Backlog-y-trazabilidad.md`.
- Seguir un ejemplo completo: HU-20 → CA-01 → CP-11 → `solicitudes.test.js`.
- Ejecutar `npm run test` y explicar casos positivos/negativos.
- Mostrar el registro manual y cómo un fallo crea un bug trazable.

### Calidad

- Ejecutar `npm run verify` o mostrar una ejecución verde del pipeline.
- Enseñar ESLint/Prettier, CI, CodeQL y Dependabot.
- Explicar GitHub Flow, aprobación por pares y protección de `main`.

### Negocio

- Presentar problema, usuario objetivo, propuesta de valor, alternativas y riesgos.
- Diferenciar hechos validados de hipótesis futuras.
- Cerrar con métricas que se tomarán en el piloto.

## Reparto sugerido

| Bloque                     | Responsable | Evidencia preparada                    |
| -------------------------- | ----------- | -------------------------------------- |
| Problema y plan de negocio | PENDIENTE   | Plan V1 y fuentes                      |
| Demo Cotizador             | PENDIENTE   | Datos ficticios y PDF                  |
| Demo Viáticos/OCR          | PENDIENTE   | Soporte de prueba sin datos personales |
| Arquitectura y código      | PENDIENTE   | Diagrama y archivos clave              |
| Pruebas y calidad          | PENDIENTE   | CI verde y trazabilidad                |
| Deuda y cierre             | PENDIENTE   | Backlog priorizado                     |

## Lista previa

- Usar datos ficticios y limpiar registros antes de la demo.
- Probar el PDF y las descargas en el equipo de presentación.
- Verificar que el enlace del repositorio y las evidencias de ceremonias abran.
- Tener una ejecución local preparada por si falla internet.
- No afirmar que HU-13, OCR productivo ni la infraestructura real están terminados.
