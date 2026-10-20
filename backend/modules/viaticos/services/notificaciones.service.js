'use strict';

const crypto = require('node:crypto');
const mongoose = require('mongoose');
const config = require('../../../config');
const Boom = require('@hapi/boom');
const schema = new mongoose.Schema({
  destinatario: { type: String, required: true, index: true },
  solicitudId: String,
  mensaje: String,
  leida: { type: Boolean, default: false },
  fecha: String
});
const Notification = mongoose.models.Notificacion || mongoose.model('Notificacion', schema);
const memory = [];
const normalize = (item) => ({ ...item, id: String(item._id || item.id) });

module.exports = {
  async create(solicitud, estado) {
    const data = {
      destinatario: solicitud.solicitanteLogin,
      solicitudId: String(solicitud.id),
      mensaje: `${solicitud.consecutivo}: ${estado}${solicitud.motivoRechazo ? `. ${solicitud.motivoRechazo}` : ''}`,
      leida: false,
      fecha: new Date().toISOString()
    };
    if (config.persistence.mode === 'mongo') return Notification.create(data);
    memory.unshift({ ...data, id: crypto.randomUUID() });
  },
  async list(usuario) {
    if (config.persistence.mode === 'mongo')
      return (await Notification.find({ destinatario: usuario }).sort({ fecha: -1 }).limit(100).lean()).map(normalize);
    return structuredClone(memory.filter((item) => item.destinatario === usuario).slice(0, 100));
  },
  async read(id, usuario) {
    if (config.persistence.mode === 'mongo') {
      if (!mongoose.isValidObjectId(id)) throw Boom.notFound();
      const item = await Notification.findOneAndUpdate(
        { _id: id, destinatario: usuario },
        { leida: true },
        { new: true }
      ).lean();
      if (!item) throw Boom.notFound();
      return normalize(item);
    }
    const item = memory.find((entry) => entry.id === id && entry.destinatario === usuario);
    if (!item) throw Boom.notFound();
    item.leida = true;
    return structuredClone(item);
  },
  reset() {
    memory.length = 0;
  }
};
