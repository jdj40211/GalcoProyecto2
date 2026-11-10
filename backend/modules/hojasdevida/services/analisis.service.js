'use strict';

// HU-28: la IA propone los datos de la hoja de vida y RRHH los confirma. La IA nunca escribe en la
// ficha del candidato por sí sola, ni decide nada sobre él.
const crypto = require('node:crypto');
const Boom = require('@hapi/boom');
const config = require('../../../config');
const { respond } = require('../../../utils/openai');
const candidates = require('./candidatos.repository.service');
const storage = require('./documentos.storage.service');
const { docxText } = require('./docx.service');
const { publicDocument } = require('./documentos.service');

const LEVELS = ['alta', 'media', 'baja'];
const SCALAR_FIELDS = ['nombre', 'correo', 'telefono', 'ciudad'];
const LIST_FIELDS = ['habilidades', 'idiomas'];
const ITEM_FIELDS = ['formacion', 'experiencia', 'certificaciones'];
const DATA_FIELDS = [...SCALAR_FIELDS, ...ITEM_FIELDS, ...LIST_FIELDS];
const MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[0-9 ()-]{7,20}$/;
const PDF = 'application/pdf';
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const MAX_ANALYSES = 20;

const instructions = `Eres un asistente de Recursos Humanos de una empresa colombiana que lee hojas de vida y extrae sus datos de forma estructurada.
Reglas:
- Extrae solo lo que aparece en el documento. Si un dato no aparece o no es legible, usa cadena vacía, null o lista vacía. No inventes datos.
- No extraigas ni menciones edad, fecha de nacimiento, género, estado civil, fotografía, origen étnico o nacional, religión, orientación, discapacidad, datos de salud ni número de documento de identidad: no deben influir en una selección.
- nombre: nombre completo del candidato.
- correo, telefono y ciudad: datos de contacto del candidato, no de sus referencias ni de sus empleadores.
- formacion: títulos obtenidos o en curso, con institución, nivel (Bachiller, Técnico, Tecnólogo, Profesional, Especialización, Maestría, Doctorado, Curso) y año de grado como número o null.
- experiencia: cada empleo con cargo, empresa, desde y hasta en formato YYYY-MM. Si sigue trabajando allí, hasta es cadena vacía. Si solo aparece el año, usa el mes 01 y confianza media.
- certificaciones: licencias y certificados (por ejemplo trabajo en alturas o soldadura) con entidad y vencimiento YYYY-MM-DD si aparece.
- habilidades: competencias técnicas concretas, máximo 15. idiomas: idiomas que declara.
- confianza: alta si el dato se lee con claridad, media si lo dedujiste, baja si es dudoso o no aparece. Cada elemento de formacion, experiencia y certificaciones lleva su propia confianza.`;

const confidence = { type: 'string', enum: LEVELS };
const objectSchema = (properties) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties
});
const schema = objectSchema({
  nombre: { type: 'string' },
  correo: { type: 'string' },
  telefono: { type: 'string' },
  ciudad: { type: 'string' },
  formacion: {
    type: 'array',
    items: objectSchema({
      titulo: { type: 'string' },
      institucion: { type: 'string' },
      nivel: { type: 'string' },
      anio: { type: ['integer', 'null'] },
      confianza: confidence
    })
  },
  experiencia: {
    type: 'array',
    items: objectSchema({
      cargo: { type: 'string' },
      empresa: { type: 'string' },
      desde: { type: 'string', description: 'YYYY-MM o cadena vacía.' },
      hasta: { type: 'string', description: 'YYYY-MM, o cadena vacía si es el empleo actual.' },
      confianza: confidence
    })
  },
  certificaciones: {
    type: 'array',
    items: objectSchema({
      nombre: { type: 'string' },
      entidad: { type: 'string' },
      vencimiento: { type: 'string', description: 'YYYY-MM-DD o cadena vacía.' },
      confianza: confidence
    })
  },
  habilidades: { type: 'array', items: { type: 'string' } },
  idiomas: { type: 'array', items: { type: 'string' } },
  confianza: objectSchema(Object.fromEntries([...SCALAR_FIELDS, ...LIST_FIELDS].map((field) => [field, confidence])))
});

const clean = (value, max) =>
  String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
const level = (value, fallback = 'media') => (LEVELS.includes(value) ? value : fallback);
const monthIndex = (value) =>
  MONTH.test(value) ? Number(value.slice(0, 4)) * 12 + Number(value.slice(5, 7)) - 1 : null;

