import { defineStore } from 'pinia';
import { loginWithAccessCode, fetchCurrentUser } from '../api/auth';

const TOKEN_KEY = 'pdcrm_token';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem(TOKEN_KEY) || null,
    loading: false,
    unreadNotifications: 0,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
  },
  actions: {
    setToken(token) {
      this.token = token;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    },
    async loginWithCode(accessCode) {
      this.loading = true;
      try {
        const data = await loginWithAccessCode(accessCode);
        this.setToken(data.token);
        this.user = data.user;
        this.unreadNotifications = data.unreadNotifications ?? 0;
      } catch (error) {
        // Не глотаем ошибку, чтобы экран логина мог показать сообщение
        throw error;
      } finally {
        this.loading = false;
      }
    },
    async loadCurrentUser() {
      if (!this.token) return;

      try {
        const data = await fetchCurrentUser();
        this.user = data.user;
        this.unreadNotifications = data.unreadNotifications ?? this.unreadNotifications;
      } catch (error) {
        // Если токен невалиден — сбрасываем авторизацию
        this.setToken(null);
        this.user = null;
        this.unreadNotifications = 0;
      }
    },
    logout() {
      this.setToken(null);
      this.user = null;
      this.unreadNotifications = 0;
    },
  },
});
