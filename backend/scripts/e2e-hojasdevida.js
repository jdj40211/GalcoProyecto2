'use strict';
// Recorrido en navegador de HU-13 (registrar candidato) y HU-31 (rol Recursos Humanos).
process.env.NODE_ENV = 'test';
process.env.PORT = '3103';
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
const candidates = require('../modules/hojasdevida/services/candidatos.repository.service');
const directory = path.resolve(__dirname, '../../docs/evidencias/sprint-3/ui');
const url = 'http://127.0.0.1:3103';

async function run() {
  fs.mkdirSync(directory, { recursive: true });
  const server = await createServer();
  await server.start();
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  try {
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
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
    const pathname = () => page.evaluate(() => location.pathname);
    const alertText = () => page.$eval('.alert.error', (element) => element.textContent.trim());

    // HU-31 CA2: Recursos Humanos entra directo a candidatos y solo ve ese módulo.
    await login('mrestrepo', 'Rrhh2026!');
    assert.equal(await pathname(), '/candidatos');
    await contains('No hay candidatos');
    await contains('Recursos Humanos');
    const menu = await page.$eval('.nav-menu', (element) => element.innerText);
    assert.match(menu, /Candidatos/);
    assert.doesNotMatch(menu, /Solicitudes de viaje|Cotizador|Usuarios/i);
    await shot('01-candidatos-vacio.png');

    // CA1: sin correo ni teléfono no se registra.
    await set('#candidate-id', '1.017.234.567');
    await set('#candidate-name', 'Ana María Pérez');
    await set('#candidate-position', 'Auxiliar de producción');
    await button('Registrar candidato');
    await page.waitForSelector('.alert.error');
    assert.match(await alertText(), /correo o un teléfono/);

    // Experiencia con fechas invertidas: el navegador marca el campo y no envía nada.
    await set('#candidate-email', 'ana.perez@example.com');
    await button('Agregar experiencia');
    await set('#experience-position-0', 'Operaria');
    await set('#experience-company-0', 'Metálicas S.A.S.');
    await set('#experience-from-0', '2024-06');
    await set('#experience-to-0', '2021-02');
    await button('Registrar candidato');
    assert.equal(await page.$eval('#experience-to-0', (element) => element.validity.rangeUnderflow), true);
    assert.equal((await candidates.list()).length, 0);

    // CA4 y CA5: registro válido con formación, certificación y autorización de datos.
    await set('#experience-to-0', '2025-02');
    await button('Agregar formación');
    await set('#education-title-0', 'Tecnóloga en producción industrial');
    await set('#education-school-0', 'SENA');
    await button('Agregar certificación');
    await set('#certification-name-0', 'Trabajo en alturas');
    await page.$eval('input[type="checkbox"]', (element) => element.click());
    await button('Registrar candidato');
    await contains('quedó registrado como candidato');
    await contains('CC 1017234567');
    await contains('Registrado');
    assert.equal(await page.$('.alert.error'), null);
    const [saved] = await candidates.list();
    assert.equal(saved.autorizacionDatos.otorgada, true);
    assert.equal(saved.experiencia[0].hasta, '2025-02');
    assert.equal(saved.formacion[0].institucion, 'SENA');
    assert.equal(saved.registradoPor.usuario, 'mrestrepo');
    await shot('02-candidato-registrado.png');

    // CA2: la misma identificación con otro formato se rechaza y se informa.
    await set('#candidate-id', '1017234567');
    await set('#candidate-name', 'Otra Persona');
    await set('#candidate-email', 'otra@example.com');
    await set('#candidate-position', 'Soldador');
    await button('Registrar candidato');
    await page.waitForFunction(() => document.querySelector('.alert.error')?.textContent.includes('Ya existe'));
    assert.equal((await candidates.list()).length, 1);
    await page.setViewport({ width: 390, height: 844 });
    await shot('03-candidatos-movil.png');
    await page.setViewport({ width: 1440, height: 1000 });

    // HU-31 CA2: RRHH no entra a viáticos; un comercial no entra a candidatos.
    await page.goto(`${url}/viaticos/solicitudes`);
    await page.waitForFunction(() => location.pathname === '/candidatos');
    await button('Cerrar sesión');
    await login('jdiaz', '1234');
    await page.goto(`${url}/candidatos`);
    await page.waitForFunction(() => location.pathname === '/carga');
    assert.doesNotMatch(await page.$eval('.nav-menu', (element) => element.innerText), /Candidatos/);

    assert.deepEqual(errors, []);
    console.log('E2E_HOJASDEVIDA_OK: rol RRHH, registro, validaciones, duplicado y permisos.');
  } finally {
    await browser.close();
    await server.stop();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
