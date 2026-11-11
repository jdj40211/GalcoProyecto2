'use strict';

const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    tipoIdentificacion: { type: String, default: 'CC' },
    // Solo letras y dígitos en mayúscula: "1.017.234.567" y "1017234567" son la misma persona.
    // Opcional (HU-34): las hojas de vida no suelen traerla. Los obligatorios se validan en la API.
    identificacion: { type: String, default: '' },
    nombre: { type: String, default: '', trim: true },
    correo: { type: String, default: '' },
    telefono: { type: String, default: '' },
    ciudad: { type: String, default: '' },
    cargoInteres: { type: String, required: true, index: true },
    // Vacante a la que aplica cuando se registra desde la hoja de vida (HU-34).
    vacanteId: { type: String, default: '', index: true },
    fuente: { type: String, default: '' },
    formacion: { type: [mongoose.Schema.Types.Mixed], default: [] },
    experiencia: { type: [mongoose.Schema.Types.Mixed], default: [] },
    certificaciones: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Solo la metadata; el archivo vive en GridFS (bucket documentosCandidatos), referido por archivoId.
    documentos: { type: [mongoose.Schema.Types.Mixed], default: [] },
    habilidades: { type: [String], default: [] },
    idiomas: { type: [String], default: [] },
    anosExperiencia: { type: Number, default: 0 },
    // Propuestas de la IA (HU-28) con su estado, correcciones y quién las confirmó.
    analisis: { type: [mongoose.Schema.Types.Mixed], default: [] },
    // Evaluaciones frente a vacantes (HU-30), cada una con la copia de la vacante y si está vigente.
    evaluaciones: { type: [mongoose.Schema.Types.Mixed], default: [] },
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
// Un dato vacío no es un duplicado: los índices únicos solo aplican a los valores diligenciados.
schema.index({ correo: 1 }, { unique: true, partialFilterExpression: { correo: { $gt: '' } } });
// Nombre propio: reemplaza al índice "identificacion_1" de HU-13, que exigía identificación en todos.
schema.index(
  { identificacion: 1 },
  { name: 'identificacion_unica', unique: true, partialFilterExpression: { identificacion: { $gt: '' } } }
);

module.exports = mongoose.models.Candidato || mongoose.model('Candidato', schema);
