'use strict';

const Joi = require('joi');
const states = [
  'pendiente_revision',
  'incompleto',
  'aprobado',
  'rechazado',
  'exportado',
  'pendiente',
  'confirmado',
  'procesado',
  'error'
];
const types = ['alimentacion', 'transporte', 'hospedaje', 'combustible', 'peajes', 'parqueadero', 'papeleria', 'otros'];

const record = Joi.object({
  usuario: Joi.string().max(120).required(),
  usuarioLogin: Joi.string().max(120).required(),
  fecha: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  valor: Joi.number().positive().required(),
  nit: Joi.string().allow('').max(80),
  proveedor: Joi.string().allow('').max(180),
  numeroDocumento: Joi.string().allow('').max(100),
  subtotal: Joi.number().min(0).allow('').optional(),
  impuestos: Joi.number().min(0).allow('').optional(),
  moneda: Joi.string().allow('').max(10).default('COP'),
  ciudad: Joi.string().allow('').max(120),
  metodoPago: Joi.string().allow('').max(120),
  tipoGasto: Joi.string()
    .valid(...types)
    .required(),
  concepto: Joi.string().max(500).required(),
  observaciones: Joi.string().allow('').max(2000),
  nivelConfianza: Joi.string().allow('').valid('', 'alta', 'media', 'baja'),
  confianzaCampos: Joi.object()
    .pattern(Joi.string(), Joi.string().valid('alta', 'media', 'baja'))
    .default({}),
  datosExtraidos: Joi.object().unknown(true).default({}),
  correcciones: Joi.array()
    .items(
      Joi.object({
        campo: Joi.string().max(80).required(),
        valorExtraido: Joi.any().allow(null),
        valorCorregido: Joi.any().allow(null),
        corregidoPor: Joi.string().max(120).required(),
        corregidoEn: Joi.string().isoDate().required()
      })
    )
    .max(40)
    .default([]),
  estado: Joi.string()
    .valid(...states)
    .default('pendiente_revision'),
  fileName: Joi.string().allow('').max(255),
  fileType: Joi.string().allow('').max(100),
  fileDataUrl: Joi.string()
    .allow('')
    .max(15 * 1024 * 1024)
});

module.exports = {
  create: record,
  update: record
    .fork(['usuario', 'usuarioLogin', 'fecha', 'valor', 'tipoGasto', 'concepto'], (schema) => schema.optional())
    .min(1),
  reject: Joi.object({ motivo: Joi.string().trim().min(3).max(1000).required() }),
  export: Joi.object({
    ids: Joi.array().items(Joi.string()).min(1).required(),
    markExported: Joi.boolean().default(false)
  }),
  ocr: Joi.object({
    fileName: Joi.string().max(255).required(),
    fileType: Joi.string().valid('image/jpeg', 'image/png', 'application/pdf').required(),
    fileDataUrl: Joi.string()
      .max(15 * 1024 * 1024)
      .required()
  }),
  query: Joi.object({
    estado: Joi.string().default('todos'),
    usuario: Joi.string().default('todos'),
    tipoGasto: Joi.string().default('todos'),
    desde: Joi.string().allow('').default(''),
    hasta: Joi.string().allow('').default('')
  })
};
