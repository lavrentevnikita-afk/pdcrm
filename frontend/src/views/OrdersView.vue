<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h1 class="page-title">Заказы</h1>
        <p class="page-subtitle">
          Живой список заказов с фильтрами по менеджеру, статусу, датам и клиенту.
        </p>
      </div>

      <div class="page-header-right">
        <div class="summary">
          <div class="summary-item">
            <span class="summary-label">Всего заказов</span>
            <span class="summary-value">{{ orders.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Сумма</span>
            <span class="summary-value">
              {{ totalAmount.toLocaleString('ru-RU') }} ₽
            </span>
          </div>
        </div>
        <button type="button" class="btn btn-secondary" @click="reload">
          Обновить
        </button>
      </div>
    </header>

    <div class="card filters-card">
      <div class="filters-row">
        <div class="filters-group">
          <span class="filters-label">Показывать</span>
          <div class="segmented">
            <button
              type="button"
              class="segmented-item"
              :class="{ 'segmented-item--active': scope === 'all' }"
              @click="setScope('all')"
            >
              Все
            </button>
            <button
              v-if="authStore.user"
              type="button"
              class="segmented-item"
              :class="{ 'segmented-item--active': scope === 'my' }"
              @click="setScope('my')"
            >
              Мои
            </button>
          </div>
          <p v-if="scope === 'my' && !authStore.user" class="filters-hint">
            Для фильтра «Мои» войдите в систему.
          </p>
        </div>

        <div class="filters-group">
          <label class="filters-label" for="status-filter">Статус</label>
          <select
            id="status-filter"
            v-model="statusFilter"
            class="input"
            @change="reload"
          >
            <option value="">Все</option>
            <option value="new">Новый</option>
            <option value="in_progress">В работе</option>
            <option value="done">Завершён</option>
            <option value="cancelled">Отменён</option>
          </select>
        </div>

        <div class="filters-group">
          <label class="filters-label" for="client-search">Клиент</label>
          <input
            id="client-search"
            v-model="clientSearch"
            type="text"
            class="input"
            placeholder="Имя, организация или телефон"
            @keyup.enter="reload"
          />
        </div>

        <div class="filters-group filters-dates">
          <label class="filters-label">Дата создания</label>
          <div class="filters-dates-row">
            <input
              v-model="dateFrom"
              type="date"
              class="input"
              @change="reload"
            />
            <span class="filters-dates-separator">—</span>
            <input
              v-model="dateTo"
              type="date"
              class="input"
              @change="reload"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="orders.length" class="card table-card">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Клиент</th>
            <th>Менеджер</th>
            <th>Статус</th>
            <th>Сумма</th>
            <th>Дедлайн</th>
            <th>Создан</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in orders" :key="order.id">
            <td>{{ order.id }}</td>
            <td>
              <div class="cell-main">
                <span class="cell-title">
                  {{ order.client_full_name || order.client_organization_name || 'Без имени' }}
                </span>
                <span v-if="order.client_phone" class="cell-subtitle">
                  {{ order.client_phone }}
                </span>
              </div>
            </td>
            <td>
              <span v-if="order.manager_name" class="badge badge-soft">
                {{ order.manager_name }}
              </span>
              <span v-else class="cell-muted">Не назначен</span>
            </td>
            <td>
              <span class="status-tag" :class="'status-tag--' + (order.status || 'new')">
                {{ statusLabel(order.status) }}
              </span>
            </td>
            <td>{{ formatMoney(order.total_amount) }}</td>
            <td>{{ formatDate(order.deadline) }}</td>
            <td>{{ formatDate(order.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="empty-state">
      Заказы не найдены. Попробуйте изменить фильтры.
    </p>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '../store/authStore';
import { fetchOrders } from '../api/orders';

const authStore = useAuthStore();

const orders = ref([]);

const scope = ref(authStore.user ? 'my' : 'all');
const statusFilter = ref('');
const clientSearch = ref('');
const dateFrom = ref('');
const dateTo = ref('');

const totalAmount = computed(() =>
  orders.value.reduce(
    (sum, order) => sum + (Number(order.total_amount) || 0),
    0,
  ),
);

function statusLabel(status) {
  switch (status) {
    case 'in_progress':
      return 'В работе';
    case 'done':
      return 'Завершён';
    case 'cancelled':
      return 'Отменён';
    case 'new':
    default:
      return 'Новый';
  }
}

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '–';
  return `${num.toLocaleString('ru-RU')} ₽`;
}

function formatDate(value) {
  if (!value) return '–';
  try {
    return new Date(value).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return value;
  }
}

function buildQueryParams() {
  const params = {};

  if (statusFilter.value) {
    params.status = statusFilter.value;
  }

  if (scope.value === 'my' && authStore.user) {
    params.scope = 'my';
    params.manager_id = authStore.user.id;
  } else {
    params.scope = 'all';
  }

  if (clientSearch.value) {
    params.client_search = clientSearch.value;
  }

  if (dateFrom.value) {
    params.date_from = dateFrom.value;
  }

  if (dateTo.value) {
    params.date_to = dateTo.value;
  }

  return params;
}

async function reload() {
  const params = buildQueryParams();
  orders.value = await fetchOrders(params);
}

function setScope(nextScope) {
  scope.value = nextScope;
  reload();
}

onMounted(() => {
  reload();
});
</script>

<style scoped>
.page-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}

.page-header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.summary {
  display: flex;
  gap: 12px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.summary-label {
  font-size: 11px;
  opacity: 0.7;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
}

.card {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  backdrop-filter: blur(8px);
}

.filters-card {
  font-size: 13px;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.filters-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filters-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.filters-hint {
  margin: 0;
  font-size: 11px;
  opacity: 0.7;
}

.filters-dates-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filters-dates-separator {
  opacity: 0.6;
  font-size: 12px;
}

.input {
  min-width: 160px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background-color: rgba(15, 23, 42, 0.7);
  color: inherit;
  font: inherit;
}

.input:focus {
  outline: none;
  border-color: rgba(96, 165, 250, 0.9);
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.5);
}

.segmented {
  display: inline-flex;
  border-radius: 999px;
  padding: 2px;
  background: rgba(15, 23, 42, 0.9);
  border: 1px solid rgba(148, 163, 184, 0.4);
}

.segmented-item {
  border: none;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.segmented-item--active {
  background: rgba(59, 130, 246, 0.9);
  color: #f9fafb;
}

.btn {
  border-radius: 999px;
  padding: 6px 12px;
  border: none;
  font: inherit;
  cursor: pointer;
}

.btn-secondary {
  background: rgba(30, 64, 175, 0.85);
  color: #e5e7eb;
}

.btn-secondary:hover {
  background: rgba(30, 64, 175, 1);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table thead {
  background: rgba(15, 23, 42, 0.95);
}

.table th,
.table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.9);
}

.table th {
  text-align: left;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.8;
}

.table tbody tr:hover {
  background: rgba(15, 23, 42, 0.7);
}

.cell-main {
  display: flex;
  flex-direction: column;
}

.cell-title {
  font-weight: 500;
}

.cell-subtitle {
  font-size: 11px;
  opacity: 0.75;
}

.cell-muted {
  font-size: 12px;
  opacity: 0.7;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.badge-soft {
  background: rgba(148, 163, 184, 0.15);
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.status-tag--new {
  background: rgba(59, 130, 246, 0.16);
  color: #bfdbfe;
}

.status-tag--in_progress {
  background: rgba(234, 179, 8, 0.18);
  color: #facc15;
}

.status-tag--done {
  background: rgba(22, 163, 74, 0.18);
  color: #bbf7d0;
}

.status-tag--cancelled {
  background: rgba(239, 68, 68, 0.16);
  color: #fecaca;
}

.empty-state {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}
</style>
