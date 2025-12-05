<template>
  <teleport to="body">
    <div v-if="visible" class="app-drawer__backdrop" @click.self="$emit('close')">
      <div class="app-drawer" :style="{ width }">
        <header class="app-drawer__header">
          <div>
            <div class="app-drawer__title">{{ title }}</div>
            <div v-if="subtitle" class="app-drawer__subtitle">{{ subtitle }}</div>
          </div>
          <button class="app-drawer__close" type="button" @click="$emit('close')">
            ×
          </button>
        </header>
        <div class="app-drawer__body">
          <slot />
        </div>
        <footer v-if="$slots.footer" class="app-drawer__footer">
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
  width: {
    type: String,
    default: '720px',
  },
});

defineEmits(['close']);
</script>

<style scoped>
.app-drawer__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.55);
  display: flex;
  justify-content: flex-end;
  z-index: 50;
}

.app-drawer {
  background: var(--bg-elevated);
  width: min(720px, 100%);
  height: 100vh;
  box-shadow: var(--shadow-lg);
  border-left: 1px solid var(--border-subtle);
  display: flex;
  flex-direction: column;
}

.app-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-subtle);
}

.app-drawer__title {
  font-size: 18px;
  font-weight: 700;
}

.app-drawer__subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.app-drawer__close {
  border: none;
  background: transparent;
  font-size: 22px;
  color: var(--text-muted);
  cursor: pointer;
}

.app-drawer__body {
  padding: 16px 20px 20px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-drawer__footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border-subtle);
  background: var(--bg-subtle);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
