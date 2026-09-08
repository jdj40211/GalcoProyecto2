'use strict';

const service = require('../services/viaticos.service');
const ocr = require('../services/ocr.service');

const credentials = (request) => request.auth.credentials;

module.exports = {
  list: (request) => service.list(request.query, credentials(request)),
  get: (request) => service.get(request.params.id, credentials(request)),
  create: (request) => service.create(request.payload, credentials(request)),
  update: (request) => service.update(request.params.id, request.payload, credentials(request)),
  remove: (request) => service.remove(request.params.id, credentials(request)),
  approve: (request) => service.approve(request.params.id, credentials(request)),
  reject: (request) => service.reject(request.params.id, request.payload.motivo, credentials(request)),
  exportTxt: (request) => service.export(request.payload.ids, request.payload.markExported, credentials(request)),
  extract: (request) => ocr.extract(request.payload)
};
