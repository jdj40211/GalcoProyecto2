'use strict';

// #62: con `npm start` el directorio de trabajo es backend/ y la interfaz respondía 403,
// porque @hapi/inert confina los archivos al directorio de trabajo por defecto.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';
process.env.SERVE_FRONTEND = 'true';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createServer } = require('../app');

// El frontend compilado vive fuera del directorio de trabajo, como frontend/dist frente a backend/.
function buildFrontend(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'galco-frontend-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dist = path.join(root, 'dist');
  fs.mkdirSync(path.join(dist, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>Galco</title>');
  fs.writeFileSync(path.join(dist, 'assets', 'app.js'), 'console.log("galco");');
  fs.writeFileSync(path.join(root, 'secreto.txt'), 'SECRETO');
  return dist;
}

test('sirve la interfaz cuando el directorio de trabajo no contiene el frontend', async (t) => {
  const frontendDirectory = buildFrontend(t);
  const fromWorkingDirectory = path.relative(process.cwd(), frontendDirectory);
  assert.ok(fromWorkingDirectory.startsWith('..') || path.isAbsolute(fromWorkingDirectory));
  const server = await createServer({ frontendDirectory });
  t.after(() => server.stop());

  for (const url of ['/', '/login', '/cotizador/historial']) {
    const response = await server.inject(url);
    assert.equal(response.statusCode, 200, url);
    assert.match(response.headers['content-type'], /text\/html/, url);
    assert.match(response.payload, /<title>Galco<\/title>/, url);
  }

  const asset = await server.inject('/assets/app.js');
  assert.equal(asset.statusCode, 200);
  assert.match(asset.headers['content-type'], /javascript/);
  assert.equal(asset.payload, 'console.log("galco");');
});

test('no publica archivos fuera del frontend ni oculta los errores de la API', async (t) => {
  const server = await createServer({ frontendDirectory: buildFrontend(t) });
  t.after(() => server.stop());

  for (const url of ['/..%2Fsecreto.txt', '/assets/..%2F..%2Fsecreto.txt', '/%2e%2e/secreto.txt']) {
    const response = await server.inject(url);
    assert.doesNotMatch(response.payload, /SECRETO/, url);
  }

  const missingApi = await server.inject('/api/no-existe');
  assert.equal(missingApi.statusCode, 404);
  assert.equal((await server.inject('/api/health')).statusCode, 200);
});
