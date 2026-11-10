'use strict';

const crypto = require('node:crypto');
const Boom = require('@hapi/boom');
const candidates = require('./candidatos.repository.service');
const storage = require('./documentos.storage.service');

const MAX_BYTES = 10 * 1024 * 1024;
// Cada formato se reconoce por su extensión, su tipo declarado y sus primeros bytes: un ejecutable
// renombrado a .pdf no pasa (HU-14 CA1).
const FORMATS = [
  { extension: '.pdf', tipo: 'application/pdf', firma: Buffer.from('%PDF-') },
  {
    extension: '.doc',
    tipo: 'application/msword',
    firma: Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
  },
  {
    extension: '.docx',
    tipo: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    firma: Buffer.from([0x50, 0x4b, 0x03, 0x04])
  }
];
const NOT_ALLOWED = 'Solo se aceptan archivos PDF, DOC o DOCX.';

function decode(fileDataUrl) {
  const [header = '', base64 = ''] = String(fileDataUrl).split(',');
  if (!/;base64$/.test(header)) throw Boom.badRequest(NOT_ALLOWED);
  return Buffer.from(base64, 'base64');
}

function detectFormat({ nombre, tipo }, bytes) {
  if (!bytes.length) throw Boom.badRequest('El archivo está vacío.');
  if (bytes.length > MAX_BYTES) throw Boom.badRequest('El archivo supera el tamaño máximo de 10 MB.');
  const format = FORMATS.find((item) => nombre.toLowerCase().endsWith(item.extension) && item.tipo === tipo);
  if (!format || !bytes.subarray(0, format.firma.length).equals(format.firma)) throw Boom.badRequest(NOT_ALLOWED);
  return format;
}

const publicDocument = ({ archivoId: _archivoId, ...document }) => document;

async function existingCandidate(id) {
  const candidate = await candidates.get(id);
  if (!candidate) throw Boom.notFound('Candidato no encontrado.');
  return candidate;
}

// Nombre para la cabecera de descarga: versión ASCII de respaldo y la original codificada (RFC 6266).
function contentDisposition(name) {
  const ascii =
    name
      .normalize('NFD')
      .replace(/[^\x20-\x7e]/g, '')
      .replace(/["\\]/g, '')
      .trim() || 'documento';
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(name)}`;
}

module.exports = {
  publicDocument,
  async upload(candidateId, payload, credentials) {
    await existingCandidate(candidateId);
    const bytes = decode(payload.fileDataUrl);
    detectFormat(payload, bytes);
    // El archivo se guarda tal cual llegó: no se convierte ni se comprime (CA5).
    const archivoId = await storage.save(bytes, {
      filename: payload.nombre,
      contentType: payload.tipo,
      candidatoId: candidateId
    });
    const document = {
      id: crypto.randomUUID(),
      archivoId,
      nombre: payload.nombre,
      tipo: payload.tipo,
      tamano: bytes.length,
      tipoDocumento: payload.tipoDocumento,
      cargadoPor: credentials.usuario,
      cargadoEn: new Date().toISOString()
    };
    try {
      if (!(await candidates.addDocument(candidateId, document))) throw Boom.notFound('Candidato no encontrado.');
    } catch (error) {
      // Sin la asociación al candidato no queda un archivo huérfano (CA4).
      await storage.remove(archivoId).catch(() => {});
      throw error;
    }
    return publicDocument(document);
  },
  async download(candidateId, documentId) {
    const candidate = await existingCandidate(candidateId);
    const document = (candidate.documentos || []).find((item) => item.id === documentId);
    const bytes = document && (await storage.read(document.archivoId));
    if (!bytes) throw Boom.notFound('Documento no encontrado.');
    return { bytes, tipo: document.tipo, disposition: contentDisposition(document.nombre) };
  }
};
