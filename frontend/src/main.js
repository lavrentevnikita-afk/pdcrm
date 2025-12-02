import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import './assets/styles.css';
import { useAuthStore } from './store/auth';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Init auth from storage and try to fetch current user
const authStore = useAuthStore(pinia);
authStore.initFromStorage();
if (authStore.token && !authStore.user) {
  authStore.fetchMe?.();
}

// Init theme
const savedTheme = localStorage.getItem('pdcrm_theme') || 'light';
document.documentElement.classList.remove('theme-light', 'theme-dark');
document.documentElement.classList.add(`theme-${savedTheme}`);

app.mount('#app');
