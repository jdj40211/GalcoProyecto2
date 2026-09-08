'use strict';

const crypto = require('node:crypto');
const config = require('../../../config');
const Solicitud = require('../models/solicitud.model');

const memory = [];
const sequences = new Map();
const clone = (value) => JSON.parse(JSON.stringify(value));

async function nextConsecutive() {
  const year = new Date().getFullYear();
  if (config.persistence.mode === 'mongo') {
    const prefix = `VIA-${year}-`;
    const latest = await Solicitud.findOne({ consecutivo: new RegExp(`^${prefix}`) })
      .sort({ consecutivo: -1 })
      .select('consecutivo')
      .lean();
    const next = latest ? Number(latest.consecutivo.slice(-4)) + 1 : 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }
  const next = (sequences.get(year) || 0) + 1;
  sequences.set(year, next);
  return `VIA-${year}-${String(next).padStart(4, '0')}`;
}

function matches(item, filters) {
  if (filters.solicitanteLogin && item.solicitanteLogin !== filters.solicitanteLogin) return false;
  if (filters.estado && filters.estado !== 'todos' && item.estado !== filters.estado) return false;
  if (filters.desde && item.fechaInicio < filters.desde) return false;
  if (filters.hasta && item.fechaInicio > filters.hasta) return false;
  return true;
}

module.exports = {
  nextConsecutive,
  async list(filters = {}) {
    if (config.persistence.mode === 'mongo') {
      const query = {};
      if (filters.solicitanteLogin) query.solicitanteLogin = filters.solicitanteLogin;
      if (filters.estado && filters.estado !== 'todos') query.estado = filters.estado;
      if (filters.desde || filters.hasta)
        query.fechaInicio = {
          ...(filters.desde ? { $gte: filters.desde } : {}),
          ...(filters.hasta ? { $lte: filters.hasta } : {})
        };
      return Solicitud.find(query)
        .sort({ createdAt: -1 })
        .lean()
        .then((items) => items.map((item) => ({ ...item, id: String(item._id), _id: undefined })));
    }
    return clone(
      memory.filter((item) => matches(item, filters)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  },
  async get(id) {
    if (config.persistence.mode === 'mongo') return Solicitud.findById(id).then((item) => item?.toJSON() || null);
    return clone(memory.find((item) => item.id === id) || null);
  },
  async create(data) {
    if (config.persistence.mode === 'mongo') return new Solicitud(data).save().then((item) => item.toJSON());
    const timestamp = new Date().toISOString();
    const item = { id: crypto.randomUUID(), ...clone(data), createdAt: timestamp, updatedAt: timestamp };
    memory.push(item);
    return clone(item);
  },
  async update(id, changes) {
    if (config.persistence.mode === 'mongo')
      return Solicitud.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).then(
        (item) => item?.toJSON() || null
      );
    const index = memory.findIndex((item) => item.id === id);
    if (index < 0) return null;
    memory[index] = { ...memory[index], ...clone(changes), updatedAt: new Date().toISOString() };
    return clone(memory[index]);
  },
  async remove(id) {
    if (config.persistence.mode === 'mongo') return Boolean(await Solicitud.findByIdAndDelete(id));
    const index = memory.findIndex((item) => item.id === id);
    if (index < 0) return false;
    memory.splice(index, 1);
    return true;
  },
  resetMemory() {
    memory.splice(0);
    sequences.clear();
  }
};
