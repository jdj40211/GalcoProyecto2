import http from './http';

const data = (response) => response.data;

export const vacantesService = {
  list: () => http.get('/vacantes').then(data),
  create: (payload) => http.post('/vacantes', payload).then(data),
  update: (id, payload) => http.put(`/vacantes/${id}`, payload).then(data),
  close: (id) => http.post(`/vacantes/${id}/cerrar`).then(data)
};
