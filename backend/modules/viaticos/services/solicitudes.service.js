'use strict';

const Boom = require('@hapi/boom');
const repository = require('./solicitudes.repository.service');
const notifications = require('./notificaciones.service');
const receipts = require('./repository.service');

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
    const updated = await repository.transition(id, 'borrador', {
      estado: 'enviada',
      enviadoEn: new Date().toISOString()
    });
    if (!updated) throw Boom.conflict('La solicitud cambió. Actualiza la página.');
    await notifications.create(updated, 'enviada');
    return updated;
  },
  async approve(id, credentials) {
    if (!isAccounting(credentials)) throw Boom.forbidden('Solo contabilidad puede aprobar solicitudes.');
    const item = await accessible(id, credentials);
    if (item.estado !== 'enviada') throw Boom.conflict('Solo se pueden aprobar solicitudes enviadas.');
    const updated = await repository.transition(id, 'enviada', {
      estado: 'aprobada',
      aprobadoPor: credentials.name,
      aprobadoEn: new Date().toISOString(),
      rechazadoPor: null,
      rechazadoEn: null,
      motivoRechazo: null
    });
    if (!updated) throw Boom.conflict('La solicitud cambió. Actualiza la página.');
    await notifications.create(updated, 'aprobada');
    return updated;
  },
  async reject(id, reason, credentials) {
    if (!isAccounting(credentials)) throw Boom.forbidden('Solo contabilidad puede rechazar solicitudes.');
    const item = await accessible(id, credentials);
    if (item.estado !== 'enviada') throw Boom.conflict('Solo se pueden rechazar solicitudes enviadas.');
    const updated = await repository.transition(id, 'enviada', {
      estado: 'rechazada',
      motivoRechazo: reason,
      rechazadoPor: credentials.name,
      rechazadoEn: new Date().toISOString(),
      aprobadoPor: null,
      aprobadoEn: null
    });
    if (!updated) throw Boom.conflict('La solicitud cambió. Actualiza la página.');
    await notifications.create(updated, 'rechazada');
    return updated;
  },
  async legalize(id, payload, credentials) {
    const item = await accessible(id, credentials);
    if (!isOwner(item, credentials) || isAccounting(credentials))
      throw Boom.forbidden('Solo el solicitante puede legalizar su viaje.');
    if (item.estado !== 'aprobada') throw Boom.conflict('La solicitud debe estar aprobada.');
    const soportes = [];
    for (const receiptId of payload.soportes) {
      const receipt = await receipts.get(receiptId);
      if (!receipt || receipt.usuarioLogin !== credentials.usuario || receipt.solicitudId !== id)
        throw Boom.badRequest('Todos los soportes deben pertenecer a esta solicitud y al solicitante.');
      if (receipt.moneda !== 'COP' || !Number.isFinite(receipt.valor) || receipt.valor <= 0)
        throw Boom.badRequest('Los soportes deben tener valores positivos en COP.');
      if (receipt.estado !== 'aprobado')
        throw Boom.conflict('Contabilidad debe aprobar todos los soportes antes de legalizar.');
      soportes.push({ id: receipt.id, valor: receipt.valor, concepto: receipt.concepto });
    }
    const totalReal = Math.round(soportes.reduce((sum, entry) => sum + entry.valor, 0) * 100) / 100;
    const saldo = Math.round((payload.anticipo - totalReal) * 100) / 100;
    const updated = await repository.transition(id, 'aprobada', {
      estado: 'legalizada',
      legalizacion: {
        soportes,
        anticipo: payload.anticipo,
        totalReal,
        saldo,
        resultado: saldo > 0 ? 'reintegrar' : saldo < 0 ? 'reembolsar' : 'saldado',
        fecha: new Date().toISOString(),
        responsable: credentials.usuario
      }
    });
    if (!updated) throw Boom.conflict('La solicitud ya fue legalizada o cambió de estado.');
    await notifications.create(updated, 'legalizada');
    return updated;
  }
};
