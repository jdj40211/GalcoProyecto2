'use strict';

process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const repository = require('../modules/cotizador/services/cotizaciones.repository.service');

const commercial = { uid: 'dev-jdiaz', nombre: 'Juan Díaz', usuario: 'jdiaz', rol: 'comercial' };
const accounting = { uid: 'dev-acastro', nombre: 'Andrés Castro', usuario: 'acastro', rol: 'contabilidad' };
const headers = (user) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify(user))
});
const configuration = { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: true, cantidad: 2 };

test('la suite publica ambos módulos y completa el flujo del cotizador', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());

  const health = await server.inject({ method: 'GET', url: '/api/health' });
  assert.deepEqual(JSON.parse(health.payload).modules, ['viaticos', 'cotizador']);

  const catalog = await server.inject({ method: 'GET', url: '/api/cotizador/catalogos', headers: headers(commercial) });
  assert.equal(catalog.statusCode, 200);
  assert.ok(JSON.parse(catalog.payload).data.tiposPoste.includes('Cercha'));

  const calculated = await server.inject({
    method: 'POST',
    url: '/api/cotizador/calculate',
    headers: headers(commercial),
    payload: { configuracion: configuration }
  });
  assert.equal(calculated.statusCode, 200);
  assert.ok(JSON.parse(calculated.payload).data.precios.precioFinal > 0);

  const created = await server.inject({
    method: 'POST',
    url: '/api/cotizador',
    headers: headers(commercial),
    payload: {
      configuracion: configuration,
      metadata: { cliente: 'Cliente Integración', vendedor: 'Juan Díaz', observaciones: 'Prueba integrada' }
    }
  });
  assert.equal(created.statusCode, 201);
  const document = JSON.parse(created.payload).data;
  assert.match(document.consecutivo, /^COT-\d{4}-0001$/);
  assert.equal(document._id.length, 24);

  const listed = await server.inject({
    method: 'GET',
    url: '/api/cotizador?cliente=Integración',
    headers: headers(accounting)
  });
  assert.equal(listed.statusCode, 200);
  assert.equal(JSON.parse(listed.payload).pagination.total, 1);

  // Flujo documentado (wiki 07): Borrador → Enviada → Aprobada / Rechazada.
  const sent = await server.inject({
    method: 'PATCH',
    url: `/api/cotizador/${document._id}/estado`,
    headers: headers(accounting),
    payload: { estado: 'enviada' }
  });
  assert.equal(sent.statusCode, 200);
  const approved = await server.inject({
    method: 'PATCH',
    url: `/api/cotizador/${document._id}/estado`,
    headers: headers(accounting),
    payload: { estado: 'aprobada' }
  });
  assert.equal(approved.statusCode, 200);
  assert.equal(JSON.parse(approved.payload).data.estado, 'aprobada');

  const pdf = await server.inject({
    method: 'GET',
    url: `/api/cotizador/${document._id}/pdf`,
    headers: headers(commercial)
  });
  assert.equal(pdf.statusCode, 200);
  assert.match(pdf.headers['content-type'], /application\/pdf/);
  assert.equal(pdf.rawPayload.subarray(0, 4).toString(), '%PDF');
});

test('contabilidad administra parámetros y precios en modo local', async (t) => {
  const server = await createServer();
  t.after(() => server.stop());

  const params = await server.inject({ method: 'GET', url: '/api/cotizador/parametros', headers: headers(accounting) });
  assert.equal(params.statusCode, 200);
  assert.equal(JSON.parse(params.payload).data.aiuMateriales, 40);

  const price = await server.inject({
    method: 'PATCH',
    url: '/api/cotizador/materiales/TUBO_4_HORIZ/precio',
    headers: headers(accounting),
    payload: { precioUnitario: 250000 }
  });
  assert.equal(price.statusCode, 200);
  assert.equal(JSON.parse(price.payload).data.precioUnitario, 250000);
});

