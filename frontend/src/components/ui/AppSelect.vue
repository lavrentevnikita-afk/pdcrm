<template>
  <label class="app-select">
    <span v-if="label" class="app-select__label">{{ label }}</span>
    <div class="app-select__wrapper">
      <select
        :value="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.value)"
      >
        <option value="" disabled v-if="placeholder">{{ placeholder }}</option>
        <option v-for="option in options" :key="option.value" :value="option.value">
          {{ option.label }}
        </option>
      </select>
    </div>
    <span v-if="hint" class="app-select__hint">{{ hint }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: [String, Number],
  label: String,
  options: {
    type: Array,
    default: () => [],
  },
  placeholder: String,
  hint: String,
  disabled: Boolean,
});

defineEmits(['update:modelValue']);
</script>

<style scoped>
.app-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  font-size: 14px;
}

.app-select__label {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.app-select__wrapper {
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 8px 12px;
}

select {
  width: 100%;
  border: none;
  background: transparent;
  font: inherit;
  color: var(--text-primary);
  outline: none;
}

.app-select__hint {
  font-size: 12px;
  color: var(--text-muted);
}
</style>
