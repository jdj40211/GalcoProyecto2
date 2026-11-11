/**
 * pdf.service.js
 *
 * Genera el PDF de una cotización usando:
 *   - handlebars para pintar el HTML a partir del template
 *   - Puppeteer para renderizar ese HTML a PDF con Chrome headless
 *
 * El template vive en backend/templates/cotizacion.hbs.
 * Se compila una sola vez y se cachea en memoria.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const Handlebars = require('handlebars');
const puppeteer = require('puppeteer');
const { money, decimal } = require('../../../utils/format');

// ---------------------------------------------------------------------------
// Handlebars helpers
// ---------------------------------------------------------------------------
Handlebars.registerHelper('f_money', (v) => money(v));
Handlebars.registerHelper('f_decimal', (v, d) => decimal(v, Number.isInteger(d) ? d : 2));

let compiled = null;
function getTemplate() {
  if (compiled) return compiled;
  const tplPath = path.join(__dirname, '..', '..', '..', 'templates', 'cotizacion.hbs');
  const src = fs.readFileSync(tplPath, 'utf8');
  compiled = Handlebars.compile(src);
  return compiled;
}

const percent = (value) => `${Number(value).toLocaleString('es-CO', { maximumFractionDigits: 2 })}%`;

// Bug #63: la nota describe la estructura de AIU con la que se calculó la cotización. Las nuevas usan
// cuatro rubros (calculos.service.js); las anteriores a P0.2 conservan los dos rubros del Excel v3.
// La MO interna no se menciona porque hoy su costo es $0 y no cambia el precio.
function notaAIU(parametros = {}) {
  if (parametros.aiuMateriales != null)
    return (
      `Precios calculados con AIU de ${percent(parametros.aiuMateriales)} sobre materiales (tubos y platinas), ` +
      `${percent(parametros.aiuGalvanizado ?? 0)} sobre galvanizado y ${percent(parametros.aiuMOExterna)} sobre pintura.`
    );
  if (parametros.aiuMateriaPrimaYMOInterna != null)
    return (
      `Precios calculados con AIU de ${percent(parametros.aiuMateriaPrimaYMOInterna)} sobre materia prima, ` +
      `galvanizado y MO interna, y ${percent(parametros.aiuManoObraExterna)} sobre pintura.`
    );
  return '';
}

/**
 * Pinta el HTML de la cotización. Separado de Puppeteer para poder probar el contenido del PDF.
 * @param {Object} cot  - documento plano devuelto por Mongoose.lean()
 * @returns {string}
 */
function renderHtml(cot) {
  return getTemplate()({
    ...cot,
    // Las cotizaciones creadas antes de guardar la versión son la versión 1.
    version: cot.version || 1,
    notaAIU: notaAIU(cot.parametrosAplicados),
    fecha: new Date(cot.createdAt || Date.now()).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  });
}

/**
 * Renderiza una cotización (documento ya persistido) como PDF.
 * @param {Object} cot  - documento plano devuelto por Mongoose.lean()
 * @returns {Promise<Buffer>}
 */
async function renderCotizacionPdf(cot) {
  const html = renderHtml(cot);

  const options = {
    format: 'A4',
    printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '14mm', right: '14mm' }
  };

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const bytes = await page.pdf(options);
    return Buffer.from(bytes);
  } finally {
    await browser.close();
  }
}

module.exports = { renderCotizacionPdf, renderHtml, notaAIU };
