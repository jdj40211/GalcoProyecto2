'use strict';

/**
 * materiales.service.js
 *
 * CRUD sobre la colección "materiales" (catálogo de 9 insumos de la hoja
 * Materia Prima del Excel 2026).
 *
 * Reglas:
 *  1. Un solo documento activo por código.
 *  2. Al actualizar precio: se desactiva el anterior y se crea uno nuevo
 *     (historial inmutable, igual a parametros.service.js).
 *  3. obtenerMapaPrecios() devuelve { codigo: precio } listo para el motor.
 */

const Material = require('../models/material.model');
const config = require('../../../config');
const crypto = require('crypto');

// ── Catálogo inicial (Excel 2026) ────────────────────────────────────────────
const CATALOGO_2026 = Object.freeze([
  {
    codigo: 'TUBO_6_VERT',
    nombre: 'Tubo HG 6" — columna vertical',
    descripcion: 'Tubo estructural galvanizado 6 pulgadas, tramo comercial 6 m',
    categoria: 'tubo',
    unidad: 'tramo_6m',
    precioUnitario: 600000
  },
  {
    codigo: 'TUBO_4_HORIZ',
    nombre: 'Tubo HG 4" — brazo horizontal',
    descripcion: 'Tubo estructural galvanizado 4 pulgadas, tramo comercial 6 m',
    categoria: 'tubo',
    unidad: 'tramo_6m',
    precioUnitario: 247575
  },
  {
    codigo: 'TUBO_3_CERCHA',
    nombre: 'Tubo HG 3" — horizontal cercha/brazo',
    descripcion: 'Tubo estructural galvanizado 3 pulgadas, tramo comercial 6 m',
    categoria: 'tubo',
    unidad: 'tramo_6m',
    precioUnitario: 173376
  },
  {
    codigo: 'TUBO_2_DIAG',
    nombre: 'Tubo HG 2" — diagonal cercha/brazo',
    descripcion: 'Tubo estructural galvanizado 2 pulgadas, tramo comercial 6 m',
    categoria: 'tubo',
    unidad: 'tramo_6m',
    precioUnitario: 117376
  },
  {
    codigo: 'PLATINA',
    nombre: 'Platinas de acero (laminado en caliente)',
    descripcion: 'Acero laminado en caliente para placas base, cartelas y accesorios',
    categoria: 'platina',
    unidad: 'kg',
    precioUnitario: 9500
  },
  {
    codigo: 'GALVANIZADO',
    nombre: 'Galvanizado en caliente',
    descripcion: 'Servicio de galvanizado en caliente por kg de material entregado',
    categoria: 'tratamiento',
    unidad: 'kg',
    precioUnitario: 3050
  },
  {
    codigo: 'PINTURA',
    nombre: 'Pintura anticorrosiva + aplicación',
    descripcion: 'Sistema epóxico anticorrosivo, precio por m² de superficie',
    categoria: 'tratamiento',
    unidad: 'm2',
    precioUnitario: 30200
  },
  {
    codigo: 'TRANSPORTE',
    nombre: 'Transporte hasta obra',
    descripcion: 'Flete por poste instalado en sitio del cliente',
    categoria: 'logistica',
    unidad: 'poste',
    precioUnitario: 12500
  },
  {
    codigo: 'EMPACADO',
    nombre: 'Empacado / embalaje',
    descripcion: 'Materiales y mano de obra de empaque por poste',
    categoria: 'logistica',
    unidad: 'poste',
    precioUnitario: 5000
  }
]);

const memoryHistory = CATALOGO_2026.map((item) => ({
  _id: crypto.randomBytes(12).toString('hex'),
  ...item,
  activo: true,
  vigenciaDesde: new Date('2026-01-01').toISOString(),
  creadoPor: 'sistema',
  createdAt: new Date('2026-01-01').toISOString(),
  updatedAt: new Date('2026-01-01').toISOString()
}));

// ── Lectura ──────────────────────────────────────────────────────────────────

async function listarMateriales() {
  if (config.persistence.mode !== 'mongo') {
    return memoryHistory
      .filter((item) => item.activo)
      .sort((a, b) => `${a.categoria}:${a.codigo}`.localeCompare(`${b.categoria}:${b.codigo}`))
      .map((item) => ({ ...item }));
  }
  return Material.find({ activo: true }).sort({ categoria: 1, codigo: 1 }).lean();
}

