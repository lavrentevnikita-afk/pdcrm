<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="sidebar-logo">Печатный двор</div>
      <div class="sidebar-subtitle">внутренняя CRM система</div>

      <div class="sidebar-search">
        <input
          v-model="menuSearch"
          type="text"
          placeholder="Поиск по меню…"
        />
      </div>

      <nav class="sidebar-nav">
        <div
          v-for="group in filteredGroups"
          :key="group.key"
          class="sidebar-group"
        >
          <div class="sidebar-group-title">
            {{ group.label }}
          </div>
          <RouterLink
            v-for="item in group.items"
            :key="item.to"
            :to="item.to"
            class="sidebar-link"
            :class="{ 'sidebar-link-active': isActive(item.to) }"
          >
            <span class="sidebar-link-dot" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <button class="sidebar-logout" type="button" @click="logout">
        Выйти
      </button>
    </aside>

    <main class="app-main">
      <AppHeader />
      <section class="app-content">
        <RouterView />
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter, RouterView, RouterLink } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import { useAuthStore } from '../store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const menuSearch = ref('');

const groups = [
  {
    key: 'main',
    label: 'Основные',
    items: [
      { label: 'Дэшборд', to: '/dashboard' },
      { label: 'Заказы', to: '/orders' },
      { label: 'Касса', to: '/cash' },
    ],
  },
  {
    key: 'operations',
    label: 'Операционные',
    items: [
      { label: 'Склад', to: '/warehouse' },
      { label: 'Персонал', to: '/staff' },
      { label: 'Аналитика', to: '/analytics' },
    ],
  },
  {
    key: 'system',
    label: 'Системные',
    items: [
      { label: 'Справочники', to: '/directories' },
      { label: 'Настройки', to: '/settings' },
      { label: 'Разрешения', to: '/permissions' },
    ],
  },
];

const filteredGroups = computed(() => {
  const q = menuSearch.value.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) =>
        item.label.toLowerCase().includes(q)
      ),
    }))
    .filter((group) => group.items.length > 0);
});

function isActive(path) {
  return route.path === path;
}

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>
