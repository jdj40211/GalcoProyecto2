'use strict';

const Boom = require('@hapi/boom');
const config = require('../../../config');
const types = ['alimentacion', 'transporte', 'hospedaje', 'combustible', 'peajes', 'parqueadero', 'papeleria', 'otros'];
const typeLabels = {
  alimentacion: 'Alimentación',
  transporte: 'Transporte',
  hospedaje: 'Hospedaje',
  combustible: 'Combustible',
  peajes: 'Peajes',
  parqueadero: 'Parqueadero',
  papeleria: 'Papelería',
  otros: 'Otros'
};
const confidenceLevels = ['alta', 'media', 'baja'];
const currencies = ['COP', 'USD', 'EUR'];
const months = {
  ene: 1,
  feb: 2,
  mar: 3,
  abr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  sep: 9,
  set: 9,
  oct: 10,
  nov: 11,
  dic: 12
};
const MAX_FILE_BYTES = 10 * 1024 * 1024;

const fold = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
const clean = (value, max) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
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

function toIsoDate(year, month, day) {
  const y = Number(year) < 100 ? Number(year) + 2000 : Number(year);
  const date = new Date(Date.UTC(y, Number(month) - 1, Number(day)));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== Number(month) - 1 || date.getUTCDate() !== Number(day))
    return '';
  return date.toISOString().slice(0, 10);
}

// Acepta YYYY-MM-DD, DD/MM/YYYY, DD-MM-YY y "15 de marzo de 2026". En Colombia el día va antes del mes.
function parseDate(value) {
  const text = fold(value);
  let match = text.match(/\b(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?!\d)/);
  if (match) return toIsoDate(match[1], match[2], match[3]);
  match = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})\b/);
  if (match) return toIsoDate(match[3], match[2], match[1]);
  match = text.match(/\b(\d{1,2})(?:\s+de)?[\s\-/.]+([a-z]{3})[a-z]*\.?(?:\s+de(?:l)?)?[\s\-/.]+(\d{4}|\d{2})\b/);
  if (match && months[match[2]]) return toIsoDate(match[3], months[match[2]], match[1]);
  return '';
}

// "$ 39.400,00", "39.400" y "1.250.000" son montos colombianos: el punto separa miles y la coma decimales.
function parseAmount(value, { allowZero = false } = {}) {
  const valid = (amount) => (amount > 0 || (allowZero && amount === 0) ? Math.round(amount * 100) / 100 : '');
  if (typeof value === 'number') return Number.isFinite(value) ? valid(value) : '';
  const text = String(value ?? '').replace(/[^\d.,]/g, '');
  if (!/\d/.test(text)) return '';
  const separator = Math.max(text.lastIndexOf('.'), text.lastIndexOf(','));
  const tail = text.slice(separator + 1);
  const mixed = text.includes('.') && text.includes(',');
  const repeated = separator >= 0 && text.indexOf(text[separator]) !== separator;
  const isDecimal = separator >= 0 && (mixed || (!repeated && tail.length > 0 && tail.length !== 3));
  return valid(
    isDecimal ? Number(`${text.slice(0, separator).replace(/\D/g, '')}.${tail}`) : Number(text.replace(/\D/g, ''))
  );
}

