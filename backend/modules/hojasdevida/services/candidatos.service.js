'use strict';

const Boom = require('@hapi/boom');
const repository = require('./candidatos.repository.service');
const { publicDocument } = require('./documentos.service');
const { yearsOfExperience } = require('./analisis.service');

// "1.017.234.567", "1017234567" y "1017 234 567" son la misma identificación.
const normalizeId = (value) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
// El identificador interno del archivo no sale del servidor.
const publicCandidate = (candidate) => ({ ...candidate, documentos: (candidate.documentos || []).map(publicDocument) });

module.exports = {
  async list() {
    const items = (await repository.list()).map(publicCandidate);
    return { items, total: items.length };
  },
  async get(id) {
    const candidate = await repository.get(id);
    if (!candidate) throw Boom.notFound('Candidato no encontrado.');
    return publicCandidate(candidate);
  },
  async create(payload, credentials) {
    const now = new Date().toISOString();
    const created = await repository.create({
      ...payload,
      documentos: [],
      habilidades: [],
      idiomas: [],
      analisis: [],
      anosExperiencia: yearsOfExperience(payload.experiencia),
      identificacion: normalizeId(payload.identificacion),
      // La autorización (Ley 1581 de 2012) se registra con fecha y responsable; sin ella no se usa la IA (HU-28).
      autorizacionDatos: payload.autorizacionDatos
        ? { otorgada: true, fecha: now, registradaPor: credentials.usuario }
        : { otorgada: false, fecha: null, registradaPor: null },
      estado: 'registrado',
      registradoPor: { uid: credentials.uid, usuario: credentials.usuario, nombre: credentials.name }
    });
    return publicCandidate(created);
  },
  normalizeId
};
