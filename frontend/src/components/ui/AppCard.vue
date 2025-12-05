<template>
  <div class="app-card" :class="{ 'app-card--padded': padded }">
    <header v-if="title || $slots.actions" class="app-card__header">
      <div>
        <div v-if="eyebrow" class="app-card__eyebrow">{{ eyebrow }}</div>
        <div v-if="title" class="app-card__title">{{ title }}</div>
        <div v-if="subtitle" class="app-card__subtitle">{{ subtitle }}</div>
      </div>
      <div class="app-card__actions">
        <slot name="actions"></slot>
      </div>
    </header>
    <div class="app-card__body">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
  eyebrow: String,
  padded: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped>
.app-card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  color: var(--text-primary);
}

.app-card--padded {
  padding: 16px;
}

.app-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.app-card__title {
  font-size: 16px;
  font-weight: 700;
}

.app-card__subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.app-card__eyebrow {
  font-size: 12px;
  color: var(--primary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 700;
  margin-bottom: 4px;
}

.app-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
