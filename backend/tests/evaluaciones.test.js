'use strict';

// HU-30 (#68) Evaluar el ajuste del candidato a una vacante, y CP-03 de HU-29.
process.env.NODE_ENV = 'test';
process.env.AUTH_BYPASS = 'true';
process.env.PERSISTENCE_MODE = 'memory';
process.env.OCR_PROVIDER = 'demo';

const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const config = require('../config');
const { createServer } = require('../app');
const candidates = require('../modules/hojasdevida/services/candidatos.repository.service');
const vacancies = require('../modules/hojasdevida/services/vacantes.repository.service');
const { levelOf } = require('../modules/hojasdevida/services/evaluaciones.service');

let server;
const headers = (rol, usuario) => ({
  authorization: 'Bearer dev-token',
  'x-dev-user': encodeURIComponent(JSON.stringify({ uid: `dev-${usuario}`, usuario, nombre: `Nombre ${usuario}`, rol }))
});
const hr = headers('rrhh', 'mrestrepo');
const call = (method, url, payload, auth = hr) => server.inject({ method, url, payload, headers: auth });
const vacancyPayload = (changes = {}) => ({
  cargo: 'Soldador',
  formacionMinima: 'Técnico',
  experienciaMinima: 2,
  certificacionesObligatorias: ['Trabajo en alturas'],
  certificacionesDeseables: ['Soldadura AWS'],
  habilidades: ['Soldadura MIG', 'Lectura de planos'],
  pesos: { formacion: 25, experiencia: 25, certificaciones: 25, habilidades: 25 },
  ...changes
});
let sequence = 0;
const candidate = (changes = {}) =>
  candidates.create({
    tipoIdentificacion: 'CC',
    identificacion: `90000${(sequence += 1)}`,
    nombre: 'Ana María Pérez',
    correo: `ana${sequence}@example.com`,
    telefono: '3001234567',
    ciudad: 'Medellín',
    cargoInteres: 'Soldadora',
    formacion: [{ titulo: 'Tecnóloga en producción industrial', institucion: 'SENA', nivel: 'Tecnólogo', anio: 2020 }],
    experiencia: [{ cargo: 'Soldadora', empresa: 'Metálicas S.A.S.', desde: '2021-02', hasta: '2024-06' }],
    certificaciones: [{ nombre: 'Trabajo en alturas avanzado', entidad: 'SENA', vencimiento: '2099-03-01' }],
    habilidades: ['Soldadura MIG', 'Pintura electrostática'],
    idiomas: ['Español'],
    anosExperiencia: 3.4,
    documentos: [],
    analisis: [],
    autorizacionDatos: { otorgada: true, fecha: '2026-11-10T00:00:00.000Z', registradaPor: 'mrestrepo' },
    estado: 'registrado',
    registradoPor: { usuario: 'mrestrepo' },
    ...changes
  });
const createVacancy = async (changes) => (await call('POST', '/api/vacantes', vacancyPayload(changes))).result;
const evaluate = (vacancy, person, auth) =>
  call('POST', `/api/vacantes/${vacancy.id}/evaluaciones`, { candidatoId: person.id }, auth);

function mockOpenAI(t, reply) {
  const original = { fetch: global.fetch, ocr: { ...config.ocr } };
  const calls = [];
  Object.assign(config.ocr, { provider: 'openai', openaiKey: 'sk-test', timeoutMs: 2000 });
  global.fetch = async (url, options) => {
    calls.push({ url, body: JSON.parse(options.body) });
    return reply();
  };
  t.after(() => {
    global.fetch = original.fetch;
    Object.assign(config.ocr, original.ocr);
  });
  return calls;
}
const openaiReply = (data, status = 200) =>
  new Response(JSON.stringify(status === 200 ? { status: 'completed', output_text: JSON.stringify(data) } : data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });

beforeEach(async () => {
  candidates.resetMemory();
  vacancies.resetMemory();
  server = await createServer();
});
afterEach(() => server.stop());

