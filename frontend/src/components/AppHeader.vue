<template>
  <header class="app-header">
    <div class="header-left">
      <div class="header-title">
        {{ greeting }}, {{ userName }}!
      </div>
      <div class="header-subtitle">
        <span>{{ currentTitle }}</span>
        <span v-if="currentSubtitle" class="header-subtitle-separator">•</span>
        <span v-if="currentSubtitle">{{ currentSubtitle }}</span>
      </div>
    </div>

    <div class="header-center">
      <span v-if="roleLabel" class="role-badge">{{ roleLabel }}</span>
      <span class="motivation">{{ motivationPhrase }}</span>
    </div>

    <div class="header-right">
      <!-- theme -->
      <button
        type="button"
        class="header-circle"
        :aria-pressed="theme === 'dark'"
        @click="toggleTheme"
      >
        <span v-if="theme === 'light'">☀️</span>
        <span v-else>🌙</span>
      </button>

      <!-- notifications -->
      <div class="header-notifications">
        <button
          type="button"
          class="header-circle"
          @click="toggleNotifications"
        >
          🔔
          <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
        </button>
        <div v-if="showNotifications" class="notifications-dropdown">
          <div v-if="!notifications.length" class="notifications-empty">
            Нет уведомлений
          </div>
          <div v-else class="notifications-list">
            <div
              v-for="item in notifications"
              :key="item.id"
              class="notification"
              :class="{ read: item.is_read }"
            >
              <div class="title">{{ item.title }}</div>
              <div class="message">{{ item.message }}</div>
              <div class="meta">{{ formatDate(item.created_at) }}</div>
              <button v-if="!item.is_read" type="button" @click="markRead(item.id)">
                Прочитано
              </button>
            </div>
            <button class="mark-all" type="button" @click="markAll">Отметить все прочитанными</button>
          </div>
        </div>
      </div>

      <!-- reserved -->
      <button type="button" class="header-circle header-circle-muted">
        ⋮
      </button>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../store/auth';

const route = useRoute();
const auth = useAuthStore();

const theme = ref('light');
const showNotifications = ref(false);
const notifications = ref([]);

const motivationPhrases = [
  'Хороших заказов и спокойного дня 👌',
  'Каждый тираж — шаг к росту выручки 💰',
  'Аккуратные дедлайны — довольные клиенты 🙂',
  'Меньше рутины — больше творчества 🎨',
];

const userName = computed(() => auth.user?.name || 'коллега');
const roleLabel = computed(() => {
  const role = auth.user?.role;
  if (role === 'designer') return 'Дизайн';
  if (role === 'production') return 'Производство';
  if (role === 'director') return 'Директор';
  if (role === 'admin') return 'Админ';
  return null;
});

const currentTitle = computed(
  () => route.meta.title || 'Рабочее пространство'
);
const currentSubtitle = computed(() => route.meta.subtitle || '');

const greeting = computed(() => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
});

const motivationPhrase = computed(() => {
  const idx = Number(localStorage.getItem('pdcrm_motivation_idx') ?? '0');
  return motivationPhrases[idx % motivationPhrases.length];
});

function applyTheme(nextTheme) {
  theme.value = nextTheme;
  document.documentElement.classList.remove('theme-light', 'theme-dark');
  document.documentElement.classList.add(`theme-${nextTheme}`);
  localStorage.setItem('pdcrm_theme', nextTheme);
}

function toggleTheme() {
  const next = theme.value === 'light' ? 'dark' : 'light';
  applyTheme(next);
}

function toggleNotifications() {
  showNotifications.value = !showNotifications.value;
}

async function loadNotifications() {
  const { data } = await axios.get('/api/notifications');
  notifications.value = data.notifications;
}

const unreadCount = computed(
  () => notifications.value.filter((n) => !n.is_read).length
);

function formatDate(value) {
  return new Date(value).toLocaleString();
}

async function markRead(id) {
  const { data } = await axios.post('/api/notifications/mark-read', { id });
  notifications.value = data.notifications;
}

async function markAll() {
  const { data } = await axios.post('/api/notifications/mark-read');
  notifications.value = data.notifications;
}

onMounted(() => {
  const saved = localStorage.getItem('pdcrm_theme') || 'light';
  applyTheme(saved);

  const nextIdx =
    (Number(localStorage.getItem('pdcrm_motivation_idx') ?? '0') + 1) %
    motivationPhrases.length;
  localStorage.setItem('pdcrm_motivation_idx', String(nextIdx));

  loadNotifications();
});
</script>
