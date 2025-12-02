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

      <template v-for="group in filteredGroups" :key="group.key">
        <div class="sidebar-group-title">{{ group.label }}</div>
        <ul class="sidebar-menu">
          <li
            v-for="item in group.items"
            :key="item.to"
            class="sidebar-item"
          >
            <RouterLink
              class="sidebar-link"
              :to="item.to"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </template>

      <div class="sidebar-footer">
        <div>PDCRM v0.1 phase1</div>
        <button class="sidebar-logout-btn" type="button">
          Выход
        </button>
      </div>
    </aside>

    <header class="app-header">
      <div>
        <div class="header-title">Печатный двор — внутренняя CRM система</div>
        <div class="header-subtitle">Phase 1 · UI skeleton</div>
      </div>
      <div class="header-subtitle">
        Пользователь не авторизован
      </div>
    </header>

    <main class="app-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';

const menuSearch = ref('');

const groups = [
  {
    key: 'main',
    label: 'Основные',
    items: [
      { to: '/dashboard', label: 'Дэшборд' },
      { to: '/orders', label: 'Заказы' },
      { to: '/cash', label: 'Касса' },
    ],
  },
  {
    key: 'management',
    label: 'Управление',
    items: [
      { to: '/warehouse', label: 'Склад' },
      { to: '/staff', label: 'Персонал' },
      { to: '/analytics', label: 'Аналитика' },
    ],
  },
  {
    key: 'other',
    label: 'Справочники и настройки',
    items: [
      { to: '/directories', label: 'Справочники' },
      { to: '/settings', label: 'Настройки' },
      { to: '/permissions', label: 'Разрешения' },
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
</script>
