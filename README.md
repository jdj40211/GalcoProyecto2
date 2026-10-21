<div align="center">

# GALCO · Cotizador y Gestión de Viáticos

**Proyecto Integrador 2 · Sprint 2 · Incremento en revisión**

![Azul GALCO](https://img.shields.io/badge/Azul_GALCO-0053A1?style=flat-square&labelColor=0053A1&color=0053A1)
![Verde GALCO](https://img.shields.io/badge/Verde_GALCO-7DB928?style=flat-square&labelColor=7DB928&color=7DB928)

_Trabajo bien Hecho!_

</div>

## Resultado

Sprint 2 añade catálogo buscable, variantes editables, adaptador de envío de PDF,
notificaciones internas, legalización con soportes y administración de usuarios.
El alcance confirmado mantiene Cotizador + Viáticos.

- [Alcance y límites](docs/wiki/22-Sprint-2-Alcance-y-trazabilidad.md)
- [Finanzas y riesgos](docs/wiki/23-Sprint-2-Caso-de-negocio.md)
- [Estrategia de pruebas](docs/wiki/24-Sprint-2-Pruebas-automaticas.md)
- [Protocolo de usabilidad](docs/wiki/25-Sprint-2-Protocolo-usabilidad.md)
- [Casos manuales](docs/wiki/26-Sprint-2-Pruebas-funcionales.md)
- [Cierre y evidencias pendientes](docs/wiki/27-Sprint-2-Ceremonias-y-cierre.md)
- [Sustentación](docs/wiki/28-Sprint-2-Sustentacion.md)

Administrador demo: `admin` / `AdminDemo2026!`. Las sesiones demo se validan
en servidor, expiran en una hora y se revocan al salir o desactivar la cuenta.
Las cuentas creadas en demo se pierden al reiniciar. Firebase real se usa con
`AUTH_BYPASS=false` y configuración concordante en frontend.

La recuperación por correo requiere Firebase. El envío de cotizaciones requiere
`MAIL_ENDPOINT` (HTTPS) y `MAIL_TOKEN`. El endpoint debe aceptar JSON
`{to, subject, text, attachments:[{filename,contentType,content}]}` (contenido base64)
y responder `{id:"identificador-del-envio"}` al aceptar el mensaje.
No se envían correos durante las pruebas; se sustituye el proveedor.
El OCR real requiere configurar el proveedor existente y validarlo con comprobantes
autorizados. Sin esas configuraciones no se declara validación productiva.

Aplicación web interna que reúne dos módulos bajo una sola sesión, navegación y sistema visual:

| Módulo              | Funciones disponibles                                                                     |
| ------------------- | ----------------------------------------------------------------------------------------- |
| Cotizador de postes | Catálogos, cálculo técnico/comercial, AIU, consecutivo, vigencia, historial y PDF         |
| Gestión de viáticos | Solicitud de viaje, gastos estimados, soportes OCR, corrección, aprobación, tablero y TXT |

El módulo de Hojas de vida documentado en Sprint 0 queda en el Product Backlog y requiere confirmación del Product Owner; no se presenta como funcionalidad terminada de este MVP.

## Ejecutar localmente

Requiere Node.js 22.13 o superior.

```bash
npm run install:all
npm run dev
```

Abrir `http://localhost:3000`. El modo local utiliza persistencia en memoria, autenticación demo y OCR simulado, por lo que no requiere cuentas externas.

Usuarios demo:

- Comercial: `jdiaz` / `1234`
- Contabilidad: `acastro` / `conta2024`

No habilitar el modo demo en producción.

## Verificación

```bash
npm run verify
```

La verificación ejecuta formato, ESLint, pruebas, compilación y auditoría de dependencias. GitHub Actions repite los controles en cada Pull Request a `main` y CodeQL analiza seguridad.

El informe de esta entrega está en [Resultados Sprint 2](docs/evidencias/sprint-2/RESULTADOS.md).
El frontend fija `@grpc/grpc-js` 1.14.6 mediante `overrides` porque el paquete
Firebase incluye una versión transitiva con alertas de seguridad. El backend
conserva alertas moderadas transitivas de Firebase Admin; su actualización mayor
y las pruebas con servicios reales quedan registradas como deuda. El control de
auditoría bloquea alertas altas y críticas.

## Configuración productiva

Copiar los archivos `.env.example` de frontend y backend y configurar:

- Firebase para identidad y tokens reales;
- MongoDB para persistencia;
- proveedor OCR autorizado;
- HTTPS y almacenamiento privado para soportes.

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

El incremento técnico de Sprint 2 está integrado en `main` mediante los PR #59 y #60, con
CI y CodeQL verdes. Para declarar el Sprint administrativamente cerrado aún se requieren
evidencia real de ceremonias, ejecución manual final y aceptación del Product Owner. Las
integraciones externas requieren configuración y validación con las cuentas del proyecto.
