<template>
  <aside class="app-sidebar">
    <nav>
      <RouterLink to="/">Дэшборд</RouterLink>
      <RouterLink to="/orders">Заказы</RouterLink>
      <RouterLink to="/clients">Клиенты</RouterLink>
      <RouterLink to="/products">Продукция</RouterLink>
    </nav>
  </aside>
</template>

<script setup>
import { RouterLink } from 'vue-router';
</script>
