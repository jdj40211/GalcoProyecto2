/**
 * cotizador.store.js
 *
 * Estado global del módulo cotizador:
 *  - catalogos  : tipos, alturas, brazos válidos, parámetros
 *  - resultado  : último cálculo en memoria (no persistido)
 *  - lista      : historial paginado
 *  - cargando / error : UI state
 */

import { defineStore } from 'pinia';
import cotizadorApi from '@/services/cotizador.service';

export const useCotizadorStore = defineStore('cotizador', {
  state: () => ({
    catalogos: null,
    resultado: null, // salida de /calculate o /cotizador (crear)
    ultimaConfig: null, // inputs con los que se calculó
    lista: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    cargando: false,
    cargandoLista: false,
    error: null
  }),

  getters: {
    brazosDisponibles: (s) => (tipo) => {
      if (!s.catalogos) return null;
      return s.catalogos.brazos?.[tipo] ?? null;
    }
  },

  actions: {
    async cargarCatalogos() {
      if (this.catalogos) return this.catalogos;
      this.error = null;
      try {
        this.catalogos = await cotizadorApi.catalogos();
        return this.catalogos;
      } catch (err) {
        this.error = err.message || 'No fue posible cargar los catálogos';
        throw err;
      }
    },

    async calcular(configuracion) {
      this.error = null;
      this.cargando = true;
      try {
        const data = await cotizadorApi.calcular(configuracion);
        this.resultado = data;
        this.ultimaConfig = { ...configuracion };
        return data;
      } catch (err) {
        this.error = err.message || 'Error al calcular';
        throw err;
      } finally {
        this.cargando = false;
      }
    },

    async guardar(configuracion, metadata) {
      this.error = null;
      this.cargando = true;
      try {
        const doc = await cotizadorApi.crear(configuracion, metadata);
        // El backend devuelve el documento completo (con consecutivo)
        this.resultado = doc;
        return doc;
      } catch (err) {
        this.error = err.message || 'Error al guardar';
        throw err;
      } finally {
        this.cargando = false;
      }
    },

    async cargarLista(params = {}) {
      this.cargandoLista = true;
      try {
        const { items, pagination } = await cotizadorApi.listar(params);
        this.lista = items;
        this.pagination = pagination;
      } finally {
        this.cargandoLista = false;
      }
    },

    limpiarResultado() {
      this.resultado = null;
      this.ultimaConfig = null;
      this.error = null;
    }
  }
});
