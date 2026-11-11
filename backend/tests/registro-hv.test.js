'use strict';

// HU-34 (#81) Registrar candidatos desde la hoja de vida.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const config = require('../config');
const { createServer } = require('../app');
const candidates = require('../modules/hojasdevida/services/candidatos.repository.service');
const storage = require('../modules/hojasdevida/services/documentos.storage.service');
const vacancies = require('../modules/hojasdevida/services/vacantes.repository.service');

let server;
let vacancy;
const headers = (rol, usuario) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify({ uid: `dev-${usuario}`, usuario, nombre: `Nombre ${usuario}`, rol }))
});
const hr = headers('rrhh', 'mrestrepo');
const call = (method, url, payload, auth = hr) => server.inject({ method, url, payload, headers: auth });
const PDF = Buffer.from('%PDF-1.7\nHoja de vida\n%%EOF\n');
const DOC = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.from('doc')]);
const upload = (changes = {}) => ({
  vacanteId: vacancy.id,
  autorizacionDatos: true,
  nombre: 'HV_01_laura_marcela_restrepo.pdf',
  tipo: 'application/pdf',
  fileDataUrl: `data:application/pdf;base64,${PDF.toString('base64')}`,
  ...changes
});
const register = (changes) => call('POST', '/api/candidatos/desde-hoja-de-vida', upload(changes));
const confirm = (candidate, analysis, datos) =>
  call('POST', `/api/candidatos/${candidate.id}/analisis/${analysis.id}/confirmar`, { datos });

function mockOpenAIDown(t) {
  const original = { fetch: global.fetch, ocr: { ...config.ocr } };
  Object.assign(config.ocr, { provider: 'openai', openaiKey: 'sk-test', timeoutMs: 2000 });
  global.fetch = async () => new Response(JSON.stringify({ error: { message: 'down' } }), { status: 503 });
  t.after(() => {
    global.fetch = original.fetch;
    Object.assign(config.ocr, original.ocr);
  });
}

beforeEach(async () => {
  candidates.resetMemory();
  storage.resetMemory();
  vacancies.resetMemory();
  server = await createServer();
  vacancy = (
    await call('POST', '/api/vacantes', {
      cargo: 'Soldador',
      formacionMinima: 'Técnico',
      experienciaMinima: 2,
      habilidades: ['Lectura de planos'],
      certificacionesObligatorias: ['Trabajo en alturas'],
      pesos: { formacion: 25, experiencia: 25, certificaciones: 25, habilidades: 25 }
    })
  ).result;
});
afterEach(() => server.stop());

test('CP-01, CA1 y CA2: la hoja de vida crea un candidato pendiente de revisión con el cargo de la vacante', async () => {
  const response = await register();
  assert.equal(response.statusCode, 201);
  const { candidato, analisis } = response.result;
  assert.equal(candidato.estado, 'pendiente_revision');
  assert.equal(candidato.cargoInteres, 'Soldador');
  assert.equal(candidato.vacanteId, vacancy.id);
  assert.equal(candidato.autorizacionDatos.otorgada, true);
  assert.equal(candidato.autorizacionDatos.registradaPor, 'mrestrepo');
  assert.equal(candidato.documentos.length, 1);
  assert.equal(candidato.documentos[0].tipoDocumento, 'hoja_de_vida');
  assert.equal(candidato.documentos[0].archivoId, undefined);
  assert.equal(analisis.estado, 'pendiente');
  assert.ok(analisis.propuesta.datos.nombre, 'la IA propone los datos');
  assert.equal(candidato.nombre, '', 'nada se registra antes de confirmar');
});

test('CP-02 y CA1: sin autorización de datos no se envía nada a la IA ni se crea nada', async () => {
  const response = await register({ autorizacionDatos: false });
  assert.equal(response.statusCode, 400);
  assert.match(response.result.message, /autorización/);
  assert.equal((await candidates.list()).length, 0);
  assert.equal(storage.countMemory(), 0);
});

