'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    usuario: { type: String, required: true, trim: true },
    usuarioLogin: { type: String, required: true, index: true },
    fecha: { type: String, required: true, index: true },
    valor: { type: Number, required: true, min: 0 },
    nit: { type: String, default: '' },
    proveedor: { type: String, default: '' },
    numeroDocumento: { type: String, default: '' },
    subtotal: { type: Number, default: 0 },
    impuestos: { type: Number, default: 0 },
    moneda: { type: String, default: 'COP' },
    ciudad: { type: String, default: '' },
    metodoPago: { type: String, default: '' },
    tipoGasto: { type: String, required: true, index: true },
    concepto: { type: String, required: true },
    observaciones: { type: String, default: '' },
    nivelConfianza: { type: String, default: '' },
    estado: { type: String, required: true, default: 'pendiente_revision', index: true },
    confianzaCampos: { type: mongoose.Schema.Types.Mixed, default: {} },
    datosExtraidos: { type: mongoose.Schema.Types.Mixed, default: {} },
    correcciones: { type: [mongoose.Schema.Types.Mixed], default: [] },
    fileName: { type: String, default: '' },
    fileType: { type: String, default: '' },
    fileDataUrl: { type: String, default: '' },
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
      transform: (_doc, ret) => {
        ret.id = String(ret._id);
        delete ret._id;
      }
    }
  }
);

module.exports = mongoose.models.Viatico || mongoose.model('Viatico', schema);
