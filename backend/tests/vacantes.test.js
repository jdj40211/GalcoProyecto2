'use strict';

// HU-29 (#67) Definir el perfil de la vacante.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const vacancies = require('../modules/hojasdevida/services/vacantes.service');
const repository = require('../modules/hojasdevida/services/vacantes.repository.service');

let server;
const headers = (rol, usuario) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify({ uid: `dev-${usuario}`, usuario, nombre: `Nombre ${usuario}`, rol }))
});
const hr = headers('rrhh', 'mrestrepo');
const call = (method, url, payload, auth = hr) => server.inject({ method, url, payload, headers: auth });
const valid = (changes = {}) => ({
  cargo: 'Soldador',
  area: 'Producción',
  ciudad: 'Medellín',
  formacionMinima: 'Técnico',
  experienciaMinima: 2,
  certificacionesObligatorias: ['Trabajo en alturas'],
  certificacionesDeseables: ['Soldadura certificada AWS'],
  habilidades: ['Soldadura MIG', 'Lectura de planos'],
  pesos: { formacion: 20, experiencia: 40, certificaciones: 20, habilidades: 20 },
  ...changes
});

beforeEach(async () => {
  repository.resetMemory();
  server = await createServer();
});
afterEach(() => server.stop());

test('CP-01: crea una vacante abierta, versión 1, con quién la creó', async () => {
  const response = await call('POST', '/api/vacantes', valid());
  assert.equal(response.statusCode, 201);
  const vacancy = response.result;
  assert.equal(vacancy.estado, 'abierta');
  assert.equal(vacancy.version, 1);
  assert.equal(vacancy.creadoPor, 'mrestrepo');
  assert.deepEqual(vacancy.pesos, { formacion: 20, experiencia: 40, certificaciones: 20, habilidades: 20 });
  assert.equal(vacancy.historial.length, 1);
  assert.equal(vacancy.historial[0].accion, 'creada');

  const list = await call('GET', '/api/vacantes');
  assert.deepEqual(
    list.result.items.map((item) => item.cargo),
    ['Soldador']
  );
  assert.equal((await call('GET', `/api/vacantes/${vacancy.id}`)).result.cargo, 'Soldador');
});

test('CP-02 y CA2: los pesos deben sumar 100 y se indica la diferencia', async () => {
  const short = await call(
    'POST',
    '/api/vacantes',
    valid({ pesos: { formacion: 20, experiencia: 30, certificaciones: 20, habilidades: 20 } })
  );
  assert.equal(short.statusCode, 400);
  assert.match(short.result.message, /suman 90: faltan 10 puntos/);
  const over = await call(
    'POST',
    '/api/vacantes',
    valid({ pesos: { formacion: 30, experiencia: 40, certificaciones: 20, habilidades: 20 } })
  );
  assert.equal(over.statusCode, 400);
  assert.match(over.result.message, /suman 110: sobran 10 puntos/);
  assert.equal((await call('GET', '/api/vacantes')).result.items.length, 0);
});

test('CA1: exige cargo, formación mínima de la escala y años mínimos de experiencia', async () => {
  for (const changes of [
    { cargo: '' },
    { formacionMinima: '' },
    { formacionMinima: 'Experto' },
    { experienciaMinima: -1 }
  ]) {
    assert.equal((await call('POST', '/api/vacantes', valid(changes))).statusCode, 400, JSON.stringify(changes));
  }
  const withoutYears = valid();
  delete withoutYears.experienciaMinima;
  assert.equal((await call('POST', '/api/vacantes', withoutYears)).statusCode, 400);
});

test('CA4: cada cambio sube la versión y queda en el historial con fecha, usuario y campos', async () => {
  const vacancy = (await call('POST', '/api/vacantes', valid())).result;
  const updated = await call(
    'PUT',
    `/api/vacantes/${vacancy.id}`,
    valid({ experienciaMinima: 3, pesos: { formacion: 20, experiencia: 50, certificaciones: 10, habilidades: 20 } }),
    headers('admin', 'admin')
  );
  assert.equal(updated.statusCode, 200);
  assert.equal(updated.result.version, 2);
  assert.equal(updated.result.experienciaMinima, 3);
  const [, change] = updated.result.historial;
  assert.equal(change.accion, 'modificada');
  assert.equal(change.version, 2);
  assert.equal(change.usuario, 'admin');
  assert.ok(!Number.isNaN(Date.parse(change.fecha)));
  assert.deepEqual(change.campos.sort(), ['experienciaMinima', 'pesos']);

  const same = await call(
    'PUT',
    `/api/vacantes/${vacancy.id}`,
    valid({ experienciaMinima: 3, pesos: updated.result.pesos })
  );
  assert.equal(same.result.version, 2, 'guardar sin cambios no crea una versión nueva');
});

test('CA3: una vacante cerrada se consulta, pero no se modifica ni admite evaluaciones', async () => {
  const vacancy = (await call('POST', '/api/vacantes', valid())).result;
  const closed = await call('POST', `/api/vacantes/${vacancy.id}/cerrar`);
  assert.equal(closed.statusCode, 200);
  assert.equal(closed.result.estado, 'cerrada');
  assert.equal(closed.result.historial.at(-1).accion, 'cerrada');
  assert.equal((await call('GET', `/api/vacantes/${vacancy.id}`)).result.estado, 'cerrada');
  const edit = await call('PUT', `/api/vacantes/${vacancy.id}`, valid({ cargo: 'Otro cargo' }));
  assert.equal(edit.statusCode, 409);
  assert.equal((await call('POST', `/api/vacantes/${vacancy.id}/cerrar`)).statusCode, 409);
  await assert.rejects(vacancies.openForEvaluation(vacancy.id), (error) => {
    assert.equal(error.output.statusCode, 409);
    assert.match(error.message, /cerrada/);
    return true;
  });
  assert.equal(
    (await vacancies.openForEvaluation((await call('POST', '/api/vacantes', valid())).result.id)).estado,
    'abierta'
  );
});

test('CP-04 y CA5: solo RRHH y administración gestionan vacantes', async () => {
  const vacancy = (await call('POST', '/api/vacantes', valid())).result;
  for (const auth of [headers('comercial', 'jdiaz'), headers('contabilidad', 'acastro')]) {
    assert.equal((await call('POST', '/api/vacantes', valid(), auth)).statusCode, 403);
    assert.equal((await call('PUT', `/api/vacantes/${vacancy.id}`, valid(), auth)).statusCode, 403);
    assert.equal((await call('POST', `/api/vacantes/${vacancy.id}/cerrar`, undefined, auth)).statusCode, 403);
    assert.equal((await call('GET', '/api/vacantes', undefined, auth)).statusCode, 403);
  }
  assert.equal((await call('GET', '/api/vacantes/no-existe')).statusCode, 404);
  assert.equal((await call('PUT', '/api/vacantes/no-existe', valid())).statusCode, 404);
});
