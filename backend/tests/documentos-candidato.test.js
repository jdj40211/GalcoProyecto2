'use strict';

// HU-14 (#18) Adjuntar hoja de vida.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const candidates = require('../modules/hojasdevida/services/candidatos.repository.service');
const storage = require('../modules/hojasdevida/services/documentos.storage.service');

let server;
let candidate;
const headers = (rol, usuario) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify({ uid: `dev-${usuario}`, usuario, nombre: `Nombre ${usuario}`, rol }))
});
const hr = headers('rrhh', 'mrestrepo');
const call = (method, url, payload, auth = hr) => server.inject({ method, url, payload, headers: auth });
const PDF = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.from('contenido de la hoja de vida ñ')]);
const DOCX = Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.from('word/document.xml')]);
const DOC = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.from('doc')]);
const MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};
const upload = (bytes, nombre = 'hoja-de-vida.pdf', tipo = MIME.pdf, extra = {}) => ({
  nombre,
  tipo,
  tipoDocumento: 'hoja_de_vida',
  fileDataUrl: `data:${tipo};base64,${bytes.toString('base64')}`,
  ...extra
});
const url = () => `/api/candidatos/${candidate.id}/documentos`;

beforeEach(async () => {
  candidates.resetMemory();
  storage.resetMemory();
  server = await createServer();
  candidate = (
    await call('POST', '/api/candidatos', {
      identificacion: '1017234567',
      nombre: 'Ana María Pérez',
      correo: 'ana@example.com',
      cargoInteres: 'Operaria',
      autorizacionDatos: true
    })
  ).result;
});
afterEach(() => server.stop());

test('CP-01, CA2 y CA3: adjunta un PDF con fecha y usuario, y se descarga idéntico', async () => {
  const response = await call('POST', url(), upload(PDF, 'Hoja de vida Ana Pérez.pdf'));
  assert.equal(response.statusCode, 201);
  const document = response.result;
  assert.equal(document.nombre, 'Hoja de vida Ana Pérez.pdf');
  assert.equal(document.tipo, MIME.pdf);
  assert.equal(document.tamano, PDF.length);
  assert.equal(document.tipoDocumento, 'hoja_de_vida');
  assert.equal(document.cargadoPor, 'mrestrepo');
  assert.ok(!Number.isNaN(Date.parse(document.cargadoEn)));
  assert.equal(document.archivoId, undefined, 'el identificador interno del archivo no se expone');

  const [listed] = (await call('GET', '/api/candidatos')).result.items;
  assert.deepEqual(
    listed.documentos.map((item) => item.id),
    [document.id]
  );

  const download = await call('GET', `${url()}/${document.id}`);
  assert.equal(download.statusCode, 200);
  assert.equal(download.headers['content-type'], MIME.pdf);
  assert.match(download.headers['content-disposition'], /^attachment;/);
  assert.match(download.headers['content-disposition'], /filename\*=UTF-8''Hoja%20de%20vida%20Ana%20P%C3%A9rez\.pdf/);
  assert.ok(Buffer.from(download.rawPayload).equals(PDF), 'CA5: el original se conserva sin cambios');
});

test('CA1: acepta DOC y DOCX, y también soportes además de la hoja de vida', async () => {
  assert.equal((await call('POST', url(), upload(DOCX, 'hv.docx', MIME.docx))).statusCode, 201);
  const support = await call('POST', url(), upload(DOC, 'certificado.doc', MIME.doc, { tipoDocumento: 'soporte' }));
  assert.equal(support.statusCode, 201);
  assert.equal(support.result.tipoDocumento, 'soporte');
});

test('CP-02 y CA4: un formato no permitido o un archivo disfrazado se rechazan sin dejar registro', async () => {
  const executable = Buffer.from('MZ\x90\x00 ejecutable');
  for (const payload of [
    upload(executable, 'programa.exe', 'application/x-msdownload'),
    upload(executable, 'hoja.pdf', MIME.pdf),
    upload(PDF, 'hoja.txt', MIME.pdf),
    upload(Buffer.alloc(0), 'vacio.pdf', MIME.pdf)
  ]) {
    const response = await call('POST', url(), payload);
    assert.equal(response.statusCode, 400, payload.nombre);
    assert.match(response.result.message, /PDF, DOC o DOCX|vacío/);
  }
  const [listed] = (await call('GET', '/api/candidatos')).result.items;
  assert.deepEqual(listed.documentos, []);
  assert.equal(storage.countMemory(), 0);
});

test('CP-03: un documento de más de 10 MB se rechaza e informa el límite', async () => {
  const big = Buffer.concat([Buffer.from('%PDF-1.7\n'), Buffer.alloc(10 * 1024 * 1024)]);
  const response = await call('POST', url(), upload(big));
  assert.equal(response.statusCode, 400);
  assert.match(response.result.message, /10 MB/);
  assert.equal(storage.countMemory(), 0);
});

test('CA2: un candidato o un documento inexistentes responden 404', async () => {
  assert.equal((await call('POST', '/api/candidatos/no-existe/documentos', upload(PDF))).statusCode, 404);
  assert.equal((await call('GET', `${url()}/no-existe`)).statusCode, 404);
  assert.equal(storage.countMemory(), 0);
});

test('CA6: solo RRHH y administración cargan o descargan hojas de vida', async () => {
  const document = (await call('POST', url(), upload(PDF))).result;
  for (const auth of [headers('comercial', 'jdiaz'), headers('contabilidad', 'acastro')]) {
    assert.equal((await call('POST', url(), upload(PDF), auth)).statusCode, 403);
    assert.equal((await call('GET', `${url()}/${document.id}`, undefined, auth)).statusCode, 403);
  }
  assert.equal((await call('GET', `${url()}/${document.id}`, undefined, headers('admin', 'admin'))).statusCode, 200);
});
