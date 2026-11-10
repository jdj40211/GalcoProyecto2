'use strict';

// HU-30: ajuste del candidato a una vacante. Formación, experiencia y certificaciones se calculan con
// reglas fijas; la IA solo valora las habilidades, con evidencia. La evaluación es un apoyo: no cambia
// la etapa del candidato ni lo descarta.
const crypto = require('node:crypto');
const Boom = require('@hapi/boom');
const config = require('../../../config');
const { respond } = require('../../../utils/openai');
const candidates = require('./candidatos.repository.service');
const vacancies = require('./vacantes.service');
const { yearsOfExperience } = require('./analisis.service');
const { FORMATION_LEVELS, CRITERIA } = require('../validators/vacante.validator');

const SKILL_VALUE = { si: 1, parcial: 0.5, no: 0 };
const SKILL_LABEL = { si: 'sí', parcial: 'parcial', no: 'no' };
const CRITERION_LABEL = {
  formacion: 'Formación',
  experiencia: 'Experiencia',
  certificaciones: 'Certificaciones',
  habilidades: 'Habilidades'
};
const fold = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
const round1 = (value) => Math.round(value * 10) / 10;
const sameItem = (a, b) => {
  const [x, y] = [fold(a), fold(b)];
  return Boolean(x && y) && (x.includes(y) || y.includes(x));
};

// Nivel de formación por el nivel declarado o, si falta, por el título. Un curso no es un nivel.
const TITLE_LEVELS = [
  [/doctor|phd/, 'Doctorado'],
  [/maestr|magist|master/, 'Maestría'],
  [/especiali/, 'Especialización'],
  [/profesional|ingenier|licenciad|pregrado|universitari|administrador|contador|abogad/, 'Profesional'],
  [/tecnolog/, 'Tecnólogo'],
  [/tecnic/, 'Técnico'],
  [/bachiller/, 'Bachiller']
];
function levelOf({ nivel, titulo }) {
  const declared = FORMATION_LEVELS.find((level) => fold(level) === fold(nivel));
  if (declared) return declared;
  const text = fold(`${nivel} ${titulo}`);
  return TITLE_LEVELS.find(([pattern]) => pattern.test(text))?.[1] || null;
}

function formationCriterion(candidate, vacancy) {
  const levels = (candidate.formacion || []).map(levelOf).filter(Boolean);
  const best = levels.sort((a, b) => FORMATION_LEVELS.indexOf(b) - FORMATION_LEVELS.indexOf(a))[0] || null;
  const gap = FORMATION_LEVELS.indexOf(vacancy.formacionMinima) - (best ? FORMATION_LEVELS.indexOf(best) : -1);
  const cumplimiento = gap <= 0 ? 1 : gap === 1 && best ? 0.5 : 0;
  return {
    cumplimiento,
    detalle: best
      ? `Nivel más alto: ${best}; la vacante pide ${vacancy.formacionMinima}.`
      : `Sin formación reconocible; la vacante pide ${vacancy.formacionMinima}.`,
    incumplido: gap > 0 ? `Formación mínima: ${vacancy.formacionMinima} (tiene ${best || 'ninguna'})` : null
  };
}

function experienceCriterion(candidate, vacancy) {
  const years = candidate.anosExperiencia ?? yearsOfExperience(candidate.experiencia);
  const minimum = vacancy.experienciaMinima;
  return {
    cumplimiento: minimum > 0 ? Math.min(1, years / minimum) : 1,
    detalle: `${years} años de experiencia; la vacante pide ${minimum}.`,
    incumplido: years < minimum ? `Experiencia mínima: ${minimum} años (tiene ${years})` : null
  };
}

// Obligatorias valen 1 y deseables 0,5. Una certificación vencida no cuenta.
function certificationsCriterion(candidate, vacancy) {
  const today = new Date().toISOString().slice(0, 10);
  const owned = candidate.certificaciones || [];
  const find = (name) => owned.find((item) => sameItem(item.nombre, name));
  const valid = (item) => item && (!item.vencimiento || item.vencimiento >= today);
  const required = vacancy.certificacionesObligatorias.map((name) => ({ name, item: find(name) }));
  const desired = vacancy.certificacionesDeseables.map((name) => ({ name, item: find(name) }));
  const total = required.length + desired.length * 0.5;
  const achieved =
    required.filter(({ item }) => valid(item)).length + desired.filter(({ item }) => valid(item)).length * 0.5;
  const describe = ({ name, item }) => `${name}: ${valid(item) ? 'sí' : item ? 'vencida' : 'no'}`;
  return {
    cumplimiento: total ? achieved / total : 1,
    detalle: total ? [...required, ...desired].map(describe).join('; ') + '.' : 'La vacante no pide certificaciones.',
    incumplidos: required
      .filter(({ item }) => !valid(item))
      .map(({ name, item }) => `Certificación obligatoria: ${name}${item ? ' (vencida)' : ''}`)
  };
}

