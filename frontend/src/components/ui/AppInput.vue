<template>
  <label class="app-field">
    <span v-if="label" class="app-field__label">{{ label }}</span>
    <input
      :value="modelValue"
      :type="type"
      :placeholder="placeholder"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      class="app-input"
      :class="{ 'app-input--error': !!error }"
      @input="onInput"
      @blur="$emit('blur', $event)"
      @focus="$emit('focus', $event)"
    />
    <span v-if="error" class="app-field__error">{{ error }}</span>
    <span v-else-if="hint" class="app-field__hint">{{ hint }}</span>
  </label>
</template>

<script setup>
import { formatPhoneInput } from '../../utils/phone';

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  label: String,
  placeholder: String,
  type: {
    type: String,
    default: 'text',
  },
  min: [String, Number],
  max: [String, Number],
  step: [String, Number],
  mask: String,
  hint: String,
  error: String,
  disabled: Boolean,
});

const emit = defineEmits(['update:modelValue', 'blur', 'focus', 'input']);

function onInput(event) {
  let value = event.target.value;

  if (props.mask === 'phone') {
    value = formatPhoneInput(value);
  }

  emit('update:modelValue', value);
  emit('input', value);
}
</script>
