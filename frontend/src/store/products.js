import { defineStore } from 'pinia';
import api from '../utils/apiClient';

export const useProductsStore = defineStore('products', {
  state: () => ({
    categories: [],
    products: [],
    loading: false,
    error: null,
  }),

  getters: {
    productsById(state) {
      const map = new Map();
      for (const p of state.products) {
        map.set(p.id, p);
      }
      return map;
    },
  },

  actions: {
    async fetchCategories() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/product-categories');
        this.categories = data.items || data;
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Не удалось загрузить категории.';
      } finally {
        this.loading = false;
      }
    },

    async fetchProducts(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/products', { params });
        this.products = data.items || data;
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Не удалось загрузить продукцию.';
      } finally {
        this.loading = false;
      }
    },
  },
});
