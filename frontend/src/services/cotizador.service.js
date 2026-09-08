/**
 * cotizador.service.js
 *
 * Capa delgada sobre HTTP para el módulo cotizador.
 * Cada método devuelve sólo el `data` útil (no el wrapper { ok, data }).
 */

import http from './http';

export default {
  async catalogos() {
    const { data } = await http.get('/cotizador/catalogos');
    return data.data;
  },

  async calcular(configuracion) {
    const { data } = await http.post('/cotizador/calculate', { configuracion });
    return data.data;
  },

  async crear(configuracion, metadata) {
    const { data } = await http.post('/cotizador', { configuracion, metadata });
    return data.data;
  },

  async listar(params = {}) {
    const { data } = await http.get('/cotizador', { params });
    return { items: data.data, pagination: data.pagination };
  },

  async obtener(id) {
    const { data } = await http.get(`/cotizador/${id}`);
    return data.data;
  },

  async cambiarEstado(id, estado) {
    const { data } = await http.patch(`/cotizador/${id}/estado`, { estado });
    return data.data;
  },

  pdfUrl(id) {
    const base = import.meta.env.VITE_API_BASE || '/api';
    return `${base}/cotizador/${id}/pdf`;
  },

  async descargarPdf(id, consecutivo) {
    // Descargamos con axios para incluir el token; luego creamos un blob.
    const res = await http.get(`/cotizador/${id}/pdf`, { responseType: 'blob' });
    const blob = new Blob([res.data], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${consecutivo || 'cotizacion'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};