function parseNit(value) {
  const nit = String(value ?? '')
    .replace(/[^\d-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return /\d/.test(nit) ? nit.slice(0, 80) : '';
}

const expenseType = (value) => {
  const key = fold(value).trim();
  return types.find((type) => type === key || type === `${key}s`) || '';
};
const currency = (value) => {
  const code = clean(value, 10).toUpperCase();
  return currencies.includes(code) ? code : 'COP';
};

const normalize = (raw = {}) => {
  const data = {
    fecha: parseDate(raw.fecha),
    valor: parseAmount(raw.valor),
    subtotal: parseAmount(raw.subtotal),
    // Un comprobante sin impuestos discriminados vale 0, no queda pendiente.
    impuestos: parseAmount(raw.impuestos, { allowZero: true }) || 0,
    nit: parseNit(raw.nit),
    numeroDocumento: clean(raw.numeroDocumento, 100),
    proveedor: clean(raw.proveedor, 180),
    moneda: currency(raw.moneda),
    ciudad: clean(raw.ciudad, 120),
    metodoPago: clean(raw.metodoPago, 120),
    tipoGasto: expenseType(raw.tipoGasto),
    concepto: clean(raw.concepto, 500)
  };
  const level = confidenceLevels.includes(raw.nivelConfianza) ? raw.nivelConfianza : 'media';
  const nivelConfianza = data.fecha && data.valor ? level : 'baja';
  const confianzaCampos = Object.fromEntries(
    Object.keys(data).map((field) => {
      if (data[field] === '' || data[field] == null) return [field, 'baja'];
      const reported = raw.confianzaCampos?.[field];
      return [field, confidenceLevels.includes(reported) ? reported : nivelConfianza];
    })
  );
  return {
    datos: data,
    camposPendientes: pending(data),
    confianzaCampos,
    nivelConfianza,
    textoCrudo: raw.textoCrudo || ''
  };
};

function decodedSize(dataUrl) {
  const base64 = String(dataUrl).split(',')[1] || '';
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

async function request(provider, url, options) {
  try {
    return await fetch(url, { ...options, signal: AbortSignal.timeout(config.ocr.timeoutMs) });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError')
      throw Boom.gatewayTimeout(`${provider} superó el tiempo máximo de ${Math.round(config.ocr.timeoutMs / 1000)} s.`);
    throw Boom.badGateway(`No fue posible conectar con ${provider}: ${error.message}`);
  }
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
  if (start < 0 || end < 0) throw Boom.badGateway('El proveedor OCR no devolvió JSON válido.');
  try {
    return JSON.parse(cleaned.slice(start, end + 1));
  } catch {
    throw Boom.badGateway('El proveedor OCR no devolvió JSON válido.');
  }
}

const openaiInstructions = `Eres un asistente contable que extrae datos de comprobantes de gasto colombianos: facturas electrónicas, tiquetes POS, recibos de caja, peajes, parqueaderos, taxis y estaciones de combustible.
Reglas:
- fecha: fecha de emisión o de compra en formato YYYY-MM-DD. En Colombia las fechas se escriben día/mes/año.
- valor: total final pagado, con IVA, impoconsumo y propina si aparecen. Nunca uses el subtotal. El punto separa miles y la coma decimales: "$ 39.400,00" es 39400.
- subtotal: valor antes de impuestos; null si no aparece.
- impuestos: suma de IVA, impoconsumo y otros impuestos discriminados; 0 si el comprobante no los discrimina.
- nit: NIT del emisor o vendedor, no del cliente, con dígito de verificación si aparece (ejemplo 890900608-9).
- numeroDocumento: número de la factura, tiquete o recibo, con su prefijo (ejemplo FE-1024).
- proveedor: razón social o nombre comercial del emisor.
- moneda: código ISO de la moneda (COP salvo que el comprobante indique otra).
- ciudad: ciudad donde se emitió el comprobante.
- metodoPago: Efectivo, Tarjeta débito, Tarjeta crédito, Transferencia, Nequi, Daviplata u otro que aparezca en el comprobante.
- tipoGasto: alimentacion (restaurantes, cafeterías, comidas), transporte (taxis, aplicaciones, buses, tiquetes aéreos o terrestres), hospedaje (hoteles), combustible (gasolina, ACPM), peajes, parqueadero, papeleria (útiles, impresiones, fotocopias) u otros.
- concepto: descripción breve en español, máximo 120 caracteres, de lo que se compró.
- nivelConfianza: alta si el documento es legible y encontraste fecha, valor y proveedor; media si tuviste que deducir algún dato; baja si es borroso, está incompleto o no parece un comprobante.
- confianzaCampos: para cada campo, alta si se lee con claridad, media si lo dedujiste y baja si es dudoso o no aparece.
Si un dato no aparece o no es legible, usa cadena vacía (o null en los montos). No inventes datos.`;

const extractedFields = [
  'fecha',
  'valor',
  'subtotal',
  'impuestos',
  'nit',
  'numeroDocumento',
  'proveedor',
  'moneda',
  'ciudad',
  'metodoPago',
  'tipoGasto',
  'concepto'
];
const openaiSchema = {
  type: 'object',
  additionalProperties: false,
  required: [...extractedFields, 'nivelConfianza', 'confianzaCampos'],
  properties: {
    fecha: { type: 'string', description: 'YYYY-MM-DD o cadena vacía.' },
    valor: { type: ['number', 'null'], description: 'Total pagado.' },
    subtotal: { type: ['number', 'null'] },
    impuestos: { type: ['number', 'null'] },
    nit: { type: 'string' },
    numeroDocumento: { type: 'string' },
    proveedor: { type: 'string' },
    moneda: { type: 'string', enum: currencies },
    ciudad: { type: 'string' },
    metodoPago: { type: 'string' },
    tipoGasto: { type: 'string', enum: [...types, ''] },
    concepto: { type: 'string' },
    nivelConfianza: { type: 'string', enum: confidenceLevels },
    confianzaCampos: {
      type: 'object',
      additionalProperties: false,
      required: extractedFields,
      properties: Object.fromEntries(
        extractedFields.map((field) => [field, { type: 'string', enum: confidenceLevels }])
      )
    }
  }
};

async function openaiError(response) {
  let detail = '';
  try {
    detail = (await response.json()).error?.message || '';
  } catch {
    /* respuesta sin cuerpo JSON */
  }
  if (response.status === 401)
    return Boom.badGateway('OpenAI rechazó la clave configurada. Revisa OPENAI_API_KEY en backend/.env.');
  if (response.status === 429)
    return Boom.badGateway(
      `OpenAI rechazó la solicitud por límite de uso o saldo insuficiente.${detail ? ` ${detail}` : ''}`
    );
  return Boom.badGateway(`OpenAI respondió ${response.status}${detail ? `: ${detail}` : '.'}`);
}

async function openai(payload) {
  if (!config.ocr.openaiKey) throw Boom.serverUnavailable('OPENAI_API_KEY no está configurada en backend/.env.');
  const attachment =
    payload.fileType === 'application/pdf'
      ? { type: 'input_file', filename: payload.fileName, file_data: payload.fileDataUrl }
      : { type: 'input_image', image_url: payload.fileDataUrl, detail: 'high' };
  const response = await request('OpenAI', 'https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.ocr.openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ocr.openaiModel,
      instructions: openaiInstructions,
      store: false,
      input: [
        { role: 'user', content: [{ type: 'input_text', text: 'Extrae los datos de este comprobante.' }, attachment] }
      ],
      text: { format: { type: 'json_schema', name: 'comprobante', strict: true, schema: openaiSchema } }
    })
  });
  if (!response.ok) throw await openaiError(response);
  const body = await response.json();
  const content = (body.output || []).filter((item) => item.type === 'message').flatMap((item) => item.content || []);
  const refusal = content.find((item) => item.type === 'refusal');
  if (refusal) throw Boom.badGateway(`OpenAI no procesó el comprobante: ${refusal.refusal}`);
  const text = body.output_text || content.find((item) => item.type === 'output_text')?.text;
  if (body.status === 'incomplete' || !text)
    throw Boom.badGateway('OpenAI no devolvió una respuesta completa. Intenta de nuevo.');
  return normalize(extractJson(text));
}

