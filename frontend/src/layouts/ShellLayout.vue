<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">PD<span>CRM</span></div>
        <div class="sidebar-caption">Типография / сувенирка</div>
      </div>

      <nav class="sidebar-nav">
        <RouterLink
          to="/orders"
          class="sidebar-link"
          active-class="sidebar-link-active"
        >
          <span class="sidebar-link-dot" />
          <span>Заказы</span>
        </RouterLink>
        <!-- Остальные разделы пока-плейсхолдеры -->
        <div class="sidebar-section-label">Скоро</div>
        <button class="sidebar-link" type="button" disabled>
          <span class="sidebar-link-dot" />
          <span>Касса</span>
        </button>
        <button class="sidebar-link" type="button" disabled>
          <span class="sidebar-link-dot" />
          <span>Склад</span>
        </button>
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
import { RouterView, RouterLink, useRouter } from 'vue-router';
import AppHeader from '../components/AppHeader.vue';
import { useAuthStore } from '../store/auth';

const auth = useAuthStore();
const router = useRouter();

function logout() {
  auth.logout();
  router.push({ name: 'login' });
}
</script>
