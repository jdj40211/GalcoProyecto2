'use strict';

const Boom = require('@hapi/boom');
const svc = require('../services/materiales.service');

// GET /cotizador/materiales
async function getMateriales(_request, h) {
  try {
    const data = await svc.listarMateriales();
    return h.response({ ok: true, data }).code(200);
  } catch (err) {
    throw Boom.badImplementation('Error listando materiales', err);
  }
}

// GET /cotizador/materiales/{codigo}
async function getMaterial(request, h) {
  try {
    const { codigo } = request.params;
    const [item, historial] = await Promise.all([svc.obtenerMaterial(codigo), svc.listarHistorialMaterial(codigo)]);
    if (!item) throw Boom.notFound(`Material '${codigo}' no encontrado`);
    return h.response({ ok: true, data: item, historial }).code(200);
  } catch (err) {
    if (err.isBoom) throw err;
    throw Boom.badImplementation('Error obteniendo material', err);
  }
}

// PATCH /cotizador/materiales/{codigo}/precio
async function patchPrecio(request, h) {
  try {
    const { codigo } = request.params;
    const { precioUnitario } = request.payload;
    const userId = request.auth?.credentials?.uid || 'admin';
    const doc = await svc.actualizarPrecio(codigo, precioUnitario, userId);
    return h.response({ ok: true, data: doc }).code(200);
  } catch (err) {
    if (err.isBoom) throw err;
    if (err.message?.startsWith('Material no encontrado')) throw Boom.notFound(err.message);
    throw Boom.badImplementation('Error actualizando precio', err);
  }
}

module.exports = { getMateriales, getMaterial, patchPrecio };
