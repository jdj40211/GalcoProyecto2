'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    tipoIdentificacion: { type: String, required: true },
    // Solo letras y dígitos en mayúscula: "1.017.234.567" y "1017234567" son la misma persona.
    identificacion: { type: String, required: true, unique: true },
    nombre: { type: String, required: true, trim: true },
    correo: { type: String, default: '' },
    telefono: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    cargoInteres: { type: String, required: true, index: true },
    fuente: { type: String, default: '' },
    formacion: { type: [mongoose.Schema.Types.Mixed], default: [] },
    experiencia: { type: [mongoose.Schema.Types.Mixed], default: [] },
    certificaciones: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Solo la metadata; el archivo vive en GridFS (bucket documentosCandidatos), referido por archivoId.
    documentos: { type: [mongoose.Schema.Types.Mixed], default: [] },
    autorizacionDatos: {
      otorgada: { type: Boolean, required: true },
      fecha: { type: Date, default: null },
      registradaPor: { type: String, default: null }
    },
    estado: { type: String, required: true, default: 'registrado', index: true },
    registradoPor: { uid: String, usuario: String, nombre: String }
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
// Un correo vacío no es un duplicado: el índice único solo aplica a los correos diligenciados.
schema.index({ correo: 1 }, { unique: true, partialFilterExpression: { correo: { $gt: '' } } });

module.exports = mongoose.models.Candidato || mongoose.model('Candidato', schema);