// Años de experiencia: une los periodos que se cruzan para no contarlos dos veces. Hasta vacío = hoy.
function yearsOfExperience(items = [], now = new Date()) {
  const current = now.getUTCFullYear() * 12 + now.getUTCMonth();
  const ranges = items
    .map(({ desde, hasta }) => [monthIndex(desde), hasta ? monthIndex(hasta) : current])
    .filter(([start, end]) => start !== null && end !== null && end >= start)
    .sort((a, b) => a[0] - b[0]);
  let months = 0;
  let open = null;
  for (const [start, end] of ranges) {
    if (open && start <= open[1] + 1) open[1] = Math.max(open[1], end);
    else {
      if (open) months += open[1] - open[0] + 1;
      open = [start, end];
    }
  }
  if (open) months += open[1] - open[0] + 1;
  return Math.round((months / 12) * 10) / 10;
}

// Lo que no cumple el formato no se propone: queda vacío y con confianza baja, para revisión.
function normalize(raw = {}) {
  const year = new Date().getFullYear();
  const reported = raw.confianza || {};
  const datos = {
    nombre: clean(raw.nombre, 120),
    correo: clean(raw.correo, 254).toLowerCase(),
    telefono: clean(raw.telefono, 20),
    ciudad: clean(raw.ciudad, 120)
  };
  if (!EMAIL.test(datos.correo)) datos.correo = '';
  if (!PHONE.test(datos.telefono)) datos.telefono = '';
  const confianza = Object.fromEntries(
    SCALAR_FIELDS.map((field) => [field, datos[field] ? level(reported[field]) : 'baja'])
  );

  const list = (items) => (Array.isArray(items) ? items.slice(0, 30) : []);
  const formacion = list(raw.formacion).map((item) => {
    const anio = Number.isInteger(item.anio) && item.anio >= 1950 && item.anio <= year + 6 ? item.anio : null;
    const value = {
      titulo: clean(item.titulo, 160),
      institucion: clean(item.institucion, 160),
      nivel: clean(item.nivel, 60),
      anio
    };
    return [value, value.titulo && value.institucion ? level(item.confianza) : 'baja'];
  });
  const experiencia = list(raw.experiencia).map((item) => {
    const desde = MONTH.test(item.desde) ? item.desde : '';
    const end = MONTH.test(item.hasta) ? item.hasta : '';
    // Una fecha final anterior a la inicial no se propone.
    const hasta = desde && end && end < desde ? '' : end;
    const valid = desde && (!item.hasta || end) && hasta === end;
    const value = { cargo: clean(item.cargo, 120), empresa: clean(item.empresa, 160), desde, hasta };
    return [value, valid && value.cargo && value.empresa ? level(item.confianza) : 'baja'];
  });
  const certificaciones = list(raw.certificaciones).map((item) => {
    const value = {
      nombre: clean(item.nombre, 160),
      entidad: clean(item.entidad, 160),
      vencimiento: DAY.test(item.vencimiento) ? item.vencimiento : ''
    };
    return [value, value.nombre && (!item.vencimiento || value.vencimiento) ? level(item.confianza) : 'baja'];
  });
  for (const [field, entries] of Object.entries({ formacion, experiencia, certificaciones })) {
    datos[field] = entries.map(([value]) => value);
    confianza[field] = entries.map(([, itemLevel]) => itemLevel);
  }
  for (const field of LIST_FIELDS) {
    datos[field] = list(raw[field])
      .map((item) => clean(item, 80))
      .filter(Boolean);
    confianza[field] = datos[field].length ? level(reported[field]) : 'baja';
  }

  const camposPendientes = [
    ...SCALAR_FIELDS.filter((field) => confianza[field] === 'baja'),
    ...ITEM_FIELDS.filter(
      (field) => confianza[field].includes('baja') || (field !== 'certificaciones' && !datos[field].length)
    )
  ];
  return { datos, confianza, camposPendientes, anosExperiencia: yearsOfExperience(datos.experiencia) };
}

async function demo() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    nombre: 'Ana María Pérez',
    correo: 'ana.perez@example.com',
    telefono: '',
    ciudad: 'Medellín',
    formacion: [
      {
        titulo: 'Tecnóloga en producción industrial',
        institucion: 'SENA',
        nivel: 'Tecnólogo',
        anio: 2020,
        confianza: 'alta'
      }
    ],
    experiencia: [
      {
        cargo: 'Operaria de producción',
        empresa: 'Metálicas S.A.S.',
        desde: '2021-02',
        hasta: '2024-06',
        confianza: 'alta'
      },
      {
        cargo: 'Auxiliar de bodega',
        empresa: 'Distribuciones del Norte',
        desde: '2019-05',
        hasta: '2020-12',
        confianza: 'media'
      }
    ],
    certificaciones: [{ nombre: 'Trabajo en alturas', entidad: 'SENA', vencimiento: '2027-03-01', confianza: 'media' }],
    habilidades: ['Lectura de planos', 'Soldadura MIG'],
    idiomas: ['Español'],
    confianza: {
      nombre: 'alta',
      correo: 'alta',
      telefono: 'baja',
      ciudad: 'media',
      habilidades: 'media',
      idiomas: 'alta'
    }
  };
}

