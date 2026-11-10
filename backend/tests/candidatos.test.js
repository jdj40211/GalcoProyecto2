'use strict';

// HU-13 (#17) Registrar candidato y HU-31 (#69) rol Recursos Humanos.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const candidates = require('../modules/hojasdevida/services/candidatos.repository.service');
const users = require('../modules/usuarios.service');

let server;
const headers = (rol, usuario) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify({ uid: `dev-${usuario}`, usuario, nombre: `Nombre ${usuario}`, rol }))
});
const hr = headers('rrhh', 'mrestrepo');
const call = (method, url, payload, auth = hr) => server.inject({ method, url, payload, headers: auth });
const valid = (changes = {}) => ({
  tipoIdentificacion: 'CC',
  identificacion: '1.017.234.567',
  nombre: 'Ana María Pérez',
  correo: 'ana.perez@example.com',
  telefono: '300 123 4567',
  ciudad: 'Medellín',
  cargoInteres: 'Auxiliar de producción',
  fuente: 'Referido',
  formacion: [{ titulo: 'Tecnólogo en producción industrial', institucion: 'SENA', nivel: 'Tecnólogo', anio: 2020 }],
  experiencia: [{ cargo: 'Operario', empresa: 'Metálicas S.A.S.', desde: '2021-02', hasta: '2024-06' }],
  certificaciones: [{ nombre: 'Trabajo en alturas', entidad: 'SENA', vencimiento: '2027-03-01' }],
  autorizacionDatos: true,
  ...changes
});

beforeEach(async () => {
  candidates.resetMemory();
  users.reset();
  server = await createServer();
});
afterEach(() => server.stop());

test('CA4 y CA5: registra el candidato con fecha, responsable, estado Registrado y autorización', async () => {
  const response = await call('POST', '/api/candidatos', valid());
  assert.equal(response.statusCode, 201);
  const item = response.result;
  assert.equal(item.estado, 'registrado');
  assert.equal(item.identificacion, '1017234567');
  assert.equal(item.registradoPor.usuario, 'mrestrepo');
  assert.ok(!Number.isNaN(Date.parse(item.createdAt)));
  assert.equal(item.autorizacionDatos.otorgada, true);
  assert.equal(item.autorizacionDatos.registradaPor, 'mrestrepo');
  assert.ok(!Number.isNaN(Date.parse(item.autorizacionDatos.fecha)));
  assert.equal(item.formacion.length, 1);
  // La fecha se guarda tal como llega, sin convertirla a fecha con hora.
  assert.equal(item.certificaciones[0].vencimiento, '2027-03-01');

  const list = await call('GET', '/api/candidatos');
  assert.equal(list.statusCode, 200);
  assert.deepEqual(
    list.result.items.map((candidate) => candidate.nombre),
    ['Ana María Pérez']
  );
});

test('CA5: sin autorización el candidato se registra con la autorización en falso', async () => {
  const response = await call('POST', '/api/candidatos', valid({ autorizacionDatos: false }));
  assert.equal(response.statusCode, 201);
  assert.deepEqual(response.result.autorizacionDatos, { otorgada: false, fecha: null, registradaPor: null });
});

test('CA2: rechaza la misma identificación aunque se escriba con otro formato, y el mismo correo', async () => {
  assert.equal((await call('POST', '/api/candidatos', valid())).statusCode, 201);
  const sameId = await call(
    'POST',
    '/api/candidatos',
    valid({ identificacion: '1017234567', correo: 'otra@example.com' })
  );
  assert.equal(sameId.statusCode, 409);
  assert.match(sameId.result.message, /ya existe/i);
  const sameEmail = await call(
    'POST',
    '/api/candidatos',
    valid({ identificacion: '99887766', correo: 'ANA.PEREZ@example.com' })
  );
  assert.equal(sameEmail.statusCode, 409);
  assert.equal((await call('GET', '/api/candidatos')).result.items.length, 1);
});

test('CA1 y CA3: exige identificación, nombre, cargo y correo o teléfono, con correo válido', async () => {
  for (const changes of [
    { nombre: '' },
    { cargoInteres: '' },
    { identificacion: '' },
    { correo: '', telefono: '' },
    { correo: 'no-es-correo' },
    { experiencia: [{ cargo: 'Operario', empresa: 'X', desde: '2024-06', hasta: '2021-02' }] }
  ]) {
    const response = await call('POST', '/api/candidatos', valid(changes));
    assert.equal(response.statusCode, 400, JSON.stringify(changes));
  }
  const onlyPhone = await call('POST', '/api/candidatos', valid({ correo: '' }));
  assert.equal(onlyPhone.statusCode, 201);
  assert.equal((await call('GET', '/api/candidatos')).result.items.length, 1);
});

test('CA6 y HU-31 CA3: solo RRHH y administración acceden a los candidatos', async () => {
  for (const auth of [headers('comercial', 'jdiaz'), headers('contabilidad', 'acastro')]) {
    assert.equal((await call('GET', '/api/candidatos', undefined, auth)).statusCode, 403);
    assert.equal((await call('POST', '/api/candidatos', valid(), auth)).statusCode, 403);
  }
  assert.equal((await call('POST', '/api/candidatos', valid(), headers('admin', 'admin'))).statusCode, 201);
});

test('HU-31 CA2: RRHH no usa los módulos de viáticos ni del cotizador', async () => {
  for (const url of ['/api/solicitudes-viaticos', '/api/viaticos', '/api/notificaciones', '/api/cotizador']) {
    assert.equal((await call('GET', url)).statusCode, 403, url);
  }
  assert.equal(
    (await call('GET', '/api/solicitudes-viaticos', undefined, headers('comercial', 'jdiaz'))).statusCode,
    200
  );
});

test('HU-31 CA1: el administrador crea una cuenta RRHH que inicia sesión con ese rol', async () => {
  const login = await call('POST', '/api/sesion', { usuario: 'admin', password: 'AdminDemo2026!' }, {});
  const admin = { authorization: `Bearer ${login.result.token}` };
  const created = await call(
    'POST',
    '/api/usuarios',
    { nombre: 'Persona RRHH', email: 'rrhh.nueva@example.com', password: 'ClaveSegura2026', rol: 'rrhh' },
    admin
  );
  assert.equal(created.statusCode, 201);
  assert.equal(created.result.rol, 'rrhh');
  const session = await call(
    'POST',
    '/api/sesion',
    { usuario: 'rrhh.nueva@example.com', password: 'ClaveSegura2026' },
    {}
  );
  assert.equal(session.result.user.rol, 'rrhh');
  const bearer = { authorization: `Bearer ${session.result.token}` };
  assert.equal((await call('GET', '/api/candidatos', undefined, bearer)).statusCode, 200);
  assert.equal((await call('GET', '/api/solicitudes-viaticos', undefined, bearer)).statusCode, 403);
});
