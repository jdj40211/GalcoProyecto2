/**
 * parametros.service.js
 *
 * CRUD sobre la colección "parametros".
 *
 * Reglas de negocio:
 *  1. Solo puede existir UN documento con activo=true.
 *  2. Al actualizar se crea un nuevo documento y se desactiva el anterior
 *     (historial inmutable — no se modifican documentos viejos).
 *  3. Si la base de datos está vacía, se inicializa con valores por defecto
 *     que replican exactamente las constantes de tablasBase.js para no romper
 *     la paridad con el Excel original (v3.xlsm).
 *  4. El motor de cálculo puede funcionar sin DB (fallback a constantes) para
 *     no bloquear el servidor si Mongo falla en startup de dev.
 */

'use strict';

const Parametros = require('../models/parametros.model');
const config = require('../../../config');
const crypto = require('crypto');

// Valores por defecto para la estructura Excel 2026 (4 rubros AIU separados).
// Galvanizado fijo a $3.050/kg y pintura a $30.200/m² según Excel 2026.
const DEFAULTS_2026 = Object.freeze({
  costoPorKgPlatina: 9500,
  costoGalvanizadoPorKg: 3050, // Excel 2026: $3.050/kg
  costoPinturaPorM2: 30200, // Excel 2026: $30.200/m²
  // Estructura AIU 4 rubros (P0.2)
  aiuMateriales: 40, // tubos + platinas
  aiuMOInterna: 55, // soldadura, corte… (costo = $0 hasta P1.1)
  aiuMOExterna: 40, // pintura, transporte, empacado
  aiuGalvanizado: 0, // galvanizado al costo, sin margen
  costoTransporte: 12500,
  costoEmpacado: 5000,
  longComercialTuboM: 6
});

// Alias de compatibilidad para referencias externas que aún usen DEFAULTS_V3.
const DEFAULTS_V3 = DEFAULTS_2026;
const memoryHistory = [
  {
    _id: crypto.randomBytes(12).toString('hex'),
    nombre: 'PARAMETROS_2026',
    ...DEFAULTS_2026,
    activo: true,
    vigenciaDesde: new Date('2026-01-01').toISOString(),
    creadoPor: 'sistema',
    createdAt: new Date('2026-01-01').toISOString(),
    updatedAt: new Date('2026-01-01').toISOString()
  }
];

// ── Lectura ─────────────────────────────────────────────────────────────────

/**
 * Devuelve el set de parámetros activo desde MongoDB.
 * Si la colección está vacía (primera ejecución o test), devuelve los
 * valores por defecto sin lanzar error — el servidor puede arrancar.
 */
async function obtenerParametrosActivos() {
  if (config.persistence.mode !== 'mongo') {
    return { ...memoryHistory.find((item) => item.activo) };
  }
  try {
    const doc = await Parametros.findOne({ activo: true }).sort({ vigenciaDesde: -1 }).lean();
    return doc || { ...DEFAULTS_V3, _fallback: true };
  } catch (_err) {
    // DB no disponible: devolver fallback para no bloquear el cálculo.
    return { ...DEFAULTS_V3, _fallback: true };
  }
}

/**
 * Historial de todos los sets (activos e inactivos), más recientes primero.
 */
async function listarHistorial(limit = 20) {
  if (config.persistence.mode !== 'mongo') return memoryHistory.slice(0, limit).map((item) => ({ ...item }));
  return Parametros.find().sort({ createdAt: -1 }).limit(limit).lean();
}

// ── Escritura ────────────────────────────────────────────────────────────────

/**
 * Actualiza los parámetros:
 *  - Desactiva el set actual.
 *  - Crea uno nuevo con los valores recibidos y vigencia = ahora.
 *
 * @param {Object} datos  Campos a guardar (deben incluir todos los requeridos).
 * @param {string} userId UID de Firebase del admin que hace el cambio.
 * @returns {Promise<Object>} El nuevo documento guardado.
 */
async function actualizarParametros(datos, userId) {
  if (config.persistence.mode !== 'mongo') {
    memoryHistory.forEach((item) => {
      item.activo = false;
    });
    const now = new Date().toISOString();
    const nuevo = {
      _id: crypto.randomBytes(12).toString('hex'),
      ...datos,
      activo: true,
      vigenciaDesde: now,
      creadoPor: userId || 'sistema',
      createdAt: now,
      updatedAt: now
    };
    memoryHistory.unshift(nuevo);
    return { ...nuevo };
  }
  // Desactivar todos los activos
  await Parametros.updateMany({ activo: true }, { $set: { activo: false } });

  const nuevo = new Parametros({
    ...datos,
    activo: true,
    vigenciaDesde: new Date(),
    creadoPor: userId || 'sistema'
  });
  await nuevo.save();
  return nuevo.toObject();
}

// ── Inicialización ───────────────────────────────────────────────────────────

/**
 * Crea el documento inicial si la colección está vacía.
 * Se llama una vez al arrancar el servidor (db.plugin.js).
 * Idempotente: no hace nada si ya existe al menos un set activo.
 */
async function inicializarPorDefecto() {
  if (config.persistence.mode !== 'mongo') return { ...memoryHistory[0] };
  const existente = await Parametros.findOne({ activo: true }).lean();
  if (existente) return existente;

  const doc = new Parametros({
    nombre: 'PARAMETROS_2026',
    ...DEFAULTS_2026,
    activo: true,
    vigenciaDesde: new Date('2026-01-01'),
    creadoPor: 'sistema'
  });
  await doc.save();
  return doc.toObject();
}

module.exports = {
  obtenerParametrosActivos,
  listarHistorial,
  actualizarParametros,
  inicializarPorDefecto,
  DEFAULTS_2026,
  DEFAULTS_V3 // alias — apunta a DEFAULTS_2026
};
