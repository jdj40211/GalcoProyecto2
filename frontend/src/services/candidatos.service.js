import http from './http';

const data = (response) => response.data;

export const candidatosService = {
  list: () => http.get('/candidatos').then(data),
  create: (payload) => http.post('/candidatos', payload).then(data)
};
