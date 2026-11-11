# Proyecto GALCO — Suite de operaciones

> Proyecto Integrador 2 · Sprint 3 · Producto final: Cotizador, Viáticos y Hojas de vida.

**Aplicación:** https://galco-suite.onrender.com

## Producto actual

La aplicación une Cotizador de postes, Gestión de viáticos y, desde el Sprint 3, Hojas de vida (registro de candidatos, análisis de hojas de vida con IA, vacantes y ranking) en una SPA Vue 3 con API Node/Hapi. Comparte autenticación, roles (Comercial, Contabilidad, Recursos Humanos y Administración), navegación e identidad GALCO. Está desplegada en Render con MongoDB Atlas, Firebase y OpenAI.

En Hojas de vida la IA solo propone: RRHH confirma los datos y la evaluación no descarta ni cambia la etapa de nadie. Búsqueda, perfil consolidado y etapas de selección (HU-15, HU-16, HU-18) siguen en el backlog. El envío de cotizaciones por correo se descartó (HU-33, #71): la cotización se entrega como PDF descargado.

## Índice

### Entrega Sprint 3

- [Manual de usuario](35-Manual-de-usuario.md)
- [Despliegue en la nube](29-Sprint-3-Despliegue.md)
- [Alcance y trazabilidad](30-Sprint-3-Alcance-y-trazabilidad.md)
- [Caso de negocio final (Sección 6: viabilidad)](31-Sprint-3-Caso-de-negocio-final.md)
- [Casos de prueba funcionales](32-Sprint-3-Pruebas-funcionales.md)
- [Pruebas automáticas](33-Sprint-3-Pruebas-automaticas.md)
- [Resultados de las pruebas de usabilidad](34-Sprint-3-Pruebas-usabilidad.md)
- [Ceremonias, backlog y cierre](36-Sprint-3-Ceremonias-y-cierre.md)
- [Guion de sustentación](37-Sprint-3-Sustentacion.md)

### Entrega Sprint 2

- [Alcance y trazabilidad](22-Sprint-2-Alcance-y-trazabilidad.md)
- [Caso de negocio V2: finanzas y riesgos](23-Sprint-2-Caso-de-negocio.md)
- [Pruebas automáticas](24-Sprint-2-Pruebas-automaticas.md)
- [Protocolo de usabilidad (planeado para Sprint 3)](25-Sprint-2-Protocolo-usabilidad.md)
- [Casos funcionales manuales](26-Sprint-2-Pruebas-funcionales.md)
- [Ceremonias y checklist de cierre](27-Sprint-2-Ceremonias-y-cierre.md)
- [Guion de sustentación](28-Sprint-2-Sustentacion.md)

### Contexto y Design Thinking

- **[[01 Contexto de la empresa]]**
- **[[02 Problematica y cifras]]**
- **[[03 Empatizar]]**
- **[[04 Divergir]]**
- **[[05 Decidir]]**
- **[[06 Prototipar]]**

### Solución

- **[[07 Funcionalidades]]**
- **[[08 Arquitectura]]** — arquitectura implementada
- **[[09 Stack tecnologico]]** — tecnologías verificables
- **[[10 Competencia y ventaja competitiva]]**
- **[[12 Manual de marca y diseno]]**
- **[[14 Mockups]]**

### Entrega Sprint 1

- **[[15 Sprint 1 Plan de negocio]]**
- **[[16 Sprint 1 Backlog y trazabilidad]]**
- **[[17 Sprint 1 Pruebas funcionales]]**
- **[[18 Calidad del software]]**
- **[[19 Ceremonias Sprint 1]]**
- **[[20 Sustentacion Sprint 1]]**
- **[[21 Sprint 1 Checklist]]**

## Identidad visual

| Token          | Color     | Uso                               |
| -------------- | --------- | --------------------------------- |
| Azul GALCO     | `#0053A1` | Navegación y acciones principales |
| Verde GALCO    | `#7DB928` | Acentos y estados positivos       |
| Gris principal | `#111827` | Texto                             |
| Fondo          | `#F7F9FB` | Superficie general                |

La interfaz usa colores sólidos, tipografía Inter, estados con texto e ícono, foco visible y diseño responsive.

## Estado

| Entregable (Sprint 3)                         | Estado                                                            |
| --------------------------------------------- | ----------------------------------------------------------------- |
| Cotizador + Viáticos                          | Implementado (Sprint 1 y 2)                                       |
| Hojas de vida (HU-13, 14, 28, 29, 30, 31, 34) | Implementado en `main`; HU-34 aún no desplegada en la nube        |
| Despliegue en nube pública (HU-32)            | Publicado; verificación manual con cuentas reales pendiente (#70) |
| Pruebas automatizadas y E2E                   | Aprobadas localmente (119 backend, 25 frontend, 3 E2E); sin CI    |
| Casos funcionales manuales                    | Diseñados; ejecución pendiente del equipo                         |
| Pruebas de usabilidad                         | Preparadas; ejecución y resultados pendientes del equipo          |
| Manual de usuario                             | Publicado en la Wiki                                              |
| Caso de negocio final                         | Redactado; cifras de GALCO pendientes del equipo                  |
| Evidencia real de ceremonias                  | Pendiente del equipo                                              |
| Aprobación del Product Owner/PR               | Pendiente                                                         |
