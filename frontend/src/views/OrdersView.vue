<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">Заказы</div>
        <div class="page-subtitle">
          Список заказов с быстрыми фильтрами и правой сводкой по статусам.
        </div>
      </div>

      <div class="page-actions">
        <button class="btn-primary" type="button" @click="openCreateDrawer">
          + Новый заказ
        </button>
      </div>
    </div>

    <div class="orders-layout">
      <div class="orders-main">
        <div class="orders-filters">
          <div class="orders-filters-row">
            <div class="orders-filters-group">
              <label class="orders-filter-label">
                Поиск
                <input
                  v-model="filters.search"
                  type="text"
                  class="orders-filter-input"
                  placeholder="№ заказа, клиент, телефон…"
                  @keyup.enter="applyFilters"
                />
              </label>
            </div>

            <div class="orders-filters-group">
              <label class="orders-filter-label">
                Статус
                <select
                  v-model="filters.status"
                  class="orders-filter-select"
                  @change="applyFilters"
                >
                  <option value="all">Все</option>
                  <option value="new">Новые</option>
                  <option value="in_progress">В работе</option>
                  <option value="production">В производстве</option>
                  <option value="completed">Завершённые</option>
                  <option value="cancelled">Отменённые</option>
                </select>
              </label>
            </div>

            <div class="orders-filters-group orders-filters-dates">
              <label class="orders-filter-label">
                Дата от
                <input
                  v-model="filters.dateFrom"
                  type="date"
                  class="orders-filter-input"
                />
              </label>
              <label class="orders-filter-label">
                Дата до
                <input
                  v-model="filters.dateTo"
                  type="date"
                  class="orders-filter-input"
                />
              </label>
            </div>

            <div class="orders-filters-group">
              <label class="orders-filter-checkbox">
                <input
                  v-model="filters.onlyMy"
                  type="checkbox"
                />
                <span>Только мои</span>
              </label>
            </div>

            <div class="orders-filters-actions">
              <button class="btn-secondary" type="button" @click="resetFilters">
                Сбросить
              </button>
              <button class="btn-primary" type="button" @click="applyFilters">
                Применить
              </button>
            </div>
          </div>
        </div>

        <div v-if="loading" class="page-loading">
          Загрузка заказов…
        </div>

        <div v-if="error" class="page-error">
          {{ error }}
        </div>

        <div v-if="!loading && !orders.length && !error" class="orders-empty">
          Заказы не найдены. Попробуйте поменять фильтры.
        </div>

        <div v-if="!loading && orders.length" class="orders-list">
          <OrderCard
            v-for="order in orders"
            :key="order.id"
            :order="order"
          />
        </div>
      </div>

      <aside class="orders-sidebar">
        <div class="orders-summary-card">
          <div class="orders-summary-title">Статусы заказов</div>
          <div class="orders-summary-row">
            <span>Активные</span>
            <span class="orders-summary-badge orders-summary-badge--active">
              {{ stats.activeCount }}
            </span>
          </div>
          <div class="orders-summary-row">
            <span>Завершённые</span>
            <span class="orders-summary-badge orders-summary-badge--completed">
              {{ stats.completedCount }}
            </span>
          </div>
          <div class="orders-summary-row">
            <span>Отменённые</span>
            <span class="orders-summary-badge orders-summary-badge--cancelled">
              {{ stats.cancelledCount }}
            </span>
          </div>
        </div>

        <div class="orders-summary-card">
          <div class="orders-summary-title">Последний завершённый заказ</div>
          <div v-if="lastCompleted">
            <div class="orders-last-number">
              #{{ lastCompleted.order_number }}
            </div>
            <div class="orders-last-title">
              {{ lastCompleted.title }}
            </div>
            <div class="orders-last-client" v-if="lastCompleted.client_name">
              {{ lastCompleted.client_name }}
            </div>
            <div class="orders-last-meta">
              <span>Сумма: {{ formatMoney(lastCompleted.sum_total) }}</span>
              <span>Дедлайн: {{ formatDate(lastCompleted.deadline_at) }}</span>
            </div>
          </div>
          <div v-else class="orders-empty-small">
            Пока нет завершённых заказов.
          </div>
        </div>
      </aside>
    </div>

    <OrderCreateDrawer
        :visible="isCreateOpen"
        @close="isCreateOpen = false"
        @created="handleOrderCreated"
      />

  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import axios from 'axios';
