<template>
  <section>
    <header style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
      <div>
        <h1>Заказы</h1>
        <p style="opacity: 0.8; font-size: 14px;">
          Список заказов из базы данных. Данные заполняются через миграции/сиды.
        </p>
      </div>
      <button type="button" @click="loadOrders">
        Обновить
      </button>
    </header>

    <table v-if="orders.length" style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <thead>
        <tr>
          <th>#</th>
          <th>Клиент (id)</th>
          <th>Статус</th>
          <th>Сумма</th>
          <th>Дедлайн</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="order in orders" :key="order.id">
          <td>{{ order.id }}</td>
          <td>{{ order.client_id || '—' }}</td>
          <td>{{ order.status }}</td>
          <td>{{ Number(order.total_amount).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) }}</td>
          <td>{{ formatDate(order.deadline) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else style="opacity: 0.8;">Пока нет заказов. Попробуйте создать их через сиды или API.</p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { fetchOrders } from '../api/orders';

const orders = ref([]);

function formatDate(value) {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('ru-RU');
  } catch {
    return value;
  }
}

async function loadOrders() {
  orders.value = await fetchOrders();
}

onMounted(loadOrders);
</script>
