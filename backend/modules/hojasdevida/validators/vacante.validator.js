'use strict';

const Joi = require('joi');

// Escala de formación, de menor a mayor: HU-30 compara el nivel del candidato con el mínimo de la vacante.
const FORMATION_LEVELS = [
  'Bachiller',
  'Técnico',
  'Tecnólogo',
  'Profesional',
  'Especialización',
  'Maestría',
  'Doctorado'
];
const CRITERIA = ['formacion', 'experiencia', 'certificaciones', 'habilidades'];

const shortList = Joi.array().items(Joi.string().trim().min(1).max(80)).max(30).default([]);
const weight = Joi.number().integer().min(0).max(100).required();

// Los pesos suman 100 y, por tanto, hay al menos un criterio de evaluación (CA1, CA2).
const totalWeights = (value, helpers) => {
  const sum = CRITERIA.reduce((total, criterion) => total + value[criterion], 0);
  if (sum === 100) return value;
  const difference = Math.abs(100 - sum);
  return helpers.message(
    `Los pesos de los criterios suman ${sum}: ${sum < 100 ? 'faltan' : 'sobran'} ${difference} puntos para llegar a 100.`
  );
};

const vacancy = Joi.object({
  cargo: Joi.string().trim().min(2).max(120).required(),
  area: Joi.string().trim().allow('').max(120).default(''),
  ciudad: Joi.string().trim().allow('').max(120).default(''),
  formacionMinima: Joi.string()
    .valid(...FORMATION_LEVELS)
    .required(),
  experienciaMinima: Joi.number().min(0).max(40).required(),
  certificacionesObligatorias: shortList,
  certificacionesDeseables: shortList,
  habilidades: shortList,
  pesos: Joi.object(Object.fromEntries(CRITERIA.map((criterion) => [criterion, weight])))
    .custom(totalWeights)
    .required()
});

module.exports = { FORMATION_LEVELS, CRITERIA, vacancy };
