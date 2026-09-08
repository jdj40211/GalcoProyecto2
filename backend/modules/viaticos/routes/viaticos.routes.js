'use strict';

const controller = require('../controllers/viaticos.controller');
const schemas = require('../validators/viatico.validator');
const validate = (schema, target = 'payload') => ({
  validate: { [target]: schema, options: { abortEarly: false, stripUnknown: true } }
});

module.exports = [
  { method: 'GET', path: '/viaticos', options: { ...validate(schemas.query, 'query'), handler: controller.list } },
  { method: 'GET', path: '/viaticos/{id}', options: { handler: controller.get } },
  { method: 'POST', path: '/viaticos', options: { ...validate(schemas.create), handler: controller.create } },
  { method: 'PUT', path: '/viaticos/{id}', options: { ...validate(schemas.update), handler: controller.update } },
  { method: 'DELETE', path: '/viaticos/{id}', options: { handler: controller.remove } },
  { method: 'POST', path: '/viaticos/{id}/approve', options: { handler: controller.approve } },
  {
    method: 'POST',
    path: '/viaticos/{id}/reject',
    options: { ...validate(schemas.reject), handler: controller.reject }
  },
  { method: 'POST', path: '/viaticos/export', options: { ...validate(schemas.export), handler: controller.exportTxt } },
  {
    method: 'POST',
    path: '/ocr/extract',
    options: { payload: { maxBytes: 16 * 1024 * 1024 }, ...validate(schemas.ocr), handler: controller.extract }
  }
];
