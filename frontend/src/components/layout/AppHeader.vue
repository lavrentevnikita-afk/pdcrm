<template>
  <header class="app-header">
    <div class="app-header-left">
      <div class="app-logo-circle">P</div>
      <div>
        <div class="app-header-title">Print CRM</div>
        <div class="app-header-subtitle">Рабочее место типографии</div>
      </div>
    </div>

    <div class="app-header-center">
      <div class="app-header-phase">Phase 2 · Авторизация и персонализация</div>
      <div class="app-header-phrase">
        {{ motivationPhrase }}
      </div>
    </div>

    <div class="app-header-right">
      <button class="notification-button" type="button">
        <span class="notification-icon">🔔</span>
        <span v-if="unreadCount > 0" class="notification-badge">
          {{ unreadCount }}
        </span>
      </button>

      <div class="app-header-user">
        <div class="app-header-greeting">
          {{ greeting }},
          <strong>{{ displayName }}</strong>
        </div>
        <div v-if="userRoleLabel" class="app-header-role">
          {{ userRoleLabel }}
        </div>
      </div>

      <div class="app-header-avatar" :title="displayName">
        <span>{{ initials }}</span>
      </div>

      <button v-if="isAuthenticated" class="logout-button" type="button" @click="handleLogout">
        Выйти
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../store';

const authStore = useAuthStore();
const router = useRouter();

const motivationPhrase = ref('');

const phrases = [
  'Сегодня сделаем идеальный тираж 💪',
  'Каждый макет — шаг к довольному клиенту.',
  'Четкие сроки, чистые макеты, счастливые клиенты.',
  'Ни один заказ не останется без внимания.',
  'Типография работает — бизнес клиентов растёт.',
];

function pickPhrase() {
  const index = Math.floor(Math.random() * phrases.length);
  motivationPhrase.value = phrases[index];
}

const greeting = computed(() => {
  const hour = new Date().getHours();

  if (hour >= 5 && hour < 12) return 'Доброе утро';
  if (hour >= 12 && hour < 18) return 'Добрый день';
  if (hour >= 18 && hour < 23) return 'Добрый вечер';
  return 'Доброй ночи';
});

const displayName = computed(() => {
  return authStore.user?.name || 'Гость';
});

const initials = computed(() => {
  if (!authStore.user?.name) return '?';
  const parts = authStore.user.name.split(' ').filter(Boolean);
  const chars = parts.map((p) => p[0]?.toUpperCase()).join('');
  return chars || '?';
});

const unreadCount = computed(() => authStore.unreadNotifications || 0);

const isAuthenticated = computed(() => authStore.isAuthenticated);

const userRoleLabel = computed(() => {
  const role = authStore.user?.role;
  if (!role) return '';

  switch (role) {
    case 'director':
      return 'Директор';
    case 'admin':
      return 'Администратор';
    case 'designer':
      return 'Дизайнер';
    case 'production':
      return 'Производство';
    default:
      return role;
  }
});

function handleLogout() {
  authStore.logout();
  router.push({ name: 'login' });
}

onMounted(() => {
  pickPhrase();

  // При обновлении страницы подгружаем пользователя по токену, если он есть
  if (!authStore.user && authStore.token) {
    authStore.loadCurrentUser();
  }
});
</script>
