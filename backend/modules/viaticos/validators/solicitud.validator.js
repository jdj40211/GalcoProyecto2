'use strict';

const Joi = require('joi');

const categories = ['alimentacion', 'transporte', 'hospedaje', 'combustible', 'peajes', 'parqueadero', 'otros'];
const date = Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/);
const expense = Joi.object({
  id: Joi.string().max(80).required(),
  categoria: Joi.string()
    .valid(...categories)
    .required(),
  descripcion: Joi.string().trim().min(3).max(240).required(),
  valor: Joi.number().positive().max(1000000000).required()
});

const payload = Joi.object({
  destino: Joi.string().trim().min(2).max(160).required(),
  fechaInicio: date.required(),
  fechaFin: date.required(),
  motivo: Joi.string().trim().min(5).max(1000).required(),
  centroCosto: Joi.string().trim().min(2).max(80).required(),
  moneda: Joi.string().valid('COP').default('COP'),
  gastos: Joi.array().items(expense).min(1).max(50).required()
})
  .custom((value, helpers) => {
    if (value.fechaFin < value.fechaInicio) return helpers.error('date.order');
    return value;
  })
  .messages({ 'date.order': 'La fecha final no puede ser anterior a la fecha inicial.' });

module.exports = {
  create: payload,
  update: payload,
  id: Joi.object({ id: Joi.string().required() }),
  reject: Joi.object({ motivo: Joi.string().trim().min(3).max(1000).required() }),
  query: Joi.object({
    estado: Joi.string().valid('todos', 'borrador', 'enviada', 'aprobada', 'rechazada').default('todos'),
    desde: date.allow('').default(''),
    hasta: date.allow('').default('')
  })
};
