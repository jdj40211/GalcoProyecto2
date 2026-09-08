/**
 * cotizacion.controller.js
 *
 * Controladores estilo GALCO: async/await, try/catch, una función por acción HTTP.
 * No hay lógica de cálculo aquí — sólo orquestación entre:
 *   - validators (ya corrieron en Hapi antes de llegar)
 *   - calculos.service (motor puro)
 *   - Mongoose model
 *   - consecutivo.service
 *
 * El patrón: cada método recibe (request, h) y devuelve h.response(...).
 * Errores de negocio -> Boom.badRequest/notFound. Errores inesperados se dejan
 * burbujar al error handler global del plugin.
 */

'use strict';

const Boom = require('@hapi/boom');

const calculos = require('../services/calculos.service');
const repository = require('../services/cotizaciones.repository.service');
const { obtenerParametrosActivos } = require('../services/parametros.service');
const { obtenerMapaPrecios } = require('../services/materiales.service');

// ---------------------------------------------------------------------------
// POST /cotizador/calculate
// Simulación: calcula pero no persiste. Ideal para el "Calcular" del formulario.
// ---------------------------------------------------------------------------
async function calculateCotizacion(request, h) {
  try {
    const { configuracion } = request.payload;
    const [parametros, preciosTubos] = await Promise.all([obtenerParametrosActivos(), obtenerMapaPrecios()]);
    const resultado = calculos.calcularCotizacionCompleta(configuracion, {
      ...parametros,
      preciosTubos
    });
    return h
      .response({
        ok: true,
        data: {
          configuracion,
          ...resultado
        }
      })
      .code(200);
  } catch (err) {
    request.log(['error', 'cotizador', 'calculate'], err);
    throw Boom.badImplementation('Error calculando cotización', err);
  }
}

// ---------------------------------------------------------------------------
// POST /cotizador
// Calcula y persiste.
// ---------------------------------------------------------------------------
async function createCotizacion(request, h) {
  try {
    const { configuracion, metadata } = request.payload;
    const uidCreador = request.auth?.credentials?.uid || null;

    const [parametros, preciosTubos] = await Promise.all([obtenerParametrosActivos(), obtenerMapaPrecios()]);
    const resultado = calculos.calcularCotizacionCompleta(configuracion, {
      ...parametros,
      preciosTubos
    });
    const consecutivo = await repository.nextConsecutive();

    const doc = await repository.create({
      consecutivo,
      configuracion,
      caracteristicas: resultado.caracteristicas,
      material: resultado.material, // P0.3
      costos: resultado.costos,
      precios: resultado.precios,
      parametrosAplicados: resultado.parametros,
      metadata: {
        ...metadata,
        creadoPor: uidCreador
      },
      estado: 'borrador'
    });

    return h.response({ ok: true, data: doc }).code(201);
  } catch (err) {
    request.log(['error', 'cotizador', 'create'], err);
    if (err.code === 11000) {
      throw Boom.conflict('Consecutivo duplicado, reintentar');
    }
    throw Boom.badImplementation('Error creando cotización', err);
  }
}

