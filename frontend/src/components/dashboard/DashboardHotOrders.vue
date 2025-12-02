<template>
  <div class="dash-card">
    <div class="dash-card-header">
      <div class="dash-card-title">Горящие заказы</div>
      <div class="dash-card-caption">ближайшие дедлайны</div>
    </div>

    <div v-if="!orders.length" class="dash-empty">
      Пока нет горящих заказов
    </div>

    <ul v-else class="dash-hot-list">
      <li
        v-for="order in orders"
        :key="order.id"
        class="dash-hot-item"
      >
        <div class="dash-hot-main">
          <div class="dash-hot-title">
            {{ order.title }}
          </div>
          <div class="dash-hot-number">
            № {{ order.order_number }}
          </div>
        </div>
        <div class="dash-hot-meta">
          <span class="dash-hot-deadline">
            до {{ formatDate(order.deadline) }}
          </span>
          <span class="dash-hot-amount">
            {{ formatAmount(order.total_amount) }}
          </span>
        </div>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({
  orders: {
    type: Array,
    default: () => [],
  },
});

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(value) {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}
</script>
