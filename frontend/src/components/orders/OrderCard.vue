<template>
  <div class="order-card" :class="{ 'order-card--hot': order.is_hot }">
    <div class="order-card-header">
      <div class="order-card-top-row">
        <div class="order-card-number">
          #{{ order.order_number }}
        </div>
        <div class="order-card-status-pill" :class="'order-card-status-' + order.status">
          {{ statusText }}
        </div>
        <div v-if="order.is_hot" class="order-card-hot-pill">
          Горящий
        </div>
      </div>

      <div class="order-card-title">
        {{ order.title }}
      </div>
    </div>

    <div class="order-card-body">
      <div class="order-card-client">
        <div v-if="order.client_name" class="order-card-client-name">
          {{ order.client_name }}
        </div>
        <div v-if="order.client_phone" class="order-card-client-phone">
          {{ order.client_phone }}
        </div>
      </div>

      <div class="order-card-meta">
        <div class="order-card-manager" v-if="order.manager_name">
          Ответственный: {{ order.manager_name }}
        </div>
        <div
          class="order-card-deadline"
          :class="{
            'order-card-deadline-soon': deadlineInfo.isSoon,
            'order-card-deadline-overdue': deadlineInfo.isOverdue
          }"
        >
          Дедлайн: {{ deadlineInfo.label }}
        </div>
        <div class="order-card-sum">
          {{ formatMoney(order.sum_total) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  order: {
    type: Object,
    required: true,
  },
});

const statusText = computed(() => {
  const status = props.order.status;
  switch (status) {
    case 'new':
      return 'Новый';
    case 'in_progress':
      return 'В работе';
    case 'production':
      return 'В производстве';
    case 'completed':
      return 'Завершён';
    case 'cancelled':
      return 'Отменён';
    default:
      return status || 'Неизвестно';
  }
});

const deadlineInfo = computed(() => {
  const raw = props.order.deadline_at;
  if (!raw) {
    return {
      label: '—',
      isSoon: false,
      isOverdue: false,
    };
  }

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return {
      label: '—',
      isSoon: false,
      isOverdue: false,
    };
  }

  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return {
    label: `${day}.${month}.${year} ${hours}:${minutes}`,
    isSoon: diffDays >= 0 && diffDays <= 2,
    isOverdue: diffDays < 0,
  };
});

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  });
}
</script>

<style scoped>
.order-card {
  background: var(--color-bg-alt);
  border-radius: 16px;
  padding: 12px 14px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 8px;
  border: 1px solid transparent;
  transition: box-shadow 0.15s ease, transform 0.08s ease, border-color 0.15s ease;
}

.order-card:hover {
  transform: translateY(-1px);
  box-shadow: 0 16px 35px rgba(15, 23, 42, 0.14);
  border-color: var(--color-primary-soft);
}

.order-card--hot {
  border-color: rgba(248, 113, 113, 0.45);
}

.order-card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.order-card-top-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.order-card-number {
  font-weight: 600;
  color: var(--color-text-muted);
}

.order-card-status-pill {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  line-height: 1.3;
}

.order-card-status-new {
  background: rgba(59, 130, 246, 0.16);
  color: #2563eb;
}

.order-card-status-in_progress {
  background: rgba(251, 191, 36, 0.18);
  color: #92400e;
}

.order-card-status-production {
  background: rgba(56, 189, 248, 0.16);
  color: #0369a1;
}

.order-card-status-completed {
  background: rgba(34, 197, 94, 0.18);
  color: #15803d;
}

.order-card-status-cancelled {
  background: rgba(248, 113, 113, 0.16);
  color: #b91c1c;
}

.order-card-hot-pill {
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 11px;
  background: linear-gradient(135deg, #f97316, #ef4444);
  color: #ffffff;
}

.order-card-title {
  font-size: 14px;
  font-weight: 600;
}

.order-card-body {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
}

.order-card-client {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.order-card-client-name {
  font-weight: 500;
}

.order-card-client-phone {
  color: var(--color-text-muted);
}

.order-card-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  text-align: right;
}

.order-card-manager {
  color: var(--color-text-muted);
}

.order-card-deadline {
  font-weight: 500;
}

.order-card-deadline-soon {
  color: #ea580c;
}

.order-card-deadline-overdue {
  color: var(--color-error);
}

.order-card-sum {
  font-weight: 600;
}
</style>
