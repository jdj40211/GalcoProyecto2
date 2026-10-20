'use strict';

process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'false';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const test = require('node:test');
const assert = require('node:assert/strict');
const firebase = require('../utils/firebase');

// Simula Firebase Admin: cada token de prueba corresponde a un usuario decodificado.
const tokens = {
  comercial: { uid: 'u1', email: 'jdiaz@galco.com.co', name: 'Juan Díaz', usuario: 'jdiaz', role: 'comercial' },
  contabilidad: {
    uid: 'u2',
    email: 'acastro@galco.com.co',
    name: 'Andrés Castro',
    usuario: 'acastro',
    role: 'contabilidad'
  },
  'sin-rol': { uid: 'u3', email: 'intruso@example.com' }
};
firebase.auth = () => ({
  verifyIdToken: async (token) => {
    if (!tokens[token]) throw new Error('invalid token');
    return tokens[token];
  }
});

const { createServer } = require('../app');
const repository = require('../modules/viaticos/services/repository.service');
const bearer = (token) => ({ authorization: `Bearer ${token}` });

test('Firebase: exige token válido y rol asignado', async (t) => {
  const server = await createServer();
  t.after(() => server.stop());
  assert.equal((await server.inject({ method: 'GET', url: '/api/viaticos' })).statusCode, 401);
  assert.equal(
    (await server.inject({ method: 'GET', url: '/api/viaticos', headers: bearer('falso') })).statusCode,
    401
  );
  const noRole = await server.inject({ method: 'GET', url: '/api/viaticos', headers: bearer('sin-rol') });
  assert.equal(noRole.statusCode, 403);
  assert.match(JSON.parse(noRole.payload).message, /rol asignado/);
});

test('Firebase: el rol y el usuario salen del token, no de la cabecera de desarrollo', async (t) => {
  repository.resetMemory();
  const server = await createServer();
  t.after(() => server.stop());
  const spoofed = { 'x-dev-user': encodeURIComponent(JSON.stringify({ usuario: 'acastro', rol: 'contabilidad' })) };
  const created = await server.inject({
    method: 'POST',
    url: '/api/viaticos',
    headers: { ...bearer('comercial'), ...spoofed },
    payload: {
      usuario: 'x',
      usuarioLogin: 'x',
      fecha: '2026-10-20',
      valor: 39400,
      tipoGasto: 'alimentacion',
      concepto: 'Almuerzo'
    }
  });
  assert.equal(created.statusCode, 200);
  const record = JSON.parse(created.payload);
  assert.equal(record.usuarioLogin, 'jdiaz');
  assert.equal(record.usuario, 'Juan Díaz');
  const forbidden = await server.inject({
    method: 'POST',
    url: `/api/viaticos/${record.id}/approve`,
    headers: { ...bearer('comercial'), ...spoofed }
  });
  assert.equal(forbidden.statusCode, 403);
  const approved = await server.inject({
    method: 'POST',
    url: `/api/viaticos/${record.id}/approve`,
    headers: bearer('contabilidad')
  });
  assert.equal(approved.statusCode, 200);
});
