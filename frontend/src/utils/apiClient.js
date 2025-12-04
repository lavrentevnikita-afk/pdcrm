import axios from 'axios';

// Единый клиент API, который:
// - всегда ходит на backend по префиксу /api
// - автоматически подставляет Authorization-токен из localStorage (как и глобальный axios)

const API_BASE =
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: `${API_BASE}/api`,
});

// Перед каждым запросом подставляем токен, если он сохранён
api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('pdcrm_auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.token) {
        if (!config.headers) config.headers = {};
        if (!config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${parsed.token}`;
        }
      }
    }
  } catch (e) {
    // ignore parse errors
  }
  return config;
});

export default api;
