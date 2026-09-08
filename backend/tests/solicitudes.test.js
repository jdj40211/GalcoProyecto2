'use strict';

process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const repository = require('../modules/viaticos/services/solicitudes.repository.service');

const commercial = { uid: 'dev-jdiaz', nombre: 'Juan Díaz', usuario: 'jdiaz', rol: 'comercial' };
const anotherCommercial = { uid: 'dev-lgomez', nombre: 'Laura Gómez', usuario: 'lgomez', rol: 'comercial' };
const accounting = { uid: 'dev-acastro', nombre: 'Andrés Castro', usuario: 'acastro', rol: 'contabilidad' };
const headers = (user) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify(user))
});
const payload = {
  destino: 'Bogotá',
  fechaInicio: '2026-09-10',
  fechaFin: '2026-09-12',
  motivo: 'Visita técnica a cliente',
  centroCosto: 'COM-001',
  moneda: 'COP',
  gastos: [
    { id: 'gasto-1', categoria: 'transporte', descripcion: 'Tiquetes terrestres', valor: 150000 },
    { id: 'gasto-2', categoria: 'hospedaje', descripcion: 'Dos noches de hotel', valor: 420000 }
  ]
};

test('HU-20/HU-21: crea borrador, calcula gastos y aísla solicitudes por usuario', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());

  const created = await server.inject({
    method: 'POST',
    url: '/api/solicitudes-viaticos',
    headers: headers(commercial),
    payload
  });
  assert.equal(created.statusCode, 201);
  const item = JSON.parse(created.payload);
  assert.match(item.consecutivo, /^VIA-\d{4}-0001$/);
  assert.equal(item.estado, 'borrador');
  assert.equal(item.totalSolicitado, 570000);
  assert.equal(item.solicitanteLogin, commercial.usuario);

  const ownList = await server.inject({
    method: 'GET',
    url: '/api/solicitudes-viaticos',
    headers: headers(commercial)
  });
  assert.equal(JSON.parse(ownList.payload).total, 1);
  const otherList = await server.inject({
    method: 'GET',
    url: '/api/solicitudes-viaticos',
    headers: headers(anotherCommercial)
  });
  assert.equal(JSON.parse(otherList.payload).total, 0);
  const forbidden = await server.inject({
    method: 'GET',
    url: `/api/solicitudes-viaticos/${item.id}`,
    headers: headers(anotherCommercial)
  });
  assert.equal(forbidden.statusCode, 403);
});

test('HU-22/HU-23: envía, aprueba y protege las transiciones de estado', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());

  const created = await server.inject({
    method: 'POST',
    url: '/api/solicitudes-viaticos',
    headers: headers(commercial),
    payload
  });
  const item = JSON.parse(created.payload);

  const sent = await server.inject({
    method: 'POST',
    url: `/api/solicitudes-viaticos/${item.id}/enviar`,
    headers: headers(commercial)
  });
  assert.equal(sent.statusCode, 200);
  assert.equal(JSON.parse(sent.payload).estado, 'enviada');

  const locked = await server.inject({
    method: 'PUT',
    url: `/api/solicitudes-viaticos/${item.id}`,
    headers: headers(commercial),
    payload
  });
  assert.equal(locked.statusCode, 409);
  const forbiddenApproval = await server.inject({
    method: 'POST',
    url: `/api/solicitudes-viaticos/${item.id}/aprobar`,
    headers: headers(commercial)
  });
  assert.equal(forbiddenApproval.statusCode, 403);

  const approved = await server.inject({
    method: 'POST',
    url: `/api/solicitudes-viaticos/${item.id}/aprobar`,
    headers: headers(accounting)
  });
  assert.equal(approved.statusCode, 200);
  assert.equal(JSON.parse(approved.payload).estado, 'aprobada');
  assert.equal(JSON.parse(approved.payload).aprobadoPor, accounting.nombre);
});

test('valida fechas, gastos y rol de creación', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());

  const invalidDates = await server.inject({
    method: 'POST',
    url: '/api/solicitudes-viaticos',
    headers: headers(commercial),
    payload: { ...payload, fechaFin: '2026-09-01' }
  });
  assert.equal(invalidDates.statusCode, 400);
  const invalidExpense = await server.inject({
    method: 'POST',
    url: '/api/solicitudes-viaticos',
    headers: headers(commercial),
    payload: { ...payload, gastos: [{ ...payload.gastos[0], valor: 0 }] }
  });
  assert.equal(invalidExpense.statusCode, 400);
  const accountingCreate = await server.inject({
    method: 'POST',
    url: '/api/solicitudes-viaticos',
    headers: headers(accounting),
    payload
  });
  assert.equal(accountingCreate.statusCode, 403);
});
