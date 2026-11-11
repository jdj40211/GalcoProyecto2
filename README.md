<div align="center">

# GALCO · Cotizador y Gestión de Viáticos

**Proyecto Integrador 2 · Sprint 3 · Entrega final**

![Azul GALCO](https://img.shields.io/badge/Azul_GALCO-0053A1?style=flat-square&labelColor=0053A1&color=0053A1)
![Verde GALCO](https://img.shields.io/badge/Verde_GALCO-7DB928?style=flat-square&labelColor=7DB928&color=7DB928)

_Trabajo bien Hecho!_

</div>

## Resultado

El Sprint 3 completa el módulo de Hojas de vida (candidatos, análisis con IA, vacantes, evaluación y ranking) y deja la
aplicación desplegada en una nube pública. Sprint 2 había añadido catálogo buscable, variantes editables,
notificaciones internas, legalización con soportes y administración de usuarios.

Documentación del Sprint 3:

- [Manual de usuario](docs/wiki/35-Manual-de-usuario.md)
- [Caso de negocio final](docs/wiki/31-Sprint-3-Caso-de-negocio-final.md)
- [Alcance y trazabilidad](docs/wiki/30-Sprint-3-Alcance-y-trazabilidad.md)
- [Despliegue](docs/wiki/29-Sprint-3-Despliegue.md)
- [Pruebas funcionales](docs/wiki/32-Sprint-3-Pruebas-funcionales.md), [automáticas](docs/wiki/33-Sprint-3-Pruebas-automaticas.md) y [de usabilidad](docs/wiki/34-Sprint-3-Pruebas-usabilidad.md)
- [Ceremonias y cierre](docs/wiki/36-Sprint-3-Ceremonias-y-cierre.md) y [actas](docs/ceremonias/sprint-3/README.md)
- [Sustentación](docs/wiki/37-Sprint-3-Sustentacion.md)

Administrador demo: `admin` / `AdminDemo2026!`. Las sesiones demo se validan
en servidor, expiran en una hora y se revocan al salir o desactivar la cuenta.
Las cuentas creadas en demo se pierden al reiniciar. Firebase real se usa con
`AUTH_BYPASS=false` y configuración concordante en frontend.

La recuperación por correo requiere Firebase. El envío de cotizaciones requiere
`MAIL_ENDPOINT` (HTTPS) y `MAIL_TOKEN`. El endpoint debe aceptar JSON
`{to, subject, text, attachments:[{filename,contentType,content}]}` (contenido base64)
y responder `{id:"identificador-del-envio"}` al aceptar el mensaje.
No se envían correos durante las pruebas; se sustituye el proveedor.
En el Sprint 3 el equipo descartó el envío con proveedor real (HU-33): la cotización se entrega como PDF descargado.
El OCR real requiere configurar el proveedor existente y validarlo con comprobantes
autorizados. Sin esas configuraciones no se declara validación productiva.

Aplicación web interna que reúne dos módulos bajo una sola sesión, navegación y sistema visual:

| Módulo              | Funciones disponibles                                                                                       |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| Cotizador de postes | Catálogos, cálculo técnico/comercial, AIU, consecutivo, vigencia, historial y PDF                           |
| Gestión de viáticos | Solicitud de viaje, gastos estimados, soportes OCR, corrección, aprobación, tablero y TXT                   |
| Hojas de vida       | Candidatos, hoja de vida adjunta, análisis con IA con confirmación, vacantes con criterios y pesos, ranking |

Del módulo de Hojas de vida quedan fuera, y pasan a un Sprint 4 hipotético, la búsqueda y filtros de candidatos (HU-15), la actualización (HU-17), la gestión de etapas (HU-18) y los reportes (HU-19). La consulta de perfil (HU-16) falta validarla contra sus criterios.

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

La verificación ejecuta formato, ESLint, pruebas, compilación y auditoría de dependencias. GitHub Actions repite los controles en cada Pull Request a `main` y CodeQL analiza seguridad.

El último informe de resultados registrado es [Resultados Sprint 2](docs/evidencias/sprint-2/RESULTADOS.md). El del Sprint 3 está pendiente (ver el checklist de la [página 36 de la Wiki](docs/wiki/36-Sprint-3-Ceremonias-y-cierre.md)). GitHub Actions no está ejecutando los controles por un bloqueo de facturación de la cuenta dueña del repositorio, así que no hay CI verde para el Sprint 3.
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
- proveedor OCR autorizado;
- HTTPS y almacenamiento privado para soportes.

En la nube, la configuración se hace en Render como explica la guía de despliegue; no se usan archivos `.env`.

## Documentación de Sprint 2

- [Alcance y límites](docs/wiki/22-Sprint-2-Alcance-y-trazabilidad.md)
- [Finanzas y riesgos](docs/wiki/23-Sprint-2-Caso-de-negocio.md)
- [Estrategia de pruebas](docs/wiki/24-Sprint-2-Pruebas-automaticas.md)
- [Protocolo de usabilidad](docs/wiki/25-Sprint-2-Protocolo-usabilidad.md)
- [Casos manuales](docs/wiki/26-Sprint-2-Pruebas-funcionales.md)
- [Cierre y evidencias](docs/wiki/27-Sprint-2-Ceremonias-y-cierre.md)
- [Sustentación](docs/wiki/28-Sprint-2-Sustentacion.md)

## Documentación de Sprint 1

- [Plan de negocio V1](docs/wiki/15-Sprint-1-Plan-de-negocio.md)
- [Backlog y trazabilidad](docs/wiki/16-Sprint-1-Backlog-y-trazabilidad.md)
- [Pruebas funcionales](docs/wiki/17-Sprint-1-Pruebas-funcionales.md)
- [Calidad del software](docs/wiki/18-Calidad-del-software.md)
- [Ceremonias y evidencias](docs/wiki/19-Ceremonias-Sprint-1.md)
- [Guion de sustentación](docs/wiki/20-Sustentacion-Sprint-1.md)
- [Checklist de entrega](docs/wiki/21-Sprint-1-Checklist.md)

La documentación completa está en [`docs/wiki/`](docs/wiki) y puede sincronizarse con la Wiki de GitHub después de la revisión del equipo.

## Estado honesto de cierre

El incremento del Sprint 3 está en `main` y hay un despliegue publicado en la URL de arriba (verificar con la prueba de humo que incluye lo último de `main`). Para declarar el Sprint cerrado aún se requieren evidencia real de ceremonias, la verificación manual del despliegue (HU-32), aceptación del Product Owner, revisión de un compañero y CI verde en GitHub. Las historias que no se terminaron están en el milestone Sprint 4 (hipotético). El envío de cotizaciones con proveedor de correo real (HU-33) se descartó por decisión del equipo: la cotización se entrega como PDF descargado.
