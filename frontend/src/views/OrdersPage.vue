<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">Заказы</div>
        <div class="page-subtitle">
          Список заказов и быстрый доступ к созданию нового через калькулятор.
        </div>
      </div>

      <div class="page-actions">
        <button class="primary-button" type="button" @click="onCreate">
          + Новый заказ
        </button>
      </div>
    </div>

    <div class="page-body">
      <div v-if="orders.loading" class="page-loading">
        Загружаем заказы…
      </div>
      <div v-else-if="orders.error" class="page-error">
        {{ orders.error }}
      </div>
      <table v-else class="orders-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Название</th>
            <th>Клиент</th>
            <th>Телефон</th>
            <th>Дедлайн</th>
            <th>Статус</th>
            <th class="text-right">Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!orders.items.length">
            <td colspan="7" class="page-loading">
              Пока нет заказов. Нажмите «Новый заказ», чтобы создать первый.
            </td>
          </tr>
          <tr v-for="item in orders.items" :key="item.id">
            <td>{{ item.order_number }}</td>
            <td>{{ item.title }}</td>
            <td>{{ item.client_name }}</td>
            <td>{{ item.client_phone }}</td>
            <td>
              {{ formatDateTime(item.deadline_at || item.deadline) }}
              <span v-if="item.is_hot" class="badge-hot">🔥 срочный</span>
            </td>
            <td>{{ mapStatus(item.status) }}</td>
            <td class="text-right">
              {{ formatMoney(item.sum_total) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <OrderCreateDrawer
      v-if="orders.isCreateDrawerOpen"
      :open="orders.isCreateDrawerOpen"
      @close="orders.closeCreateDrawer"
    />
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useOrdersStore } from '../store/orders';
import OrderCreateDrawer from '../components/OrderCreateDrawer.vue';

const orders = useOrdersStore();

onMounted(() => {
  orders.fetchList();
});

function onCreate() {
  orders.openCreateDrawer();
}

function formatMoney(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(num);
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function mapStatus(status) {
  const map = {
    new: 'Новый',
    production: 'В производстве',
    ready: 'Готов',
    done: 'Завершён',
    cancelled: 'Отменён',
  };
  return map[status] || status;
}
</script>
