'use strict';

process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const repository = require('../modules/viaticos/services/repository.service');

const header = (user) => ({
  'x-dev-user': encodeURIComponent(JSON.stringify(user)),
  authorization: 'Bearer dev-token'
});
const commercial = { uid: 'dev-jdiaz', nombre: 'Juan Díaz', usuario: 'jdiaz', rol: 'comercial' };
const accounting = { uid: 'dev-acastro', nombre: 'Andrés Castro', usuario: 'acastro', rol: 'contabilidad' };

test('flujo completo: crear, aislar por usuario, aprobar y exportar', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());
  const created = await server.inject({
    method: 'POST',
    url: '/api/viaticos',
    headers: header(commercial),
    payload: {
      usuario: commercial.nombre,
      usuarioLogin: commercial.usuario,
      fecha: '2026-09-02',
      valor: 185000,
      nit: '',
      proveedor: 'Hotel Prueba',
      ciudad: 'Medellín',
      metodoPago: 'Tarjeta',
      tipoGasto: 'hospedaje',
      concepto: 'Alojamiento comercial',
      observaciones: '',
      nivelConfianza: 'alta',
      estado: 'pendiente_revision',
      fileName: '',
      fileType: '',
      fileDataUrl: ''
    }
  });
  assert.equal(created.statusCode, 200);
  const record = JSON.parse(created.payload);
  assert.equal(record.estado, 'pendiente_revision');
  assert.equal(record.fecha, '2026-09-02');
  const approved = await server.inject({
    method: 'POST',
    url: `/api/viaticos/${record.id}/approve`,
    headers: header(accounting)
  });
  assert.equal(approved.statusCode, 200);
  assert.equal(JSON.parse(approved.payload).estado, 'aprobado');
  const exported = await server.inject({
    method: 'POST',
    url: '/api/viaticos/export',
    headers: header(accounting),
    payload: { ids: [record.id], markExported: true }
  });
  assert.equal(exported.statusCode, 200);
  const txt = JSON.parse(exported.payload).content;
  assert.match(txt, /511515/);
  assert.match(txt, /2026-09-02\|511515/);
});

test('el listado omite el comprobante y el detalle lo incluye', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());
  const fileDataUrl = `data:image/jpeg;base64,${'A'.repeat(100000)}`;
  const created = await server.inject({
    method: 'POST',
    url: '/api/viaticos',
    headers: header(commercial),
    payload: {
      usuario: commercial.nombre,
      usuarioLogin: commercial.usuario,
      fecha: '2026-10-20',
      valor: 39400,
      tipoGasto: 'alimentacion',
      concepto: 'Almuerzo',
      fileName: 'recibo.jpg',
      fileType: 'image/jpeg',
      fileDataUrl
    }
  });
  const { id } = JSON.parse(created.payload);
  const listed = JSON.parse(
    (await server.inject({ method: 'GET', url: '/api/viaticos', headers: header(commercial) })).payload
  );
  assert.equal(listed.items[0].fileName, 'recibo.jpg');
  assert.equal('fileDataUrl' in listed.items[0], false);
  const detail = JSON.parse(
    (await server.inject({ method: 'GET', url: `/api/viaticos/${id}`, headers: header(commercial) })).payload
  );
  assert.equal(detail.fileDataUrl, fileDataUrl);
});

test('OCR demo conserva el contrato de extracción', async (t) => {
  const server = await createServer();
  t.after(() => server.stop());
  const response = await server.inject({
    method: 'POST',
    url: '/api/ocr/extract',
    headers: header(commercial),
    payload: { fileName: 'test.png', fileType: 'image/png', fileDataUrl: 'data:image/png;base64,AA==' }
  });
  assert.equal(response.statusCode, 200);
  const body = JSON.parse(response.payload);
  assert.ok(body.datos.fecha);
  assert.ok(Array.isArray(body.camposPendientes));
});
