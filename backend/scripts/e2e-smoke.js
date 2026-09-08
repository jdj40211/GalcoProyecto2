'use strict';

process.env.NODE_ENV = 'test';
process.env.PORT = process.env.E2E_PORT || '3101';
process.env.HOST = '127.0.0.1';
process.env.SERVE_FRONTEND = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.AUTH_BYPASS = 'true';
process.env.OCR_PROVIDER = 'demo';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { createServer } = require('../app');

const root = path.resolve(__dirname, '..', '..');
const evidenceDirectory = path.join(root, 'docs', 'evidencias', 'sprint-1', 'ui');
const baseUrl = `http://127.0.0.1:${process.env.PORT}`;

async function clickButton(page, text) {
  await page.waitForFunction(
    (label) =>
      [...document.querySelectorAll('button')].some(
        (item) =>
          (item.textContent.trim().includes(label) || item.getAttribute('aria-label') === label) && !item.disabled
      ),
    {},
    text
  );
  const clicked = await page.evaluate((label) => {
    const button = [...document.querySelectorAll('button')].find(
      (item) => item.textContent.trim().includes(label) || item.getAttribute('aria-label') === label
    );
    if (!button || button.disabled) return false;
    button.click();
    return true;
  }, text);
  assert.equal(clicked, true, `No se encontró un botón disponible: ${text}`);
}

async function waitForText(page, text) {
  await page.waitForFunction((expected) => document.body.innerText.includes(expected), {}, text);
}

async function setValue(page, selector, value) {
  await page.$eval(
    selector,
    (element, nextValue) => {
      const descriptor = Object.getOwnPropertyDescriptor(element.constructor.prototype, 'value');
      descriptor.set.call(element, nextValue);
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    },
    value
  );
}

async function login(page, username, password) {
  await setValue(page, '#username', username);
  await setValue(page, '#password', password);
  await clickButton(page, 'Iniciar sesión');
}

async function screenshot(page, filename, fullPage = true) {
  await page.screenshot({ path: path.join(evidenceDirectory, filename), fullPage });
}

async function run() {
  fs.mkdirSync(evidenceDirectory, { recursive: true });
  const server = await createServer();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    await server.start();
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#username');
    await screenshot(page, '01-login.png', false);

    await login(page, 'usuario-invalido', 'incorrecta');
    await waitForText(page, 'Usuario o contraseña incorrectos.');
    assert.equal(new URL(page.url()).pathname, '/login');

    await login(page, 'jdiaz', '1234');
    await page.waitForFunction(() => new URL(location.href).pathname === '/carga');
    await waitForText(page, 'Subir comprobante');

    await page.goto(`${baseUrl}/cotizador`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#quote-client');
    await setValue(page, '#quote-type', 'L');
    await page.waitForFunction(() => document.querySelector('#quote-arm')?.tagName === 'INPUT');
    await setValue(page, '#quote-type', 'Cercha');
    await page.waitForFunction(() => document.querySelector('#quote-arm')?.tagName === 'SELECT');
    await setValue(page, '#quote-seller', 'Juan Díaz');
    await setValue(page, '#quote-client', 'Cliente de prueba Sprint 1');
    await setValue(page, '#quote-valid-until', '2026-09-30');
    await clickButton(page, 'Calcular');
    await waitForText(page, 'TOTAL A FACTURAR');
    await setValue(page, '#quote-client', 'Cliente de prueba Sprint 1');
    await clickButton(page, 'Guardar cotización');
    await waitForText(page, 'Cotización guardada: COT-');
    await waitForText(page, 'Descargar PDF');
    await screenshot(page, '02-cotizacion-guardada.png');
    const pdfResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/pdf') && response.status() === 200
    );
    await clickButton(page, 'Descargar PDF');
    const pdfResponse = await pdfResponsePromise;
    assert.match(pdfResponse.headers()['content-type'] || '', /application\/pdf/);

    await page.goto(`${baseUrl}/viaticos/solicitudes`, { waitUntil: 'networkidle0' });
    await page.waitForSelector('#request-destination');
    await setValue(page, '#request-destination', 'Medellín - Planta cliente');
    await setValue(page, '#request-cost-center', 'COM-001');
    await setValue(page, '#request-start', '2026-09-15');
    await setValue(page, '#request-end', '2026-09-14');
    await setValue(page, '#request-reason', 'Visita técnica de validación con cliente');
    await setValue(page, '#expense-description-0', 'Transporte terrestre');
    await setValue(page, '#expense-value-0', '85000');
    await clickButton(page, 'Guardar borrador');
    await waitForText(page, 'La fecha final no puede ser anterior');
    await setValue(page, '#request-end', '2026-09-16');
    await clickButton(page, 'Agregar gasto');
    await setValue(page, '#expense-description-1', 'Alimentación');
    await setValue(page, '#expense-value-1', '65000');
    const totalText = await page.$eval('.request-summary strong', (element) => element.textContent);
    assert.match(totalText, /150[.\s]?000/, `El total visible no corresponde a los gastos: ${totalText}`);
    await clickButton(page, 'Guardar borrador');
    await waitForText(page, 'guardada como borrador');
    await screenshot(page, '03-solicitud-borrador.png');
    await clickButton(page, 'Enviar a aprobación');
    await waitForText(page, 'enviada a aprobación');
    await waitForText(page, 'Enviada');

    await page.goto(`${baseUrl}/carga`, { waitUntil: 'networkidle0' });
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(path.join(root, 'README.md'));
    await waitForText(page, 'Formato no permitido');
    await fileInput.uploadFile(path.join(root, 'frontend', 'public', 'logo-galco.png'));
    await waitForText(page, 'logo-galco.png');
    await clickButton(page, 'Procesar con IA / OCR');
    await page.waitForFunction(() => new URL(location.href).pathname === '/validacion');
    await waitForText(page, 'Confianza');
    await setValue(page, '#concepto', 'Soporte de prueba corregido');
    await screenshot(page, '04-validacion-ocr.png');
    await clickButton(page, 'Confirmar información');
    await page.waitForFunction(() => new URL(location.href).pathname === '/resultado');
    await waitForText(page, 'enviado a revisión');
    const viaticos = await page.evaluate(async () => {
      const user = JSON.parse(sessionStorage.getItem('galco.viaticos.session'));
      const response = await fetch('/api/viaticos', {
        headers: {
          Authorization: 'Bearer dev-token',
          'X-Dev-User': encodeURIComponent(JSON.stringify(user))
        }
      });
      return response.json();
    });
    assert.equal(
      viaticos.items[0].correcciones.some((item) => item.campo === 'concepto'),
      true
    );

    await clickButton(page, 'Cerrar sesión');
    await page.waitForFunction(() => new URL(location.href).pathname === '/login');
    await login(page, 'acastro', 'conta2024');
    await page.waitForFunction(() => new URL(location.href).pathname === '/contabilidad');
    await page.goto(`${baseUrl}/viaticos/solicitudes`, { waitUntil: 'networkidle0' });
    await waitForText(page, 'VIA-2026-');
    await clickButton(page, 'Aprobar solicitud');
    await waitForText(page, 'aprobada.');
    await waitForText(page, 'Aprobada');
    await screenshot(page, '05-solicitud-aprobada.png');

    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto(`${baseUrl}/dashboard`, { waitUntil: 'networkidle0' });
    await waitForText(page, 'Dashboard de análisis');
    await screenshot(page, '06-dashboard-movil.png');

    process.stdout.write('E2E_UI_OK: login, cotización, solicitud, OCR, aprobación y vista móvil.\n');
  } finally {
    await browser.close();
    await server.stop();
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
