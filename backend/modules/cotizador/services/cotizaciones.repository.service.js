'use strict';

const crypto = require('crypto');
const config = require('../../../config');
const Cotizacion = require('../models/cotizacion.model');
const { siguienteConsecutivo } = require('./consecutivo.service');

const memory = [];
const sequences = new Map();

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

async function nextConsecutive() {
  if (config.persistence.mode === 'mongo') return siguienteConsecutivo();
  const year = new Date().getFullYear();
  const next = (sequences.get(year) || 0) + 1;
  sequences.set(year, next);
  return `COT-${year}-${String(next).padStart(4, '0')}`;
}

async function create(data) {
  if (config.persistence.mode === 'mongo') {
    const document = await Cotizacion.create(data);
    return document.toObject();
  }
  const now = new Date().toISOString();
  const document = {
    _id: crypto.randomBytes(12).toString('hex'),
    ...clone(data),
    createdAt: now,
    updatedAt: now
  };
  memory.push(document);
  return clone(document);
}

async function list({ page, limit, cliente, vendedor, estado, desde, hasta }) {
  if (config.persistence.mode === 'mongo') {
    const filter = {};
    if (cliente) filter['metadata.cliente'] = new RegExp(cliente, 'i');
    if (vendedor) filter['metadata.vendedor'] = new RegExp(vendedor, 'i');
    if (estado) filter.estado = estado;
    if (desde || hasta) {
      filter.createdAt = {};
      if (desde) filter.createdAt.$gte = new Date(desde);
      if (hasta) filter.createdAt.$lte = new Date(hasta);
    }
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Cotizacion.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Cotizacion.countDocuments(filter)
    ]);
    return { items, total };
  }

  const includes = (value, term) =>
    String(value || '')
      .toLocaleLowerCase('es')
      .includes(String(term || '').toLocaleLowerCase('es'));
  const from = desde ? new Date(desde).getTime() : null;
  const to = hasta ? new Date(hasta).getTime() : null;
  const filtered = memory
    .filter((item) => {
      const created = new Date(item.createdAt).getTime();
      return (
        (!cliente || includes(item.metadata?.cliente, cliente)) &&
        (!vendedor || includes(item.metadata?.vendedor, vendedor)) &&
        (!estado || item.estado === estado) &&
        (!from || created >= from) &&
        (!to || created <= to)
      );
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const skip = (page - 1) * limit;
  return { items: clone(filtered.slice(skip, skip + limit)), total: filtered.length };
}

async function getById(id) {
  if (config.persistence.mode === 'mongo') return Cotizacion.findById(id).lean();
  const document = memory.find((item) => item._id === id);
  return document ? clone(document) : null;
}

async function updateStatus(id, estado) {
  if (config.persistence.mode === 'mongo') {
    return Cotizacion.findByIdAndUpdate(id, { estado }, { new: true, runValidators: true }).lean();
  }
  const document = memory.find((item) => item._id === id);
  if (!document) return null;
  document.estado = estado;
  document.updatedAt = new Date().toISOString();
  return clone(document);
}

function resetMemory() {
  memory.length = 0;
  sequences.clear();
}

module.exports = { nextConsecutive, create, list, getById, updateStatus, resetMemory };
