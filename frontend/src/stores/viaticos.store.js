import { defineStore } from 'pinia';
import { viaticosService } from '@/services/viaticos.service';

export const useViaticosStore = defineStore('viaticos', {
  state: () => ({ records: [], loading: false, error: null }),
  actions: {
    async fetch(filters = {}) {
      this.loading = true;
      this.error = null;
      try {
        const result = await viaticosService.list(filters);
        this.records = result.items;
        return result;
      } catch (error) {
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async create(payload) {
      const record = await viaticosService.create(payload);
      this.records.unshift(record);
      return record;
    },
    async remove(id) {
      await viaticosService.remove(id);
      this.records = this.records.filter((record) => record.id !== id);
    },
    async approve(id) {
      const record = await viaticosService.approve(id);
      this.replace(record);
      return record;
    },
    async reject(id, motivo) {
      const record = await viaticosService.reject(id, motivo);
      this.replace(record);
      return record;
    },
    replace(record) {
      const index = this.records.findIndex((item) => item.id === record.id);
      if (index >= 0) this.records[index] = record;
    }
  }
});