// CA5: a la IA solo llega el perfil profesional, sin nombre, identificación, contacto ni ciudad.
const professionalProfile = (candidate) => ({
  formacion: (candidate.formacion || []).map(({ titulo, institucion, nivel, anio }) => ({
    titulo,
    institucion,
    nivel,
    anio
  })),
  experiencia: (candidate.experiencia || []).map(({ cargo, empresa, desde, hasta }) => ({
    cargo,
    empresa,
    desde,
    hasta
  })),
  certificaciones: (candidate.certificaciones || []).map(({ nombre, entidad }) => ({ nombre, entidad })),
  habilidades: candidate.habilidades || [],
  idiomas: candidate.idiomas || []
});

const instructions = `Eres un asistente de selección de personal. Valoras si un perfil profesional demuestra cada habilidad que pide una vacante.
Reglas:
- Valora solo las habilidades de la lista, usando únicamente el perfil recibido. No inventes experiencia.
- cumple: si cuando el perfil la muestra con claridad, parcial cuando hay indicios relacionados, no cuando no aparece.
- evidencia: cita brevemente el dato del perfil que lo respalda (cargo, empresa, título o habilidad declarada); cadena vacía si no hay.
- No uses ni infieras edad, género, estado civil, origen, religión, discapacidad, salud ni ningún dato personal: no deben influir en la selección.
- resumen: dos frases en español sobre el ajuste de las habilidades, sin recomendar contratar ni descartar.`;
const skillsSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['habilidades', 'resumen'],
  properties: {
    habilidades: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['habilidad', 'cumple', 'evidencia'],
        properties: {
          habilidad: { type: 'string' },
          cumple: { type: 'string', enum: Object.keys(SKILL_VALUE) },
          evidencia: { type: 'string' }
        }
      }
    },
    resumen: { type: 'string' }
  }
};

async function openaiSkills(profile, skills) {
  const text = await respond({
    instructions,
    content: [
      {
        type: 'input_text',
        text: `Habilidades que pide la vacante: ${JSON.stringify(skills)}\nPerfil profesional: ${JSON.stringify(profile)}`
      }
    ],
    name: 'valoracion_habilidades',
    schema: skillsSchema,
    subject: 'la valoración de habilidades'
  });
  return JSON.parse(text);
}

// Proveedor demo: coincidencia de texto con las habilidades, cargos y certificaciones del perfil.
async function demoSkills(profile, skills) {
  const sources = [
    ...profile.habilidades.map((value) => ['habilidades', value]),
    ...profile.experiencia.map((item) => ['experiencia', `${item.cargo} en ${item.empresa}`]),
    ...profile.certificaciones.map((item) => ['certificaciones', item.nombre])
  ];
  return {
    habilidades: skills.map((habilidad) => {
      const found = sources.find(([, value]) => sameItem(value, habilidad));
      return { habilidad, cumple: found ? 'si' : 'no', evidencia: found ? `Aparece en ${found[0]}: ${found[1]}.` : '' };
    }),
    resumen: 'Valoración por coincidencia de texto del proveedor demo.'
  };
}
const skillProviders = { openai: openaiSkills, demo: demoSkills };

async function skillsCriterion(candidate, vacancy) {
  const skills = vacancy.habilidades;
  if (!skills.length)
    return { cumplimiento: 1, detalle: 'La vacante no pide habilidades.', habilidades: [], pendiente: false };
  const pending = (aviso) => ({
    cumplimiento: 0,
    detalle: 'Valoración pendiente.',
    habilidades: skills.map((habilidad) => ({ habilidad, cumple: null, evidencia: '' })),
    pendiente: true,
    aviso
  });
  if (!candidate.autorizacionDatos?.otorgada)
    return pending(
      'La valoración de habilidades quedó pendiente: el candidato no tiene registrada la autorización de tratamiento de datos.'
    );
  const provider = skillProviders[config.ocr.provider];
  if (!provider)
    return pending('La valoración de habilidades quedó pendiente: configura OCR_PROVIDER=openai para usar la IA.');
  let result;
  try {
    result = await provider(professionalProfile(candidate), skills);
  } catch (error) {
    // CA7: sin IA, los criterios medibles se calculan igual.
    return pending(`La valoración de habilidades quedó pendiente: ${error.message} Vuelve a evaluar más tarde.`);
  }
  const valued = skills.map((habilidad) => {
    const item = (result.habilidades || []).find((entry) => fold(entry.habilidad) === fold(habilidad));
    const cumple = Object.hasOwn(SKILL_VALUE, item?.cumple) ? item.cumple : 'no';
    return { habilidad, cumple, evidencia: String(item?.evidencia || '').slice(0, 300) };
  });
  return {
    cumplimiento: valued.reduce((sum, item) => sum + SKILL_VALUE[item.cumple], 0) / skills.length,
    detalle: valued.map((item) => `${item.habilidad}: ${SKILL_LABEL[item.cumple]}`).join('; ') + '.',
    habilidades: valued,
    resumen: String(result.resumen || '').slice(0, 600),
    pendiente: false
  };
}