test('los roles y validadores bloquean operaciones no autorizadas o inválidas', async (t) => {
  const server = await createServer();
  t.after(() => server.stop());

  const invalidQuote = await server.inject({
    method: 'POST',
    url: '/api/cotizador/calculate',
    headers: headers(commercial),
    payload: { configuracion: { ...configuration, brazo: 13 } }
  });
  assert.equal(invalidQuote.statusCode, 400);

  const accountingCreate = await server.inject({
    method: 'POST',
    url: '/api/viaticos',
    headers: headers(accounting),
    payload: {
      usuario: accounting.nombre,
      usuarioLogin: accounting.usuario,
      fecha: '2026-09-03',
      valor: 100000,
      nit: '',
      proveedor: 'Proveedor restringido',
      ciudad: 'Medellín',
      metodoPago: 'Tarjeta',
      tipoGasto: 'alimentacion',
      concepto: 'No autorizado',
      observaciones: '',
      nivelConfianza: 'alta',
      estado: 'pendiente_revision',
      fileName: '',
      fileType: '',
      fileDataUrl: ''
    }
  });
  assert.equal(accountingCreate.statusCode, 403);

  const created = await server.inject({
    method: 'POST',
    url: '/api/viaticos',
    headers: headers(commercial),
    payload: {
      usuario: commercial.nombre,
      usuarioLogin: commercial.usuario,
      fecha: '2026-09-03',
      valor: 100000,
      nit: '',
      proveedor: 'Proveedor permisos',
      ciudad: 'Medellín',
      metodoPago: 'Tarjeta',
      tipoGasto: 'alimentacion',
      concepto: 'Prueba de permisos',
      observaciones: '',
      nivelConfianza: 'alta',
      estado: 'pendiente_revision',
      fileName: '',
      fileType: '',
      fileDataUrl: ''
    }
  });
  const record = JSON.parse(created.payload);
  const commercialApproval = await server.inject({
    method: 'POST',
    url: `/api/viaticos/${record.id}/approve`,
    headers: headers(commercial)
  });
  assert.equal(commercialApproval.statusCode, 403);
});

test('cada vendedor ve solo sus cotizaciones y contabilidad las ve todas', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());
  const otherSeller = { uid: 'dev-lgomez', nombre: 'Laura Gómez', usuario: 'lgomez', rol: 'comercial' };
  const create = async (user, cliente) =>
    JSON.parse(
      (
        await server.inject({
          method: 'POST',
          url: '/api/cotizador',
          headers: headers(user),
          payload: {
            configuracion: configuration,
            metadata: { cliente, vendedor: 'Nombre escrito a mano' }
          }
        })
      ).payload
    ).data;

  const mine = await create(commercial, 'Cliente de Juan');
  const theirs = await create(otherSeller, 'Cliente de Laura');
  assert.equal(mine.metadata.vendedor, 'Juan Díaz');
  assert.equal(mine.metadata.vendedorLogin, 'jdiaz');

  const listFor = async (user, query = '') =>
    JSON.parse(
      (await server.inject({ method: 'GET', url: `/api/cotizador${query}`, headers: headers(user) })).payload
    ).data.map((q) => q.metadata.cliente);
  assert.deepEqual(await listFor(commercial), ['Cliente de Juan']);
  assert.deepEqual(await listFor(otherSeller), ['Cliente de Laura']);
  assert.deepEqual((await listFor(accounting)).sort(), ['Cliente de Juan', 'Cliente de Laura']);
  assert.deepEqual(await listFor(accounting, '?vendedor=laura'), ['Cliente de Laura']);
  // Un comercial no puede filtrar para ver cotizaciones ajenas.
  assert.deepEqual(await listFor(commercial, '?vendedor=laura'), []);

  for (const [method, url, payload] of [
    ['GET', `/api/cotizador/${theirs._id}`],
    ['GET', `/api/cotizador/${theirs._id}/pdf`],
    ['PATCH', `/api/cotizador/${theirs._id}/estado`, { estado: 'anulada' }]
  ]) {
    assert.equal(
      (await server.inject({ method, url, payload, headers: headers(commercial) })).statusCode,
      404,
      `${method} ${url}`
    );
  }
  assert.equal(
    (await server.inject({ method: 'GET', url: `/api/cotizador/${theirs._id}`, headers: headers(accounting) }))
      .statusCode,
    200
  );
  assert.equal(
    (
      await server.inject({
        method: 'PATCH',
        url: `/api/cotizador/${mine._id}/estado`,
        payload: { estado: 'enviada' },
        headers: headers(commercial)
      })
    ).statusCode,
    200
  );
});
