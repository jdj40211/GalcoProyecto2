'use strict';

const repository = require('./candidatos.repository.service');

// "1.017.234.567", "1017234567" y "1017 234 567" son la misma identificación.
const normalizeId = (value) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

module.exports = {
  async list() {
    const items = await repository.list();
    return { items, total: items.length };
  },
  async create(payload, credentials) {
    const now = new Date().toISOString();
    return repository.create({
      ...payload,
      identificacion: normalizeId(payload.identificacion),
      // La autorización (Ley 1581 de 2012) se registra con fecha y responsable; sin ella no se usa la IA (HU-28).
      autorizacionDatos: payload.autorizacionDatos
        ? { otorgada: true, fecha: now, registradaPor: credentials.usuario }
        : { otorgada: false, fecha: null, registradaPor: null },
      estado: 'registrado',
      registradoPor: { uid: credentials.uid, usuario: credentials.usuario, nombre: credentials.name }
    });
  },
  normalizeId
};
