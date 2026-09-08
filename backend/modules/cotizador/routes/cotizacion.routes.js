/**
 * cotizacion.routes.js
 *
 * Definición de rutas Hapi del módulo cotizador.
 *
 * Convenciones estilo GALCO WEB:
 *  - validate: { payload, query, params } apuntando a schemas Joi.
 *  - auth: { strategy: 'firebase', scope: [...] } para autorización por roles.
 *  - failAction: 'error' en validación para que devuelva 400 con detalle.
 *
 * Se exporta un array de rutas que `app.js` registra de una vez con server.route(...).
 */

'use strict';

const Joi = require('joi');
const controller = require('../controllers/cotizacion.controller');
const v = require('../validators/cotizacion.validator');

const failAction = (_request, _h, err) => {
  throw err;
};

const routes = [
  // -----------------------------------------------------------------------
  // GET /cotizador/catalogos  -> catálogos para alimentar el formulario
  // -----------------------------------------------------------------------
  {
    method: 'GET',
    path: '/cotizador/catalogos',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad', 'consulta'] },
      description: 'Obtiene tipos de poste, alturas, brazos válidos y parámetros vigentes',
      tags: ['api', 'cotizador'],
      handler: controller.getCatalogos
    }
  },

  // -----------------------------------------------------------------------
  // POST /cotizador/calculate  -> calcula sin persistir
  // -----------------------------------------------------------------------
  {
    method: 'POST',
    path: '/cotizador/calculate',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad'] },
      description: 'Calcula una cotización sin guardarla (modo simulación)',
      tags: ['api', 'cotizador'],
      validate: {
        payload: v.calculatePayload,
        failAction
      },
      handler: controller.calculateCotizacion
    }
  },

  // -----------------------------------------------------------------------
  // POST /cotizador  -> calcula y persiste
  // -----------------------------------------------------------------------
  {
    method: 'POST',
    path: '/cotizador',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad'] },
      description: 'Crea y guarda una cotización',
      tags: ['api', 'cotizador'],
      validate: {
        payload: v.createPayload,
        failAction
      },
      handler: controller.createCotizacion
    }
  },

  // -----------------------------------------------------------------------
  // GET /cotizador  -> lista paginada con filtros
  // -----------------------------------------------------------------------
  {
    method: 'GET',
    path: '/cotizador',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad', 'consulta'] },
      description: 'Lista cotizaciones con filtros y paginación',
      tags: ['api', 'cotizador'],
      validate: {
        query: v.listQuery,
        failAction
      },
      handler: controller.getCotizaciones
    }
  },

  // -----------------------------------------------------------------------
  // GET /cotizador/{id}  -> detalle
  // -----------------------------------------------------------------------
  {
    method: 'GET',
    path: '/cotizador/{id}',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad', 'consulta'] },
      description: 'Obtiene una cotización por id',
      tags: ['api', 'cotizador'],
      validate: {
        params: v.idParams,
        failAction
      },
      handler: controller.getCotizacionById
    }
  },

  // -----------------------------------------------------------------------
  // PATCH /cotizador/{id}/estado  -> transición de estado
  // -----------------------------------------------------------------------
  {
    method: 'PATCH',
    path: '/cotizador/{id}/estado',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad'] },
      description: 'Cambia el estado de una cotización',
      tags: ['api', 'cotizador'],
      validate: {
        params: v.idParams,
        payload: Joi.object({
          estado: Joi.string().valid('borrador', 'enviada', 'aprobada', 'rechazada', 'anulada').required()
        }),
        failAction
      },
      handler: controller.cambiarEstado
    }
  },

  // -----------------------------------------------------------------------
  // GET /cotizador/{id}/pdf  -> binario PDF
  // -----------------------------------------------------------------------
  {
    method: 'GET',
    path: '/cotizador/{id}/pdf',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad', 'consulta'] },
      description: 'Descarga la cotización en PDF',
      tags: ['api', 'cotizador'],
      validate: {
        params: v.idParams,
        failAction
      },
      handler: controller.generarPdfCotizacion
    }
  }
];

module.exports = routes;
