<template>
  <transition name="toast-fade">
    <div v-if="visible" class="app-toast" :class="`app-toast--${type}`">
      <slot>{{ message }}</slot>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  visible: Boolean,
  message: String,
  type: {
    type: String,
    default: 'info',
  },
});
</script>
