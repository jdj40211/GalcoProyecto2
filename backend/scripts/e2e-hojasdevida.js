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
const vacancies = require('../modules/hojasdevida/services/vacantes.repository.service');
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
    // Los avisos emergentes se ocultan solo durante la captura: en las evidencias tapaban el contenido.
    async function shot(name) {
      await page
        .addStyleTag({ content: '.toast-stack { visibility: hidden !important; }' })
        .then((tag) =>
          page
            .screenshot({ path: path.join(directory, name), fullPage: true })
            .finally(() => tag.evaluate((element) => element.remove()))
        );
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

    // El registro manual vive en un desplegable desde HU-34: se abre como lo haría RRHH.
    await page.$eval('details', (element) => {
      element.open = true;
    });
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
    await page.$eval('details input[type="checkbox"]', (element) => element.click());
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

    // HU-29: crear, versionar y cerrar una vacante.
    // Botón por su texto exacto dentro de la tabla: "Cerrar" no debe confundirse con "Cerrar sesión".
    const tableButton = (text) =>
      page.evaluate(
        (label) => [...document.querySelectorAll('table button')].find((b) => b.textContent.trim() === label).click(),
        text
      );
    await page.click('a[href="/vacantes"]');
    await contains('No hay vacantes');
    await set('#vacancy-position', 'Soldador');
    await page.select('#vacancy-education', 'Técnico');
    await set('#vacancy-years', '2');
    await set('#vacancy-required-certs', 'Trabajo en alturas');
    await set('#vacancy-skills', 'Soldadura MIG, Lectura de planos');
    await set('#vacancy-weight-experiencia', '15');
    await contains('Total: 90 / 100');
    await button('Crear vacante');
    await page.waitForFunction(() => document.querySelector('.alert.error')?.textContent.includes('faltan 10 puntos'));
    assert.equal((await vacancies.list()).length, 0);
    await set('#vacancy-weight-experiencia', '25');
    await button('Crear vacante');
    await contains('quedó abierta');
    await contains('v1');
    await tableButton('Editar');
    await contains('Editar vacante: Soldador');
    await set('#vacancy-years', '3');
    await button('Guardar cambios');
    await contains('quedó en la versión 2');

    // HU-30: evaluar a la candidata del flujo, ver el ranking, el detalle y el filtro.
    const rankingLink = 'a[href^="/vacantes/"][href$="/ranking"]';
    await page.click(rankingLink);
    await contains('Ranking: Soldador');
    await contains('Sin candidatos evaluados');
    const [person] = await candidates.list();
    await page.select('#ranking-candidate', person.id);
    await button('Evaluar');
    await contains('Evaluación con');
    await contains('Ana María Pérez Gómez');
    const [evaluated] = await candidates.list();
    const [evaluation] = evaluated.evaluaciones;
    assert.equal(evaluation.vigente, true);
    assert.equal(evaluation.vacanteVersion, 2);
    assert.equal(evaluated.estado, 'registrado', 'evaluar no cambia la etapa');
    assert.ok(
      evaluation.puntaje > 0 && evaluation.cumpleObligatorios,
      JSON.stringify(evaluation.obligatoriosIncumplidos)
    );
    await contains(`${evaluation.puntaje} / 100`);
    await page.select('#ranking-filter', 'true');
    await contains('1 candidato(s)');
    await button('Ver detalle');
    await contains('Justificación');
    await contains('Nivel más alto');
    await shot('07-ranking-detalle.png');
    await page.click('.modal .modal-actions .btn-outline:last-child');
    await page.waitForFunction(() => !document.querySelector('.modal'));

    // HU-34: subir dos hojas de vida a la vez para la vacante, revisar y confirmar una, descartar la otra.
    const resumes = fs.mkdtempSync(path.join(os.tmpdir(), 'galco-e2e-hv-'));
    try {
      const resumePaths = ['HV_01_laura.pdf', 'HV_02_andres.pdf'].map((name) => {
        const file = path.join(resumes, name);
        fs.writeFileSync(file, '%PDF-1.7\nHoja de vida de prueba\n%%EOF\n');
        return file;
      });
      await page.click('a[href="/candidatos"]');
      await contains('Registrar candidatos');
      const [vacancyRow] = await vacancies.list();
      await page.select('#batch-vacancy', vacancyRow.id);
      const batchInput = await page.waitForSelector('#batch-files');
      await batchInput.uploadFile(...resumePaths);
      await page.$eval('#batch-consent', (element) => element.click());
      await button('Analizar hojas de vida');
      await contains('2 de 2 hoja(s) de vida quedaron pendientes de revisión');
      await contains('Pendientes de revisión (2)');
      assert.equal((await candidates.list()).filter((item) => item.estado === 'pendiente_revision').length, 2);
      await shot('08-registro-desde-hv.png');

      // Revisar y confirmar la primera, sin identificación del archivo y agregándola al revisar.
      await page.click('a[href^="/candidatos/"][href*="/analisis/"]');
      await contains('Aplica a');
      await page.waitForSelector('#review-id');
      await set('#review-id', '1.017.555.000');
      await shot('09-revision-pendiente.png');
      await set('#review-name', 'Laura Marcela Restrepo');
      await set('#review-email', 'laura.restrepo@example.com');
      await button('Confirmar datos');
      await page.waitForFunction(() => location.pathname === '/candidatos');
      await contains('quedó registrado:');
      await contains('Pendientes de revisión (1)');
      const laura = (await candidates.list()).find((item) => item.nombre === 'Laura Marcela Restrepo');
      assert.equal(laura.estado, 'registrado');
      assert.equal(laura.identificacion, '1017555000');
      assert.equal(laura.cargoInteres, 'Soldador');
      assert.equal(laura.evaluaciones.length, 1, 'quedó evaluada contra su vacante');

      // Descartar la segunda: desaparece con su hoja de vida.
      await button('Descartar');
      await contains('Esta acción no se puede deshacer');
      await page.click('.modal .btn-danger');
      await contains('Hoja de vida descartada');
      assert.equal((await candidates.list()).filter((item) => item.estado === 'pendiente_revision').length, 0);
      assert.equal(
        await page.evaluate(() => document.body.innerText.includes('Pendientes de revisión')),
        false,
        'sin pendientes no se muestra la sección'
      );
    } finally {
      fs.rmSync(resumes, { recursive: true, force: true });
    }

    await page.click('a[href="/vacantes"]');
    await contains('Crear vacante');
    await tableButton('Cerrar');
    await contains('no admitirá nuevas evaluaciones');
    await button('Cerrar vacante');
    await contains('quedó cerrada');
    const [vacancy] = await vacancies.list();
    assert.equal(vacancy.estado, 'cerrada');
    assert.equal(vacancy.version, 2);
    assert.deepEqual(vacancy.certificacionesObligatorias, ['Trabajo en alturas']);
    assert.deepEqual(
      vacancy.historial.map((entry) => entry.accion),
      ['creada', 'modificada', 'cerrada']
    );
    assert.equal(
      await page.evaluate(() =>
        [...document.querySelectorAll('table button')].some((b) => b.textContent.trim() === 'Editar')
      ),
      false,
      'una vacante cerrada no muestra acciones'
    );
    await shot('06-vacantes.png');
    // HU-29 CP-03: el ranking de una vacante cerrada se consulta, pero no admite evaluar.
    await page.click(rankingLink);
    await contains('no admite nuevas evaluaciones');
    assert.equal(await page.$eval('#ranking-candidate', (element) => element.disabled), true);

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
      'E2E_HOJASDEVIDA_OK: rol RRHH, registro, validaciones, duplicado, documentos, análisis con IA, vacantes, ranking, registro desde hojas de vida y permisos.'
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
