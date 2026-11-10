'use strict';

// HU-29: perfil de la vacante con criterios y pesos explícitos, versionado para que las evaluaciones
// de HU-30 sepan con qué versión se calcularon.
const Boom = require('@hapi/boom');
const repository = require('./vacantes.repository.service');
const { CRITERIA } = require('../validators/vacante.validator');

const FIELDS = [
  'cargo',
  'area',
  'ciudad',
  'formacionMinima',
  'experienciaMinima',
  'certificacionesObligatorias',
  'certificacionesDeseables',
  'habilidades',
  'pesos'
];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
// Los pesos siempre en el mismo orden, para comparar versiones sin falsos cambios.
const normalize = (payload) => ({
  ...payload,
  pesos: Object.fromEntries(CRITERIA.map((criterion) => [criterion, payload.pesos[criterion]]))
});
const changed = () =>
  Boom.conflict('La vacante cambió mientras la editabas. Actualiza la página e inténtalo de nuevo.');

async function existing(id) {
  const vacancy = await repository.get(id);
  if (!vacancy) throw Boom.notFound('Vacante no encontrada.');
  return vacancy;
}

module.exports = {
  async list() {
    const items = await repository.list();
    return { items, total: items.length };
  },
  get: existing,
  async create(payload, credentials) {
    const fecha = new Date().toISOString();
    return repository.create({
      ...normalize(payload),
      estado: 'abierta',
      version: 1,
      creadoPor: credentials.usuario,
      historial: [{ accion: 'creada', version: 1, fecha, usuario: credentials.usuario, campos: [] }]
    });
  },
  async update(id, payload, credentials) {
    const current = await existing(id);
    if (current.estado === 'cerrada') throw Boom.conflict('Una vacante cerrada no se puede modificar.');
    const next = normalize(payload);
    const campos = FIELDS.filter((field) => !same(current[field], next[field]));
    if (!campos.length) return current;
    // CA4: una versión nueva por cada cambio, con fecha, usuario y los campos que cambiaron.
    const version = current.version + 1;
    const updated = await repository.update(
      id,
      current.version,
      { ...next, version },
      { accion: 'modificada', version, fecha: new Date().toISOString(), usuario: credentials.usuario, campos }
    );
    if (!updated) throw changed();
    return updated;
  },
  async close(id, credentials) {
    const current = await existing(id);
    if (current.estado === 'cerrada') throw Boom.conflict('La vacante ya está cerrada.');
    const updated = await repository.update(
      id,
      current.version,
      { estado: 'cerrada' },
      {
        accion: 'cerrada',
        version: current.version,
        fecha: new Date().toISOString(),
        usuario: credentials.usuario,
        campos: ['estado']
      }
    );
    if (!updated) throw changed();
    return updated;
  },
  // CA3: HU-30 solo evalúa contra vacantes abiertas.
  async openForEvaluation(id) {
    const vacancy = await existing(id);
    if (vacancy.estado === 'cerrada') throw Boom.conflict('La vacante está cerrada: no admite nuevas evaluaciones.');
    return vacancy;
  }
};
