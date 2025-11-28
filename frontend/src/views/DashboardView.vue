<template>
  <section>
    <h1>Дэшборд</h1>
    <p>Это стартовый дэшборд CRM типографии. Сейчас в рамках Phase 1 настроен базовый каркас.</p>

    <p v-if="health">
      <strong>Backend:</strong>
      <span>{{ health.status }} · {{ new Date(health.timestamp).toLocaleString() }}</span>
    </p>
    <p v-else>
      <em>Пробуем получить статус backend...</em>
    </p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { api } from '../api';

const health = ref(null);

onMounted(async () => {
  try {
    const { data } = await api.get('/health');
    health.value = data;
  } catch (e) {
    console.error('Не удалось получить статус backend', e);
  }
});
</script>
