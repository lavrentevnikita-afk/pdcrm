<template>
  <div class="analytics-page">
    <div class="page-title">Аналитика</div>
    <div class="page-subtitle">
      Отчёты и графики по выручке, клиентам и заказам.
    </div>

    <div class="grid">
      <section class="card">
        <div class="card-header">
          <div>
            <div class="card-title">Динамика выручки</div>
            <div class="card-subtitle">Текущая неделя vs прошлый период</div>
          </div>
          <div class="pill">+{{ revenue.change }}% к прошлому периоду</div>
        </div>

        <div class="chart">
          <div
            v-for="point in revenue.points"
            :key="point.label"
            class="bar"
            :style="{ height: Math.max(6, point.value / 8000) + 'px' }"
            :title="`${point.label}: ${formatMoney(point.value)}`"
          >
            <span>{{ point.label }}</span>
          </div>
        </div>

        <div class="total">Сумма за неделю: {{ formatMoney(revenue.total) }}</div>
      </section>

      <section class="card">
        <div class="card-header">
          <div class="card-title">Топ клиенты</div>
          <div class="card-subtitle">Кто приносит больше всего выручки</div>
        </div>

        <div class="table">
          <div class="table-head">
            <div>Клиент</div>
            <div>Выручка</div>
            <div>Заказы</div>
          </div>
          <div v-for="client in clients" :key="client.name" class="table-row">
            <div>{{ client.name }}</div>
            <div>{{ formatMoney(client.revenue) }}</div>
            <div>{{ client.orders }}</div>
          </div>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <div class="card-title">Топ продукты</div>
          <div class="card-subtitle">Доли и выручка по позициям</div>
        </div>

        <div class="table">
          <div class="table-head">
            <div>Продукт</div>
            <div>Выручка</div>
            <div>Доля</div>
          </div>
          <div v-for="product in products" :key="product.name" class="table-row">
            <div>{{ product.name }}</div>
            <div>{{ formatMoney(product.revenue) }}</div>
            <div>
              <div class="progress">
                <div class="progress-fill" :style="{ width: product.share + '%' }"></div>
              </div>
              <span class="muted">{{ product.share }}%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';

const revenue = ref({ points: [], change: 0, total: 0 });
const clients = ref([]);
const products = ref([]);

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(
    value
  );
}

async function loadAnalytics() {
  const [revRes, clientsRes, productsRes] = await Promise.all([
    axios.get('/api/analytics/revenue'),
    axios.get('/api/analytics/top-clients'),
    axios.get('/api/analytics/top-products'),
  ]);

  revenue.value = revRes.data;
  clients.value = clientsRes.data.clients;
  products.value = productsRes.data.products;
}

onMounted(loadAnalytics);
</script>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.card {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
}

.card-subtitle {
  font-size: 13px;
  color: #9ca3af;
}

.pill {
  background: rgba(16, 185, 129, 0.1);
  color: #6ee7b7;
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
}

.chart {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 10px;
  align-items: end;
  height: 220px;
  padding: 12px 4px 6px;
}

.bar {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border-radius: 8px 8px 4px 4px;
  position: relative;
}

.bar span {
  position: absolute;
  bottom: -22px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  color: #9ca3af;
}

.total {
  margin-top: 12px;
  font-weight: 600;
}

.table {
  border: 1px solid #1f2937;
  border-radius: 10px;
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1.3fr 0.9fr 0.6fr;
  gap: 8px;
  padding: 10px 12px;
}

.table-head {
  background: #111827;
  color: #9ca3af;
  font-size: 13px;
}

.table-row:nth-child(odd) {
  background: #0b1221;
}

.table-row:nth-child(even) {
  background: #0d1528;
}

.progress {
  background: #0b1221;
  border: 1px solid #1f2937;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(135deg, #06b6d4, #3b82f6);
  height: 100%;
}

.muted {
  font-size: 12px;
  color: #9ca3af;
}
</style>
