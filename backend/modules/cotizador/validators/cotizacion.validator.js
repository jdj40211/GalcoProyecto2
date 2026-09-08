/**
 * cotizacion.validator.js
 *
 * Validadores Joi para los endpoints del cotizador.
 *
 * La validación de negocio (ej: "si tipo=Cercha, brazo sólo puede ser 12/18/21")
 * se implementa con Joi condicional: la API devuelve 400 con mensaje claro
 * ANTES de que la lógica llegue al motor de cálculo.
 */

'use strict';

const Joi = require('joi');
const { TIPOS_POSTE, ALTURAS_VALIDAS, getBrazosValidosParaTipo } = require('../data/tablasBase');

// Anchos discretos permitidos para Cercha y Brazo_Cercha
const BRAZOS_CERCHA = getBrazosValidosParaTipo('Cercha'); // [12,18,21]
const BRAZOS_BRAZO_CERCHA = getBrazosValidosParaTipo('Brazo_Cercha'); // [3, 3.5, ..., 6]

// ---------------------------------------------------------------------------
// Configuración: lo que el usuario ingresa en el formulario
// ---------------------------------------------------------------------------
const configuracionSchema = Joi.object({
  tipoPoste: Joi.string()
    .valid(...TIPOS_POSTE)
    .required()
    .messages({ 'any.only': 'tipoPoste debe ser uno de: ' + TIPOS_POSTE.join(', ') }),

  altura: Joi.number()
    .valid(...ALTURAS_VALIDAS)
    .required()
    .messages({ 'any.only': `altura debe ser una de: ${ALTURAS_VALIDAS.join(', ')} m` }),

  // brazo se valida condicionalmente según tipoPoste
  brazo: Joi.number().positive().required(),

  pintura: Joi.boolean().required(),
  cantidad: Joi.number().integer().min(1).max(10000).required()
})
  // Reglas condicionales sobre el brazo
  .when(Joi.object({ tipoPoste: Joi.valid('Cercha') }).unknown(), {
    then: Joi.object({
      brazo: Joi.number()
        .valid(...BRAZOS_CERCHA)
        .required()
        .messages({ 'any.only': `Para Cercha, brazo debe ser: ${BRAZOS_CERCHA.join(', ')}` })
    })
  })
  .when(Joi.object({ tipoPoste: Joi.valid('Brazo_Cercha') }).unknown(), {
    then: Joi.object({
      brazo: Joi.number()
        .valid(...BRAZOS_BRAZO_CERCHA)
        .required()
        .messages({ 'any.only': `Para Brazo_Cercha, brazo debe ser: ${BRAZOS_BRAZO_CERCHA.join(', ')}` })
    })
  })
  .when(Joi.object({ tipoPoste: Joi.valid('L', 'T') }).unknown(), {
    then: Joi.object({
      brazo: Joi.number()
        .positive()
        .max(20)
        .required()
        .messages({ 'number.max': 'Para L/T, el brazo máximo permitido es 20 m' })
    })
  });

const metadataSchema = Joi.object({
  cliente: Joi.string().trim().min(1).max(200).required(),
  vendedor: Joi.string().trim().min(1).max(100).required(),
  vigenciaHasta: Joi.date().iso().raw().optional(),
  observaciones: Joi.string().allow('').max(2000).optional()
});

// ---------------------------------------------------------------------------
// Payloads por endpoint
// ---------------------------------------------------------------------------

// POST /cotizador/calculate   -> sólo calcula, no persiste
const calculatePayload = Joi.object({
  configuracion: configuracionSchema.required()
});

// POST /cotizador   -> calcula y persiste
const createPayload = Joi.object({
  configuracion: configuracionSchema.required(),
  metadata: metadataSchema.required()
});

// GET /cotizador  query params
const listQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(20),
  cliente: Joi.string().trim().optional(),
  vendedor: Joi.string().trim().optional(),
  estado: Joi.string().valid('borrador', 'enviada', 'aprobada', 'rechazada', 'anulada').optional(),
  desde: Joi.date().iso().optional(),
  hasta: Joi.date().iso().optional()
});

// GET /cotizador/{id}
const idParams = Joi.object({
  id: Joi.string().hex().length(24).required().messages({ 'string.length': 'id debe ser un ObjectId válido (24 hex)' })
});

module.exports = {
  configuracionSchema,
  metadataSchema,
  calculatePayload,
  createPayload,
  listQuery,
  idParams
};
