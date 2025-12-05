<template>
  <div class="app-card">
    <header v-if="hasHeader" class="app-card__header">
      <div>
        <div v-if="title" class="app-card__title">{{ title }}</div>
        <div v-if="subtitle" class="app-card__subtitle">{{ subtitle }}</div>
      </div>
      <div class="app-card__actions">
        <slot name="actions" />
      </div>
    </header>
    <div class="app-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="app-card__footer">
      <slot name="footer" />
    </footer>
  </div>
</template>

<script setup>
import { computed, useSlots } from 'vue';

const props = defineProps({
  title: String,
  subtitle: String,
});

const slots = useSlots();
const hasHeader = computed(() => props.title || props.subtitle || !!slots.actions);
</script>
