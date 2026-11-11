'use strict';

const service = require('./services/candidatos.service');
const documents = require('./services/documentos.service');
const analyses = require('./services/analisis.service');
const Joi = require('joi');
const vacancies = require('./services/vacantes.service');
const evaluations = require('./services/evaluaciones.service');
const schemas = require('./validators/candidato.validator');
const candidatesRepository = require('./services/candidatos.repository.service');
const config = require('../../config');
const vacancySchemas = require('./validators/vacante.validator');

// Las hojas de vida son datos personales: solo Recursos Humanos y administración las consultan (HU-13 CA6).
const auth = { strategy: 'firebase', scope: ['rrhh', 'admin'] };
// Devuelve el mensaje de validación en lugar del genérico de Hapi, como el cotizador.
const failAction = (_request, _h, error) => {
  throw error;
};

module.exports = {
  name: 'hojasdevida-module',
  version: '1.0.0',
  register: async (server) => {
    server.route([
      // HU-29: vacantes con sus criterios de evaluación.
      { method: 'GET', path: '/vacantes', options: { auth, handler: () => vacancies.list() } },
      {
        method: 'GET',
        path: '/vacantes/{id}',
        options: { auth, handler: (request) => vacancies.get(request.params.id) }
      },
      {
        method: 'POST',
        path: '/vacantes',
        options: {
          auth,
          validate: { payload: vacancySchemas.vacancy, options: { abortEarly: false, stripUnknown: true }, failAction },
          handler: async (request, h) =>
            h.response(await vacancies.create(request.payload, request.auth.credentials)).code(201)
        }
      },
      {
        method: 'PUT',
        path: '/vacantes/{id}',
        options: {
          auth,
          validate: { payload: vacancySchemas.vacancy, options: { abortEarly: false, stripUnknown: true }, failAction },
          handler: (request) => vacancies.update(request.params.id, request.payload, request.auth.credentials)
        }
      },
      {
        method: 'POST',
        path: '/vacantes/{id}/cerrar',
        options: { auth, handler: (request) => vacancies.close(request.params.id, request.auth.credentials) }
      },
      // HU-30: evaluación del candidato frente a la vacante y ranking.
      {
        method: 'POST',
        path: '/vacantes/{id}/evaluaciones',
        options: {
          auth,
          validate: { payload: Joi.object({ candidatoId: Joi.string().max(80).required() }), failAction },
          handler: async (request, h) =>
            h
              .response(await evaluations.evaluate(request.params.id, request.payload, request.auth.credentials))
              .code(201)
        }
      },
      {
        method: 'GET',
        path: '/vacantes/{id}/ranking',
        options: {
          auth,
          validate: { query: Joi.object({ soloCumplen: Joi.boolean().default(false) }), failAction },
          handler: (request) => evaluations.ranking(request.params.id, request.query)
        }
      },
      // HU-34: registrar desde la hoja de vida y descartar candidatos pendientes.
      {
        method: 'POST',
        path: '/candidatos/desde-hoja-de-vida',
        options: {
          auth,
          validate: { payload: schemas.fromResume, options: { stripUnknown: true }, failAction },
          handler: async (request, h) =>
            h.response(await service.registerFromResume(request.payload, request.auth.credentials)).code(201)
        }
      },
      {
        method: 'DELETE',
        path: '/candidatos/{id}',
        options: { auth, handler: (request) => service.removePending(request.params.id) }
      },
      {
        method: 'GET',
        path: '/candidatos',
        options: { auth, handler: () => service.list() }
      },
      {
        method: 'GET',
        path: '/candidatos/{id}',
        options: { auth, handler: (request) => service.get(request.params.id) }
      },
      {
        method: 'POST',
        path: '/candidatos/{id}/analisis',
        options: {
          auth,
          validate: { payload: schemas.analyze, failAction },
          handler: async (request, h) =>
            h.response(await analyses.analyze(request.params.id, request.payload, request.auth.credentials)).code(201)
        }
      },
      {
        method: 'POST',
        path: '/candidatos/{id}/analisis/{analisisId}/confirmar',
        options: {
          auth,
          validate: { payload: schemas.confirm, options: { abortEarly: false, stripUnknown: true }, failAction },
          handler: (request) =>
            service.confirmAnalysis(
              request.params.id,
              request.params.analisisId,
              request.payload,
              request.auth.credentials
            )
        }
      },
      {
        method: 'POST',
        path: '/candidatos',
        options: {
          auth,
          validate: {
            payload: schemas.create,
            options: { abortEarly: false, stripUnknown: true },
            failAction
          },
          handler: async (request, h) =>
            h.response(await service.create(request.payload, request.auth.credentials)).code(201)
        }
      },
      {
        method: 'POST',
        path: '/candidatos/{id}/documentos',
        options: {
          auth,
          validate: { payload: schemas.document, options: { stripUnknown: true }, failAction },
          handler: async (request, h) =>
            h.response(await documents.upload(request.params.id, request.payload, request.auth.credentials)).code(201)
        }
      },
      {
        method: 'GET',
        path: '/candidatos/{id}/documentos/{documentoId}',
        options: {
          auth,
          handler: async (request, h) => {
            const file = await documents.download(request.params.id, request.params.documentoId);
            // nosniff evita que el navegador interprete el archivo como otro tipo de contenido.
            return h
              .response(file.bytes)
              .type(file.tipo)
              .header('Content-Disposition', file.disposition)
              .header('X-Content-Type-Options', 'nosniff');
          }
        }
      }
    ]);
    // HU-34: quita el índice de identificación obligatoria de HU-13 en bases que ya lo tienen.
    if (config.persistence.mode === 'mongo') {
      try {
        const dropped = await candidatesRepository.migrate();
        if (dropped.length) server.log(['hojasdevida'], `Índices reemplazados: ${dropped.join(', ')}`);
      } catch (error) {
        console.error(`[hojasdevida] No se pudo migrar el índice de identificación: ${error.message}`);
      }
    }
  }
};
