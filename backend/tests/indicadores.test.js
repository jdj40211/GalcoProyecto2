'use strict';

process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const test = require('node:test');
const assert = require('node:assert/strict');
const { calcularIndicadores, puedeCambiar } = require('../modules/cotizador/services/indicadores.service');
const { createServer } = require('../app');
const repository = require('../modules/cotizador/services/cotizaciones.repository.service');

const commercial = { uid: 'dev-jdiaz', nombre: 'Juan Díaz', usuario: 'jdiaz', rol: 'comercial' };
const otherSeller = { uid: 'dev-lgomez', nombre: 'Laura Gómez', usuario: 'lgomez', rol: 'comercial' };
const accounting = { uid: 'dev-acastro', nombre: 'Andrés Castro', usuario: 'acastro', rol: 'contabilidad' };
const headers = (user) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify(user))
});
const configuration = { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: true, cantidad: 1 };

const at = (iso) => new Date(iso);
const quote = (estado, precioFinal, historial, extra = {}) => ({
  estado,
  createdAt: historial[0]?.fecha || at('2026-10-01T08:00:00Z'),
  precios: { precioFinal },
  metadata: { vendedor: 'Juan Díaz' },
  configuracion: { tipoPoste: 'Cercha' },
  historialEstados: historial,
  ...extra
});

test('el flujo de estados sigue el proceso comercial documentado', () => {
  assert.equal(puedeCambiar('borrador', 'enviada'), true);
  assert.equal(puedeCambiar('enviada', 'aprobada'), true);
  assert.equal(puedeCambiar('enviada', 'rechazada'), true);
  // Una cotización entregada por otro medio se decide directamente desde borrador.
  assert.equal(puedeCambiar('borrador', 'aprobada'), true);
  assert.equal(puedeCambiar('enviada', 'borrador'), false);
  assert.equal(puedeCambiar('aprobada', 'anulada'), false);
  assert.equal(puedeCambiar('rechazada', 'enviada'), false);
});

test('los indicadores miden resultados y tiempos de respuesta', () => {
  const result = calcularIndicadores([
    // Enviada 4 h después de crearla y aprobada 2 días después de enviarla.
    quote('aprobada', 1000, [
      { estado: 'borrador', fecha: at('2026-10-01T08:00:00Z') },
      { estado: 'enviada', fecha: at('2026-10-01T12:00:00Z') },
      { estado: 'aprobada', fecha: at('2026-10-03T12:00:00Z') }
    ]),
    // Enviada 8 h después y rechazada 1 día después.
    quote('rechazada', 500, [
      { estado: 'borrador', fecha: at('2026-10-02T08:00:00Z') },
      { estado: 'enviada', fecha: at('2026-10-02T16:00:00Z') },
      { estado: 'rechazada', fecha: at('2026-10-03T16:00:00Z') }
    ]),
    quote('borrador', 300, [{ estado: 'borrador', fecha: at('2026-11-05T08:00:00Z') }], {
      metadata: { vendedor: 'Laura Gómez' },
      configuracion: { tipoPoste: 'L' }
    }),
    // Cotización migrada sin historial: cuenta en totales, no en tiempos.
    quote('aprobada', 200, [], { createdAt: at('2026-09-02T11:49:13Z') })
  ]);
  assert.equal(result.total, 4);
  assert.equal(result.valorTotal, 2000);
  assert.equal(result.valorAprobado, 1200);
  assert.equal(result.tasaAprobacion, 66.7);
  assert.equal(result.tiempoRespuestaHoras, 6);
  assert.equal(result.tiempoDecisionHoras, 36);
  assert.deepEqual(result.porEstado.aprobada, { cantidad: 2, valor: 1200 });
  assert.deepEqual(
    result.porMes.map((mes) => [mes.nombre, mes.cantidad]),
    [
      ['2026-09', 1],
      ['2026-10', 2],
      ['2026-11', 1]
    ]
  );
  assert.deepEqual(result.porVendedor[0], {
    nombre: 'Juan Díaz',
    cantidad: 3,
    valor: 1700,
    aprobadas: 2,
    rechazadas: 1
  });
  assert.equal(result.porTipoPoste.find((tipo) => tipo.nombre === 'L').cantidad, 1);
});

test('sin cotizaciones decididas la tasa de aprobación queda vacía', () => {
  const result = calcularIndicadores([]);
  assert.equal(result.total, 0);
  assert.equal(result.tasaAprobacion, null);
  assert.equal(result.tiempoRespuestaHoras, null);
});

