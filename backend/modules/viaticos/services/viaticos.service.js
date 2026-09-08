'use strict';

const Boom = require('@hapi/boom');
const repository = require('./repository.service');
const txt = require('./txt.service');

const isAccounting = (credentials) => credentials.scope?.includes('contabilidad');
const isOwner = (record, credentials) =>
  record.usuarioLogin === credentials.usuario || record.usuario === credentials.name;

async function requireAccessible(id, credentials) {
  const record = await repository.get(id);
  if (!record) throw Boom.notFound('Viático no encontrado.');
  if (!isAccounting(credentials) && !isOwner(record, credentials))
    throw Boom.forbidden('No tienes permiso para consultar este viático.');
  return record;
}

module.exports = {
  async list(filters, credentials) {
    const scoped = { ...filters };
    if (!isAccounting(credentials)) scoped.usuarioLogin = credentials.usuario;
    const items = await repository.list(scoped);
    return { items, total: items.length };
  },
  get: requireAccessible,
  async create(payload, credentials) {
    if (isAccounting(credentials)) throw Boom.forbidden('Contabilidad no registra viáticos comerciales.');
    return repository.create({
      ...payload,
      usuario: credentials.name,
      usuarioLogin: credentials.usuario,
      estado: 'pendiente_revision'
    });
  },
  async update(id, payload, credentials) {
    const record = await requireAccessible(id, credentials);
    if (!isAccounting(credentials) && !['pendiente_revision', 'incompleto', 'rechazado'].includes(record.estado))
      throw Boom.conflict('El viático ya no se puede editar.');
    const safePayload = { ...payload };
    if (!isAccounting(credentials)) {
      delete safePayload.usuario;
      delete safePayload.usuarioLogin;
      delete safePayload.estado;
    }
    return repository.update(id, safePayload);
  },
  async remove(id, credentials) {
    const record = await requireAccessible(id, credentials);
    if (!isAccounting(credentials) && !isOwner(record, credentials)) throw Boom.forbidden();
    await repository.remove(id);
    return { ok: true };
  },
  async approve(id, credentials) {
    if (!isAccounting(credentials)) throw Boom.forbidden('Solo contabilidad puede aprobar viáticos.');
    await requireAccessible(id, credentials);
    return repository.update(id, {
      estado: 'aprobado',
      aprobadoPor: credentials.name,
      aprobadoEn: new Date().toISOString(),
      rechazadoPor: null,
      rechazadoEn: null,
      motivoRechazo: null
    });
  },
  async reject(id, motivo, credentials) {
    if (!isAccounting(credentials)) throw Boom.forbidden('Solo contabilidad puede rechazar viáticos.');
    await requireAccessible(id, credentials);
    return repository.update(id, {
      estado: 'rechazado',
      motivoRechazo: motivo,
      rechazadoPor: credentials.name,
      rechazadoEn: new Date().toISOString(),
      aprobadoPor: null,
      aprobadoEn: null
    });
  },
  async export(ids, markExported, credentials) {
    const records = [];
    for (const id of ids) records.push(await requireAccessible(id, credentials));
    if (markExported && !isAccounting(credentials))
      throw Boom.forbidden('Solo contabilidad puede marcar registros como exportados.');
    if (markExported) await Promise.all(records.map((record) => repository.update(record.id, { estado: 'exportado' })));
    const fileOwner =
      records.length === 1 ? records[0].usuarioLogin || records[0].usuario : credentials.usuario || credentials.name;
    return { content: txt.build(records), filename: txt.filename(fileOwner), count: records.length };
  }
};
