'use strict';

const crypto = require('node:crypto');
const config = require('../../../config');
const Viatico = require('../models/viatico.model');
const memory = [];

const clone = (value) => JSON.parse(JSON.stringify(value));
const now = () => new Date().toISOString();

function matches(record, filters) {
  if (filters.estado && filters.estado !== 'todos' && record.estado !== filters.estado) return false;
  if (filters.usuario && filters.usuario !== 'todos' && record.usuario !== filters.usuario) return false;
  if (filters.tipoGasto && filters.tipoGasto !== 'todos' && record.tipoGasto !== filters.tipoGasto) return false;
  if (filters.desde && record.fecha < filters.desde) return false;
  if (filters.hasta && record.fecha > filters.hasta) return false;
  if (filters.usuarioLogin && record.usuarioLogin !== filters.usuarioLogin) return false;
  return true;
}

module.exports = {
  async list(filters = {}) {
    if (config.persistence.mode === 'mongo') {
      const query = {};
      if (filters.estado && filters.estado !== 'todos') query.estado = filters.estado;
      if (filters.usuario && filters.usuario !== 'todos') query.usuario = filters.usuario;
      if (filters.tipoGasto && filters.tipoGasto !== 'todos') query.tipoGasto = filters.tipoGasto;
      if (filters.usuarioLogin) query.usuarioLogin = filters.usuarioLogin;
      if (filters.desde || filters.hasta)
        query.fecha = {
          ...(filters.desde ? { $gte: filters.desde } : {}),
          ...(filters.hasta ? { $lte: filters.hasta } : {})
        };
      return Viatico.find(query)
        .sort({ createdAt: -1 })
        .lean({ virtuals: true })
        .then((items) => items.map((item) => ({ ...item, id: String(item._id), _id: undefined })));
    }
    return clone(
      memory.filter((item) => matches(item, filters)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    );
  },
  async get(id) {
    if (config.persistence.mode === 'mongo') return Viatico.findById(id).then((item) => item?.toJSON() || null);
    return clone(memory.find((item) => item.id === id) || null);
  },
  async create(data) {
    if (config.persistence.mode === 'mongo') return new Viatico(data).save().then((item) => item.toJSON());
    const timestamp = now();
    const item = { id: crypto.randomUUID(), ...clone(data), createdAt: timestamp, updatedAt: timestamp };
    memory.push(item);
    return clone(item);
  },
  async update(id, changes) {
    if (config.persistence.mode === 'mongo')
      return Viatico.findByIdAndUpdate(id, changes, { new: true, runValidators: true }).then(
        (item) => item?.toJSON() || null
      );
    const index = memory.findIndex((item) => item.id === id);
    if (index < 0) return null;
    memory[index] = { ...memory[index], ...clone(changes), updatedAt: now() };
    return clone(memory[index]);
  },
  async remove(id) {
    if (config.persistence.mode === 'mongo') return Boolean(await Viatico.findByIdAndDelete(id));
    const index = memory.findIndex((item) => item.id === id);
    if (index < 0) return false;
    memory.splice(index, 1);
    return true;
  },
  resetMemory() {
    memory.splice(0);
  }
};