async function evaluate(vacancyId, { candidatoId }, credentials) {
  const vacancy = await vacancies.openForEvaluation(vacancyId);
  const candidate = await candidates.get(candidatoId);
  if (!candidate) throw Boom.notFound('Candidato no encontrado.');

  const formation = formationCriterion(candidate, vacancy);
  const experience = experienceCriterion(candidate, vacancy);
  const certifications = certificationsCriterion(candidate, vacancy);
  const skills = await skillsCriterion(candidate, vacancy);
  const results = {
    formacion: formation,
    experiencia: experience,
    certificaciones: certifications,
    habilidades: skills
  };

  // CA1: puntaje = suma de peso × cumplimiento; cada criterio muestra su aporte.
  const criterios = Object.fromEntries(
    CRITERIA.map((criterion) => {
      const { cumplimiento, detalle } = results[criterion];
      const peso = vacancy.pesos[criterion];
      return [
        criterion,
        { peso, cumplimiento: round1(cumplimiento * 100) / 100, aporte: round1(peso * cumplimiento), detalle }
      ];
    })
  );
  criterios.habilidades.habilidades = skills.habilidades;
  const puntaje = Math.round(
    CRITERIA.reduce((sum, criterion) => sum + vacancy.pesos[criterion] * results[criterion].cumplimiento, 0)
  );
  // CA2: los obligatorios incumplidos se listan aparte, sin importar el puntaje.
  const obligatoriosIncumplidos = [formation.incumplido, experience.incumplido, ...certifications.incumplidos].filter(
    Boolean
  );
  const justificacion = [
    `Puntaje ${puntaje} de 100 para ${vacancy.cargo}.`,
    ...CRITERIA.map((criterion) => `${CRITERION_LABEL[criterion]}: ${criterios[criterion].detalle}`),
    skills.resumen || ''
  ]
    .filter(Boolean)
    .join(' ');

  const evaluation = {
    id: crypto.randomUUID(),
    vacanteId: vacancy.id,
    vacanteVersion: vacancy.version,
    // CA6: copia de la vacante tal como estaba al evaluar.
    vacante: {
      cargo: vacancy.cargo,
      formacionMinima: vacancy.formacionMinima,
      experienciaMinima: vacancy.experienciaMinima,
      certificacionesObligatorias: vacancy.certificacionesObligatorias,
      certificacionesDeseables: vacancy.certificacionesDeseables,
      habilidades: vacancy.habilidades,
      pesos: vacancy.pesos
    },
    puntaje,
    criterios,
    obligatoriosIncumplidos,
    cumpleObligatorios: obligatoriosIncumplidos.length === 0,
    justificacion,
    habilidadesPendientes: skills.pendiente,
    aviso: skills.aviso || '',
    proveedor: skills.pendiente ? null : config.ocr.provider,
    modelo: skills.pendiente ? null : config.ocr.provider === 'openai' ? config.ocr.openaiModel : config.ocr.provider,
    solicitadoPor: credentials.usuario,
    fecha: new Date().toISOString(),
    vigente: true
  };
  // CA4: solo se agrega la evaluación; la etapa del candidato no cambia.
  await candidates.addEvaluation(candidate.id, evaluation);
  return evaluation;
}

async function ranking(vacancyId, { soloCumplen }) {
  await vacancies.get(vacancyId);
  const rows = (await candidates.listEvaluated(vacancyId))
    .map((candidate) => {
      const own = (candidate.evaluaciones || []).filter((item) => item.vacanteId === vacancyId);
      return {
        // Solo lo necesario para decidir a quién revisar: sin datos de contacto.
        candidato: {
          id: candidate.id,
          nombre: candidate.nombre,
          cargoInteres: candidate.cargoInteres,
          estado: candidate.estado
        },
        evaluacion: own.find((item) => item.vigente),
        anteriores: own.filter((item) => !item.vigente).length
      };
    })
    .filter((row) => row.evaluacion && (!soloCumplen || row.evaluacion.cumpleObligatorios))
    .sort((a, b) => b.evaluacion.puntaje - a.evaluacion.puntaje);
  return { items: rows, total: rows.length };
}

module.exports = { levelOf, evaluate, ranking };
