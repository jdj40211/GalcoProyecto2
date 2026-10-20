'use strict';

process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../config');
const ocr = require('../modules/viaticos/services/ocr.service');
const { createServer } = require('../app');

const recibo = `RESTAURANTE EL CORRAL S.A.S.
NIT: 890.900.608-9
Medellín - Antioquia
Factura POS No. CRL-48213
Fecha: 15/03/2026  Hora 13:45
Hamburguesa clásica    32.900
Gaseosa                 6.500
SUBTOTAL               33.109
IVA / INC 8%            2.651
TOTAL               $ 39.400,00
Forma de pago: TARJETA DEBITO`;

function mockOpenAI(t, reply) {
  const original = { fetch: global.fetch, ocr: { ...config.ocr } };
  const calls = [];
  Object.assign(config.ocr, { provider: 'openai', openaiKey: 'sk-test', timeoutMs: 2000 });
  global.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body), headers: options.headers });
    return reply();
  };
  t.after(() => {
    global.fetch = original.fetch;
    Object.assign(config.ocr, original.ocr);
  });
  return calls;
}
const openaiReply = (data, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
const message = (json) => ({
  status: 'completed',
  output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(json) }] }]
});

test('montos colombianos se interpretan con punto de miles y coma decimal', () => {
  assert.equal(ocr.parseAmount('$ 39.400,00'), 39400);
  assert.equal(ocr.parseAmount('39.400'), 39400);
  assert.equal(ocr.parseAmount('1.250.000'), 1250000);
  assert.equal(ocr.parseAmount('1,250,000.50'), 1250000.5);
  assert.equal(ocr.parseAmount('39,40'), 39.4);
  assert.equal(ocr.parseAmount(185000), 185000);
  assert.equal(ocr.parseAmount(''), '');
  assert.equal(ocr.parseAmount('sin valor'), '');
});

test('fechas se convierten a YYYY-MM-DD y se descartan las inválidas', () => {
  assert.equal(ocr.parseDate('2026-03-15'), '2026-03-15');
  assert.equal(ocr.parseDate('15/03/2026'), '2026-03-15');
  assert.equal(ocr.parseDate('5-3-26'), '2026-03-05');
  assert.equal(ocr.parseDate('15 de marzo de 2026'), '2026-03-15');
  assert.equal(ocr.parseDate('15-MAR-2026'), '2026-03-15');
  assert.equal(ocr.parseDate('31/02/2026'), '');
  assert.equal(ocr.parseDate(''), '');
});

test('el texto de un tiquete POS produce todos los campos', () => {
  const { datos, camposPendientes, nivelConfianza } = ocr.parseText(recibo);
  assert.deepEqual(datos, {
    fecha: '2026-03-15',
    valor: 39400,
    subtotal: 33109,
    impuestos: 2651,
    nit: '890900608-9',
    numeroDocumento: 'CRL-48213',
    proveedor: 'RESTAURANTE EL CORRAL S.A.S.',
    moneda: 'COP',
    ciudad: 'Medellín',
    metodoPago: 'Tarjeta débito',
    tipoGasto: 'alimentacion',
    concepto: 'Alimentación - RESTAURANTE EL CORRAL S.A.S.'
  });
  assert.deepEqual(camposPendientes, []);
  assert.equal(nivelConfianza, 'media');
});

test('el texto sin datos reconocibles deja los campos pendientes en vez de inventarlos', () => {
  const { datos, camposPendientes, nivelConfianza } = ocr.parseText('Gracias por su compra');
  assert.equal(datos.tipoGasto, '');
  assert.deepEqual(camposPendientes, [
    'fecha',
    'valor',
    'subtotal',
    'nit',
    'numeroDocumento',
    'proveedor',
    'tipoGasto',
    'concepto'
  ]);
  assert.equal(nivelConfianza, 'baja');
});

test('la normalización respeta los límites del validador de viáticos', () => {
  const { datos, camposPendientes, nivelConfianza } = ocr.normalize({
    fecha: '15/03/2026',
    valor: '39.400',
    tipoGasto: 'Peaje',
    proveedor: 'x'.repeat(300),
    nivelConfianza: 'altísima'
  });
  assert.equal(datos.tipoGasto, 'peajes');
  assert.equal(datos.proveedor.length, 180);
  assert.equal(nivelConfianza, 'media');
  assert.ok(camposPendientes.includes('concepto'));
  assert.equal(ocr.normalize({ tipoGasto: 'viajes' }).datos.tipoGasto, '');
});

