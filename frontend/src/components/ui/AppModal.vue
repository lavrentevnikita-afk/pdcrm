<template>
  <teleport to="body">
    <div class="app-modal__backdrop" @click.self="$emit('close')">
      <div class="app-modal">
        <header class="app-modal__header">
          <div>
            <div class="app-modal__title">{{ title }}</div>
            <div v-if="subtitle" class="app-modal__subtitle">{{ subtitle }}</div>
          </div>
          <button type="button" class="app-modal__close" @click="$emit('close')">
            ×
          </button>
        </header>
        <div class="app-modal__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="app-modal__footer">
          <slot name="footer" />
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
});

defineEmits(['close']);
</script>
