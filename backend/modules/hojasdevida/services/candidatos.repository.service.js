'use strict';

const crypto = require('node:crypto');
const Boom = require('@hapi/boom');
const mongoose = require('mongoose');
const config = require('../../../config');
const Candidato = require('../models/candidato.model');

const memory = [];
const clone = (value) => JSON.parse(JSON.stringify(value));
const duplicate = () => Boom.conflict('Ya existe un candidato con esa identificación o ese correo.');
// Un valor vacío nunca es un duplicado (HU-34: la identificación es opcional).
const clashes = (item, data) =>
  (data.identificacion && item.identificacion === data.identificacion) || (data.correo && item.correo === data.correo);

module.exports = {
  // HU-34: el índice "identificacion_1" de HU-13 exigía identificación única en todos los candidatos y
  // chocaría con los que no la tienen. Se elimina; lo reemplaza "identificacion_unica" (parcial).
  async migrate() {
    if (config.persistence.mode !== 'mongo') return [];
    let indexes;
    try {
      indexes = await Candidato.collection.indexes();
    } catch (error) {
      if (error.codeName === 'NamespaceNotFound') return [];
      throw error;
    }
    const legacy = indexes.filter((index) => index.name === 'identificacion_1' && !index.partialFilterExpression);
    for (const index of legacy) await Candidato.collection.dropIndex(index.name);
    await Candidato.createIndexes();
    return legacy.map((index) => index.name);
  },
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
    if (memory.some((item) => clashes(item, data))) throw duplicate();
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
  // Guarda un análisis de IA pendiente; se conservan los `keep` más recientes.
  async addAnalysis(id, analysis, keep) {
    if (config.persistence.mode === 'mongo') {
      await Candidato.updateOne({ _id: id }, { $push: { analisis: { $each: [analysis], $slice: -keep } } });
      return;
    }
    const item = memory.find((entry) => entry.id === id);
    item.analisis = [...(item.analisis || []), clone(analysis)].slice(-keep);
  },
  // HU-30: la evaluación nueva queda vigente y las anteriores para la misma vacante se conservan.
  async addEvaluation(id, evaluation) {
    if (config.persistence.mode === 'mongo') {
      await Candidato.updateOne(
        { _id: id },
        { $set: { 'evaluaciones.$[previous].vigente': false } },
        { arrayFilters: [{ 'previous.vacanteId': evaluation.vacanteId }] }
      );
      await Candidato.updateOne({ _id: id }, { $push: { evaluaciones: evaluation } });
      return;
    }
    const item = memory.find((entry) => entry.id === id);
    item.evaluaciones = [
      ...(item.evaluaciones || []).map((entry) =>
        entry.vacanteId === evaluation.vacanteId ? { ...entry, vigente: false } : entry
      ),
      clone(evaluation)
    ];
  },
  async listEvaluated(vacancyId) {
    if (config.persistence.mode === 'mongo')
      return (await Candidato.find({ 'evaluaciones.vacanteId': vacancyId })).map((item) => item.toJSON());
    return clone(memory.filter((item) => (item.evaluaciones || []).some((entry) => entry.vacanteId === vacancyId)));
  },
  // Aplica los datos confirmados y cierra el análisis en una sola operación: un segundo intento sobre
  // el mismo análisis no encuentra nada pendiente y devuelve null.
  async confirmAnalysis(id, analysisId, changes, analysisPatch) {
    if (config.persistence.mode === 'mongo') {
      if (!mongoose.isValidObjectId(id)) return null;
      const set = { ...changes };
      for (const [key, value] of Object.entries(analysisPatch)) set[`analisis.$.${key}`] = value;
      try {
        const updated = await Candidato.findOneAndUpdate(
          { _id: id, analisis: { $elemMatch: { id: analysisId, estado: 'pendiente' } } },
          { $set: set },
          { new: true, runValidators: true }
        );
        return updated?.toJSON() ?? null;
      } catch (error) {
        if (error.code === 11000) throw duplicate();
        throw error;
      }
    }
    const item = memory.find((entry) => entry.id === id);
    const analysis = item?.analisis?.find((entry) => entry.id === analysisId && entry.estado === 'pendiente');
    if (!analysis) return null;
    if (memory.some((entry) => entry !== item && clashes(entry, changes))) throw duplicate();
    Object.assign(item, clone(changes), { updatedAt: new Date().toISOString() });
    Object.assign(analysis, clone(analysisPatch));
    return clone(item);
  },
  async remove(id) {
    if (config.persistence.mode === 'mongo')
      return mongoose.isValidObjectId(id) && Boolean(await Candidato.findByIdAndDelete(id));
    const index = memory.findIndex((item) => item.id === id);
    if (index < 0) return false;
    memory.splice(index, 1);
    return true;
  },
  resetMemory() {
    memory.splice(0);
  }
};