test('OpenAI recibe la imagen con esquema JSON estricto y su respuesta se normaliza', async (t) => {
  const calls = mockOpenAI(t, () =>
    openaiReply(
      message({
        fecha: '15/03/2026',
        valor: 39400,
        subtotal: 33109,
        impuestos: 2651,
        nit: '890.900.608-9',
        numeroDocumento: 'CRL-48213',
        proveedor: 'El Corral',
        moneda: 'COP',
        ciudad: 'Medellín',
        metodoPago: 'Tarjeta débito',
        tipoGasto: 'alimentacion',
        concepto: 'Almuerzo',
        nivelConfianza: 'alta',
        confianzaCampos: { valor: 'alta', subtotal: 'media', nit: 'baja' }
      })
    )
  );
  const result = await ocr.extract({
    fileName: 'recibo.jpg',
    fileType: 'image/jpeg',
    fileDataUrl: 'data:image/jpeg;base64,AA=='
  });
  assert.equal(calls[0].url, 'https://api.openai.com/v1/responses');
  assert.equal(calls[0].headers.Authorization, 'Bearer sk-test');
  assert.equal(calls[0].body.store, false);
  assert.equal(calls[0].body.text.format.type, 'json_schema');
  assert.equal(calls[0].body.text.format.strict, true);
  assert.equal(calls[0].body.input[0].content[1].type, 'input_image');
  assert.equal(result.datos.fecha, '2026-03-15');
  assert.equal(result.datos.nit, '890900608-9');
  assert.equal(result.nivelConfianza, 'alta');
  assert.deepEqual(result.camposPendientes, []);
  // La confianza por campo respeta la reportada por el modelo y usa la general para el resto.
  assert.equal(result.confianzaCampos.subtotal, 'media');
  assert.equal(result.confianzaCampos.nit, 'baja');
  assert.equal(result.confianzaCampos.fecha, 'alta');
  const schema = calls[0].body.text.format.schema;
  assert.ok(schema.required.includes('confianzaCampos') && schema.required.includes('numeroDocumento'));
});

test('OpenAI recibe los PDF como archivo adjunto', async (t) => {
  const calls = mockOpenAI(t, () =>
    openaiReply(
      message({
        fecha: '',
        valor: null,
        nit: '',
        proveedor: '',
        ciudad: '',
        metodoPago: '',
        tipoGasto: '',
        concepto: '',
        nivelConfianza: 'baja'
      })
    )
  );
  const result = await ocr.extract({
    fileName: 'factura.pdf',
    fileType: 'application/pdf',
    fileDataUrl: 'data:application/pdf;base64,AA=='
  });
  assert.deepEqual(calls[0].body.input[0].content[1], {
    type: 'input_file',
    filename: 'factura.pdf',
    file_data: 'data:application/pdf;base64,AA=='
  });
  assert.equal(result.datos.valor, '');
  assert.equal(result.nivelConfianza, 'baja');
});

test('los errores de OpenAI llegan al usuario con un mensaje claro', async (t) => {
  mockOpenAI(t, () => openaiReply({ error: { message: 'Incorrect API key provided' } }, 401));
  await assert.rejects(
    ocr.extract({ fileName: 'a.png', fileType: 'image/png', fileDataUrl: 'data:image/png;base64,AA==' }),
    (error) => error.output.statusCode === 502 && /OPENAI_API_KEY/.test(error.message)
  );

  config.ocr.openaiKey = '';
  const server = await createServer();
  t.after(() => server.stop());
  const response = await server.inject({
    method: 'POST',
    url: '/api/ocr/extract',
    headers: {
      authorization: 'Bearer dev-token',
      'x-dev-user': encodeURIComponent(JSON.stringify({ usuario: 'jdiaz', rol: 'comercial' }))
    },
    payload: { fileName: 'a.png', fileType: 'image/png', fileDataUrl: 'data:image/png;base64,AA==' }
  });
  assert.equal(response.statusCode, 503);
  assert.match(JSON.parse(response.payload).message, /OPENAI_API_KEY no está configurada/);
});

test('una respuesta lenta de OpenAI se corta al superar el tiempo máximo', async (t) => {
  mockOpenAI(t, () => new Promise(() => {}));
  config.ocr.timeoutMs = 50;
  // El temporizador de AbortSignal.timeout no mantiene vivo el proceso: en Node 22 la prueba
  // terminaría antes del corte. En producción lo mantiene vivo el servidor HTTP.
  const keepAlive = setTimeout(() => {}, 5000);
  t.after(() => clearTimeout(keepAlive));
  global.fetch = (_url, options) =>
    new Promise((_, reject) => options.signal.addEventListener('abort', () => reject(options.signal.reason)));
  await assert.rejects(
    ocr.extract({ fileName: 'a.png', fileType: 'image/png', fileDataUrl: 'data:image/png;base64,AA==' }),
    (error) => error.output.statusCode === 504
  );
});
