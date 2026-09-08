import http from './http';

const data = (response) => response.data;

export const viaticosService = {
  list: (filters = {}) => http.get('/viaticos', { params: filters }).then(data),
  get: (id) => http.get(`/viaticos/${id}`).then(data),
  create: (payload) => http.post('/viaticos', payload).then(data),
  update: (id, payload) => http.put(`/viaticos/${id}`, payload).then(data),
  remove: (id) => http.delete(`/viaticos/${id}`).then(data),
  approve: (id) => http.post(`/viaticos/${id}/approve`).then(data),
  reject: (id, motivo) => http.post(`/viaticos/${id}/reject`, { motivo }).then(data),
  extract: (payload) => http.post('/ocr/extract', payload, { timeout: 45000 }).then(data),
  exportTxt: (ids, markExported = false) => http.post('/viaticos/export', { ids, markExported }).then(data)
};
