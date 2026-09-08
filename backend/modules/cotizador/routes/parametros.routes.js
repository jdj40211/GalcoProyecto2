/**
 * parametros.routes.js
 *
 * GET  /cotizador/parametros            — parámetros vigentes (lectura pública por rol)
 * GET  /cotizador/parametros/historial  — todos los sets históricos (admin)
 * PUT  /cotizador/parametros            — actualizar parámetros (admin)
 */

'use strict';

const Joi = require('joi');
const controller = require('../controllers/parametros.controller');

const failAction = (_request, _h, err) => {
  throw err;
};

// Schema Joi para validar el payload de actualización.
// Los costos y la longitud comercial son requeridos siempre.
// Los AIU: se acepta la estructura nueva (4 rubros) o la legacy (2 rubros),
// pero no es obligatorio enviar ninguna — el calculator detecta cuál usar.
const parametrosPayload = Joi.object({
  nombre: Joi.string().trim().max(100).optional(),

  // Costos (siempre requeridos)
  costoPorKgPlatina: Joi.number().positive().required(),
  costoGalvanizadoPorKg: Joi.number().positive().required(),
  costoPinturaPorM2: Joi.number().positive().required(),

  // AIU 4 rubros (Excel 2026, P0.2+)
  aiuMateriales: Joi.number().min(0).max(100).optional(),
  aiuMOInterna: Joi.number().min(0).max(100).optional(),
  aiuMOExterna: Joi.number().min(0).max(100).optional(),
  aiuGalvanizado: Joi.number().min(0).max(100).optional(),

  // AIU legacy (Excel v3) — aceptados para migración histórica
  aiuMateriaPrimaYMOInterna: Joi.number().min(0).max(100).optional(),
  aiuManoObraExterna: Joi.number().min(0).max(100).optional(),

  // MO externa fija (P1.2)
  costoTransporte: Joi.number().min(0).required(),
  costoEmpacado: Joi.number().min(0).required(),
  longComercialTuboM: Joi.number().positive().required()
});

const routes = [
  {
    method: 'GET',
    path: '/cotizador/parametros',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'comercial', 'contabilidad', 'consulta'] },
      description: 'Obtiene los parámetros operativos vigentes del cotizador',
      tags: ['api', 'parametros'],
      handler: controller.getParametros
    }
  },
  {
    method: 'GET',
    path: '/cotizador/parametros/historial',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'contabilidad'] },
      description: 'Historial de todos los sets de parámetros',
      tags: ['api', 'parametros'],
      validate: {
        query: Joi.object({ limit: Joi.number().integer().min(1).max(100).default(20) }),
        failAction
      },
      handler: controller.getHistorial
    }
  },
  {
    method: 'PUT',
    path: '/cotizador/parametros',
    options: {
      auth: { strategy: 'firebase', scope: ['admin', 'contabilidad'] },
      description: 'Actualiza los parámetros operativos (desactiva el anterior y crea uno nuevo)',
      tags: ['api', 'parametros'],
      validate: {
        payload: parametrosPayload,
        failAction
      },
      handler: controller.putParametros
    }
  }
];

module.exports = routes;
