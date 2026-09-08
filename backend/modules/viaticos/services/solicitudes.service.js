'use strict';

const Boom = require('@hapi/boom');
const repository = require('./solicitudes.repository.service');

const isAccounting = (credentials) => credentials.scope?.includes('contabilidad');
const isOwner = (item, credentials) => item.solicitanteLogin === credentials.usuario;
const total = (gastos) => gastos.reduce((sum, item) => sum + Number(item.valor || 0), 0);

async function accessible(id, credentials) {
  const item = await repository.get(id);
  if (!item) throw Boom.notFound('Solicitud de viáticos no encontrada.');
  if (!isAccounting(credentials) && !isOwner(item, credentials))
    throw Boom.forbidden('No tienes permiso para consultar esta solicitud.');
  return item;
}

async function editable(id, credentials) {
  const item = await accessible(id, credentials);
  if (isAccounting(credentials) || !isOwner(item, credentials))
    throw Boom.forbidden('Solo el solicitante puede editar el borrador.');
  if (item.estado !== 'borrador') throw Boom.conflict('Solo se pueden modificar solicitudes en borrador.');
  return item;
}

module.exports = {
  async list(filters, credentials) {
    const scoped = { ...filters };
    if (!isAccounting(credentials)) scoped.solicitanteLogin = credentials.usuario;
    const items = await repository.list(scoped);
    return { items, total: items.length };
  },
  get: accessible,
  async create(payload, credentials) {
    if (isAccounting(credentials)) throw Boom.forbidden('Contabilidad no crea solicitudes de viáticos.');
    return repository.create({
      ...payload,
      consecutivo: await repository.nextConsecutive(),
      solicitante: credentials.name,
      solicitanteLogin: credentials.usuario,
      totalSolicitado: total(payload.gastos),
      estado: 'borrador'
    });
  },
  async update(id, payload, credentials) {
    await editable(id, credentials);
    return repository.update(id, { ...payload, totalSolicitado: total(payload.gastos) });
  },
  async remove(id, credentials) {
    await editable(id, credentials);
    await repository.remove(id);
    return { ok: true };
  },
  async send(id, credentials) {
    const item = await editable(id, credentials);
    if (!item.gastos?.length || item.totalSolicitado <= 0)
      throw Boom.badRequest('Agrega al menos un gasto estimado válido antes de enviar.');
    return repository.update(id, { estado: 'enviada', enviadoEn: new Date().toISOString() });
  },
  async approve(id, credentials) {
    if (!isAccounting(credentials)) throw Boom.forbidden('Solo contabilidad puede aprobar solicitudes.');
    const item = await accessible(id, credentials);
    if (item.estado !== 'enviada') throw Boom.conflict('Solo se pueden aprobar solicitudes enviadas.');
    return repository.update(id, {
      estado: 'aprobada',
      aprobadoPor: credentials.name,
      aprobadoEn: new Date().toISOString(),
      rechazadoPor: null,
      rechazadoEn: null,
      motivoRechazo: null
    });
  },
  async reject(id, reason, credentials) {
    if (!isAccounting(credentials)) throw Boom.forbidden('Solo contabilidad puede rechazar solicitudes.');
    const item = await accessible(id, credentials);
    if (item.estado !== 'enviada') throw Boom.conflict('Solo se pueden rechazar solicitudes enviadas.');
    return repository.update(id, {
      estado: 'rechazada',
      motivoRechazo: reason,
      rechazadoPor: credentials.name,
      rechazadoEn: new Date().toISOString(),
      aprobadoPor: null,
      aprobadoEn: null
    });
  }
};
