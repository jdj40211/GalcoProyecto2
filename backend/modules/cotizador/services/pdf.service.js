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

/**
 * Renderiza una cotización (documento ya persistido) como PDF.
 * @param {Object} cot  - documento plano devuelto por Mongoose.lean()
 * @returns {Promise<Buffer>}
 */
async function renderCotizacionPdf(cot) {
  const tpl = getTemplate();

  // Normalizo campos mostrables
  const data = {
    ...cot,
    fecha: new Date(cot.createdAt || Date.now()).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  };

  const html = tpl(data);

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

module.exports = { renderCotizacionPdf };
