/**
 * cotizacion.model.js
 *
 * Modelo Mongoose de una cotización de postes.
 *
 * Decisiones de diseño:
 *  - `configuracion` guarda los inputs EXACTOS con los que se calculó.
 *    Nunca mutarlos: si el usuario quiere recalcular, se crea una nueva versión.
 *  - `parametrosAplicados` guarda los precios/AIU vigentes al momento de
 *    cotizar. Si mañana cambia el costo del acero, las cotizaciones antiguas
 *    siguen siendo reproducibles.
 *  - `consecutivo` se genera en el controller (no aquí) para evitar problemas
 *    de concurrencia con hooks pre('save').
 *  - `version` permite futuro versionado de una misma cotización.
 *  - Índices pensados para los filtros típicos: por cliente, por vendedor, por fecha.
 */

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const configuracionSchema = new Schema(
  {
    tipoPoste: {
      type: String,
      enum: ['L', 'T', 'Cercha', 'Brazo_Cercha'],
      required: true
    },
    altura: { type: Number, required: true }, // metros
    brazo: { type: Number, required: true }, // metros
    pintura: { type: Boolean, required: true },
    cantidad: { type: Number, required: true, min: 1 }
  },
  { _id: false }
);

const caracteristicasSchema = new Schema(
  {
    pesoVertical: Number,
    pesoHorizontales: Number,
    pesoPlatinas: Number,
    pesoTotalUnitario: Number,
    areaVertical: Number,
    areaHorizontales: Number,
    areaPlatinas: Number,
    areaTotalUnitaria: Number
  },
  { _id: false }
);

const costosSchema = new Schema(
  {
    tubos: Number,
    platinas: Number,
    galvanizado: Number,
    pintura: Number,
    costoUnitario: Number,
    costoTotal: Number
  },
  { _id: false }
);

const preciosSchema = new Schema(
  {
    precioUnitarioGalvanizado: Number,
    precioUnitarioGalvanizadoPintura: Number,
    precioFinalGalvanizado: Number,
    precioFinalGalvanizadoPintura: Number,
    precioFinal: Number
  },
  { _id: false }
);

const materialSchema = new Schema(
  {
    vertical: {
      tramos: Number,
      longComercialM: Number,
      longCompradaM: Number,
      longUsadaM: Number,
      desperdicioM: Number
    },
    pesoGalvanizadoKg: Number // P0.4: peso total de tramos entregados al galvanizador
  },
  { _id: false }
);

const parametrosAplicadosSchema = new Schema(
  {
    // Estructura 4 rubros (Excel 2026, P0.2+)
    aiuMateriales: Number,
    aiuMOInterna: Number,
    aiuMOExterna: Number,
    aiuGalvanizado: Number,
    // Legacy 2 rubros (Excel v3) — presentes en cotizaciones anteriores a P0.2
    aiuMateriaPrimaYMOInterna: Number,
    aiuManoObraExterna: Number,
    // Costos comunes
    costoPorKgPlatina: Number,
    costoPorM2Pintura: Number,
    costoGalvanizadoPorKg: Number
  },
  { _id: false }
);

const metadataSchema = new Schema(
  {
    cliente: { type: String, required: true, trim: true },
    vendedor: { type: String, required: true, trim: true },
    vigenciaHasta: { type: String, default: '' },
    // `creadoPor` es el UID de Firebase — no necesariamente == vendedor
    creadoPor: { type: String, index: true },
    observaciones: { type: String, default: '' }
  },
  { _id: false }
);

const cotizacionSchema = new Schema(
  {
    // Identificador comercial: COT-2026-0001 etc.
    consecutivo: { type: String, unique: true, index: true },

    configuracion: { type: configuracionSchema, required: true },
    caracteristicas: { type: caracteristicasSchema, required: true },
    material: { type: materialSchema }, // P0.3 — no required (backward compat)
    costos: { type: costosSchema, required: true },
    precios: { type: preciosSchema, required: true },
    parametrosAplicados: { type: parametrosAplicadosSchema, required: true },
    metadata: { type: metadataSchema, required: true },

    version: { type: Number, default: 1 },
    estado: {
      type: String,
      enum: ['borrador', 'enviada', 'aprobada', 'rechazada', 'anulada'],
      default: 'borrador',
      index: true
    }
  },
  {
    timestamps: true, // createdAt / updatedAt automáticos
    versionKey: false
  }
);

// Índices compuestos para listados filtrados
cotizacionSchema.index({ 'metadata.cliente': 1, createdAt: -1 });
cotizacionSchema.index({ 'metadata.vendedor': 1, createdAt: -1 });
cotizacionSchema.index({ estado: 1, createdAt: -1 });

module.exports = mongoose.model('Cotizacion', cotizacionSchema);
