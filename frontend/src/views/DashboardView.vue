<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">Дэшборд</div>
        <div class="page-subtitle">
          Краткая сводка по заказам, выручке и загруженности производства.
        </div>
      </div>

      <div class="page-actions">
        <label class="page-filter-label">
          Период:
          <select v-model="period" @change="loadData">
            <option value="day">Сегодня</option>
            <option value="week">Неделя</option>
            <option value="month">30 дней</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="loading" class="page-loading">
      Загрузка данных дэшборда…
    </div>

    <div v-else class="dashboard-grid">
      <DashboardTotalCard
        :amount="summary.totalAmount"
        :prev-amount="summary.prevTotalAmount"
        :change-percent="summary.changePercent"
        :period="period"
      />

      <DashboardStatCard
        title="Активные заказы"
        :value="summary.activeCount"
        subtitle="в работе / производстве"
      />

      <DashboardStatCard
        title="Завершённые заказы"
        :value="summary.completedCount"
        subtitle="закрыты за период"
      />

      <DashboardWorkloadChart
        :data="summary.workload"
      />

      <DashboardHotOrders
        :orders="summary.hotOrders"
      />
    </div>

    <div v-if="error" class="page-error">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import axios from 'axios';
import DashboardTotalCard from '../components/dashboard/DashboardTotalCard.vue';
import DashboardStatCard from '../components/dashboard/DashboardStatCard.vue';
import DashboardWorkloadChart from '../components/dashboard/DashboardWorkloadChart.vue';
import DashboardHotOrders from '../components/dashboard/DashboardHotOrders.vue';

const period = ref('month');
const loading = ref(false);
const error = ref('');
const summary = ref({
  totalAmount: 0,
  prevTotalAmount: 0,
  changePercent: null,
  activeCount: 0,
  completedCount: 0,
  workload: [],
  hotOrders: [],
});

async function loadData() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await axios.get('/api/dashboard/summary', {
      params: { period: period.value },
    });
    summary.value = {
      totalAmount: data.totalAmount ?? 0,
      prevTotalAmount: data.prevTotalAmount ?? 0,
      changePercent: data.changePercent ?? null,
      activeCount: data.activeCount ?? 0,
      completedCount: data.completedCount ?? 0,
      workload: data.workload ?? [],
      hotOrders: data.hotOrders ?? [],
    };
  } catch (err) {
    console.error('Dashboard load error', err);
    error.value =
      err?.response?.data?.message ||
      'Не удалось загрузить данные дэшборда';
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>