async function obtenerMaterial(codigo) {
  if (config.persistence.mode !== 'mongo') {
    const item = memoryHistory.find((entry) => entry.codigo === codigo.toUpperCase() && entry.activo);
    return item ? { ...item } : null;
  }
  return Material.findOne({ codigo: codigo.toUpperCase(), activo: true }).lean();
}

async function listarHistorialMaterial(codigo) {
  if (config.persistence.mode !== 'mongo') {
    return memoryHistory
      .filter((item) => item.codigo === codigo.toUpperCase())
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map((item) => ({ ...item }));
  }
  return Material.find({ codigo: codigo.toUpperCase() }).sort({ createdAt: -1 }).lean();
}

/**
 * Devuelve un mapa { CODIGO: precioUnitario } de todos los materiales activos.
 * Se usa en el controller para pasarlo al motor de cálculo como `preciosTubos`.
 * Si la DB no responde devuelve {} (el motor usa fallback a tablasBase.js).
 */
async function obtenerMapaPrecios() {
  try {
    const items = await listarMateriales();
    return items.reduce((acc, m) => {
      acc[m.codigo] = m.precioUnitario;
      return acc;
    }, {});
  } catch (_err) {
    return {};
  }
}

// ── Escritura ────────────────────────────────────────────────────────────────

/**
 * Actualiza el precio de un material:
 * desactiva el documento actual y crea uno nuevo con el precio y fecha dados.
 *
 * @param {string} codigo
 * @param {number} precioUnitario
 * @param {string} userId
 */
async function actualizarPrecio(codigo, precioUnitario, userId) {
  const codigoUp = codigo.toUpperCase();
  if (config.persistence.mode !== 'mongo') {
    const existente = memoryHistory.find((item) => item.codigo === codigoUp && item.activo);
    if (!existente) throw new Error(`Material no encontrado: ${codigoUp}`);
    existente.activo = false;
    const now = new Date().toISOString();
    const nuevo = {
      ...existente,
      _id: crypto.randomBytes(12).toString('hex'),
      precioUnitario,
      activo: true,
      vigenciaDesde: now,
      creadoPor: userId || 'sistema',
      createdAt: now,
      updatedAt: now
    };
    memoryHistory.unshift(nuevo);
    return { ...nuevo };
  }
  const existente = await Material.findOne({ codigo: codigoUp, activo: true }).lean();
  if (!existente) throw new Error(`Material no encontrado: ${codigoUp}`);

  await Material.updateMany({ codigo: codigoUp, activo: true }, { $set: { activo: false } });

  const base = { ...existente };
  delete base._id;
  delete base.createdAt;
  delete base.updatedAt;
  const nuevo = new Material({
    ...base,
    precioUnitario,
    activo: true,
    vigenciaDesde: new Date(),
    creadoPor: userId || 'sistema'
  });
  await nuevo.save();
  return nuevo.toObject();
}

// ── Inicialización ───────────────────────────────────────────────────────────

/**
 * Crea los materiales que falten en la colección.
 * Idempotente: no toca los que ya existen con activo=true.
 */
async function inicializarCatalogo() {
  if (config.persistence.mode !== 'mongo') return listarMateriales();
  const codigos = CATALOGO_2026.map((m) => m.codigo);
  const existentes = await Material.find({ codigo: { $in: codigos }, activo: true }).lean();
  const yaExisten = new Set(existentes.map((e) => e.codigo));

  const nuevos = CATALOGO_2026.filter((m) => !yaExisten.has(m.codigo));
  if (nuevos.length === 0) return existentes;

  const fecha = new Date('2026-01-01');
  await Material.insertMany(nuevos.map((m) => ({ ...m, activo: true, vigenciaDesde: fecha, creadoPor: 'sistema' })));

  return Material.find({ activo: true }).sort({ categoria: 1, codigo: 1 }).lean();
}

module.exports = {
  listarMateriales,
  obtenerMaterial,
  listarHistorialMaterial,
  obtenerMapaPrecios,
  actualizarPrecio,
  inicializarCatalogo,
  CATALOGO_2026
};