test('reconoce el nivel de formación por el nivel declarado o por el título', () => {
  assert.equal(levelOf({ nivel: 'Tecnólogo' }), 'Tecnólogo');
  assert.equal(levelOf({ nivel: '', titulo: 'Ingeniera mecánica' }), 'Profesional');
  assert.equal(levelOf({ nivel: '', titulo: 'Magíster en gestión' }), 'Maestría');
  assert.equal(levelOf({ nivel: 'Curso', titulo: 'Excel básico' }), null);
  // HU-34: títulos de las hojas de vida de prueba que no traían nivel reconocible.
  assert.equal(
    levelOf({ nivel: '', titulo: 'Estadística', institucion: 'Universidad Capital Simulada' }),
    'Profesional'
  );
  assert.equal(
    levelOf({ nivel: '', titulo: 'Administración de Empresas', institucion: 'Corporación Costa Azul' }),
    'Profesional'
  );
  assert.equal(levelOf({ nivel: '', titulo: 'Tecnología en Logística', institucion: 'Instituto Andino' }), 'Tecnólogo');
  assert.equal(
    levelOf({ nivel: '', titulo: 'Técnica en Asistencia Administrativa', institucion: 'Centro Beta' }),
    'Técnico'
  );
  assert.equal(
    levelOf({ nivel: '', titulo: 'Tecnología en Electromecánica', institucion: 'Universidad X' }),
    'Tecnólogo'
  );
});

test('HU-34: una certificación con palabras extra cumple la obligatoria ("Trabajo seguro en alturas")', async () => {
  const vacancy = await createVacancy();
  const person = await candidate({
    certificaciones: [{ nombre: 'Trabajo seguro en alturas (formación simulada)', entidad: 'SENA', vencimiento: '' }]
  });
  const evaluation = (await evaluate(vacancy, person)).result;
  assert.equal(evaluation.cumpleObligatorios, true, JSON.stringify(evaluation.obligatoriosIncumplidos));
  const unrelated = await candidate({
    certificaciones: [{ nombre: 'Trabajo en equipo', entidad: 'X', vencimiento: '' }]
  });
  assert.equal((await evaluate(vacancy, unrelated)).result.cumpleObligatorios, false, 'no basta una palabra en común');
});

test('CP-01 y CA1: puntaje con el aporte de cada criterio, justificación y evidencia', async () => {
  const vacancy = await createVacancy();
  const person = await candidate();
  const response = await evaluate(vacancy, person);
  assert.equal(response.statusCode, 201);
  const evaluation = response.result;
  // Formación 25 + experiencia 25 + certificaciones 25 × (1 / 1,5) + habilidades 25 × (1 / 2) = 79,2.
  assert.equal(evaluation.puntaje, 79);
  assert.deepEqual(
    Object.fromEntries(Object.entries(evaluation.criterios).map(([key, value]) => [key, value.aporte])),
    { formacion: 25, experiencia: 25, certificaciones: 16.7, habilidades: 12.5 }
  );
  assert.equal(evaluation.criterios.formacion.peso, 25);
  assert.match(evaluation.criterios.formacion.detalle, /Tecnólogo/);
  assert.match(evaluation.criterios.certificaciones.detalle, /Trabajo en alturas/);
  const skills = evaluation.criterios.habilidades.habilidades;
  assert.deepEqual(
    skills.map((item) => [item.habilidad, item.cumple]),
    [
      ['Soldadura MIG', 'si'],
      ['Lectura de planos', 'no']
    ]
  );
  assert.ok(skills[0].evidencia, 'la habilidad que cumple cita su evidencia');
  assert.ok(evaluation.justificacion.length > 20);
  assert.equal(evaluation.cumpleObligatorios, true);
  assert.deepEqual(evaluation.obligatoriosIncumplidos, []);
  assert.equal(evaluation.vigente, true);
  assert.equal(evaluation.vacanteVersion, 1);
  assert.equal(evaluation.vacante.cargo, 'Soldador');
  assert.equal(evaluation.solicitadoPor, 'mrestrepo');
  assert.equal(evaluation.habilidadesPendientes, false);
});

