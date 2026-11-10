'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    cargo: { type: String, required: true, trim: true },
    area: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    formacionMinima: { type: String, required: true },
    experienciaMinima: { type: Number, required: true },
    certificacionesObligatorias: { type: [String], default: [] },
    certificacionesDeseables: { type: [String], default: [] },
    habilidades: { type: [String], default: [] },
    pesos: {
      formacion: { type: Number, required: true },
      experiencia: { type: Number, required: true },
      certificaciones: { type: Number, required: true },
      habilidades: { type: Number, required: true }
    },
    estado: { type: String, required: true, default: 'abierta', index: true },
    // Cada evaluación (HU-30) guarda la versión de la vacante con la que se calculó.
    version: { type: Number, required: true, default: 1 },
    creadoPor: { type: String, required: true },
    historial: { type: [mongoose.Schema.Types.Mixed], default: [] }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
      }
    }
  }
);

module.exports = mongoose.models.Vacante || mongoose.model('Vacante', schema);
