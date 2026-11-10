'use strict';

// HU-28 (#66) Analizar hoja de vida con IA.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const { createServer } = require('../app');
const candidates = require('../modules/hojasdevida/services/candidatos.repository.service');
const storage = require('../modules/hojasdevida/services/documentos.storage.service');
const { docxText } = require('../modules/hojasdevida/services/docx.service');
const { yearsOfExperience } = require('../modules/hojasdevida/services/analisis.service');

let server;
const headers = (rol, usuario) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify({ uid: `dev-${usuario}`, usuario, nombre: `Nombre ${usuario}`, rol }))
});
const hr = headers('rrhh', 'mrestrepo');
const call = (method, url, payload, auth = hr) => server.inject({ method, url, payload, headers: auth });
const DOCX = fs.readFileSync(path.join(__dirname, 'fixtures', 'hoja-de-vida.docx'));
const PDF = Buffer.from('%PDF-1.7\nHoja de vida\n%%EOF\n');
const DOC = Buffer.concat([Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]), Buffer.from('doc')]);
const MIME = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

async function candidateWithDocument({ autorizacionDatos = true, bytes = PDF, extension = 'pdf' } = {}) {
  const candidate = (
    await call('POST', '/api/candidatos', {
      identificacion: `${Date.now()}${Math.floor(Math.random() * 1000)}`,
      nombre: 'Nombre Registrado',
      telefono: '3001234567',
      cargoInteres: 'Operaria',
      autorizacionDatos
    })
  ).result;
  const document = (
    await call('POST', `/api/candidatos/${candidate.id}/documentos`, {
      nombre: `hoja-de-vida.${extension}`,
      tipo: MIME[extension],
      fileDataUrl: `data:${MIME[extension]};base64,${bytes.toString('base64')}`
    })
  ).result;
  return { candidate, document };
}
const analyze = (candidate, document) =>
  call('POST', `/api/candidatos/${candidate.id}/analisis`, { documentoId: document.id });

