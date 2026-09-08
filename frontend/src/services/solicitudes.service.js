import http from './http';

const data = (response) => response.data;

export const solicitudesService = {
  list: (filters = {}) => http.get('/solicitudes-viaticos', { params: filters }).then(data),
  get: (id) => http.get(`/solicitudes-viaticos/${id}`).then(data),
  create: (payload) => http.post('/solicitudes-viaticos', payload).then(data),
  update: (id, payload) => http.put(`/solicitudes-viaticos/${id}`, payload).then(data),
  remove: (id) => http.delete(`/solicitudes-viaticos/${id}`).then(data),
  send: (id) => http.post(`/solicitudes-viaticos/${id}/enviar`).then(data),
  approve: (id) => http.post(`/solicitudes-viaticos/${id}/aprobar`).then(data),
  reject: (id, motivo) => http.post(`/solicitudes-viaticos/${id}/rechazar`, { motivo }).then(data)
};
