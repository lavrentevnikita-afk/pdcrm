<template>
  <teleport to="body">
    <div class="app-toast-stack">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="app-toast"
        :class="`app-toast--${toast.type}`"
      >
        <div class="app-toast__title">{{ toast.title }}</div>
        <div v-if="toast.message" class="app-toast__message">
          {{ toast.message }}
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup>
import { storeToRefs } from 'pinia';
import { useToastStore } from '../../store/toast';

const toastStore = useToastStore();
const { toasts } = storeToRefs(toastStore);
</script>

<style scoped>
.app-toast-stack {
  position: fixed;
  inset: 12px 12px auto auto;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 60;
}

.app-toast {
  min-width: 260px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-left: 4px solid var(--primary);
  box-shadow: var(--shadow-md);
  padding: 12px 14px;
  border-radius: var(--radius-md);
}

.app-toast--success {
  border-left-color: var(--success);
}

.app-toast--error {
  border-left-color: var(--error);
}

.app-toast__title {
  font-weight: 700;
  font-size: 14px;
}

.app-toast__message {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
