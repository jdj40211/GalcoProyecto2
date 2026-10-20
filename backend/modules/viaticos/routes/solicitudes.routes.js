'use strict';

const controller = require('../controllers/solicitudes.controller');
const schemas = require('../validators/solicitud.validator');
const validate = (schema, target = 'payload') => ({
  validate: { [target]: schema, options: { abortEarly: false, stripUnknown: true } }
});

module.exports = [
  {
    method: 'POST',
    path: '/solicitudes-viaticos/{id}/legalizar',
    options: {
      validate: { params: schemas.id, payload: schemas.legalize },
      handler: controller.legalize
    }
  },
  {
    method: 'GET',
    path: '/notificaciones',
    handler: (request) => require('../services/notificaciones.service').list(request.auth.credentials.usuario)
  },
  {
    method: 'PATCH',
    path: '/notificaciones/{id}/leer',
    handler: (request) =>
      require('../services/notificaciones.service').read(request.params.id, request.auth.credentials.usuario)
  },
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
