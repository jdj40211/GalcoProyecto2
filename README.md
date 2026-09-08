<div align="center">

# GALCO · Cotizador y Gestión de Viáticos

**Proyecto Integrador 2 · Sprint 1 · MVP integrado**

![Azul GALCO](https://img.shields.io/badge/Azul_GALCO-0053A1?style=flat-square&labelColor=0053A1&color=0053A1)
![Verde GALCO](https://img.shields.io/badge/Verde_GALCO-7DB928?style=flat-square&labelColor=7DB928&color=7DB928)

_Trabajo bien Hecho!_

</div>

## Resultado

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

El código, la documentación, las pruebas automatizadas y los controles de calidad están preparados en la rama `feature/sprint-1-mvp`. Para declarar el Sprint cerrado aún se requieren evidencia real de ceremonias, ejecución manual final, aceptación del Product Owner, revisión de un compañero y CI verde en GitHub.
