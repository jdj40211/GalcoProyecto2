'use strict';

/**
 * materiales.routes.js
 *
 * GET  /cotizador/materiales               — catálogo completo (lectura)
 * GET  /cotizador/materiales/{codigo}      — material + historial de precios
 * PATCH /cotizador/materiales/{codigo}/precio — actualizar precio (admin)
 */

const Joi = require('joi');
const controller = require('../controllers/materiales.controller');

const failAction = (_request, _h, err) => {
  throw err;
};
const codigoParam = Joi.object({
  codigo: Joi.string().trim().uppercase().min(1).max(30).required()
});

const routes = [
  {
    method: 'GET',
    path: '/cotizador/materiales',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad', 'consulta'] },
      description: 'Lista los 9 materiales del catálogo con precios vigentes',
      tags: ['api', 'materiales'],
      handler: controller.getMateriales
    }
  },
  {
    method: 'GET',
    path: '/cotizador/materiales/{codigo}',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad', 'consulta'] },
      description: 'Obtiene un material por código con historial de precios',
      tags: ['api', 'materiales'],
      validate: { params: codigoParam, failAction },
      handler: controller.getMaterial
    }
  },
  {
    method: 'PATCH',
    path: '/cotizador/materiales/{codigo}/precio',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'contabilidad'] },
      description: 'Actualiza el precio de un material (crea nueva versión histórica)',
      tags: ['api', 'materiales'],
      validate: {
        params: codigoParam,
        payload: Joi.object({ precioUnitario: Joi.number().positive().required() }),
        failAction
      },
      handler: controller.patchPrecio
    }
  }
];

module.exports = routes;
