import http from './http';
import { fileToDataUrl } from './format';

const data = (response) => response.data;
const ANALYSIS_TIMEOUT_MS = 120000;
const documentBlob = (candidateId, document) =>
  http
    .get(`/candidatos/${candidateId}/documentos/${document.id}`, { responseType: 'blob' })
    .then((response) => new Blob([response.data], { type: document.tipo }));

export const candidatosService = {
  list: () => http.get('/candidatos').then(data),
  get: (id) => http.get(`/candidatos/${id}`).then(data),
  create: (payload) => http.post('/candidatos', payload).then(data),
  attach: (id, payload) => http.post(`/candidatos/${id}/documentos`, payload).then(data),
  // HU-28: la IA propone; RRHH revisa y confirma. El análisis puede tardar hasta OCR_TIMEOUT_MS (45 s) en el
  // servidor: si la interfaz cortara antes, el candidato se crearía igual y un reintento lo duplicaría.
  analyze: (id, documentoId) =>
    http.post(`/candidatos/${id}/analisis`, { documentoId }, { timeout: ANALYSIS_TIMEOUT_MS }).then(data),
  // HU-34: registra desde la hoja de vida (queda pendiente de revisión) y descarta pendientes.
  registerFromResume: (payload) =>
    http.post('/candidatos/desde-hoja-de-vida', payload, { timeout: ANALYSIS_TIMEOUT_MS }).then(data),
  removePending: (id) => http.delete(`/candidatos/${id}`).then(data),
  confirm: (id, analisisId, datos) =>
    http.post(`/candidatos/${id}/analisis/${analisisId}/confirmar`, { datos }).then(data),

  // El documento como data URL, para la vista previa (PdfPreview).
  documentDataUrl: async (candidateId, document) => fileToDataUrl(await documentBlob(candidateId, document)),

  // Se descarga con axios para enviar el token y se entrega como archivo con su nombre original.
  async download(candidateId, document) {
    const url = URL.createObjectURL(await documentBlob(candidateId, document));
    const link = Object.assign(window.document.createElement('a'), { href: url, download: document.nombre });
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
};
