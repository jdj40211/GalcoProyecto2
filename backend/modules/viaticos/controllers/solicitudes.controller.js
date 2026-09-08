'use strict';

const service = require('../services/solicitudes.service');
const credentials = (request) => request.auth.credentials;

module.exports = {
  list: (request) => service.list(request.query, credentials(request)),
  get: (request) => service.get(request.params.id, credentials(request)),
  create: (request, h) =>
    service.create(request.payload, credentials(request)).then((item) => h.response(item).code(201)),
  update: (request) => service.update(request.params.id, request.payload, credentials(request)),
  remove: (request) => service.remove(request.params.id, credentials(request)),
  send: (request) => service.send(request.params.id, credentials(request)),
  approve: (request) => service.approve(request.params.id, credentials(request)),
  reject: (request) => service.reject(request.params.id, request.payload.motivo, credentials(request))
};
