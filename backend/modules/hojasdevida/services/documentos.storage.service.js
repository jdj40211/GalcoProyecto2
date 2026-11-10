'use strict';

// Almacenamiento privado de los documentos de candidatos, fuera del documento del candidato (HU-14).
// En MongoDB usa GridFS; en el modo local, memoria del proceso.
const crypto = require('node:crypto');
const mongoose = require('mongoose');
const config = require('../../../config');

const BUCKET = 'documentosCandidatos';
const memory = new Map();
const bucket = () => new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BUCKET });

async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks);
}

module.exports = {
  async save(buffer, { filename, contentType, candidatoId }) {
    if (config.persistence.mode !== 'mongo') {
      const id = crypto.randomUUID();
      memory.set(id, Buffer.from(buffer));
      return id;
    }
    const upload = bucket().openUploadStream(filename, { metadata: { contentType, candidatoId } });
    await new Promise((resolve, reject) => upload.on('error', reject).on('finish', resolve).end(buffer));
    return String(upload.id);
  },
  async read(id) {
    if (config.persistence.mode !== 'mongo') return memory.has(id) ? Buffer.from(memory.get(id)) : null;
    if (!mongoose.isValidObjectId(id)) return null;
    try {
      return await streamToBuffer(bucket().openDownloadStream(new mongoose.Types.ObjectId(id)));
    } catch (error) {
      if (/FileNotFound/i.test(error.code || error.message)) return null;
      throw error;
    }
  },
  async remove(id) {
    if (config.persistence.mode !== 'mongo') return memory.delete(id);
    await bucket().delete(new mongoose.Types.ObjectId(id));
    return true;
  },
  countMemory: () => memory.size,
  resetMemory: () => memory.clear()
};
