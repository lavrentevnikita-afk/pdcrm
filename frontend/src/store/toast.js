import { defineStore } from 'pinia';

let nextId = 1;

export const useToastStore = defineStore('toast', {
  state: () => ({
    toasts: [],
  }),
  actions: {
    push({ title, message = '', type = 'info', timeout = 3200 }) {
      const id = nextId++;
      this.toasts.push({ id, title, message, type });
      if (timeout) {
        setTimeout(() => this.remove(id), timeout);
      }
      return id;
    },
    success(title, message = '') {
      return this.push({ title, message, type: 'success' });
    },
    error(title, message = '') {
      return this.push({ title, message, type: 'error', timeout: 4500 });
    },
    remove(id) {
      this.toasts = this.toasts.filter((toast) => toast.id !== id);
    },
    clear() {
      this.toasts = [];
    },
  },
});