test('CP-02 y CA2: los requisitos obligatorios incumplidos se marcan aunque el puntaje sea alto', async () => {
  const vacancy = await createVacancy({
    pesos: { formacion: 10, experiencia: 60, certificaciones: 10, habilidades: 20 }
  });
  const person = await candidate({ certificaciones: [] });
  const evaluation = (await evaluate(vacancy, person)).result;
  assert.ok(evaluation.puntaje >= 75, `puntaje ${evaluation.puntaje}`);
  assert.equal(evaluation.cumpleObligatorios, false);
  assert.deepEqual(evaluation.obligatoriosIncumplidos, ['Certificación obligatoria: Trabajo en alturas']);

  const expired = await candidate({
    formacion: [{ titulo: 'Bachiller académico', institucion: 'Colegio', nivel: 'Bachiller', anio: 2015 }],
    experiencia: [{ cargo: 'Ayudante', empresa: 'Taller', desde: '2025-01', hasta: '2025-06' }],
    anosExperiencia: 0.5,
    certificaciones: [{ nombre: 'Trabajo en alturas', entidad: 'SENA', vencimiento: '2020-01-01' }]
  });
  const weak = (await evaluate(vacancy, expired)).result;
  assert.deepEqual(weak.obligatoriosIncumplidos, [
    'Formación mínima: Técnico (tiene Bachiller)',
    'Experiencia mínima: 2 años (tiene 0.5)',
    'Certificación obligatoria: Trabajo en alturas (vencida)'
  ]);
  assert.equal(weak.criterios.formacion.aporte, 5, 'un nivel por debajo cuenta la mitad');
});

test('CP-03 y CA3: el ranking ordena por puntaje y filtra por requisitos obligatorios', async () => {
  const vacancy = await createVacancy();
  const best = await candidate({ nombre: 'Primera Persona', habilidades: ['Soldadura MIG', 'Lectura de planos'] });
  const middle = await candidate({ nombre: 'Segunda Persona' });
  const missing = await candidate({ nombre: 'Sin Certificación', certificaciones: [] });
  for (const person of [middle, missing, best]) await evaluate(vacancy, person);
  const ranking = await call('GET', `/api/vacantes/${vacancy.id}/ranking`);
  assert.equal(ranking.statusCode, 200);
  assert.deepEqual(
    ranking.result.items.map((row) => row.candidato.nombre),
    ['Primera Persona', 'Segunda Persona', 'Sin Certificación']
  );
  assert.equal(ranking.result.items[0].candidato.correo, undefined, 'el ranking no expone datos de contacto');
  const filtered = await call('GET', `/api/vacantes/${vacancy.id}/ranking?soloCumplen=true`);
  assert.deepEqual(
    filtered.result.items.map((row) => row.candidato.nombre),
    ['Primera Persona', 'Segunda Persona']
  );
});

test('CA4: evaluar no cambia la etapa del candidato', async () => {
  const vacancy = await createVacancy();
  const person = await candidate({ certificaciones: [] });
  await evaluate(vacancy, person);
  const stored = await candidates.get(person.id);
  assert.equal(stored.estado, 'registrado');
  assert.equal(stored.evaluaciones.length, 1);
});

test('CP-04 y CA6: al volver a evaluar se conserva la evaluación anterior y se marca la vigente', async () => {
  const vacancy = await createVacancy();
  const person = await candidate();
  const first = (await evaluate(vacancy, person)).result;
  await call(
    'PUT',
    `/api/vacantes/${vacancy.id}`,
    vacancyPayload({ pesos: { formacion: 10, experiencia: 10, certificaciones: 10, habilidades: 70 } })
  );
  const second = (await evaluate(vacancy, person)).result;
  assert.equal(second.vacanteVersion, 2);
  assert.notEqual(second.puntaje, first.puntaje);
  const stored = await candidates.get(person.id);
  assert.deepEqual(
    stored.evaluaciones.map((item) => [item.id, item.vigente, item.vacanteVersion]),
    [
      [first.id, false, 1],
      [second.id, true, 2]
    ]
  );
  const [row] = (await call('GET', `/api/vacantes/${vacancy.id}/ranking`)).result.items;
  assert.equal(row.evaluacion.id, second.id);
  assert.equal(row.anteriores, 1);
});

