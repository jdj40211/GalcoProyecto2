import http from './http';

const data = (response) => response.data;

export const candidatosService = {
  list: () => http.get('/candidatos').then(data),
  create: (payload) => http.post('/candidatos', payload).then(data),
  attach: (id, payload) => http.post(`/candidatos/${id}/documentos`, payload).then(data),

  // Se descarga con axios para enviar el token y se entrega como archivo con su nombre original.
  async download(candidateId, document) {
    const response = await http.get(`/candidatos/${candidateId}/documentos/${document.id}`, { responseType: 'blob' });
    const url = URL.createObjectURL(new Blob([response.data], { type: document.tipo }));
    const link = Object.assign(window.document.createElement('a'), { href: url, download: document.nombre });
    window.document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }
};
