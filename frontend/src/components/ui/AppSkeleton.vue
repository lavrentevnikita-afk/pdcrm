<template>
  <div
    class="app-skeleton"
    :style="{ width, height, borderRadius: radius }"
  />
</template>

<script setup>
defineProps({
  width: {
    type: String,
    default: '100%',
  },
  height: {
    type: String,
    default: '12px',
  },
  radius: {
    type: String,
    default: '8px',
  },
});
</script>
