import { defineStore } from 'pinia';
import { useAuthStore } from './auth.store';

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    show(message, tone = 'info') {
      // Con la sesión vencida, el aviso del login ya explica qué pasó; los errores de las peticiones sobran.
      if (tone === 'danger' && useAuthStore().endReason === 'expirada') return;
      const id = `${Date.now()}-${Math.random()}`;
      this.items.push({ id, message, tone });
      setTimeout(() => this.remove(id), 4500);
    },
    remove(id) {
      this.items = this.items.filter((item) => item.id !== id);
    }
  }
});