test('CA1: la vacante debe estar abierta y el archivo ser PDF o DOCX', async () => {
  const doc = await register({
    nombre: 'hv.doc',
    tipo: 'application/msword',
    fileDataUrl: `data:application/msword;base64,${DOC.toString('base64')}`
  });
  assert.equal(doc.statusCode, 400);
  assert.match(doc.result.message, /PDF o DOCX/);
  await call('POST', `/api/vacantes/${vacancy.id}/cerrar`);
  const closed = await register();
  assert.equal(closed.statusCode, 409);
  assert.match(closed.result.message, /cerrada/);
  assert.equal((await candidates.list()).length, 0);
  assert.equal(storage.countMemory(), 0);
});

test('CP-05 y CA3: si el análisis falla no queda candidato ni documento', async (t) => {
  mockOpenAIDown(t);
  const response = await register();
  assert.equal(response.statusCode, 502);
  assert.equal((await candidates.list()).length, 0);
  assert.equal(storage.countMemory(), 0);
});

test('CP-03, CA4 y CA5: al confirmar sin identificación queda registrado y evaluado contra la vacante', async () => {
  const { candidato, analisis } = (await register()).result;
  const response = await confirm(candidato, analisis, { ...analisis.propuesta.datos, telefono: '3001234567' });
  assert.equal(response.statusCode, 200);
  const registered = response.result;
  assert.equal(registered.estado, 'registrado');
  assert.equal(registered.identificacion, '');
  assert.equal(registered.nombre, analisis.propuesta.datos.nombre);
  assert.ok(registered.evaluacion, 'se evalúa automáticamente');
  assert.equal(registered.evaluacion.vacanteId, vacancy.id);
  assert.equal(typeof registered.evaluacion.puntaje, 'number');
  const ranking = await call('GET', `/api/vacantes/${vacancy.id}/ranking`);
  assert.deepEqual(
    ranking.result.items.map((row) => row.candidato.id),
    [candidato.id]
  );
});

test('CA4: varios candidatos sin identificación conviven, pero no se repiten identificación ni correo', async () => {
  const first = (await register()).result;
  const second = (await register({ nombre: 'HV_02.pdf' })).result;
  const base = first.analisis.propuesta.datos;
  assert.equal((await confirm(first.candidato, first.analisis, base)).statusCode, 200);
  const sameEmail = await confirm(second.candidato, second.analisis, base);
  assert.equal(sameEmail.statusCode, 409, 'mismo correo');
  const withId = await confirm(second.candidato, second.analisis, {
    ...base,
    correo: 'otra.persona@example.com',
    tipoIdentificacion: 'CC',
    identificacion: '1.017.000.111'
  });
  assert.equal(withId.statusCode, 200);
  assert.equal(withId.result.identificacion, '1017000111');

  const third = (await register({ nombre: 'HV_03.pdf' })).result;
  const sameId = await confirm(third.candidato, third.analisis, {
    ...base,
    correo: 'tercera@example.com',
    identificacion: '1017000111'
  });
  assert.equal(sameId.statusCode, 409, 'misma identificación');
});

test('CA5: si la vacante se cerró, el candidato queda registrado sin evaluación y con aviso', async () => {
  const { candidato, analisis } = (await register()).result;
  await call('POST', `/api/vacantes/${vacancy.id}/cerrar`);
  const response = await confirm(candidato, analisis, analisis.propuesta.datos);
  assert.equal(response.statusCode, 200);
  assert.equal(response.result.estado, 'registrado');
  assert.equal(response.result.evaluacion, null);
  assert.match(response.result.avisoEvaluacion, /cerrada/);
});

test('CP-06 y CA6: un pendiente se descarta con su hoja de vida; un registrado no', async () => {
  const pending = (await register()).result;
  const removed = await call('DELETE', `/api/candidatos/${pending.candidato.id}`);
  assert.equal(removed.statusCode, 200);
  assert.equal((await candidates.list()).length, 0);
  assert.equal(storage.countMemory(), 0);

  const other = (await register()).result;
  await confirm(other.candidato, other.analisis, other.analisis.propuesta.datos);
  assert.equal((await call('DELETE', `/api/candidatos/${other.candidato.id}`)).statusCode, 409);
  assert.equal((await call('DELETE', '/api/candidatos/no-existe')).statusCode, 404);
});

test('solo RRHH y administración registran desde la hoja de vida', async () => {
  const response = await call('POST', '/api/candidatos/desde-hoja-de-vida', upload(), headers('comercial', 'jdiaz'));
  assert.equal(response.statusCode, 403);
});
