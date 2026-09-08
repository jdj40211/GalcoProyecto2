/**
 * parametros.controller.js
 *
 * Handlers HTTP para los endpoints de parámetros operativos.
 * Solo rol "admin" puede modificar; "comercial" y "consulta" pueden leer.
 */

'use strict';

const Boom = require('@hapi/boom');
const svc = require('../services/parametros.service');

// GET /cotizador/parametros
async function getParametros(_request, h) {
  try {
    const params = await svc.obtenerParametrosActivos();
    return h.response({ ok: true, data: params }).code(200);
  } catch (err) {
    throw Boom.badImplementation('Error obteniendo parámetros', err);
  }
}

// GET /cotizador/parametros/historial
async function getHistorial(request, h) {
  try {
    const limit = request.query?.limit || 20;
    const lista = await svc.listarHistorial(limit);
    return h.response({ ok: true, data: lista }).code(200);
  } catch (err) {
    throw Boom.badImplementation('Error obteniendo historial de parámetros', err);
  }
}

// PUT /cotizador/parametros
async function putParametros(request, h) {
  try {
    const userId = request.auth?.credentials?.uid || 'admin';
    const nuevo = await svc.actualizarParametros(request.payload, userId);
    return h.response({ ok: true, data: nuevo }).code(200);
  } catch (err) {
    request.log(['error', 'parametros', 'update'], err);
    throw Boom.badImplementation('Error actualizando parámetros', err);
  }
}

module.exports = { getParametros, getHistorial, putParametros };
