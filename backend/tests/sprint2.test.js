'use strict';
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';
const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const quotes = require('../modules/cotizador/services/cotizaciones.repository.service');
const requests = require('../modules/viaticos/services/solicitudes.repository.service');
const receipts = require('../modules/viaticos/services/repository.service');
const notifications = require('../modules/viaticos/services/notificaciones.service');
const catalog = require('../modules/cotizador/services/catalogo.service');
const users = require('../modules/usuarios.service');
const mail = require('../modules/cotizador/services/envio.service');
let server;
const headers = (rol = 'comercial', usuario = 'jdiaz') => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify({ uid: `dev-${usuario}`, usuario, nombre: usuario, rol }))
});
const input = {
  configuracion: { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: true, cantidad: 1 },
  metadata: { cliente: 'Cliente Sprint 2', vendedor: 'Juan Díaz', vigenciaHasta: '2099-12-31' }
};
const call = (method, url, payload, auth = headers()) => server.inject({ method, url, payload, headers: auth });
async function quote() {
  return (await call('POST', '/api/cotizador', input)).result.data;
}
async function approvedTrip() {
  const trip = await requests.create({
    consecutivo: 'VIA-TEST',
    solicitante: 'Juan Díaz',
    solicitanteLogin: 'jdiaz',
    destino: 'Bogotá',
    fechaInicio: '2026-10-20',
    fechaFin: '2026-10-21',
    motivo: 'Visita técnica',
    centroCosto: 'COM',
    gastos: [],
    totalSolicitado: 200,
    estado: 'aprobada'
  });
  const receipt = await receipts.create({
    usuario: 'Juan Díaz',
    usuarioLogin: 'jdiaz',
    solicitudId: trip.id,
    valor: 150,
    moneda: 'COP',
    estado: 'aprobado',
    concepto: 'Transporte',
    fecha: '2026-10-20',
    tipoGasto: 'transporte'
  });
  return { trip, receipt };
}
beforeEach(async () => {
  quotes.resetMemory();
  requests.resetMemory();
  receipts.resetMemory();
  notifications.reset();
  users.reset();
  catalog.reset();
  server = await createServer();
});
afterEach(async () => {
  await server.stop();
});
test('HU-09 duplica sin alterar original y edita la variante recalculando', async () => {
  const original = await quote();
  const duplicate = await call('POST', `/api/cotizador/${original._id}/duplicar`);
  assert.equal(duplicate.statusCode, 201);
  const variant = duplicate.result.data;
  assert.equal(variant.varianteDe, original._id);
  assert.deepEqual(variant.parametrosAplicados, original.parametrosAplicados);
  const edited = await call('PUT', `/api/cotizador/${variant._id}`, {
    ...input,
    configuracion: { ...input.configuracion, cantidad: 2 }
  });
  assert.equal(edited.statusCode, 200);
  assert.equal(edited.result.data.precios.precioFinal, 2 * original.precios.precioFinal);
  assert.equal((await quotes.getById(original._id)).configuracion.cantidad, 1);
});
test('HU-09 rechaza cantidad inválida, edición ajena o cotización enviada', async () => {
  const original = await quote();
  assert.equal(
    (
      await call('PUT', `/api/cotizador/${original._id}`, {
        ...input,
        configuracion: { ...input.configuracion, cantidad: 0 }
      })
    ).statusCode,
    400
  );
  assert.equal(
    (await call('PUT', `/api/cotizador/${original._id}`, input, headers('comercial', 'otra'))).statusCode,
    403
  );
  await quotes.updateStatus(original._id, 'enviada');
  assert.equal((await call('PUT', `/api/cotizador/${original._id}`, input)).statusCode, 409);
});
test('HU-10 envío confirmado registra destinatario y estado', async (t) => {
  const original = await quote();
  t.mock.method(mail, 'send', async ({ to, pdf }) => {
    assert.ok(pdf.length > 100);
    return { proveedorId: 'test-mail', destinatario: to, fecha: new Date().toISOString() };
  });
  const response = await call('POST', `/api/cotizador/${original._id}/enviar`, { destinatario: 'cliente@example.com' });
  assert.equal(response.statusCode, 200);
  assert.equal(response.result.data.estado, 'enviada');
  assert.equal(response.result.data.envio.destinatario, 'cliente@example.com');
});
test('HU-10 fallo del proveedor conserva borrador y correo inválido se rechaza', async (t) => {
  const original = await quote();
  assert.equal((await call('POST', `/api/cotizador/${original._id}/enviar`, { destinatario: 'mal' })).statusCode, 400);
  t.mock.method(mail, 'send', async () => {
    throw require('@hapi/boom').badGateway('Sin proveedor');
  });
  assert.equal(
    (await call('POST', `/api/cotizador/${original._id}/enviar`, { destinatario: 'cliente@example.com' })).statusCode,
    502
  );
  assert.equal((await quotes.getById(original._id)).estado, 'borrador');
});
test('HU-06 encuentra catálogo sin distinguir mayúsculas y oculta inactivos', async () => {
  const found = await call('GET', '/api/cotizador/configuraciones?q=cercha-6-12');
  assert.ok(found.result.some((item) => item.codigo === 'Cercha-6-12'));
  await call('PATCH', '/api/cotizador/configuraciones/Cercha-6-12', { activo: false }, headers('contabilidad'));
  assert.equal((await call('GET', '/api/cotizador/configuraciones?q=Cercha-6-12')).result.length, 0);
});
test('HU-06 sin resultados y configuración inactiva no se cotiza', async () => {
  assert.equal((await call('GET', '/api/cotizador/configuraciones?q=inexistente')).result.length, 0);
  assert.equal((await call('PATCH', '/api/cotizador/configuraciones/Cercha-6-12', { activo: false })).statusCode, 403);
  await catalog.setActive('Cercha-6-12', false);
  assert.equal((await call('POST', '/api/cotizador', input)).statusCode, 409);
});
test('HU-24 decisión crea notificación personal y permite marcarla leída', async () => {
  const { trip } = await approvedTrip();
  await requests.update(trip.id, { estado: 'enviada' });
  assert.equal(
    (await call('POST', `/api/solicitudes-viaticos/${trip.id}/aprobar`, undefined, headers('contabilidad'))).statusCode,
    200
  );
  const items = (await call('GET', '/api/notificaciones')).result;
  assert.equal(items.length, 1);
  assert.match(items[0].mensaje, /aprobada/);
  const read = await call('PATCH', `/api/notificaciones/${items[0].id}/leer`);
  assert.equal(read.result.leida, true);
});
test('HU-24 no muestra ni permite leer avisos ajenos', async () => {
  const { trip } = await approvedTrip();
  await notifications.create(trip, 'aprobada');
  const items = await notifications.list('jdiaz');
  assert.equal((await call('GET', '/api/notificaciones', undefined, headers('comercial', 'otra'))).result.length, 0);
  assert.equal(
    (await call('PATCH', `/api/notificaciones/${items[0].id}/leer`, undefined, headers('comercial', 'otra')))
      .statusCode,
    404
  );
});
test('HU-26 legaliza con saldo y congela soporte', async () => {
  const { trip, receipt } = await approvedTrip();
  const response = await call('POST', `/api/solicitudes-viaticos/${trip.id}/legalizar`, {
    anticipo: 200,
    soportes: [receipt.id]
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.result.legalizacion.saldo, 50);
  assert.equal(response.result.estado, 'legalizada');
  assert.equal((await call('DELETE', `/api/viaticos/${receipt.id}`)).statusCode, 409);
});
test('HU-26 no legaliza soportes ajenos, duplicados, sin aprobar ni dos veces', async () => {
  const { trip, receipt } = await approvedTrip();
  const url = `/api/solicitudes-viaticos/${trip.id}/legalizar`;
  assert.equal((await call('POST', url, { anticipo: 0, soportes: [receipt.id, receipt.id] })).statusCode, 400);
  assert.equal((await call('POST', url, { anticipo: 0, soportes: ['otro'] })).statusCode, 400);
  await receipts.update(receipt.id, { estado: 'pendiente_revision' });
  assert.equal((await call('POST', url, { anticipo: 0, soportes: [receipt.id] })).statusCode, 409);
  await receipts.update(receipt.id, { estado: 'aprobado' });
  const response = await call('POST', url, { anticipo: 100, soportes: [receipt.id] });
  assert.equal(response.result.legalizacion.resultado, 'reembolsar');
  assert.equal((await call('POST', url, { anticipo: 100, soportes: [receipt.id] })).statusCode, 409);
});
test('HU-25 conserva vínculo del soporte a la solicitud', async () => {
  const { trip } = await approvedTrip();
  const response = await call('POST', '/api/viaticos', {
    solicitudId: trip.id,
    usuario: 'Juan',
    usuarioLogin: 'jdiaz',
    fecha: '2026-10-20',
    valor: 100,
    tipoGasto: 'transporte',
    concepto: 'Taxi'
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.result.solicitudId, trip.id);
});
test('HU-25 rechaza asociación a viaje ajeno o no aprobado', async () => {
  const { trip } = await approvedTrip();
  const payload = {
    solicitudId: trip.id,
    usuario: 'Juan',
    usuarioLogin: 'jdiaz',
    fecha: '2026-10-20',
    valor: 100,
    tipoGasto: 'transporte',
    concepto: 'Taxi'
  };
  assert.equal((await call('POST', '/api/viaticos', payload, headers('comercial', 'otra'))).statusCode, 403);
  await requests.update(trip.id, { estado: 'borrador' });
  assert.equal((await call('POST', '/api/viaticos', payload)).statusCode, 409);
});
test('HU-05 crea usuario y desactivarlo invalida su sesión', async () => {
  const created = await call(
    'POST',
    '/api/usuarios',
    { nombre: 'Usuario prueba', email: 'nuevo@example.com', password: 'ContraseñaSegura123!', rol: 'comercial' },
    headers('admin', 'admin')
  );
  assert.equal(created.statusCode, 201);
  const login = await call('POST', '/api/sesion', { usuario: 'nuevo@example.com', password: 'ContraseñaSegura123!' });
  assert.equal(login.statusCode, 200);
  const token = { authorization: `Bearer ${login.result.token}` };
  assert.equal((await call('GET', '/api/notificaciones', undefined, token)).statusCode, 200);
  await call('PATCH', `/api/usuarios/${created.result.uid}/activo`, { activo: false }, headers('admin', 'admin'));
  assert.equal((await call('GET', '/api/notificaciones', undefined, token)).statusCode, 401);
});
test('HU-05 rechaza administración por comercial, duplicados y autodesactivación', async () => {
  assert.equal((await call('GET', '/api/usuarios')).statusCode, 403);
  assert.equal(
    (await call('PATCH', '/api/usuarios/dev-admin/activo', { activo: false }, headers('admin', 'admin'))).statusCode,
    409
  );
  const payload = {
    nombre: 'Usuario prueba',
    email: 'nuevo@example.com',
    password: 'ContraseñaSegura123!',
    rol: 'comercial'
  };
  await call('POST', '/api/usuarios', payload, headers('admin', 'admin'));
  assert.equal((await call('POST', '/api/usuarios', payload, headers('admin', 'admin'))).statusCode, 409);
});
test('HU-02 cerrar sesión revoca el token y rechaza credenciales inválidas', async () => {
  const login = await call('POST', '/api/sesion', { usuario: 'jdiaz', password: '1234' });
  const auth = { authorization: `Bearer ${login.result.token}` };
  assert.equal((await call('DELETE', '/api/sesion', undefined, auth)).statusCode, 200);
  assert.equal((await call('GET', '/api/notificaciones', undefined, auth)).statusCode, 401);
  assert.equal((await call('POST', '/api/sesion', { usuario: 'jdiaz', password: 'incorrecta' })).statusCode, 401);
});
test('HU-26 dos cierres simultáneos producen una sola legalización', async () => {
  const { trip, receipt } = await approvedTrip();
  const payload = { anticipo: 200, soportes: [receipt.id] };
  const responses = await Promise.all([
    call('POST', `/api/solicitudes-viaticos/${trip.id}/legalizar`, payload),
    call('POST', `/api/solicitudes-viaticos/${trip.id}/legalizar`, payload)
  ]);
  assert.deepEqual(responses.map((response) => response.statusCode).sort(), [200, 409]);
  assert.equal((await notifications.list('jdiaz')).length, 1);
});
test('HU-02 una sesión vencida pierde acceso aunque el token sea válido', (context) => {
  const session = users.login('jdiaz', '1234');
  context.mock.method(Date, 'now', () => session.expiresAt + 1);
  assert.throws(
    () => users.authenticate(session.token),
    (error) => error.output.statusCode === 401
  );
});
test('HU-09 preserva aislamiento por vendedor al duplicar y editar', async () => {
  const original = await quote();
  assert.equal(
    (await call('POST', `/api/cotizador/${original._id}/duplicar`, undefined, headers('comercial', 'lgomez')))
      .statusCode,
    404
  );
  const copied = (await call('POST', `/api/cotizador/${original._id}/duplicar`)).result.data;
  await call('PUT', `/api/cotizador/${copied._id}`, {
    ...input,
    metadata: { ...input.metadata, vendedor: 'Otro vendedor' }
  });
  const edited = (await call('GET', `/api/cotizador/${copied._id}`)).result.data;
  assert.equal(edited.metadata.vendedorLogin, 'jdiaz');
  assert.equal(edited.metadata.vendedor, original.metadata.vendedor);
});
