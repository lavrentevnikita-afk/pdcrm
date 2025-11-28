<template>
  <div v-if="route.meta && route.meta.layout === 'blank'">
    <RouterView />
  </div>
  <div v-else>
    <AppLayout />
  </div>
</template>

<script setup>
import { RouterView, useRoute } from 'vue-router';
import AppLayout from './components/layout/AppLayout.vue';

const route = useRoute();
</script>
