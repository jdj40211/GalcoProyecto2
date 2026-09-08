'use strict';

const Boom = require('@hapi/boom');
const config = require('../../../config');
const types = ['alimentacion', 'transporte', 'hospedaje', 'combustible', 'peajes', 'parqueadero', 'papeleria', 'otros'];
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const empty = () => ({
  fecha: '',
  valor: '',
  subtotal: '',
  impuestos: '',
  nit: '',
  numeroDocumento: '',
  proveedor: '',
  moneda: 'COP',
  ciudad: '',
  metodoPago: '',
  tipoGasto: '',
  concepto: ''
});
const pending = (data) =>
  [
    'fecha',
    'valor',
    'subtotal',
    'impuestos',
    'nit',
    'numeroDocumento',
    'proveedor',
    'moneda',
    'tipoGasto',
    'concepto'
  ].filter((field) => data[field] === '' || data[field] == null);
const normalize = (raw = {}) => {
  const data = Object.fromEntries(Object.keys(empty()).map((field) => [field, raw[field] ?? empty()[field]]));
  data.valor = Number(data.valor) || '';
  data.subtotal = Number(data.subtotal) || '';
  data.impuestos = Number(data.impuestos) || 0;
  data.moneda = data.moneda || 'COP';
  if (!types.includes(data.tipoGasto)) data.tipoGasto = 'otros';
  const level = raw.nivelConfianza || 'media';
  const confianzaCampos = Object.fromEntries(
    Object.keys(data).map((field) => [
      field,
      raw.confianzaCampos?.[field] || (data[field] === '' || data[field] == null ? 'baja' : level)
    ])
  );
  return {
    datos: data,
    camposPendientes: pending(data),
    confianzaCampos,
    nivelConfianza: level,
    textoCrudo: raw.textoCrudo || ''
  };
};

function decodedSize(dataUrl) {
  const base64 = String(dataUrl).split(',')[1] || '';
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

function timeout(promise) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('El procesamiento superó el tiempo máximo.')), config.ocr.timeoutMs);
    })
  ]).finally(() => clearTimeout(timer));
}

async function demo() {
  await new Promise((resolve) => setTimeout(resolve, 450));
  return normalize({
    fecha: new Date().toISOString().slice(0, 10),
    subtotal: 155462,
    impuestos: 29538,
    valor: 185000,
    nit: '901234567-8',
    numeroDocumento: 'FE-1024',
    proveedor: 'Proveedor de ejemplo S.A.S.',
    moneda: 'COP',
    ciudad: 'Medellín',
    metodoPago: 'Tarjeta',
    tipoGasto: 'alimentacion',
    concepto: 'Alimentación durante visita comercial',
    nivelConfianza: 'alta'
  });
}

function extractJson(text) {
  const cleaned = String(text || '')
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/i, '')
    .trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end < 0) throw new Error('El proveedor OCR no devolvió JSON válido.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

async function openai(payload) {
  if (!config.ocr.openaiKey) throw new Error('OPENAI_API_KEY no está configurada en el backend.');
  const prompt = `Extrae los datos de este comprobante colombiano y responde solamente JSON con: fecha (YYYY-MM-DD), subtotal, impuestos, valor total (en la propiedad valor), moneda, nit, numeroDocumento, proveedor, ciudad, metodoPago, tipoGasto (${types.join(', ')}), concepto, nivelConfianza (alta, media o baja) y confianzaCampos (objeto con una confianza alta, media o baja por cada campo). Usa cadenas vacías para datos ausentes.`;
  const attachment =
    payload.fileType === 'application/pdf'
      ? { type: 'input_file', filename: payload.fileName, file_data: payload.fileDataUrl }
      : { type: 'input_image', image_url: payload.fileDataUrl };
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.ocr.openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ocr.openaiModel,
      input: [{ role: 'user', content: [{ type: 'input_text', text: prompt }, attachment] }]
    })
  });
  if (!response.ok) throw new Error(`OpenAI respondió ${response.status}.`);
  const body = await response.json();
  const text =
    body.output_text ||
    body.output?.flatMap((item) => item.content || []).find((item) => item.type === 'output_text')?.text;
  return normalize(extractJson(text));
}

function parseText(text) {
  const data = empty();
  const date = text.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/) || text.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (date) data.fecha = date[0];
  const nit = text.match(/NIT[._:\s]*([\d.-]{6,})/i);
  if (nit) data.nit = nit[1];
  const totalLine =
    text
      .split(/\r?\n/)
      .filter((line) => /total/i.test(line))
      .pop() || '';
  const amount = totalLine.match(/\$?\s*([\d.,]+)/g)?.pop();
  if (amount) data.valor = Number(amount.replace(/[^\d]/g, '')) || '';
  data.moneda = /USD|US\$/i.test(text) ? 'USD' : 'COP';
  const normalized = text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const keywordMap = {
    alimentacion: ['restaurante', 'almuerzo', 'comida'],
    transporte: ['taxi', 'uber', 'bus', 'transporte'],
    hospedaje: ['hotel', 'hospedaje'],
    combustible: ['gasolina', 'combustible', 'acpm'],
    peajes: ['peaje'],
    parqueadero: ['parqueadero'],
    papeleria: ['papeleria', 'impresion']
  };
  data.tipoGasto =
    Object.keys(keywordMap).find((key) => keywordMap[key].some((word) => normalized.includes(word))) || 'otros';
  data.concepto =
    text
      .split(/\r?\n/)
      .find((line) => line.trim().length > 12 && /[a-záéíóúñ]/i.test(line))
      ?.trim() || '';
  return normalize({ ...data, textoCrudo: text, nivelConfianza: 'media' });
}

async function ocrspace(payload) {
  if (!config.ocr.ocrspaceKey) throw new Error('OCRSPACE_API_KEY no está configurada.');
  const form = new FormData();
  form.set('apikey', config.ocr.ocrspaceKey);
  form.set('language', 'spa');
  form.set('base64Image', payload.fileDataUrl);
  form.set('isOverlayRequired', 'false');
  const response = await fetch('https://api.ocr.space/parse/image', { method: 'POST', body: form });
  if (!response.ok) throw new Error(`OCR.space respondió ${response.status}.`);
  const body = await response.json();
  if (body.IsErroredOnProcessing) throw new Error(body.ErrorMessage?.[0] || 'OCR.space no pudo procesar el archivo.');
  return parseText((body.ParsedResults || []).map((item) => item.ParsedText).join('\n'));
}

async function custom(payload) {
  if (!config.ocr.customEndpoint) throw new Error('CUSTOM_OCR_ENDPOINT no está configurado.');
  const response = await fetch(config.ocr.customEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.ocr.customToken ? { Authorization: `Bearer ${config.ocr.customToken}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(`El OCR personalizado respondió ${response.status}.`);
  return normalize(await response.json());
}

module.exports = {
  extract: (payload) => {
    if (decodedSize(payload.fileDataUrl) > MAX_FILE_BYTES)
      throw Boom.badRequest('El soporte supera el tamaño máximo de 10 MB.');
    return timeout(
      config.ocr.provider === 'openai'
        ? openai(payload)
        : config.ocr.provider === 'ocrspace'
          ? ocrspace(payload)
          : config.ocr.provider === 'custom'
            ? custom(payload)
            : demo()
    );
  }
};
