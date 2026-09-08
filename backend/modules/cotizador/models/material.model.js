'use strict';

/**
 * material.model.js
 *
 * Catálogo de materiales con historial de precios (igual patrón que parametros):
 * cada actualización de precio crea un documento nuevo y desactiva el anterior.
 * Así las cotizaciones antiguas son siempre reproducibles.
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

const materialSchema = new Schema(
  {
    codigo: { type: String, required: true, trim: true, uppercase: true },
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true, default: '' },
    categoria: {
      type: String,
      enum: ['tubo', 'platina', 'tratamiento', 'logistica'],
      required: true
    },
    unidad: { type: String, required: true }, // 'tramo_6m' | 'kg' | 'm2' | 'poste'
    precioUnitario: { type: Number, required: true, min: 0 },
    activo: { type: Boolean, default: true, index: true },
    vigenciaDesde: { type: Date, default: Date.now },
    creadoPor: { type: String, default: 'sistema' }
  },
  { timestamps: true, versionKey: false }
);

materialSchema.index({ codigo: 1, activo: 1 });
materialSchema.index({ categoria: 1, activo: 1 });

module.exports = mongoose.model('Material', materialSchema);
