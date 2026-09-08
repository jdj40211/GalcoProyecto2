/**
 * consecutivo.service.js
 *
 * Genera consecutivos comerciales tipo COT-2026-0001 de forma atómica.
 *
 * Uso un contador auxiliar en MongoDB (colección `counters`) con $inc atómico,
 * evitando las race conditions clásicas de "buscar el último y sumar 1".
 */

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const counterSchema = new Schema(
  {
    _id: String, // ej: "cotizacion:2026"
    seq: { type: Number, default: 0 }
  },
  { versionKey: false }
);

const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

/**
 * Devuelve el siguiente consecutivo del año actual en formato COT-YYYY-NNNN.
 * Thread-safe gracias a findByIdAndUpdate con $inc y upsert.
 */
async function siguienteConsecutivo() {
  const year = new Date().getFullYear();
  const id = `cotizacion:${year}`;

  const doc = await Counter.findByIdAndUpdate(
    id,
    { $inc: { seq: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  ).lean();

  const num = String(doc.seq).padStart(4, '0');
  return `COT-${year}-${num}`;
}

module.exports = { siguienteConsecutivo };