// ---------------------------------------------------------------------------
// GET /cotizador?page=&limit=&cliente=&vendedor=&estado=&desde=&hasta=
// ---------------------------------------------------------------------------
async function getCotizaciones(request, h) {
  try {
    const { page, limit, cliente, vendedor, estado, desde, hasta } = request.query;

    const { items, total } = await repository.list({ page, limit, cliente, vendedor, estado, desde, hasta });

    return h
      .response({
        ok: true,
        data: items,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
      .code(200);
  } catch (err) {
    request.log(['error', 'cotizador', 'list'], err);
    throw Boom.badImplementation('Error listando cotizaciones', err);
  }
}

// ---------------------------------------------------------------------------
// GET /cotizador/{id}
// ---------------------------------------------------------------------------
async function getCotizacionById(request, h) {
  try {
    const { id } = request.params;
    const doc = await repository.getById(id);
    if (!doc) throw Boom.notFound('Cotización no encontrada');
    return h.response({ ok: true, data: doc }).code(200);
  } catch (err) {
    if (err.isBoom) throw err;
    request.log(['error', 'cotizador', 'getById'], err);
    throw Boom.badImplementation('Error obteniendo cotización', err);
  }
}

// ---------------------------------------------------------------------------
// PATCH /cotizador/{id}/estado  (transiciones de estado)
// ---------------------------------------------------------------------------
async function cambiarEstado(request, h) {
  try {
    const { id } = request.params;
    const { estado } = request.payload;

    const doc = await repository.updateStatus(id, estado);
    if (!doc) throw Boom.notFound('Cotización no encontrada');
    return h.response({ ok: true, data: doc }).code(200);
  } catch (err) {
    if (err.isBoom) throw err;
    request.log(['error', 'cotizador', 'cambiarEstado'], err);
    throw Boom.badImplementation('Error cambiando estado', err);
  }
}

// ---------------------------------------------------------------------------
// GET /cotizador/{id}/pdf  -> devuelve application/pdf
// ---------------------------------------------------------------------------
async function generarPdfCotizacion(request, h) {
  try {
    const { id } = request.params;
    const doc = await repository.getById(id);
    if (!doc) throw Boom.notFound('Cotización no encontrada');

    // Carga diferida del servicio PDF — es pesado (Chromium)
    const { renderCotizacionPdf } = require('../services/pdf.service');
    const pdfBuffer = await renderCotizacionPdf(doc);

    return h
      .response(pdfBuffer)
      .type('application/pdf')
      .header('Content-Disposition', `attachment; filename="${doc.consecutivo}.pdf"`);
  } catch (err) {
    if (err.isBoom) throw err;
    request.log(['error', 'cotizador', 'pdf'], err);
    throw Boom.badImplementation('Error generando PDF', err);
  }
}

// ---------------------------------------------------------------------------
// GET /cotizador/catalogos  -> tipos, alturas, brazos válidos, parámetros.
// Alimenta los dropdowns del frontend en vez de duplicarlos allá.
// ---------------------------------------------------------------------------
async function getCatalogos(_request, h) {
  const { TIPOS_POSTE, ALTURAS_VALIDAS, getBrazosValidosParaTipo } = require('../data/tablasBase');

  // Leer parámetros desde DB (fallback a constantes si DB no disponible)
  const parametros = await obtenerParametrosActivos();

  return h
    .response({
      ok: true,
      data: {
        tiposPoste: TIPOS_POSTE,
        alturas: ALTURAS_VALIDAS,
        brazos: {
          L: null,
          T: null,
          Cercha: getBrazosValidosParaTipo('Cercha'),
          Brazo_Cercha: getBrazosValidosParaTipo('Brazo_Cercha')
        },
        parametros: {
          // 4 rubros (Excel 2026, P0.2+)
          aiuMateriales: parametros.aiuMateriales,
          aiuMOInterna: parametros.aiuMOInterna,
          aiuMOExterna: parametros.aiuMOExterna,
          aiuGalvanizado: parametros.aiuGalvanizado,
          // Legacy (Excel v3)
          aiuMateriaPrimaYMOInterna: parametros.aiuMateriaPrimaYMOInterna,
          aiuManoObraExterna: parametros.aiuManoObraExterna,
          // Costos
          costoPorKgPlatina: parametros.costoPorKgPlatina,
          costoPorM2Pintura: parametros.costoPinturaPorM2,
          costoGalvanizadoPorKg: parametros.costoGalvanizadoPorKg,
          costoTransporte: parametros.costoTransporte,
          costoEmpacado: parametros.costoEmpacado,
          longComercialTuboM: parametros.longComercialTuboM,
          vigenciaDesde: parametros.vigenciaDesde
        }
      }
    })
    .code(200);
}

module.exports = {
  calculateCotizacion,
  createCotizacion,
  getCotizaciones,
  getCotizacionById,
  cambiarEstado,
  generarPdfCotizacion,
  getCatalogos
};
