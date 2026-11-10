import http from './http';
import { fileToDataUrl } from './format';

const data = (response) => response.data;
const documentBlob = (candidateId, document) =>
  http
    .get(`/candidatos/${candidateId}/documentos/${document.id}`, { responseType: 'blob' })
    .then((response) => new Blob([response.data], { type: document.tipo }));

export const candidatosService = {
  list: () => http.get('/candidatos').then(data),
  get: (id) => http.get(`/candidatos/${id}`).then(data),
  create: (payload) => http.post('/candidatos', payload).then(data),
  attach: (id, payload) => http.post(`/candidatos/${id}/documentos`, payload).then(data),
  // HU-28: la IA propone; RRHH revisa y confirma.
  analyze: (id, documentoId) => http.post(`/candidatos/${id}/analisis`, { documentoId }).then(data),
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
