'use strict';
process.env.NODE_ENV = 'test';
process.env.PORT = '3102';
process.env.HOST = '127.0.0.1';
process.env.SERVE_FRONTEND = 'true';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { createServer } = require('../app');
const requests = require('../modules/viaticos/services/solicitudes.repository.service');
const receipts = require('../modules/viaticos/services/repository.service');
const notifications = require('../modules/viaticos/services/notificaciones.service');
const directory = path.resolve(__dirname, '../../docs/evidencias/sprint-2/ui');
const url = 'http://127.0.0.1:3102';
async function run() {
  fs.mkdirSync(directory, { recursive: true });
  const server = await createServer();
  await server.start();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    page.on('pageerror', (error) => console.error('Browser:', error.message));
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.setViewport({ width: 1440, height: 1000 });
    async function set(selector, value) {
      await page.waitForSelector(selector);
      await page.$eval(
        selector,
        (element, text) => {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));
        },
        value
      );
    }
    async function button(text) {
      await page.waitForFunction(
        (label) => [...document.querySelectorAll('button')].some((b) => b.textContent.includes(label) && !b.disabled),
        {},
        text
      );
      await page.evaluate(
        (label) =>
          [...document.querySelectorAll('button')].find((b) => b.textContent.includes(label) && !b.disabled).click(),
        text
      );
    }
    async function contains(text) {
      await page.waitForFunction((value) => document.body.innerText.includes(value), {}, text);
    }
    async function shot(name) {
      await page.screenshot({ path: path.join(directory, name), fullPage: true });
    }
    async function login(user, password) {
      await page.goto(`${url}/login`);
      await set('#username', user);
      await set('#password', password);
      await button('Iniciar sesión');
      await page.waitForFunction(() => location.pathname !== '/login');
    }
    await login('jdiaz', '1234');
    await page.goto(`${url}/cotizador/catalogo`);
    await set('#catalog-query', 'cercha-6-12');
    await button('Buscar');
    await contains('Poste Cercha 6 m');
    await shot('01-catalogo.png');
    await page.$eval('a[href*="codigo="]', (element) => element.click());
    await page.waitForFunction(() => location.pathname === '/cotizador');
    await set('#quote-client', 'Cliente Sprint 2');
    await set('#quote-valid-until', '2099-12-31');
    await button('Calcular');
    await contains('TOTAL A FACTURAR');
    await button('Guardar cotización');
    await contains('Cotización guardada');
    await page.goto(`${url}/cotizador/historial`);
    await button('Duplicar variante');
    await set('#variant-quantity', '2');
    await button('Guardar variante');
    await contains('Variante guardada');
    await shot('02-variante.png');
    const trip = await requests.create({
      consecutivo: 'VIA-S2-001',
      solicitanteLogin: 'jdiaz',
      solicitante: 'Juan Díaz',
      destino: 'Visita de prueba',
      estado: 'aprobada',
      fechaInicio: '2026-10-20',
      fechaFin: '2026-10-21',
      motivo: 'Prueba de integración',
      centroCosto: 'COM',
      gastos: [],
      totalSolicitado: 200000
    });
    await receipts.create({
      solicitudId: trip.id,
      usuarioLogin: 'jdiaz',
      usuario: 'Juan Díaz',
      valor: 150000,
      moneda: 'COP',
      estado: 'aprobado',
      concepto: 'Transporte de prueba',
      fecha: '2026-10-20',
      tipoGasto: 'transporte'
    });
    await notifications.create(trip, 'aprobada');
    await page.goto(`${url}/notificaciones`);
    await contains('VIA-S2-001');
    await button('Marcar como leída');
    await contains('Leída');
    await shot('03-notificaciones.png');
    await page.goto(`${url}/viaticos/legalizacion`);
    await page.waitForSelector('#settlement-request option[value]:not([value=""])');
    await page.select('#settlement-request', trip.id);
    await set('#settlement-advance', '200000');
    await page.$eval('input[type="checkbox"]', (element) => element.click());
    await button('Confirmar legalización');
    await contains('reintegrar');
    await shot('04-legalizacion.png');
    assert.equal((await requests.get(trip.id)).legalizacion.saldo, 50000);
    await button('Cerrar sesión');
    await login('admin', 'AdminDemo2026!');
    await contains('Administrar usuarios');
    await set('#user-name', 'Usuario E2E');
    await set('#user-email', 'e2e@example.com');
    await set('#user-password', 'PasswordPrueba2026!');
    await button('Crear usuario');
    await contains('e2e@example.com');
    await shot('05-usuarios.png');
    await page.setViewport({ width: 390, height: 844 });
    await shot('06-usuarios-movil.png');
    assert.deepEqual(errors, []);
    console.log('E2E_SPRINT2_OK: catálogo, selección, variante, notificación, legalización y usuarios.');
  } finally {
    await browser.close();
    await server.stop();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
