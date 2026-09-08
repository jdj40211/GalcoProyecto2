'use strict';

const mongoose = require('mongoose');

const gastoSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    categoria: { type: String, required: true },
    descripcion: { type: String, required: true, trim: true },
    valor: { type: Number, required: true, min: 0.01 }
  },
  { _id: false }
);

const solicitudSchema = new mongoose.Schema(
  {
    consecutivo: { type: String, required: true, unique: true, index: true },
    solicitante: { type: String, required: true, trim: true },
    solicitanteLogin: { type: String, required: true, index: true },
    destino: { type: String, required: true, trim: true },
    fechaInicio: { type: String, required: true, index: true },
    fechaFin: { type: String, required: true },
    motivo: { type: String, required: true, trim: true },
    centroCosto: { type: String, required: true, trim: true },
    moneda: { type: String, default: 'COP' },
    gastos: { type: [gastoSchema], default: [] },
    totalSolicitado: { type: Number, default: 0, min: 0 },
    estado: {
      type: String,
      enum: ['borrador', 'enviada', 'aprobada', 'rechazada'],
      default: 'borrador',
      index: true
    },
    enviadoEn: Date,
    aprobadoPor: String,
    aprobadoEn: Date,
    rechazadoPor: String,
    rechazadoEn: Date,
    motivoRechazo: String
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_document, value) => {
        value.id = String(value._id);
        delete value._id;
      }
    }
  }
);

solicitudSchema.index({ solicitanteLogin: 1, createdAt: -1 });
solicitudSchema.index({ estado: 1, createdAt: -1 });

module.exports = mongoose.models.SolicitudViatico || mongoose.model('SolicitudViatico', solicitudSchema);
