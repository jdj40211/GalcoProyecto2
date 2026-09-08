/**
 * parametros.model.js
 *
 * Colección que almacena los parámetros operativos del cotizador
 * (costos, AIU, longitudes comerciales).
 *
 * Regla de negocio: solo puede existir UN documento con activo=true.
 * Al actualizar parámetros se desactiva el anterior y se crea uno nuevo,
 * conservando el historial completo para auditoría.
 *
 * Por qué en Mongo y no en código:
 *   El precio del galvanizado, el AIU y el costo de pintura cambian con
 *   frecuencia (mensual o trimestral). Un cambio de precio no debe requerir
 *   un deploy; debe poder hacerlo el administrador desde la UI.
 */

'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const parametrosSchema = new Schema(
  {
    nombre: { type: String, default: 'PARAMETROS_ACTIVOS', trim: true },

    // ── Costos de materiales ──────────────────────────────────────────────
    costoPorKgPlatina: {
      type: Number,
      required: true,
      min: 0,
      description: 'COP por kg de platina (acero laminado en plano)'
    },

    // ── Costos de procesos de acabado ─────────────────────────────────────
    costoGalvanizadoPorKg: {
      type: Number,
      required: true,
      min: 0,
      description:
        'COP por kg de galvanizado en caliente (ASTM-A123). ' + 'Excel 2026: $3.050/kg. App anterior: $2.950/kg.'
    },
    costoPinturaPorM2: {
      type: Number,
      required: true,
      min: 0,
      description: 'COP por m² de pintura electrostática. Excel 2026: $30.200/m².'
    },

    // ── AIU por rubro — estructura Excel 2026 (4 rubros separados) ───────
    // Fórmula por rubro: precio = costo / (1 - aiu/100)
    aiuMateriales: {
      type: Number,
      min: 0,
      max: 100,
      description: 'AIU sobre tubos + platinas (materiales estructurales). Excel 2026: 40%.'
    },
    aiuMOInterna: {
      type: Number,
      min: 0,
      max: 100,
      description:
        'AIU sobre MO interna (soldadura, corte, taladro). Excel 2026: 55%. ' +
        'Activa desde P1.1; hasta entonces el costo MO interna = $0.'
    },
    aiuMOExterna: {
      type: Number,
      min: 0,
      max: 100,
      description: 'AIU sobre MO externa (pintura, transporte, empacado). Excel 2026: 40%.'
    },
    aiuGalvanizado: {
      type: Number,
      min: 0,
      max: 100,
      description: 'AIU sobre galvanizado en caliente. Excel 2026: 0% (al costo, sin margen).'
    },

    // ── AIU legacy — estructura Excel v3 (2 rubros) ───────────────────────
    // Conservados para reproducir cotizaciones guardadas antes de P0.2.
    // No se usan en cotizaciones nuevas.
    aiuMateriaPrimaYMOInterna: {
      type: Number,
      min: 0,
      max: 100,
      description: '[LEGACY] AIU unificado sobre tubos+platinas+galvanizado. Excel v3: 55%.'
    },
    aiuManoObraExterna: {
      type: Number,
      min: 0,
      max: 100,
      description: '[LEGACY] AIU sobre pintura. Excel v3: 45%.'
    },

    // ── MO externa fija (por cotización / por poste) ──────────────────────
    // Estos valores entran en juego en P1.2. Los almacenamos desde P0.1
    // para no tener que migrar la colección después.
    costoTransporte: {
      type: Number,
      required: true,
      min: 0,
      description: 'COP fijo de transporte por cotización. Excel 2026: $12.500.'
    },
    costoEmpacado: {
      type: Number,
      required: true,
      min: 0,
      description: 'COP fijo de empacado por poste. Excel 2026: $5.000.'
    },

    // ── Logística de tubos (para P0.3 multi-tramo) ───────────────────────
    longComercialTuboM: {
      type: Number,
      required: true,
      min: 1,
      description: 'Longitud estándar del tramo de tubo que se compra (m). Ejemplo: 6m.'
    },

    // ── Control de vigencia ───────────────────────────────────────────────
    activo: { type: Boolean, default: true, index: true },
    vigenciaDesde: { type: Date, required: true },
    creadoPor: { type: String, default: 'sistema' },
    modificadoPor: { type: String }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Solo lectura rápida del set activo
parametrosSchema.index({ activo: 1, vigenciaDesde: -1 });

module.exports = mongoose.model('Parametros', parametrosSchema);
