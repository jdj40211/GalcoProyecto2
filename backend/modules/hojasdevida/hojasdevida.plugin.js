'use strict';

const service = require('./services/candidatos.service');
const schemas = require('./validators/candidato.validator');

// Las hojas de vida son datos personales: solo Recursos Humanos y administración las consultan (HU-13 CA6).
const auth = { strategy: 'firebase', scope: ['rrhh', 'admin'] };

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
            // Devuelve el mensaje de validación en lugar del genérico de Hapi, como el cotizador.
            failAction: (_request, _h, error) => {
              throw error;
            }
          },
          handler: async (request, h) =>
            h.response(await service.create(request.payload, request.auth.credentials)).code(201)
        }
      }
    ])
};
