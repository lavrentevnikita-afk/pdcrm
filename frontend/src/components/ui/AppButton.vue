<template>
  <button
    class="app-btn"
    :class="[
      `app-btn--${variant}`,
      `app-btn--${size}`,
      { 'app-btn--block': block, 'is-loading': loading },
    ]"
    :disabled="disabled || loading"
    :type="type"
    @click="$emit('click', $event)"
  >
    <span class="app-btn__spinner" v-if="loading" aria-hidden="true"></span>
    <span class="app-btn__label"><slot /></span>
  </button>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
  },
  size: {
    type: String,
    default: 'md',
  },
  block: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  type: {
    type: String,
    default: 'button',
  },
});
</script>

<style scoped>
.app-btn {
  border: none;
  cursor: pointer;
  border-radius: var(--radius-md);
  padding: 0 14px;
  height: 40px;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.1s ease, box-shadow 0.15s ease,
    background-color 0.15s ease, color 0.15s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.app-btn:hover {
  transform: translateY(-1px);
}

.app-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.app-btn--block {
  width: 100%;
}

.app-btn--primary {
  background: linear-gradient(90deg, var(--primary), var(--primary-strong));
  color: #fff;
  box-shadow: var(--shadow-sm);
}

.app-btn--secondary {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  color: var(--text-primary);
}

.app-btn--ghost {
  background: transparent;
  color: var(--text-muted);
}

.app-btn--sm {
  height: 32px;
  font-size: 13px;
  padding: 0 12px;
}

.app-btn--lg {
  height: 48px;
  font-size: 15px;
  padding: 0 18px;
}

.app-btn__spinner {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-top-color: #fff;
  animation: spin 0.8s linear infinite;
}

.app-btn--secondary .app-btn__spinner,
.app-btn--ghost .app-btn__spinner {
  border-color: rgba(0, 0, 0, 0.15);
  border-top-color: var(--primary);
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
