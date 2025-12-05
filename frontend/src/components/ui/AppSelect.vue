<template>
  <label class="app-field">
    <span v-if="label" class="app-field__label">{{ label }}</span>
    <select
      :value="modelValue"
      :disabled="disabled"
      class="app-input"
      :class="{ 'app-input--error': !!error }"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <slot />
    </select>
    <span v-if="error" class="app-field__error">{{ error }}</span>
    <span v-else-if="hint" class="app-field__hint">{{ hint }}</span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: String,
  hint: String,
  error: String,
  disabled: Boolean,
});

defineEmits(['update:modelValue']);
</script>
