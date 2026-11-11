<div align="center">

# GALCO · Suite de operaciones

**Proyecto Integrador 2 · Sprint 3 · Producto final**

![Azul GALCO](https://img.shields.io/badge/Azul_GALCO-0053A1?style=flat-square&labelColor=0053A1&color=0053A1)
![Verde GALCO](https://img.shields.io/badge/Verde_GALCO-7DB928?style=flat-square&labelColor=7DB928&color=7DB928)

_Trabajo bien Hecho!_

</div>

## Resultado

Aplicación web interna que reúne tres módulos bajo una sola sesión, roles, navegación y sistema visual.
Está publicada en https://galco-suite.onrender.com.

| Módulo              | Funciones disponibles                                                                                          |
| ------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cotizador de postes | Catálogos, cálculo técnico/comercial, AIU, consecutivo, vigencia, variantes, historial, indicadores y PDF      |
| Gestión de viáticos | Solicitud de viaje, gastos estimados, soportes OCR, corrección, aprobación, notificaciones, legalización y TXT |
| Hojas de vida       | Registro de candidatos desde la hoja de vida, análisis con IA confirmado por RRHH, vacantes y ranking          |

En Hojas de vida la IA solo propone: Recursos Humanos confirma los datos y la evaluación es un apoyo que no
descarta a nadie ni cambia su etapa. Antes de enviar una hoja de vida a la IA se registra la autorización de
tratamiento de datos (Ley 1581 de 2012). La búsqueda, el perfil consolidado y las etapas de selección
(HU-15, HU-16, HU-18) siguen en el Product Backlog.

El envío de cotizaciones por correo se descartó por decisión del equipo (HU-33, #71): la cotización se entrega
como PDF descargado desde el historial. La recuperación de contraseña sí envía correo, a través de Firebase.

Documentación del Sprint 3:

- [Manual de usuario](docs/wiki/35-Manual-de-usuario.md)
- [Despliegue en la nube](docs/wiki/29-Sprint-3-Despliegue.md)
- [Alcance y trazabilidad](docs/wiki/30-Sprint-3-Alcance-y-trazabilidad.md)
- [Caso de negocio final](docs/wiki/31-Sprint-3-Caso-de-negocio-final.md)
- [Casos de prueba funcionales](docs/wiki/32-Sprint-3-Pruebas-funcionales.md)
- [Pruebas automáticas](docs/wiki/33-Sprint-3-Pruebas-automaticas.md)
- [Pruebas de usabilidad](docs/wiki/34-Sprint-3-Pruebas-usabilidad.md)
- [Ceremonias y cierre](docs/wiki/36-Sprint-3-Ceremonias-y-cierre.md)
- [Sustentación](docs/wiki/37-Sprint-3-Sustentacion.md)

Administrador demo: `admin` / `AdminDemo2026!`. Las sesiones demo se validan
en servidor, expiran en una hora y se revocan al salir o desactivar la cuenta.
Las cuentas creadas en demo se pierden al reiniciar. Firebase real se usa con
`AUTH_BYPASS=false` y configuración concordante en frontend.

El OCR de comprobantes y el análisis de hojas de vida usan OpenAI con `OCR_PROVIDER=openai`;
en modo demo (`OCR_PROVIDER=demo`) devuelven datos simulados y no requieren cuenta.

## Ejecutar localmente

Requiere Node.js 22.13 o superior.

```bash
npm run install:all
npm run dev
```

Abrir `http://localhost:5173` (interfaz de Vite; la API corre en el puerto 3000 y Vite le reenvía `/api`).
Con la configuración de los archivos `.env.example`, el modo local utiliza persistencia en memoria, autenticación
demo y OCR simulado, por lo que no requiere cuentas externas.

Para probar la aplicación integrada, con la API sirviendo también la interfaz compilada como en un despliegue:

```bash
npm run preview
```

Abrir `http://localhost:3000`. `npm run start` hace lo mismo con `NODE_ENV=production`, que exige
`AUTH_BYPASS=false` y la configuración real de Firebase.

Usuarios demo:

- Comercial: `jdiaz` / `1234`
- Contabilidad: `acastro` / `conta2024`
- Recursos Humanos: `mrestrepo` / `Rrhh2026!`

No habilitar el modo demo en producción.

## Verificación

```bash
npm run verify
```

La verificación ejecuta formato, ESLint, pruebas, compilación y auditoría de dependencias. GitHub Actions está configurado para repetir los controles en cada Pull Request a `main` y CodeQL para analizar seguridad, pero hoy no se ejecuta porque la cuenta dueña del repositorio está bloqueada por facturación: los controles se corren con `npm run verify` antes de cada PR.

El informe de la entrega anterior está en [Resultados Sprint 2](docs/evidencias/sprint-2/RESULTADOS.md).
El frontend fija `@grpc/grpc-js` 1.14.6 mediante `overrides` porque el paquete
Firebase incluye una versión transitiva con alertas de seguridad. El backend
conserva alertas moderadas transitivas de Firebase Admin; su actualización mayor
y las pruebas con servicios reales quedan registradas como deuda. El control de
auditoría bloquea alertas altas y críticas.

## Aplicación desplegada

**URL:** https://galco-suite.onrender.com — plan gratuito de Render: si nadie la usó en los últimos 15 minutos, la primera carga tarda cerca de un minuto.

La aplicación corre en Render (Docker) con MongoDB Atlas, Firebase Authentication y OpenAI. El proceso completo,
las variables de entorno, la verificación y la reversión están en
[Sprint 3 — Despliegue](docs/wiki/29-Sprint-3-Despliegue.md). Después de cada despliegue:

```bash
npm run smoke:deploy -- https://<servicio>.onrender.com
```

## Configuración productiva

Copiar los archivos `.env.example` de frontend y backend y configurar:

- Firebase para identidad y tokens reales;
- MongoDB para persistencia;
- OpenAI (`OPENAI_API_KEY`) para el OCR de comprobantes y el análisis de hojas de vida;
- HTTPS y almacenamiento privado para soportes.

En la nube, la configuración se hace en Render como explica la guía de despliegue; no se usan archivos `.env`.

## Documentación de entregas anteriores

Sprint 1:
[plan de negocio V1](docs/wiki/15-Sprint-1-Plan-de-negocio.md),
[backlog y trazabilidad](docs/wiki/16-Sprint-1-Backlog-y-trazabilidad.md),
[pruebas funcionales](docs/wiki/17-Sprint-1-Pruebas-funcionales.md),
[calidad del software](docs/wiki/18-Calidad-del-software.md),
[ceremonias](docs/wiki/19-Ceremonias-Sprint-1.md),
[sustentación](docs/wiki/20-Sustentacion-Sprint-1.md) y
[checklist](docs/wiki/21-Sprint-1-Checklist.md).

Sprint 2:
[alcance](docs/wiki/22-Sprint-2-Alcance-y-trazabilidad.md),
[caso de negocio](docs/wiki/23-Sprint-2-Caso-de-negocio.md),
[pruebas automáticas](docs/wiki/24-Sprint-2-Pruebas-automaticas.md),
[protocolo de usabilidad](docs/wiki/25-Sprint-2-Protocolo-usabilidad.md),
[casos manuales](docs/wiki/26-Sprint-2-Pruebas-funcionales.md),
[cierre](docs/wiki/27-Sprint-2-Ceremonias-y-cierre.md) y
[sustentación](docs/wiki/28-Sprint-2-Sustentacion.md).

La documentación completa está en [`docs/wiki/`](docs/wiki) y puede sincronizarse con la Wiki de GitHub después de la revisión del equipo.

## Estado honesto de cierre

El código del Sprint 3 está en `main` y desplegado en Render. Para declarar el Sprint cerrado aún se requieren
los resultados de las pruebas de usabilidad, la evidencia real de las ceremonias, la ejecución manual de los casos
funcionales, la verificación manual del despliegue (#70), la aceptación del Product Owner y la revisión de un
compañero en los Pull Request. GitHub Actions no corre mientras la cuenta dueña siga bloqueada por facturación.