import OrderCard from '../components/orders/OrderCard.vue';
import OrderCreateDrawer from '../components/orders/OrderCreateDrawer.vue';

const orders = ref([]);
const isCreateOpen = ref(false);
const loading = ref(false);
const error = ref('');

const filters = reactive({
  search: '',
  status: 'all',
  dateFrom: '',
  dateTo: '',
  onlyMy: false,
});

const stats = reactive({
  activeCount: 0,
  completedCount: 0,
  cancelledCount: 0,
});

const lastCompleted = computed(() => {
  const completed = orders.value
    .filter((o) => o.status === 'completed')
    .slice()
    .sort((a, b) => {
      const ad = a.deadline_at ? new Date(a.deadline_at).getTime() : 0;
      const bd = b.deadline_at ? new Date(b.deadline_at).getTime() : 0;
      return bd - ad;
    });

  return completed[0] || null;
});

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  });
}

function recomputeStats() {
  const all = orders.value;
  stats.activeCount = all.filter((o) =>
    ['new', 'in_progress', 'production'].includes(o.status)
  ).length;
  stats.completedCount = all.filter((o) => o.status === 'completed').length;
  stats.cancelledCount = all.filter((o) => o.status === 'cancelled').length;
}

async function loadOrders() {
  loading.value = true;
  error.value = '';

  try {
    const params = {};
    if (filters.search.trim()) params.search = filters.search.trim();
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.dateFrom) params.date_from = filters.dateFrom;
    if (filters.dateTo) params.date_to = filters.dateTo;
    if (filters.onlyMy) params.my = '1';

    const { data } = await axios.get('/api/orders', { params });
    orders.value = Array.isArray(data.items) ? data.items : [];
    recomputeStats();
  } catch (err) {
    console.error('Orders load error', err);
    error.value =
      err?.response?.data?.message || 'Не удалось загрузить список заказов';
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  loadOrders();
}

function resetFilters() {
  filters.search = '';
  filters.status = 'all';
  filters.dateFrom = '';
  filters.dateTo = '';
  filters.onlyMy = false;
  loadOrders();
}

function openCreateDrawer() {
  isCreateOpen.value = true;
}

function handleOrderCreated(order) {
  // Можно оптимистично добавить заказ в начало списка,
  // но надёжнее перезагрузить список с сервера.
  isCreateOpen.value = false;
  loadOrders();
}

onMounted(loadOrders);
</script>

<style scoped>
.orders-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 1fr);
  gap: 20px;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .orders-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .orders-sidebar {
    order: -1;
  }
}

.orders-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.orders-filters {
  background: var(--color-bg-alt);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.orders-filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: flex-end;
}

.orders-filters-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.orders-filters-dates {
  flex-direction: row;
  align-items: flex-end;
  gap: 10px;
}

.orders-filter-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.orders-filter-input,
.orders-filter-select {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  outline: none;
  min-width: 180px;
}

.orders-filter-input:focus,
.orders-filter-select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary-soft);
}

.orders-filter-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.orders-filter-checkbox input {
  width: 16px;
  height: 16px;
}

.orders-filters-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.btn-primary,
.btn-secondary {
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}

.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: #e5e7f0;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.orders-empty {
  background: var(--color-bg-alt);
  border-radius: 12px;
  padding: 20px;
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
}

.orders-empty-small {
  font-size: 13px;
  color: var(--color-text-muted);
}

.orders-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.orders-summary-card {
  background: var(--color-bg-alt);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  font-size: 13px;
}

.orders-summary-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.orders-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.orders-summary-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 28px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
}

.orders-summary-badge--active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.orders-summary-badge--completed {
  background: rgba(34, 197, 94, 0.16);
  color: #16a34a;
}

.orders-summary-badge--cancelled {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}

.orders-last-number {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.orders-last-title {
  font-weight: 600;
  margin-bottom: 4px;
}

.orders-last-client {
  font-size: 13px;
  margin-bottom: 6px;
}

.orders-last-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.page-error {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--color-error);
}

.page-loading {
  margin-bottom: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
