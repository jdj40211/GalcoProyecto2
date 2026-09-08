'use strict';

const controller = require('../controllers/solicitudes.controller');
const schemas = require('../validators/solicitud.validator');
const validate = (schema, target = 'payload') => ({
  validate: { [target]: schema, options: { abortEarly: false, stripUnknown: true } }
});

module.exports = [
  {
    method: 'GET',
    path: '/solicitudes-viaticos',
    options: { ...validate(schemas.query, 'query'), handler: controller.list }
  },
  {
    method: 'GET',
    path: '/solicitudes-viaticos/{id}',
    options: { ...validate(schemas.id, 'params'), handler: controller.get }
  },
  {
    method: 'POST',
    path: '/solicitudes-viaticos',
    options: { ...validate(schemas.create), handler: controller.create }
  },
  {
    method: 'PUT',
    path: '/solicitudes-viaticos/{id}',
    options: {
      validate: { params: schemas.id, payload: schemas.update, options: { abortEarly: false, stripUnknown: true } },
      handler: controller.update
    }
  },
  {
    method: 'DELETE',
    path: '/solicitudes-viaticos/{id}',
    options: { ...validate(schemas.id, 'params'), handler: controller.remove }
  },
  {
    method: 'POST',
    path: '/solicitudes-viaticos/{id}/enviar',
    options: { ...validate(schemas.id, 'params'), handler: controller.send }
  },
  {
    method: 'POST',
    path: '/solicitudes-viaticos/{id}/aprobar',
    options: { ...validate(schemas.id, 'params'), handler: controller.approve }
  },
  {
    method: 'POST',
    path: '/solicitudes-viaticos/{id}/rechazar',
    options: {
      validate: { params: schemas.id, payload: schemas.reject, options: { abortEarly: false, stripUnknown: true } },
      handler: controller.reject
    }
  }
];
