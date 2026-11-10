'use strict';

const Joi = require('joi');

const ID_TYPES = ['CC', 'CE', 'PA', 'PPT'];
const month = Joi.string().pattern(/^\d{4}-(0[1-9]|1[0-2])$/);
const year = new Date().getFullYear();

const education = Joi.object({
  titulo: Joi.string().trim().min(2).max(160).required(),
  institucion: Joi.string().trim().min(2).max(160).required(),
  nivel: Joi.string().trim().allow('').max(60).default(''),
  anio: Joi.number()
    .integer()
    .min(1950)
    .max(year + 6)
    .allow(null)
    .default(null)
});

const experience = Joi.object({
  cargo: Joi.string().trim().min(2).max(120).required(),
  empresa: Joi.string().trim().min(2).max(160).required(),
  desde: month.required(),
  // Vacío = trabajo actual.
  hasta: month.allow('').default('')
}).custom((value, helpers) =>
  value.hasta && value.hasta < value.desde
    ? helpers.message('La fecha final no puede ser anterior a la inicial.')
    : value
);

const certification = Joi.object({
  nombre: Joi.string().trim().min(2).max(160).required(),
  entidad: Joi.string().trim().allow('').max(160).default(''),
  // Patrón y no isoDate(): isoDate convierte "2027-03-01" en "2027-03-01T00:00:00.000Z".
  vencimiento: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/)
    .allow('')
    .default('')
});

const create = Joi.object({
  tipoIdentificacion: Joi.string()
    .valid(...ID_TYPES)
    .default('CC'),
  identificacion: Joi.string()
    .trim()
    .pattern(/^[A-Za-z0-9.\- ]{4,30}$/)
    .required()
    .messages({ 'string.pattern.base': 'La identificación solo admite letras, números, puntos y guiones.' }),
  nombre: Joi.string().trim().min(3).max(120).required(),
  correo: Joi.string().trim().lowercase().email().max(254).allow('').default(''),
  telefono: Joi.string()
    .trim()
    .pattern(/^\+?[0-9 ()-]{7,20}$/)
    .allow('')
    .default('')
    .messages({ 'string.pattern.base': 'El teléfono solo admite números, espacios, paréntesis, guiones y +.' }),
  ciudad: Joi.string().trim().allow('').max(120).default(''),
  cargoInteres: Joi.string().trim().min(2).max(120).required(),
  fuente: Joi.string().trim().allow('').max(80).default(''),
  formacion: Joi.array().items(education).max(20).default([]),
  experiencia: Joi.array().items(experience).max(30).default([]),
  certificaciones: Joi.array().items(certification).max(30).default([]),
  autorizacionDatos: Joi.boolean().required()
}).custom((value, helpers) =>
  value.correo || value.telefono ? value : helpers.message('Indica al menos un correo o un teléfono de contacto.')
);

// El formato y el tamaño reales se comprueban sobre los bytes en documentos.service.js.
const document = Joi.object({
  nombre: Joi.string().trim().min(1).max(255).required(),
  tipo: Joi.string().max(120).required(),
  tipoDocumento: Joi.string().valid('hoja_de_vida', 'soporte').default('hoja_de_vida'),
  fileDataUrl: Joi.string()
    .allow('')
    .max(15 * 1024 * 1024)
    .required()
});

module.exports = { ID_TYPES, create, document };
