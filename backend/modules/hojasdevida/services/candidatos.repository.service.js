'use strict';

const crypto = require('node:crypto');
const Boom = require('@hapi/boom');
const mongoose = require('mongoose');
const config = require('../../../config');
const Candidato = require('../models/candidato.model');

const memory = [];
const clone = (value) => JSON.parse(JSON.stringify(value));
const duplicate = () => Boom.conflict('Ya existe un candidato con esa identificación o ese correo.');

module.exports = {
  async list() {
    if (config.persistence.mode === 'mongo')
      return (await Candidato.find().sort({ createdAt: -1 }).limit(200)).map((item) => item.toJSON());
    return clone([...memory].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  },
  async create(data) {
    if (config.persistence.mode === 'mongo') {
      try {
        // Espera a que existan los índices únicos; sin ellos un duplicado se guardaría sin error.
        await Candidato.init();
        return (await new Candidato(data).save()).toJSON();
      } catch (error) {
        // El índice único resuelve también dos registros simultáneos de la misma persona.
        if (error.code === 11000) throw duplicate();
        throw error;
      }
    }
    if (
      memory.some((item) => item.identificacion === data.identificacion || (data.correo && item.correo === data.correo))
    )
      throw duplicate();
    const timestamp = new Date().toISOString();
    const item = { id: crypto.randomUUID(), ...clone(data), createdAt: timestamp, updatedAt: timestamp };
    memory.push(item);
    return clone(item);
  },
  async get(id) {
    if (config.persistence.mode === 'mongo')
      return mongoose.isValidObjectId(id) ? ((await Candidato.findById(id))?.toJSON() ?? null) : null;
    return clone(memory.find((item) => item.id === id) || null);
  },
  // Agrega la metadata de un documento; el archivo vive en el almacenamiento de documentos.
  async addDocument(id, document) {
    if (config.persistence.mode === 'mongo') {
      if (!mongoose.isValidObjectId(id)) return null;
      const updated = await Candidato.findByIdAndUpdate(id, { $push: { documentos: document } }, { new: true });
      return updated?.toJSON() ?? null;
    }
    const item = memory.find((entry) => entry.id === id);
    if (!item) return null;
    item.documentos = [...(item.documentos || []), clone(document)];
    item.updatedAt = new Date().toISOString();
    return clone(item);
  },
  resetMemory() {
    memory.splice(0);
  }
};
