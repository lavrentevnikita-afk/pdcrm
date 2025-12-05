<template>
  <teleport to="body">
    <div v-if="visible" class="app-modal__backdrop" @click.self="$emit('close')">
      <div class="app-modal">
        <header class="app-modal__header">
          <div>
            <div class="app-modal__title">{{ title }}</div>
            <div v-if="subtitle" class="app-modal__subtitle">{{ subtitle }}</div>
          </div>
          <button class="app-modal__close" type="button" @click="$emit('close')">×</button>
        </header>
        <div class="app-modal__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="app-modal__footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script setup>
defineProps({
  visible: Boolean,
  title: String,
  subtitle: String,
});

defineEmits(['close']);
</script>

<style scoped>
.app-modal__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
  padding: 16px;
}

.app-modal {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  width: min(640px, 100%);
  max-height: calc(100vh - 48px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-modal__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-subtle);
}

.app-modal__title {
  font-size: 18px;
  font-weight: 700;
}

.app-modal__subtitle {
  font-size: 14px;
  color: var(--text-muted);
}

.app-modal__close {
  border: none;
  background: transparent;
  font-size: 20px;
  color: var(--text-muted);
  cursor: pointer;
}

.app-modal__body {
  padding: 16px;
  overflow: auto;
  flex: 1;
}

.app-modal__footer {
  padding: 14px 16px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
