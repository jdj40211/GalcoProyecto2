import { defineStore } from 'pinia';

export const useToastStore = defineStore('toast', {
  state: () => ({ items: [] }),
  actions: {
    show(message, tone = 'info') {
      const id = `${Date.now()}-${Math.random()}`;
      this.items.push({ id, message, tone });
      setTimeout(() => this.remove(id), 4500);
    },
    remove(id) {
      this.items = this.items.filter((item) => item.id !== id);
    }
  }
});
