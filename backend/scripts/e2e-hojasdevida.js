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
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');
const { createServer } = require('../app');
const candidates = require('../modules/hojasdevida/services/candidatos.repository.service');
const storage = require('../modules/hojasdevida/services/documentos.storage.service');
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

    // HU-14: adjuntar la hoja de vida, rechazar un formato no permitido y descargar.
    const files = fs.mkdtempSync(path.join(os.tmpdir(), 'galco-e2e-'));
    const resume = path.join(files, 'Hoja de vida Ana Pérez.pdf');
    const resumeBytes = Buffer.from('%PDF-1.7\nHoja de vida de prueba\n%%EOF\n');
    fs.writeFileSync(resume, resumeBytes);
    const executable = path.join(files, 'programa.exe');
    fs.writeFileSync(executable, 'MZ ejecutable');
    try {
      await button('Documentos (0)');
      await contains('Sin documentos');
      const input = await page.waitForSelector('#document-file');
      await input.uploadFile(executable);
      await button('Adjuntar documento');
      await page.waitForFunction(() =>
        document.querySelector('.modal .alert.error')?.textContent.includes('PDF, DOC o DOCX')
      );
      await input.uploadFile(resume);
      await button('Adjuntar documento');
      await contains('quedó adjunto a Ana María Pérez');
      await contains('Hoja de vida Ana Pérez.pdf');
      const [withDocument] = await candidates.list();
      assert.equal(withDocument.documentos.length, 1);
      assert.equal(withDocument.documentos[0].cargadoPor, 'mrestrepo');
      assert.ok((await storage.read(withDocument.documentos[0].archivoId)).equals(resumeBytes));
      await button('Descargar');
      assert.equal(await page.$('.modal .alert.error'), null);
      await shot('04-documentos-candidato.png');
      // El botón del diálogo, no "Cerrar sesión" del menú lateral.
      await page.click('.modal .modal-actions .btn-outline');
      await page.waitForFunction(() => !document.querySelector('.modal'));
      await contains('Documentos (1)');

      // HU-28: la IA propone, RRHH corrige y confirma; nada se guarda antes de confirmar.
      await button('Documentos (1)');
      await button('Analizar con IA');
      await page.waitForFunction(() => /^\/candidatos\/[^/]+\/analisis\/[^/]+$/.test(location.pathname));
      await contains('Revisar análisis de hoja de vida');
      await contains('pendiente de revisión');
      await page.waitForSelector('#review-name');
      assert.equal(await page.$eval('#review-phone', (element) => element.classList.contains('input-missing')), true);
      assert.equal((await candidates.list())[0].nombre, 'Ana María Pérez', 'sin confirmar, la ficha no cambia');
      await set('#review-name', 'Ana María Pérez Gómez');
      await set('#review-phone', '300 123 4567');
      await shot('05-revision-analisis.png');
      await button('Confirmar datos');
      await page.waitForFunction(() => location.pathname === '/candidatos');
      await contains('quedaron confirmados');
      const [reviewed] = await candidates.list();
      assert.equal(reviewed.nombre, 'Ana María Pérez Gómez');
      assert.equal(reviewed.telefono, '300 123 4567');
      assert.ok(reviewed.experiencia.length > 0 && reviewed.anosExperiencia > 0);
      assert.equal(reviewed.analisis[0].estado, 'confirmado');
      assert.deepEqual(reviewed.analisis[0].correcciones.map((item) => item.campo).sort(), ['nombre', 'telefono']);
    } finally {
      fs.rmSync(files, { recursive: true, force: true });
    }

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
    console.log(
      'E2E_HOJASDEVIDA_OK: rol RRHH, registro, validaciones, duplicado, documentos, análisis con IA y permisos.'
    );
  } finally {
    await browser.close();
    await server.stop();
  }
}
run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