test('CP-05 y CA7: si la IA falla, se calculan los criterios medibles y habilidades queda pendiente', async (t) => {
  const vacancy = await createVacancy();
  const person = await candidate();
  mockOpenAI(t, () => openaiReply({ error: { message: 'Service unavailable' } }, 503));
  const response = await evaluate(vacancy, person);
  assert.equal(response.statusCode, 201);
  const evaluation = response.result;
  assert.equal(evaluation.habilidadesPendientes, true);
  assert.match(evaluation.aviso, /habilidades quedó pendiente/);
  assert.equal(evaluation.criterios.habilidades.aporte, 0);
  assert.equal(evaluation.criterios.formacion.aporte, 25);
  assert.equal(evaluation.puntaje, 67);
});

test('CA5: a la IA solo llega el perfil profesional; sin autorización, no llega nada', async (t) => {
  const vacancy = await createVacancy();
  const person = await candidate();
  const calls = mockOpenAI(t, () =>
    openaiReply({
      habilidades: [
        { habilidad: 'Soldadura MIG', cumple: 'si', evidencia: 'Soldadora en Metálicas S.A.S.' },
        { habilidad: 'Lectura de planos', cumple: 'parcial', evidencia: 'Tecnóloga en producción industrial' },
        { habilidad: 'Habilidad inventada', cumple: 'si', evidencia: 'x' }
      ],
      resumen: 'Perfil técnico con experiencia en soldadura.'
    })
  );
  const evaluation = (await evaluate(vacancy, person)).result;
  const sent = JSON.stringify(calls[0].body);
  for (const value of ['Ana María Pérez', person.identificacion, person.correo, '3001234567', 'Medellín'])
    assert.equal(sent.includes(value), false, `no se envía ${value}`);
  assert.match(sent, /Soldadura MIG/);
  assert.match(calls[0].body.instructions, /edad/);
  assert.deepEqual(
    evaluation.criterios.habilidades.habilidades.map((item) => item.cumple),
    ['si', 'parcial'],
    'solo se valoran las habilidades que pide la vacante'
  );
  assert.equal(evaluation.criterios.habilidades.aporte, 18.8);
  assert.match(evaluation.justificacion, /Perfil técnico/);

  const unauthorized = await candidate({ autorizacionDatos: { otorgada: false, fecha: null, registradaPor: null } });
  const pending = (await evaluate(vacancy, unauthorized)).result;
  assert.equal(calls.length, 1, 'sin autorización no se llama a la IA');
  assert.equal(pending.habilidadesPendientes, true);
  assert.match(pending.aviso, /autorización/);
});

test('HU-29 CP-03: una vacante cerrada no admite evaluaciones', async () => {
  const vacancy = await createVacancy();
  const person = await candidate();
  await call('POST', `/api/vacantes/${vacancy.id}/cerrar`);
  const response = await evaluate(vacancy, person);
  assert.equal(response.statusCode, 409);
  assert.match(response.result.message, /cerrada/);
  assert.deepEqual((await candidates.get(person.id)).evaluaciones || [], []);
});

test('solo RRHH y administración evalúan y consultan el ranking', async () => {
  const vacancy = await createVacancy();
  const person = await candidate();
  assert.equal((await evaluate(vacancy, person, headers('comercial', 'jdiaz'))).statusCode, 403);
  assert.equal(
    (await call('GET', `/api/vacantes/${vacancy.id}/ranking`, undefined, headers('contabilidad', 'acastro')))
      .statusCode,
    403
  );
  assert.equal(
    (await call('POST', `/api/vacantes/${vacancy.id}/evaluaciones`, { candidatoId: 'no-existe' })).statusCode,
    404
  );
  assert.equal((await call('GET', '/api/vacantes/no-existe/ranking')).statusCode, 404);
});