function mockOpenAI(t, reply) {
  const original = { fetch: global.fetch, ocr: { ...config.ocr } };
  const calls = [];
  Object.assign(config.ocr, { provider: 'openai', openaiKey: 'sk-test', timeoutMs: 2000 });
  global.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return reply();
  };
  t.after(() => {
    global.fetch = original.fetch;
    Object.assign(config.ocr, original.ocr);
  });
  return calls;
}
const openaiReply = (data, status = 200) =>
  new Response(JSON.stringify(status === 200 ? { status: 'completed', output_text: JSON.stringify(data) } : data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

beforeEach(async () => {
  candidates.resetMemory();
  storage.resetMemory();
  server = await createServer();
});
afterEach(() => server.stop());

test('lee el texto de un DOCX real, con tildes, entidades y tabulaciones', () => {
  const text = docxText(DOCX);
  assert.match(text, /Carlos Andrés Gómez Ríos/);
  assert.match(text, /carlos\.gomez@example\.com & Tel/);
  assert.match(text, /Soldador — Estructuras del Valle S\.A\.S\./);
  assert.match(text, /Idiomas:\tEspañol, inglés básico/);
  assert.equal(text.split('\n').filter(Boolean).length, 7);
  assert.throws(() => docxText(PDF), /DOCX/);
});

test('calcula los años de experiencia sin contar dos veces los periodos que se cruzan', () => {
  const now = new Date('2026-11-10T12:00:00Z');
  assert.equal(yearsOfExperience([{ desde: '2021-02', hasta: '2024-06' }], now), 3.4);
  assert.equal(
    yearsOfExperience(
      [
        { desde: '2020-01', hasta: '2020-12' },
        { desde: '2020-07', hasta: '2021-06' }
      ],
      now
    ),
    1.5
  );
  assert.equal(yearsOfExperience([{ desde: '2025-11', hasta: '' }], now), 1.1, 'vacío = trabajo actual');
  assert.equal(yearsOfExperience([{ desde: '', hasta: '' }], now), 0);
});

test('CA2, CA3 y CA4: propone los datos con confianza y no cambia el candidato hasta confirmar', async () => {
  const { candidate, document } = await candidateWithDocument();
  const response = await analyze(candidate, document);
  assert.equal(response.statusCode, 201);
  const analysis = response.result;
  assert.equal(analysis.estado, 'pendiente');
  assert.equal(analysis.documentoId, document.id);
  assert.equal(analysis.solicitadoPor, 'mrestrepo');
  assert.equal(analysis.proveedor, 'demo');
  const { datos, confianza, anosExperiencia } = analysis.propuesta;
  assert.ok(datos.nombre && datos.experiencia.length && datos.formacion.length);
  assert.ok(['alta', 'media', 'baja'].includes(confianza.nombre));
  assert.equal(confianza.experiencia.length, datos.experiencia.length);
  assert.equal(typeof anosExperiencia, 'number');
  assert.ok(analysis.propuesta.camposPendientes.includes('telefono'), 'un dato vacío queda pendiente');

  const [stored] = (await call('GET', '/api/candidatos')).result.items;
  assert.equal(stored.nombre, 'Nombre Registrado');
  assert.deepEqual(stored.experiencia, []);
  assert.equal(stored.analisis.length, 1);
});

test('CA4 y CA7: al confirmar guarda los datos revisados, las correcciones y quién confirmó', async () => {
  const { candidate, document } = await candidateWithDocument();
  const analysis = (await analyze(candidate, document)).result;
  const datos = structuredClone(analysis.propuesta.datos);
  datos.nombre = 'Ana María Pérez Gómez';
  datos.experiencia[0].hasta = '2025-01';
  const response = await call('POST', `/api/candidatos/${candidate.id}/analisis/${analysis.id}/confirmar`, {
    datos: { ...datos, telefono: '3001234567' }
  });
  assert.equal(response.statusCode, 200);
  const updated = response.result;
  assert.equal(updated.nombre, 'Ana María Pérez Gómez');
  assert.equal(updated.experiencia[0].hasta, '2025-01');
  assert.equal(updated.identificacion, candidate.identificacion, 'la identificación no la cambia la IA');
  assert.equal(updated.cargoInteres, 'Operaria');
  assert.deepEqual(updated.habilidades, datos.habilidades);
  assert.equal(updated.anosExperiencia, yearsOfExperience(datos.experiencia));

  const [confirmed] = updated.analisis;
  assert.equal(confirmed.estado, 'confirmado');
  assert.equal(confirmed.confirmadoPor, 'mrestrepo');
  assert.ok(!Number.isNaN(Date.parse(confirmed.confirmadoEn)));
  const fields = confirmed.correcciones.map((item) => item.campo);
  // Solo lo que RRHH cambió: nada que la validación transforme por su cuenta (las fechas, por ejemplo).
  assert.deepEqual(fields.sort(), ['experiencia', 'nombre', 'telefono']);
  assert.equal(updated.certificaciones[0].vencimiento, datos.certificaciones[0].vencimiento);
  const name = confirmed.correcciones.find((item) => item.campo === 'nombre');
  assert.equal(name.valorExtraido, analysis.propuesta.datos.nombre);
  assert.equal(name.valorCorregido, 'Ana María Pérez Gómez');

  const again = await call('POST', `/api/candidatos/${candidate.id}/analisis/${analysis.id}/confirmar`, { datos });
  assert.equal(again.statusCode, 409);
});

test('CA4: la confirmación exige un dato de contacto y fechas válidas', async () => {
  const { candidate, document } = await candidateWithDocument();
  const analysis = (await analyze(candidate, document)).result;
  const url = `/api/candidatos/${candidate.id}/analisis/${analysis.id}/confirmar`;
  const datos = analysis.propuesta.datos;
  assert.equal((await call('POST', url, { datos: { ...datos, correo: '', telefono: '' } })).statusCode, 400);
  const inverted = {
    ...datos,
    experiencia: [{ cargo: 'Operaria', empresa: 'X S.A.S.', desde: '2024-06', hasta: '2021-02' }]
  };
  assert.equal((await call('POST', url, { datos: inverted })).statusCode, 400);
  assert.equal((await call('GET', '/api/candidatos')).result.items[0].analisis[0].estado, 'pendiente');
});

test('CA6: sin autorización de datos no se envía nada a la IA', async (t) => {
  const { candidate, document } = await candidateWithDocument({ autorizacionDatos: false });
  const calls = mockOpenAI(t, () => openaiReply({}));
  const response = await analyze(candidate, document);
  assert.equal(response.statusCode, 409);
  assert.match(response.result.message, /autorización/);
  assert.equal(calls.length, 0);
});

test('CA1: un DOC se conserva pero se indica el registro manual', async () => {
  const { candidate, document } = await candidateWithDocument({ bytes: DOC, extension: 'doc' });
  const response = await analyze(candidate, document);
  assert.equal(response.statusCode, 422);
  assert.match(response.result.message, /PDF o DOCX.*manualmente/);
  const [stored] = (await call('GET', '/api/candidatos')).result.items;
  assert.equal(stored.documentos.length, 1);
  assert.deepEqual(stored.analisis, []);
});

test('CA5: si la IA falla, el documento y el candidato quedan intactos', async (t) => {
  const { candidate, document } = await candidateWithDocument();
  mockOpenAI(t, () => openaiReply({ error: { message: 'Rate limit' } }, 429));
  const response = await analyze(candidate, document);
  assert.equal(response.statusCode, 502);
  assert.match(response.result.message, /límite de uso/);
  const [stored] = (await call('GET', '/api/candidatos')).result.items;
  assert.deepEqual(stored.analisis, []);
  assert.equal(stored.documentos.length, 1);
  assert.equal(stored.nombre, 'Nombre Registrado');
});

const reply = {
  nombre: 'Carlos Andrés Gómez Ríos',
  correo: 'no-es-correo',
  telefono: '300 555 1234',
  ciudad: 'Cali',
  formacion: [{ titulo: 'Técnico en soldadura', institucion: 'SENA', nivel: 'Técnico', anio: 2018, confianza: 'alta' }],
  experiencia: [
    {
      cargo: 'Soldador',
      empresa: 'Estructuras del Valle S.A.S.',
      desde: '2019-03',
      hasta: '2023-08',
      confianza: 'alta'
    },
    { cargo: 'Ayudante', empresa: 'Taller', desde: '03/2017', hasta: '', confianza: 'alta' }
  ],
  certificaciones: [],
  habilidades: ['Soldadura MIG'],
  idiomas: ['Español'],
  confianza: {
    nombre: 'alta',
    correo: 'alta',
    telefono: 'alta',
    ciudad: 'media',
    habilidades: 'media',
    idiomas: 'alta'
  }
};

test('OpenAI: un PDF se envía como archivo, sin guardarse en OpenAI, y la respuesta se normaliza', async (t) => {
  const { candidate, document } = await candidateWithDocument();
  const calls = mockOpenAI(t, () => openaiReply(reply));
  const response = await analyze(candidate, document);
  assert.equal(response.statusCode, 201);
  const [request] = calls;
  assert.equal(request.url, 'https://api.openai.com/v1/responses');
  assert.equal(request.body.store, false);
  assert.equal(request.body.text.format.type, 'json_schema');
  assert.equal(request.body.text.format.strict, true);
  const file = request.body.input[0].content.find((item) => item.type === 'input_file');
  assert.equal(file.file_data, `data:application/pdf;base64,${PDF.toString('base64')}`);
  assert.match(request.body.instructions, /edad/);

  const { datos, confianza } = response.result.propuesta;
  assert.equal(datos.correo, '', 'un correo inválido no se propone');
  assert.equal(confianza.correo, 'baja');
  assert.equal(datos.experiencia[1].desde, '', 'una fecha en otro formato no se propone');
  assert.equal(confianza.experiencia[1], 'baja');
  assert.equal(response.result.modelo, config.ocr.openaiModel);
});

test('OpenAI: un DOCX se envía como texto extraído en el servidor', async (t) => {
  const { candidate, document } = await candidateWithDocument({ bytes: DOCX, extension: 'docx' });
  const calls = mockOpenAI(t, () => openaiReply(reply));
  assert.equal((await analyze(candidate, document)).statusCode, 201);
  const content = calls[0].body.input[0].content;
  assert.equal(
    content.some((item) => item.type === 'input_file'),
    false
  );
  assert.match(content.map((item) => item.text || '').join('\n'), /Soldador — Estructuras del Valle/);
});

test('solo RRHH y administración analizan hojas de vida', async () => {
  const { candidate, document } = await candidateWithDocument();
  const response = await call(
    'POST',
    `/api/candidatos/${candidate.id}/analisis`,
    { documentoId: document.id },
    headers('comercial', 'jdiaz')
  );
  assert.equal(response.statusCode, 403);
  assert.equal((await call('POST', `/api/candidatos/${candidate.id}/analisis`, { documentoId: 'x' })).statusCode, 404);

  // Detalle de un candidato, para la pantalla de revisión.
  const detail = await call('GET', `/api/candidatos/${candidate.id}`);
  assert.equal(detail.statusCode, 200);
  assert.equal(detail.result.id, candidate.id);
  assert.equal(detail.result.documentos[0].archivoId, undefined);
  assert.equal((await call('GET', '/api/candidatos/no-existe')).statusCode, 404);
  assert.equal(
    (await call('GET', `/api/candidatos/${candidate.id}`, undefined, headers('comercial', 'jdiaz'))).statusCode,
    403
  );
});
