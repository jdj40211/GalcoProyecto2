'use strict';

const Boom = require('@hapi/boom');
const repository = require('./candidatos.repository.service');
const storage = require('./documentos.storage.service');
const documents = require('./documentos.service');
const analyses = require('./analisis.service');
const vacancies = require('./vacantes.service');
const evaluations = require('./evaluaciones.service');

const { publicDocument } = documents;
const { yearsOfExperience } = analyses;
const PENDING = 'pendiente_revision';
const ANALYZABLE = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

// "1.017.234.567", "1017234567" y "1017 234 567" son la misma identificación.
const normalizeId = (value) => value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
// El identificador interno del archivo no sale del servidor.
const publicCandidate = (candidate) => ({ ...candidate, documentos: (candidate.documentos || []).map(publicDocument) });

module.exports = {
  async list() {
    const items = (await repository.list()).map(publicCandidate);
    return { items, total: items.length };
  },
  async get(id) {
    const candidate = await repository.get(id);
    if (!candidate) throw Boom.notFound('Candidato no encontrado.');
    return publicCandidate(candidate);
  },
  async create(payload, credentials) {
    const now = new Date().toISOString();
    const created = await repository.create({
      ...payload,
      documentos: [],
      habilidades: [],
      idiomas: [],
      analisis: [],
      anosExperiencia: yearsOfExperience(payload.experiencia),
      identificacion: normalizeId(payload.identificacion),
      // La autorización (Ley 1581 de 2012) se registra con fecha y responsable; sin ella no se usa la IA (HU-28).
      autorizacionDatos: payload.autorizacionDatos
        ? { otorgada: true, fecha: now, registradaPor: credentials.usuario }
        : { otorgada: false, fecha: null, registradaPor: null },
      estado: 'registrado',
      registradoPor: { uid: credentials.uid, usuario: credentials.usuario, nombre: credentials.name }
    });
    return publicCandidate(created);
  },

  // HU-34: la hoja de vida crea un candidato pendiente de revisión para la vacante elegida y se
  // analiza de inmediato. Si algo falla, no queda ni el candidato ni su archivo (CA3).
  async registerFromResume({ vacanteId, autorizacionDatos, nombre, tipo, fileDataUrl }, credentials) {
    // CA1: sin autorización de tratamiento de datos (Ley 1581 de 2012) no se envía nada a la IA.
    if (autorizacionDatos !== true)
      throw Boom.badRequest(
        'Confirma que los candidatos autorizaron el tratamiento de sus datos: sin esa autorización no se envía nada a la IA.'
      );
    const vacancy = await vacancies.openForEvaluation(vacanteId);
    const extension = Object.keys(ANALYZABLE).find((ext) => nombre.toLowerCase().endsWith(ext));
    if (!extension || ANALYZABLE[extension] !== tipo)
      throw Boom.badRequest(
        'Para registrar desde la hoja de vida usa un PDF o DOCX; un DOC se registra con el formulario manual.'
      );
    const now = new Date().toISOString();
    const pending = await repository.create({
      tipoIdentificacion: 'CC',
      identificacion: '',
      nombre: '',
      correo: '',
      telefono: '',
      ciudad: '',
      cargoInteres: vacancy.cargo,
      vacanteId: vacancy.id,
      fuente: 'Hoja de vida',
      formacion: [],
      experiencia: [],
      certificaciones: [],
      habilidades: [],
      idiomas: [],
      documentos: [],
      analisis: [],
      evaluaciones: [],
      anosExperiencia: 0,
      autorizacionDatos: { otorgada: true, fecha: now, registradaPor: credentials.usuario },
      estado: PENDING,
      registradoPor: { uid: credentials.uid, usuario: credentials.usuario, nombre: credentials.name }
    });
    try {
      const document = await documents.upload(
        pending.id,
        { nombre, tipo, tipoDocumento: 'hoja_de_vida', fileDataUrl },
        credentials
      );
      const analisis = await analyses.analyze(pending.id, { documentoId: document.id }, credentials);
      return { candidato: publicCandidate(await repository.get(pending.id)), analisis };
    } catch (error) {
      await discard(pending.id).catch(() => {});
      throw error;
    }
  },

  // Confirma el análisis. Si el candidato venía de su hoja de vida (HU-34), queda registrado y se evalúa
  // contra su vacante; si la vacante se cerró, queda registrado sin evaluación y con aviso (CA5).
  async confirmAnalysis(id, analysisId, payload, credentials) {
    const before = await repository.get(id);
    const updated = await analyses.confirm(id, analysisId, payload, credentials);
    let evaluacion = null;
    let avisoEvaluacion = '';
    if (before?.estado === PENDING && before.vacanteId) {
      try {
        evaluacion = await evaluations.evaluate(before.vacanteId, { candidatoId: id }, credentials);
      } catch (error) {
        avisoEvaluacion = `Quedó registrado sin evaluación: ${error.message}`;
      }
    }
    return { ...updated, evaluacion, avisoEvaluacion };
  },

  // CA6: solo se descarta un candidato pendiente; uno registrado no se borra por esta vía.
  async removePending(id) {
    const candidate = await repository.get(id);
    if (!candidate) throw Boom.notFound('Candidato no encontrado.');
    if (candidate.estado !== PENDING) throw Boom.conflict('Solo se descartan candidatos pendientes de revisión.');
    await discard(id);
    return { ok: true };
  },
  normalizeId
};

// Borra el candidato y los archivos de sus documentos.
async function discard(id) {
  const candidate = await repository.get(id);
  for (const document of candidate?.documentos || []) await storage.remove(document.archivoId).catch(() => {});
  await repository.remove(id);
}