test('la API registra el historial, valida el flujo y calcula indicadores por rol', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());
  const create = async (user, cliente) =>
    JSON.parse(
      (
        await server.inject({
          method: 'POST',
          url: '/api/cotizador',
          headers: headers(user),
          payload: { configuracion: configuration, metadata: { cliente } }
        })
      ).payload
    ).data;
  const change = (user, id, estado) =>
    server.inject({ method: 'PATCH', url: `/api/cotizador/${id}/estado`, headers: headers(user), payload: { estado } });

  const mine = await create(commercial, 'Cliente A');
  await create(otherSeller, 'Cliente B');
  assert.deepEqual(
    mine.historialEstados.map((item) => [item.estado, item.usuario]),
    [['borrador', 'Juan Díaz']]
  );

  // Reglas de main: "enviada" solo por correo confirmado y la decisión la registra Contabilidad.
  assert.equal((await change(accounting, mine._id, 'enviada')).statusCode, 400);
  assert.equal((await change(commercial, mine._id, 'aprobada')).statusCode, 403);
  const mail = require('../modules/cotizador/services/envio.service');
  t.mock.method(mail, 'send', async ({ to }) => ({
    proveedorId: 'test',
    destinatario: to,
    fecha: new Date().toISOString()
  }));
  const sent = await server.inject({
    method: 'POST',
    url: `/api/cotizador/${mine._id}/enviar`,
    headers: headers(commercial),
    payload: { destinatario: 'cliente@example.com' }
  });
  assert.equal(sent.statusCode, 200);
  const approved = JSON.parse((await change(accounting, mine._id, 'aprobada')).payload).data;
  assert.deepEqual(
    approved.historialEstados.map((item) => [item.estado, item.usuario]),
    [
      ['borrador', 'Juan Díaz'],
      ['enviada', 'Juan Díaz'],
      ['aprobada', 'Andrés Castro']
    ]
  );
  const reopened = await change(accounting, mine._id, 'anulada');
  assert.equal(reopened.statusCode, 409);

  const indicators = async (user, query = '') =>
    JSON.parse(
      (await server.inject({ method: 'GET', url: `/api/cotizador/indicadores${query}`, headers: headers(user) }))
        .payload
    ).data;
  const own = await indicators(commercial);
  assert.equal(own.total, 1);
  assert.equal(own.tasaAprobacion, 100);
  assert.equal(typeof own.tiempoRespuestaHoras, 'number');
  assert.equal((await indicators(accounting)).total, 2);
  assert.deepEqual((await indicators(accounting)).porVendedor.map((item) => item.nombre).sort(), [
    'Juan Díaz',
    'Laura Gómez'
  ]);
  assert.equal((await indicators(accounting, '?desde=2000-01-01&hasta=2000-12-31')).total, 0);
  const today = new Date().toLocaleDateString('en-CA');
  assert.equal((await indicators(accounting, `?desde=${today}&hasta=${today}`)).total, 2);
  const invalid = await server.inject({
    method: 'GET',
    url: '/api/cotizador/indicadores?desde=20-10-2026',
    headers: headers(accounting)
  });
  assert.equal(invalid.statusCode, 400);
});

test('el envío por correo y las variantes respetan el historial de estados', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());
  const mail = require('../modules/cotizador/services/envio.service');
  t.mock.method(mail, 'send', async ({ to }) => ({
    proveedorId: 'test-mail',
    destinatario: to,
    fecha: new Date().toISOString()
  }));
  const original = JSON.parse(
    (
      await server.inject({
        method: 'POST',
        url: '/api/cotizador',
        headers: headers(commercial),
        payload: { configuracion: configuration, metadata: { cliente: 'Cliente correo' } }
      })
    ).payload
  ).data;

  // Una variante empieza su propio historial: no hereda las fechas de la original.
  const variant = JSON.parse(
    (
      await server.inject({
        method: 'POST',
        url: `/api/cotizador/${original._id}/duplicar`,
        headers: headers(commercial)
      })
    ).payload
  ).data;
  assert.deepEqual(
    variant.historialEstados.map((item) => item.estado),
    ['borrador']
  );
  assert.ok(new Date(variant.historialEstados[0].fecha) >= new Date(original.historialEstados[0].fecha));

  const sent = await server.inject({
    method: 'POST',
    url: `/api/cotizador/${original._id}/enviar`,
    headers: headers(commercial),
    payload: { destinatario: 'cliente@example.com' }
  });
  assert.equal(sent.statusCode, 200);
  const data = JSON.parse(sent.payload).data;
  assert.equal(data.estado, 'enviada');
  assert.equal(data.envio.destinatario, 'cliente@example.com');
  assert.deepEqual(
    data.historialEstados.map((item) => [item.estado, item.usuario]),
    [
      ['borrador', 'Juan Díaz'],
      ['enviada', 'Juan Díaz']
    ]
  );
  const indicators = JSON.parse(
    (await server.inject({ method: 'GET', url: '/api/cotizador/indicadores', headers: headers(commercial) })).payload
  ).data;
  assert.equal(indicators.porEstado.enviada.cantidad, 1);
  assert.equal(typeof indicators.tiempoRespuestaHoras, 'number');
});
