<template>
  <label class="app-input">
    <span v-if="label" class="app-input__label">{{ label }}</span>
    <div class="app-input__wrapper" :class="{ 'has-error': !!error }">
      <slot name="prepend"></slot>
      <input
        :value="modelValue"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :autocomplete="autocomplete"
        @input="onInput"
        @blur="$emit('blur', $event)"
      />
    </div>
    <div class="app-input__meta">
      <span v-if="error" class="app-input__error">{{ error }}</span>
      <span v-else-if="hint" class="app-input__hint">{{ hint }}</span>
    </div>
  </label>
</template>

<script setup>
function formatPhone(value) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  const parts = ['+7'];
  if (digits[0] && digits[0] !== '7') {
    parts.push(' (' + digits[0]);
  }
  const slice = digits.startsWith('7') ? digits.slice(1) : digits.slice(0);
  if (slice.length) {
    parts.push(' (' + slice.slice(0, 3));
    if (slice.length >= 4) parts.push(') ' + slice.slice(3, 6));
    if (slice.length >= 7) parts.push('-' + slice.slice(6, 8));
    if (slice.length >= 9) parts.push('-' + slice.slice(8, 10));
  }
  return parts.join('').replace('( )', '');
}

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: String,
  type: {
    type: String,
    default: 'text',
  },
  placeholder: String,
  hint: String,
  error: String,
  disabled: Boolean,
  mask: String,
  autocomplete: String,
});

const emit = defineEmits(['update:modelValue', 'blur']);

function onInput(event) {
  const value = event.target.value;
  if (props.mask === 'phone') {
    emit('update:modelValue', formatPhone(value));
    return;
  }
  emit('update:modelValue', value);
}
</script>

<style scoped>
.app-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  font-size: 14px;
}

.app-input__label {
  color: var(--text-muted);
  font-size: 13px;
  font-weight: 600;
}

.app-input__wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--bg-elevated);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 10px 12px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.app-input__wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.12);
}

.app-input__wrapper.has-error {
  border-color: var(--error);
}

input {
  border: none;
  background: transparent;
  color: var(--text-primary);
  font: inherit;
  outline: none;
  width: 100%;
}

input::placeholder {
  color: var(--text-muted);
}

.app-input__meta {
  display: flex;
  justify-content: space-between;
  min-height: 16px;
}

.app-input__hint {
  font-size: 12px;
  color: var(--text-muted);
}

.app-input__error {
  font-size: 12px;
  color: var(--error);
}
</style>