const cities = [
  'Medellín',
  'Bogotá',
  'Cali',
  'Barranquilla',
  'Cartagena',
  'Bucaramanga',
  'Pereira',
  'Manizales',
  'Armenia',
  'Cúcuta',
  'Ibagué',
  'Santa Marta',
  'Villavicencio',
  'Pasto',
  'Montería',
  'Neiva',
  'Popayán',
  'Tunja',
  'Valledupar',
  'Sincelejo',
  'Riohacha',
  'Yopal',
  'Quibdó',
  'Florencia',
  'Leticia',
  'Rionegro',
  'Envigado',
  'Itagüí',
  'Sabaneta',
  'Bello',
  'Marinilla',
  'La Ceja',
  'Apartadó',
  'Soacha',
  'Chía',
  'Zipaquirá',
  'Palmira',
  'Buenaventura',
  'Tuluá',
  'Girardot',
  'Duitama',
  'Sogamoso',
  'Barrancabermeja',
  'Floridablanca',
  'Dosquebradas'
];
const paymentMethods = [
  ['Tarjeta débito', /tarjeta\s*(de\s*)?debito|\bdebito\b/],
  ['Tarjeta crédito', /tarjeta\s*(de\s*)?credito/],
  ['Tarjeta', /tarjeta|datafono|\bvisa\b|mastercard|redeban|credibanco/],
  ['Nequi', /\bnequi\b/],
  ['Daviplata', /daviplata/],
  ['Transferencia', /transferencia|\bpse\b/],
  ['Efectivo', /efectivo/]
];
const keywordMap = {
  peajes: ['peaje'],
  parqueadero: ['parqueadero', 'parqueo', 'parking'],
  combustible: ['gasolina', 'combustible', 'acpm', 'diesel', 'estacion de servicio', 'galones'],
  hospedaje: ['hotel', 'hospedaje', 'hostal', 'alojamiento'],
  alimentacion: [
    'restaurante',
    'almuerzo',
    'desayuno',
    'cena',
    'comida',
    'cafeteria',
    'cafe',
    'panaderia',
    'asadero',
    'pizzeria'
  ],
  transporte: ['taxi', 'uber', 'didi', 'cabify', 'bus', 'transporte', 'tiquete', 'pasaje', 'aerolinea', 'terminal'],
  papeleria: ['papeleria', 'impresion', 'fotocopia', 'utiles']
};
const amountPattern = /\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;
const providerSkip =
  /^(factura|fecha|nit|tel|cel|direcci|dir\b|regimen|resoluci|documento|pos\b|ticket|tiquete|recibo|cliente|caja|cajero|hora|responsable|iva|gracias|bienvenid|total|subtotal|valor|cambio|cant|descripci|forma de pago)/;

