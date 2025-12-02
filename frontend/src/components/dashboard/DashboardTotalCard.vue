<template>
  <div class="dash-card dash-card--accent">
    <div class="dash-card-header">
      <div class="dash-card-title">Сумма заказов</div>
      <div class="dash-card-period">
        {{ periodLabel }}
      </div>
    </div>
    <div class="dash-card-value">
      {{ formattedAmount }}
    </div>
    <div class="dash-card-caption">
      <span v-if="hasChange">
        <span :class="['dash-trend', trendClass]">
          <span class="dash-trend-arrow">
            {{ trendArrow }}
          </span>
          {{ Math.abs(normalizedChange).toFixed(1) }}%
        </span>
        &nbsp;к предыдущему периоду
      </span>
      <span v-else>
        Нет данных для сравнения с предыдущим периодом
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  amount: {
    type: Number,
    default: 0,
  },
  prevAmount: {
    type: Number,
    default: 0,
  },
  changePercent: {
    type: Number,
    default: null,
  },
  period: {
    type: String,
    default: 'month',
  },
});

const periodLabel = computed(() => {
  if (props.period === 'day') return 'Сегодня';
  if (props.period === 'week') return 'Последние 7 дней';
  return 'Последние 30 дней';
});

const formattedAmount = computed(() =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(props.amount || 0),
);

const hasChange = computed(() => props.changePercent !== null);

const normalizedChange = computed(
  () => props.changePercent ?? 0,
);

const trendClass = computed(() => {
  if (!hasChange.value) return '';
  if (normalizedChange.value > 0) return 'dash-trend--up';
  if (normalizedChange.value < 0) return 'dash-trend--down';
  return '';
});

const trendArrow = computed(() => {
  if (!hasChange.value) return '';
  if (normalizedChange.value > 0) return '▲';
  if (normalizedChange.value < 0) return '▼';
  return '■';
});
</script>
