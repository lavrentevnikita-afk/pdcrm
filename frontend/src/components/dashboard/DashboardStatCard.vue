<template>
  <div class="dash-card dash-card--compact">
    <div class="dash-card-header">
      <div class="dash-card-title">{{ title }}</div>
    </div>
    <div class="dash-card-value">
      {{ value }}
    </div>
    <div class="dash-card-caption">
      {{ subtitle }}
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true,
  },
  value: {
    type: [Number, String],
    default: 0,
  },
  subtitle: {
    type: String,
    default: '',
  },
});
</script>