// Busca de abajo hacia arriba la última línea con la etiqueta y toma el monto de esa línea o de la siguiente.
function findAmount(lines, labels, exclude) {
  const folded = lines.map(fold);
  for (const label of labels) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (!label.test(folded[index]) || exclude?.test(folded[index])) continue;
      const amounts = folded[index].match(amountPattern) || folded[index + 1]?.match(amountPattern) || [];
      const amount = parseAmount(amounts.pop());
      if (amount) return amount;
    }
  }
  return '';
}

const findTotal = (lines) =>
  findAmount(
    lines,
    [/(total|valor|neto)\s*a\s*pagar|total\s*pagado/, /valor\s*total|gran\s*total|total\s*factura/, /\btotal\b/],
    /sub\s*-?\s*total|total\s*(iva|impuesto|items|articulos|unidades|cantidad)/
  );
const findSubtotal = (lines) => findAmount(lines, [/sub\s*-?\s*total/]);
const findTaxes = (lines) =>
  findAmount(lines, [/\b(iva|impoconsumo|impuesto|inc)\b/], /\bbase\b|exento|excluido|regimen/);

function findDocumentNumber(text) {
  const match = fold(text).match(
    /(?:factura(?:\s+electronica)?(?:\s+de\s+venta)?|tiquete|recibo|documento)\s*(?:pos\s*)?(?:no\.?|n°|nº|#|numero|:)\s*:?\s*([a-z]{0,6}-?\s?\d[\d-]{1,19})/
  );
  return match ? match[1].replace(/\s+/g, '').toUpperCase() : '';
}

function findProvider(lines) {
  const isName = (line) =>
    /[a-zñ]{3,}/.test(fold(line)) &&
    !providerSkip.test(fold(line).trim()) &&
    !/\d{3,}/.test(line) &&
    line.trim().length <= 120;
  const nitIndex = lines.findIndex((line) => /\bnit\b/.test(fold(line)));
  if (nitIndex >= 0) {
    const beforeNit = lines[nitIndex].slice(0, fold(lines[nitIndex]).search(/\bnit\b/));
    if (isName(beforeNit)) return beforeNit.trim();
    for (let index = nitIndex - 1; index >= 0; index -= 1) if (isName(lines[index])) return lines[index].trim();
  }
  return lines.find(isName)?.trim() || '';
}

function parseText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .filter((line) => line.trim());
  const folded = fold(text);
  const data = empty();
  data.fecha = parseDate(lines.find((line) => /fecha/.test(fold(line)) && parseDate(line)) || text);
  data.valor = findTotal(lines);
  data.subtotal = findSubtotal(lines);
  data.impuestos = findTaxes(lines);
  data.nit = parseNit(String(text).match(/N\.?\s?I\.?\s?T\.?[\s.:#-]*([\d.\s]{6,}(?:\s*-\s*\d)?)/i)?.[1]);
  data.numeroDocumento = findDocumentNumber(text);
  data.proveedor = findProvider(lines);
  data.moneda = /\busd\b|us\$|dolares/.test(folded) ? 'USD' : 'COP';
  data.ciudad =
    cities
      .map((city) => ({ city, index: folded.search(new RegExp(`\\b${fold(city)}\\b`)) }))
      .filter((item) => item.index >= 0)
      .sort((a, b) => a.index - b.index)[0]?.city || '';
  data.metodoPago = paymentMethods.find(([, pattern]) => pattern.test(folded))?.[0] || '';
  data.tipoGasto =
    Object.keys(keywordMap).find((key) => new RegExp(`\\b(${keywordMap[key].join('|')})`).test(folded)) || '';
  data.concepto = data.tipoGasto ? [typeLabels[data.tipoGasto], data.proveedor].filter(Boolean).join(' - ') : '';
  const found = ['fecha', 'valor', 'proveedor', 'tipoGasto'].filter((field) => data[field]).length;
  return normalize({ ...data, textoCrudo: text, nivelConfianza: found === 4 ? 'media' : 'baja' });
}

async function ocrspace(payload) {
  if (!config.ocr.ocrspaceKey) throw Boom.serverUnavailable('OCRSPACE_API_KEY no está configurada en backend/.env.');
  const form = new FormData();
  form.set('apikey', config.ocr.ocrspaceKey);
  form.set('language', 'spa');
  form.set('base64Image', payload.fileDataUrl);
  form.set('isOverlayRequired', 'false');
  form.set('isTable', 'true');
  form.set('scale', 'true');
  form.set('OCREngine', '2');
  const response = await request('OCR.space', 'https://api.ocr.space/parse/image', { method: 'POST', body: form });
  if (!response.ok) throw Boom.badGateway(`OCR.space respondió ${response.status}.`);
  const body = await response.json();
  if (body.IsErroredOnProcessing)
    throw Boom.badGateway([].concat(body.ErrorMessage || 'OCR.space no pudo procesar el archivo.')[0]);
  return parseText((body.ParsedResults || []).map((item) => item.ParsedText).join('\n'));
}

async function custom(payload) {
  if (!config.ocr.customEndpoint)
    throw Boom.serverUnavailable('CUSTOM_OCR_ENDPOINT no está configurado en backend/.env.');
  const response = await request('El OCR personalizado', config.ocr.customEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(config.ocr.customToken ? { Authorization: `Bearer ${config.ocr.customToken}` } : {})
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw Boom.badGateway(`El OCR personalizado respondió ${response.status}.`);
  return normalize(await response.json());
}

const providers = { demo, openai, ocrspace, custom };

async function extract(payload) {
  if (decodedSize(payload.fileDataUrl) > MAX_FILE_BYTES)
    throw Boom.badRequest('El soporte supera el tamaño máximo de 10 MB.');
  try {
    return await (providers[config.ocr.provider] || demo)(payload);
  } catch (error) {
    console.error(`[ocr:${config.ocr.provider}] ${error.message}`);
    throw Boom.isBoom(error) ? error : Boom.badGateway(error.message);
  }
}

module.exports = { extract, normalize, parseText, parseDate, parseAmount };
