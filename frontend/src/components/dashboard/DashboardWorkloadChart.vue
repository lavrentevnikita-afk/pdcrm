<template>
  <div class="dash-card dash-chart">
    <div class="dash-card-header">
      <div class="dash-card-title">Загруженность по неделе</div>
      <div class="dash-card-caption">по дедлайнам активных заказов</div>
    </div>
    <div class="dash-chart-body">
      <div
        v-for="point in data"
        :key="point.label"
        class="dash-chart-column"
      >
        <div class="dash-chart-bar-wrapper">
          <div
            class="dash-chart-bar"
            :style="{ height: barHeight(point) + '%' }"
          />
        </div>
        <div class="dash-chart-label">
          {{ point.label }}
        </div>
        <div class="dash-chart-value">
          {{ point.orders }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});

function barHeight(point) {
  const maxOrders = Math.max(...props.data.map((p) => p.orders || 0), 1);
  return ((point.orders || 0) / maxOrders) * 100;
}
</script>
