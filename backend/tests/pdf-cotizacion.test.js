'use strict';

// Bug #63: el PDF salía con la nota de AIU sin cifras y con "Versión:" vacío.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../app');
const quotes = require('../modules/cotizador/services/cotizaciones.repository.service');
const { renderHtml } = require('../modules/cotizador/services/pdf.service');

let server;
const headers = {
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(
    JSON.stringify({ uid: 'dev-jdiaz', usuario: 'jdiaz', nombre: 'jdiaz', rol: 'comercial' })
  )
};
const input = {
  configuracion: { tipoPoste: 'Cercha', altura: 6, brazo: 12, pintura: true, cantidad: 1 },
  metadata: { cliente: 'Cliente bug 63', vendedor: 'Juan Díaz', vigenciaHasta: '2099-12-31' }
};
// El texto del PDF sin etiquetas ni espacios repetidos, como lo leería el cliente.
const text = (html) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
const note = (html) => text(html).match(/Precios calculados[^.]*\./)?.[0] ?? '';

beforeEach(async () => {
  quotes.resetMemory();
  server = await createServer();
});
afterEach(() => server.stop());

test('#63: una cotización nueva muestra su versión y la nota de AIU con cifras', async () => {
  const created = (await server.inject({ method: 'POST', url: '/api/cotizador', payload: input, headers })).result.data;
  assert.equal(created.version, 1, 'la cotización nace en la versión 1');
  const html = renderHtml(created);
  assert.match(text(html), /Versión: 1\b/);
  const aiu = note(html);
  assert.doesNotMatch(aiu, /de %|y %|\s%/, `la nota no debe tener porcentajes vacíos: "${aiu}"`);
  assert.match(aiu, /\d+(,\d+)?% sobre materiales/);
});

test('#63: con la estructura de cuatro rubros, la nota usa los porcentajes aplicados', () => {
  const html = renderHtml({
    consecutivo: 'COT-2026-0001',
    version: 3,
    configuracion: { pintura: true },
    metadata: { cliente: 'X' },
    parametrosAplicados: {
      aiuMateriales: 30,
      aiuMOInterna: 55,
      aiuMOExterna: 40,
      aiuGalvanizado: 0,
      costoGalvanizadoPorKg: 3050,
      costoPorM2Pintura: 18000
    }
  });
  assert.match(text(html), /Versión: 3\b/);
  assert.equal(
    note(html),
    'Precios calculados con AIU de 30% sobre materiales (tubos y platinas), 0% sobre galvanizado y 40% sobre pintura.'
  );
});

test('#63: las cotizaciones antiguas (dos rubros, sin versión) también salen completas', () => {
  const html = renderHtml({
    consecutivo: 'COT-2025-0001',
    configuracion: { pintura: false },
    metadata: { cliente: 'X' },
    parametrosAplicados: { aiuMateriaPrimaYMOInterna: 55, aiuManoObraExterna: 45.5, costoGalvanizadoPorKg: 3050 }
  });
  assert.match(text(html), /Versión: 1\b/, 'sin versión guardada se muestra la 1');
  assert.equal(
    note(html),
    'Precios calculados con AIU de 55% sobre materia prima, galvanizado y MO interna, y 45,5% sobre pintura.'
  );
});
