'use strict';

// Texto de un DOCX sin dependencias: un DOCX es un ZIP y el texto vive en word/document.xml.
// Se lee el directorio central del ZIP (sus tamaños son fiables aunque el archivo use descriptores
// de datos) y se descomprime solo esa entrada, con un tope contra archivos comprimidos maliciosos.
const zlib = require('node:zlib');

const END_OF_DIRECTORY = 0x06054b50;
const DIRECTORY_ENTRY = 0x02014b50;
const LOCAL_HEADER = 0x04034b50;
const MAX_XML_BYTES = 20 * 1024 * 1024;
const MAX_TEXT_CHARS = 60000;
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };

const invalid = () => new Error('El archivo no es un DOCX válido.');

function documentXml(zip) {
  let end = -1;
  for (let i = zip.length - 22; i >= Math.max(0, zip.length - 65557); i -= 1)
    if (zip.readUInt32LE(i) === END_OF_DIRECTORY) {
      end = i;
      break;
    }
  if (end < 0) throw invalid();
  const entries = zip.readUInt16LE(end + 10);
  let offset = zip.readUInt32LE(end + 16);
  for (let index = 0; index < entries; index += 1) {
    if (offset + 46 > zip.length || zip.readUInt32LE(offset) !== DIRECTORY_ENTRY) throw invalid();
    const method = zip.readUInt16LE(offset + 10);
    const compressedSize = zip.readUInt32LE(offset + 20);
    const nameLength = zip.readUInt16LE(offset + 28);
    const extraLength = zip.readUInt16LE(offset + 30);
    const commentLength = zip.readUInt16LE(offset + 32);
    const localOffset = zip.readUInt32LE(offset + 42);
    const name = zip.toString('utf8', offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;
    if (name !== 'word/document.xml') continue;
    if (localOffset + 30 > zip.length || zip.readUInt32LE(localOffset) !== LOCAL_HEADER) throw invalid();
    const start = localOffset + 30 + zip.readUInt16LE(localOffset + 26) + zip.readUInt16LE(localOffset + 28);
    const data = zip.subarray(start, start + compressedSize);
    if (method === 0) return data.toString('utf8');
    if (method === 8) return zlib.inflateRawSync(data, { maxOutputLength: MAX_XML_BYTES }).toString('utf8');
    throw invalid();
  }
  throw invalid();
}

function docxText(buffer) {
  let xml;
  try {
    xml = documentXml(Buffer.from(buffer));
  } catch {
    throw invalid();
  }
  return xml
    .replace(/<w:tab\/>/g, '\t')
    .replace(/<w:br\/>|<\/w:p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|apos);/g, (_match, entity) => ENTITIES[entity])
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, MAX_TEXT_CHARS);
}

module.exports = { docxText };