async function openai(document, bytes) {
  const content = [{ type: 'input_text', text: 'Extrae los datos de esta hoja de vida.' }];
  if (document.tipo === PDF)
    // El PDF va completo: el modelo también lee PDF escaneados.
    content.push({
      type: 'input_file',
      filename: document.nombre,
      file_data: `data:${PDF};base64,${bytes.toString('base64')}`
    });
  else {
    const text = docxText(bytes);
    if (!text) throw Boom.badData('El DOCX no tiene texto para analizar. Registra los datos manualmente.');
    content.push({ type: 'input_text', text: `Contenido de la hoja de vida:\n${text}` });
  }
  const text = await respond({ instructions, content, name: 'hoja_de_vida', schema, subject: 'la hoja de vida' });
  try {
    return JSON.parse(text);
  } catch {
    throw Boom.badGateway('OpenAI no devolvió JSON válido. Intenta de nuevo.');
  }
}

const providers = {
  demo: { read: demo, model: () => 'demo' },
  openai: { read: openai, model: () => config.ocr.openaiModel }
};

async function existingCandidate(id) {
  const candidate = await candidates.get(id);
  if (!candidate) throw Boom.notFound('Candidato no encontrado.');
  return candidate;
}

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

module.exports = {
  normalize,
  yearsOfExperience,
  async analyze(candidateId, { documentoId }, credentials) {
    const candidate = await existingCandidate(candidateId);
    // CA6: sin autorización de tratamiento de datos, la hoja de vida no sale hacia la IA.
    if (!candidate.autorizacionDatos?.otorgada)
      throw Boom.conflict(
        'El candidato no tiene registrada la autorización de tratamiento de datos; no se puede enviar a la IA.'
      );
    const document = (candidate.documentos || []).find((item) => item.id === documentoId);
    if (!document) throw Boom.notFound('Documento no encontrado.');
    if (![PDF, DOCX].includes(document.tipo))
      throw Boom.badData(
        'El análisis automático admite PDF o DOCX. Registra los datos de esta hoja de vida manualmente.'
      );
    const provider = providers[config.ocr.provider];
    if (!provider)
      throw Boom.serverUnavailable('El análisis de hojas de vida usa OpenAI: configura OCR_PROVIDER=openai.');
    const bytes = await storage.read(document.archivoId);
    if (!bytes) throw Boom.notFound('Documento no encontrado.');

    // CA5: si la IA falla, el error sale antes de guardar nada; el documento y el candidato no cambian.
    const propuesta = normalize(await provider.read(document, bytes));
    const analysis = {
      id: crypto.randomUUID(),
      documentoId,
      documentoNombre: document.nombre,
      proveedor: config.ocr.provider,
      modelo: provider.model(),
      estado: 'pendiente',
      solicitadoPor: credentials.usuario,
      fecha: new Date().toISOString(),
      propuesta,
      correcciones: [],
      confirmadoPor: null,
      confirmadoEn: null
    };
    await candidates.addAnalysis(candidateId, analysis, MAX_ANALYSES);
    return analysis;
  },
  async confirm(candidateId, analysisId, { datos }, credentials) {
    const candidate = await existingCandidate(candidateId);
    const analysis = (candidate.analisis || []).find((item) => item.id === analysisId);
    if (!analysis) throw Boom.notFound('Análisis no encontrado.');
    if (analysis.estado !== 'pendiente') throw Boom.conflict('Este análisis ya fue confirmado.');
    // CA7: cada dato que RRHH cambió frente a lo que propuso la IA queda registrado.
    const correcciones = DATA_FIELDS.filter((field) => !same(analysis.propuesta.datos[field], datos[field])).map(
      (field) => ({ campo: field, valorExtraido: analysis.propuesta.datos[field], valorCorregido: datos[field] })
    );
    const updated = await candidates.confirmAnalysis(
      candidateId,
      analysisId,
      { ...datos, anosExperiencia: yearsOfExperience(datos.experiencia) },
      {
        estado: 'confirmado',
        confirmadoPor: credentials.usuario,
        confirmadoEn: new Date().toISOString(),
        correcciones
      }
    );
    if (!updated) throw Boom.conflict('Este análisis ya fue confirmado.');
    return { ...updated, documentos: (updated.documentos || []).map(publicDocument) };
  }
};
