'use strict';
const Joi = require('joi');
const service = require('./usuarios.service');
const admin = { strategy: 'firebase', scope: ['admin'] };
module.exports = [
  {
    method: 'POST',
    path: '/api/sesion',
    options: {
      auth: false,
      validate: {
        payload: Joi.object({ usuario: Joi.string().max(254).required(), password: Joi.string().max(128).required() })
      }
    },
    handler: (request) => service.login(request.payload.usuario, request.payload.password, request.info.remoteAddress)
  },
  {
    method: 'DELETE',
    path: '/api/sesion',
    handler: (request) => {
      service.logout(request.headers.authorization?.slice(7));
      return { ok: true };
    }
  },
  {
    method: 'GET',
    path: '/api/usuarios',
    options: { auth: admin },
    handler: () => service.list()
  },
  {
    method: 'POST',
    path: '/api/usuarios',
    options: {
      auth: admin,
      validate: {
        payload: Joi.object({
          nombre: Joi.string().trim().min(2).max(120).required(),
          email: Joi.string().email().lowercase().required(),
          password: Joi.string().min(12).max(128).required(),
          rol: Joi.string().valid('comercial', 'contabilidad', 'admin').required()
        })
      }
    },
    handler: async (request, h) => h.response(await service.create(request.payload)).code(201)
  },
  {
    method: 'PATCH',
    path: '/api/usuarios/{id}/activo',
    options: { auth: admin, validate: { payload: Joi.object({ activo: Joi.boolean().required() }) } },
    handler: (request) => service.setActive(request.params.id, request.payload.activo, request.auth.credentials.uid)
  }
];
