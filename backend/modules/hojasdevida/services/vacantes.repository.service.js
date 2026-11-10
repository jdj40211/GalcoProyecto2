'use strict';

const crypto = require('node:crypto');
const mongoose = require('mongoose');
const config = require('../../../config');
const Vacante = require('../models/vacante.model');

const memory = [];
const clone = (value) => JSON.parse(JSON.stringify(value));

module.exports = {
  async list() {
    if (config.persistence.mode === 'mongo')
      return (await Vacante.find().sort({ createdAt: -1 }).limit(200)).map((item) => item.toJSON());
    return clone([...memory].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async get(id) {
    if (config.persistence.mode === 'mongo')
      return mongoose.isValidObjectId(id) ? ((await Vacante.findById(id))?.toJSON() ?? null) : null;
    return clone(memory.find((item) => item.id === id) || null);
  },
  async create(data) {
    if (config.persistence.mode === 'mongo') return (await new Vacante(data).save()).toJSON();
    const timestamp = new Date().toISOString();
    const item = { id: crypto.randomUUID(), ...clone(data), createdAt: timestamp, updatedAt: timestamp };
    memory.push(item);
    return clone(item);
  },
  // Aplica el cambio solo si nadie modificó la vacante desde que se leyó (misma versión); si no, null.
  async update(id, expectedVersion, changes, entry) {
    if (config.persistence.mode === 'mongo') {
      if (!mongoose.isValidObjectId(id)) return null;
      const updated = await Vacante.findOneAndUpdate(
        { _id: id, version: expectedVersion },
        { $set: changes, $push: { historial: entry } },
        { new: true, runValidators: true }
      );
      return updated?.toJSON() ?? null;
    }
    const item = memory.find((entry_) => entry_.id === id && entry_.version === expectedVersion);
    if (!item) return null;
    Object.assign(item, clone(changes), { updatedAt: new Date().toISOString() });
    item.historial = [...item.historial, clone(entry)];
    return clone(item);
  },
  resetMemory() {
    memory.splice(0);
  }
};
