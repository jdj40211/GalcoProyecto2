'use strict';

const service = require('./services/candidatos.service');
const documents = require('./services/documentos.service');
const schemas = require('./validators/candidato.validator');

// Las hojas de vida son datos personales: solo Recursos Humanos y administración las consultan (HU-13 CA6).
const auth = { strategy: 'firebase', scope: ['rrhh', 'admin'] };
// Devuelve el mensaje de validación en lugar del genérico de Hapi, como el cotizador.
const failAction = (_request, _h, error) => {
  throw error;
};

module.exports = {
  name: 'hojasdevida-module',
  version: '1.0.0',
  register: async (server) =>
    server.route([
      {
        method: 'GET',
        path: '/candidatos',
        options: { auth, handler: () => service.list() }
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
    ])
};
