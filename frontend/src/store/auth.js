import { defineStore } from 'pinia';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

axios.defaults.baseURL = API_BASE_URL;

function applyToken(token) {
  if (token) {
    axios.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common.Authorization;
  }
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: null,
    loading: false,
    error: null,
  }),
  getters: {
    isAuthenticated(state) {
      return !!state.token && !!state.user;
    },
  },
  actions: {
    initFromStorage() {
      const raw = localStorage.getItem('pdcrm_auth');
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw);
        this.token = parsed.token || null;
        this.user = parsed.user || null;
        applyToken(this.token);
      } catch (e) {
        console.warn('Failed to parse auth from storage', e);
      }
    },
    persist() {
      localStorage.setItem(
        'pdcrm_auth',
        JSON.stringify({ token: this.token, user: this.user })
      );
    },
    async login(code) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await axios.post('/api/auth/login', { code });
        this.token = data.token;
        this.user = data.user;
        applyToken(this.token);
        this.persist();
      } catch (err) {
        console.error(err);
        this.error =
          err.response?.data?.message ||
          'Не удалось войти. Попробуйте ещё раз.';
        this.token = null;
        this.user = null;
      } finally {
        this.loading = false;
      }
    },
    async fetchMe() {
      if (!this.token) return;
      try {
        const { data } = await axios.get('/api/auth/me');
        this.user = data;
        this.persist();
      } catch (err) {
        console.error('fetchMe failed', err);
        this.logout();
      }
    },
    logout() {
      this.user = null;
      this.token = null;
      this.error = null;
      applyToken(null);
      localStorage.removeItem('pdcrm_auth');
    },
  },
});
