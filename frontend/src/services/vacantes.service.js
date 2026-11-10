import http from './http';

const data = (response) => response.data;

export const vacantesService = {
  list: () => http.get('/vacantes').then(data),
  get: (id) => http.get(`/vacantes/${id}`).then(data),
  // HU-30: evaluación del candidato frente a la vacante y ranking.
  evaluate: (id, candidatoId) => http.post(`/vacantes/${id}/evaluaciones`, { candidatoId }).then(data),
  ranking: (id, soloCumplen = false) => http.get(`/vacantes/${id}/ranking`, { params: { soloCumplen } }).then(data),
  create: (payload) => http.post('/vacantes', payload).then(data),
  update: (id, payload) => http.put(`/vacantes/${id}`, payload).then(data),
  close: (id) => http.post(`/vacantes/${id}/cerrar`).then(data)
};
