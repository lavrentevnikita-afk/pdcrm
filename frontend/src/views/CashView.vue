<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">Касса</div>
        <div class="page-subtitle">
          Раздел для оплаты заказов и учёта движения средств.
        </div>
      </div>

      <div class="page-actions">
        <button type="button" class="btn-secondary" @click="reloadAll">
          Обновить
        </button>
      </div>
    </div>

    <div class="cash-layout">
      <div class="cash-main">
        <!-- Фильтры -->
        <div class="cash-filters-card">
          <div class="cash-filters">
            <div class="cash-filters-group">
              <label class="cash-filter-label">
                Телефон клиента
                <input
                  v-model="filters.clientPhone"
                  type="text"
                  placeholder="+7 900..."
                  class="cash-filter-input"
                />
              </label>
            </div>

            <div class="cash-filters-group cash-filters-dates">
              <label class="cash-filter-label">
                Дата исполнения от
                <input
                  v-model="filters.dateFrom"
                  type="date"
                  class="cash-filter-input"
                />
              </label>
              <label class="cash-filter-label">
                Дата исполнения до
                <input
                  v-model="filters.dateTo"
                  type="date"
                  class="cash-filter-input"
                />
              </label>
            </div>

            <div class="cash-filters-group">
              <label class="cash-filter-label">
                Статус оплаты
                <select v-model="filters.paymentStatus" class="cash-filter-input">
                  <option value="open">Неоплаченные и частичные</option>
                  <option value="unpaid">Только неоплаченные</option>
                  <option value="partial">Только частично оплаченные</option>
                  <option value="paid">Только оплаченные</option>
                  <option value="all">Все статусы</option>
                </select>
              </label>
            </div>

            <div class="cash-filters-actions">
              <button type="button" class="btn-secondary" @click="resetFilters">
                Сбросить
              </button>
              <button type="button" class="btn-primary" @click="applyFilters">
                Применить
              </button>
            </div>
          </div>
        </div>

        <!-- Таблица заказов -->
        <div class="cash-card">
          <div class="cash-card-header">
            <div>
              <div class="cash-card-title">Заказы к оплате</div>
              <div class="cash-card-subtitle">
                {{ orders.length }} {{ orders.length === 1 ? 'заказ' : 'заказов' }}
              </div>
            </div>
          </div>

          <div v-if="loading" class="page-loading">
            Загрузка заказов…
          </div>
          <div v-else-if="error" class="page-error">
            {{ error }}
          </div>
          <div v-else-if="!orders.length" class="cash-empty">
            Нет заказов, подходящих под выбранные фильтры.
          </div>

          <div v-else class="cash-table-wrapper">
            <table class="cash-table">
              <thead>
                <tr>
                  <th>№</th>
                  <th>Название</th>
                  <th>Клиент</th>
                  <th>Сумма</th>
                  <th>Оплачено</th>
                  <th>Остаток</th>
                  <th>Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="order in orders"
                  :key="order.id"
                  class="cash-row"
                >
                  <td class="cash-col-number">#{{ order.order_number }}</td>
                  <td class="cash-col-title">
                    <div class="cash-order-title">
                      {{ order.title || 'Без названия' }}
                    </div>
                    <div class="cash-order-deadline">
                      Дедлайн: {{ formatDate(order.deadline_at) }}
                    </div>
                  </td>
                  <td class="cash-col-client">
                    <div class="cash-client-name">
                      {{ order.client_name || '—' }}
                    </div>
                    <div class="cash-client-phone" v-if="order.client_phone">
                      {{ order.client_phone }}
                    </div>
                  </td>
                  <td class="cash-col-money">
                    {{ formatMoney(order.sum_total) }}
                  </td>
                  <td class="cash-col-money">
                    {{ formatMoney(order.paid_amount) }}
                  </td>
                  <td class="cash-col-money cash-col-remaining">
                    {{ formatMoney(order.remaining_amount) }}
                  </td>
                  <td class="cash-col-status">
                    <span
                      class="cash-status"
                      :class="'cash-status--' + (order.payment_status || 'unpaid')"
                    >
                      {{ paymentStatusText(order.payment_status) }}
                    </span>
                  </td>
                  <td class="cash-col-actions">
                    <button
                      type="button"
                      class="btn-primary btn-sm"
                      :disabled="order.remaining_amount <= 0 || paying"
                      @click="openPaymentModal(order)"
                    >
                      Оплатить
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Боковая панель -->
      <aside class="cash-sidebar">
        <div class="cash-card">
          <div class="cash-card-header">
            <div class="cash-card-title">Итоги кассы</div>
          </div>

          <div v-if="shiftLoading" class="page-loading">
            Загрузка данных по смене…
          </div>
          <div v-else>
            <div v-if="shiftError" class="page-error">{{ shiftError }}</div>

            <div v-if="shift" class="cash-summary">
              <div class="cash-summary-row">
                <span>Открыта смена</span>
                <span>{{ formatDate(shift.opened_at) }}</span>
              </div>
              <div class="cash-summary-row">
                <span>Сумма оплат за смену</span>
                <span class="cash-summary-amount">
                  {{ formatMoney(shift.total_amount) }}
                </span>
              </div>
              <div class="cash-summary-actions">
                <button
                  type="button"
                  class="btn-secondary"
                  :disabled="shiftActionLoading"
                  @click="closeShift"
                >
                  <span v-if="shiftActionLoading">Закрываем смену…</span>
                  <span v-else>Закрыть смену</span>
                </button>
              </div>
            </div>

            <div v-else>
              <div class="cash-empty">
                Нет открытой кассовой смены. Оплаты будут учитываться в заказах,
                но не попадут в статистику смены.
              </div>
              <div class="cash-summary-actions">
                <button
                  type="button"
                  class="btn-primary"
                  :disabled="shiftActionLoading"
                  @click="openShift"
                >
                  <span v-if="shiftActionLoading">Открываем смену…</span>
                  <span v-else>Открыть смену</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </div>

    <!-- Модалка оплаты -->
    <div
      v-if="isPaymentModalOpen"
      class="cash-modal-backdrop"
      @click.self="closePaymentModal"
    >
      <div class="cash-modal">
        <div class="cash-modal-header">
          <div class="cash-modal-title">Оплата заказа</div>
          <button type="button" class="cash-modal-close" @click="closePaymentModal">
            ×
          </button>
        </div>

        <div v-if="selectedOrder" class="cash-modal-body">
          <div class="cash-modal-order">
            <div class="cash-modal-order-number">
              #{{ selectedOrder.order_number }}
            </div>
            <div class="cash-modal-order-title">
              {{ selectedOrder.title || 'Без названия' }}
            </div>
            <div class="cash-modal-order-client">
              <span v-if="selectedOrder.client_name">
                {{ selectedOrder.client_name }}
              </span>
              <span v-if="selectedOrder.client_phone">
                · {{ selectedOrder.client_phone }}
              </span>
            </div>
            <div class="cash-modal-order-money">
              <span>К оплате по заказу: {{ formatMoney(selectedOrder.sum_total) }}</span>
              <span>Уже оплачено: {{ formatMoney(selectedOrder.paid_amount) }}</span>
              <span>Остаток: {{ formatMoney(selectedOrder.remaining_amount) }}</span>
            </div>
          </div>

          <div class="cash-modal-form">
            <label class="cash-modal-label">
              Сумма к оплате
              <input
                v-model="paymentAmount"
                type="number"
                min="0"
                step="0.01"
                class="cash-modal-input"
              />
            </label>

            <label class="cash-modal-label">
              Способ оплаты
              <select v-model="paymentMethod" class="cash-modal-input">
                <option value="cash">Наличные</option>
                <option value="card">Банковская карта</option>
                <option value="bank">Безналичный расчёт</option>
              </select>
            </label>
          </div>

          <div v-if="paymentError" class="cash-modal-error">
            {{ paymentError }}
          </div>

          <div class="cash-modal-footer">
            <button type="button" class="btn-secondary" @click="closePaymentModal">
              Отмена
            </button>
            <button
              type="button"
              class="btn-primary"
              :disabled="paying"
              @click="submitPayment"
            >
              <span v-if="paying">Проведение…</span>
              <span v-else>Провести оплату</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Тост -->
    <div v-if="toastVisible" class="cash-toast" :class="'cash-toast--' + toastType">
      {{ toastMessage }}
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue';
import axios from 'axios';

const orders = ref([]);
const loading = ref(false);
const error = ref('');

const filters = reactive({
  clientPhone: '',
  dateFrom: '',
  dateTo: '',
  paymentStatus: 'open',
});

const shift = ref(null);
const shiftLoading = ref(false);
const shiftError = ref('');
const shiftActionLoading = ref(false);

// Модалка оплаты
const isPaymentModalOpen = ref(false);
const selectedOrder = ref(null);
const paymentAmount = ref('');
const paymentMethod = ref('cash');
const paymentError = ref('');
const paying = ref(false);

// Тосты
const toastVisible = ref(false);
const toastMessage = ref('');
const toastType = ref('success');

function showToast(message, type = 'success') {
  toastMessage.value = message;
  toastType.value = type;
  toastVisible.value = true;
  window.clearTimeout(showToast._timer);
  showToast._timer = window.setTimeout(() => {
    toastVisible.value = false;
  }, 3000);
}

async function loadOrders() {
  loading.value = true;
  error.value = '';

  try {
    const params = {};

    if (filters.clientPhone.trim()) {
      params.client_phone = filters.clientPhone.trim();
    }
    if (filters.dateFrom) {
      params.date_from = filters.dateFrom;
    }
    if (filters.dateTo) {
      params.date_to = filters.dateTo;
    }

    if (filters.paymentStatus === 'unpaid') {
      params.payment_status = 'unpaid';
    } else if (filters.paymentStatus === 'partial') {
      params.payment_status = 'partial';
    } else if (filters.paymentStatus === 'paid') {
      params.payment_status = 'paid';
    } else if (filters.paymentStatus === 'all') {
      params.payment_status = 'unpaid,partial,paid';
    }
    // 'open' — по умолчанию unpaid+partial, параметр не передаём

    const { data } = await axios.get('/api/cash/orders', { params });
    orders.value = Array.isArray(data.items) ? data.items : [];
  } catch (e) {
    console.error(e);
    error.value =
      e?.response?.data?.message || 'Не удалось загрузить заказы для кассы';
  } finally {
    loading.value = false;
  }
}

async function loadShift() {
  shiftLoading.value = true;
  shiftError.value = '';

  try {
    const { data } = await axios.get('/api/cash/shift/current');
    shift.value = data?.shift || null;
  } catch (e) {
    console.error(e);
    shiftError.value =
      e?.response?.data?.message || 'Не удалось загрузить данные по смене';
  } finally {
    shiftLoading.value = false;
  }
}

async function openShift() {
  shiftActionLoading.value = true;
  shiftError.value = '';

  try {
    const { data } = await axios.post('/api/cash/shift/open');
    shift.value = data?.shift || null;
    showToast('Кассовая смена открыта', 'success');
  } catch (e) {
    console.error(e);
    const message =
      e?.response?.data?.message || 'Не удалось открыть кассовую смену';
    shiftError.value = message;
    showToast(message, 'error');
  } finally {
    shiftActionLoading.value = false;
  }
}

async function closeShift() {
  shiftActionLoading.value = true;
  shiftError.value = '';

  try {
    await axios.post('/api/cash/shift/close');
    shift.value = null;
    showToast('Кассовая смена закрыта', 'success');
  } catch (e) {
    console.error(e);
    const message =
      e?.response?.data?.message || 'Не удалось закрыть кассовую смену';
    shiftError.value = message;
    showToast(message, 'error');
  } finally {
    shiftActionLoading.value = false;
  }
}

function applyFilters() {
  loadOrders();
}

function resetFilters() {
  filters.clientPhone = '';
  filters.dateFrom = '';
  filters.dateTo = '';
  filters.paymentStatus = 'open';
  loadOrders();
}

function reloadAll() {
  loadOrders();
  loadShift();
}

function openPaymentModal(order) {
  selectedOrder.value = order;
  const remaining = Number(order.remaining_amount || 0);
  paymentAmount.value = remaining > 0 ? remaining.toFixed(2) : '';
  paymentMethod.value = 'cash';
  paymentError.value = '';
  isPaymentModalOpen.value = true;
}

function closePaymentModal() {
  if (paying.value) return;
  isPaymentModalOpen.value = false;
  selectedOrder.value = null;
  paymentAmount.value = '';
  paymentMethod.value = 'cash';
  paymentError.value = '';
}

async function submitPayment() {
  if (!selectedOrder.value) return;

  const amountNum = Number(paymentAmount.value);
  if (!Number.isFinite(amountNum) || amountNum <= 0) {
    paymentError.value = 'Введите корректную сумму оплаты';
    return;
  }

  paying.value = true;
  paymentError.value = '';

  try {
    const payload = {
      order_id: selectedOrder.value.id,
      amount: amountNum,
      method: paymentMethod.value,
    };

    await axios.post('/api/payments', payload);

    showToast('Оплата успешно проведена', 'success');
    closePaymentModal();
    await Promise.all([loadOrders(), loadShift()]);
  } catch (e) {
    console.error(e);
    paymentError.value =
      e?.response?.data?.message || 'Не удалось провести оплату';
    showToast(paymentError.value, 'error');
  } finally {
    paying.value = false;
  }
}

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

function paymentStatusText(status) {
  switch (status) {
    case 'paid':
      return 'Оплачен';
    case 'partial':
      return 'Частично оплачен';
    case 'unpaid':
    default:
      return 'Не оплачен';
  }
}

onMounted(() => {
  reloadAll();
});
</script>

<style scoped>
.cash-layout {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(260px, 1fr);
  gap: 20px;
  align-items: flex-start;
}

@media (max-width: 1024px) {
  .cash-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .cash-sidebar {
    order: -1;
  }
}

.cash-main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cash-filters-card {
  background: var(--color-bg-alt);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.cash-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 16px;
  align-items: flex-end;
}

.cash-filters-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}

.cash-filters-dates {
  display: flex;
  flex-direction: row;
  gap: 12px;
}

.cash-filter-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.cash-filter-input {
  padding: 6px 10px;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background-color: var(--color-bg-alt);
  font-size: 13px;
  outline: none;
  color: var(--color-text);
}

.cash-filter-input::placeholder {
  color: var(--color-text-muted);
}

.cash-filters-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.cash-card {
  background: var(--color-bg-alt);
  border-radius: 16px;
  padding: 14px 16px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  font-size: 13px;
}

.cash-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.cash-card-title {
  font-weight: 600;
}

.cash-card-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
}

.cash-table-wrapper {
  margin-top: 4px;
  overflow-x: auto;
}

.cash-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.cash-table thead th {
  text-align: left;
  padding: 8px 6px;
  border-bottom: 1px solid var(--color-border);
  font-weight: 500;
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.cash-table tbody td {
  padding: 8px 6px;
  border-bottom: 1px solid rgba(148, 163, 184, 0.2);
  vertical-align: top;
}

.cash-row:hover {
  background: rgba(148, 163, 184, 0.08);
}

.cash-col-number {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono',
    'Courier New', monospace;
  white-space: nowrap;
}

.cash-col-title {
  min-width: 220px;
}

.cash-order-title {
  font-weight: 500;
}

.cash-order-deadline {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.cash-col-client {
  min-width: 180px;
}

.cash-client-name {
  font-weight: 500;
}

.cash-client-phone {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.cash-col-money {
  white-space: nowrap;
}

.cash-col-remaining {
  font-weight: 600;
}

.cash-col-status {
  white-space: nowrap;
}

.cash-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.cash-status--unpaid {
  background: #fee2e2;
  color: #b91c1c;
}

.cash-status--partial {
  background: #fef3c7;
  color: #92400e;
}

.cash-status--paid {
  background: #dcfce7;
  color: #166534;
}

.cash-col-actions {
  text-align: right;
}

.cash-sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cash-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cash-summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.cash-summary-amount {
  font-weight: 600;
}

.cash-summary-actions {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.cash-empty {
  font-size: 13px;
  color: var(--color-text-muted);
  padding: 8px 0;
}

/* Модалка */

.cash-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 40;
}

.cash-modal {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg-alt);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.4);
  padding: 16px 18px 14px;
}

.cash-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.cash-modal-title {
  font-weight: 600;
  font-size: 16px;
}

.cash-modal-close {
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0 4px;
  color: var(--color-text-muted);
}

.cash-modal-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.cash-modal-order {
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--color-bg);
  font-size: 13px;
}

.cash-modal-order-number {
  font-weight: 600;
  margin-bottom: 2px;
}

.cash-modal-order-title {
  font-size: 13px;
  margin-bottom: 2px;
}

.cash-modal-order-client {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-bottom: 4px;
}

.cash-modal-order-money {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}

.cash-modal-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cash-modal-label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.cash-modal-input {
  border-radius: 10px;
  padding: 8px 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  font-size: 13px;
  outline: none;
  color: var(--color-text);
}

.cash-modal-error {
  font-size: 12px;
  color: var(--color-error);
}

.cash-modal-footer {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* Тост */

.cash-toast {
  position: fixed;
  right: 16px;
  bottom: 16px;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 13px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.3);
  z-index: 50;
}

.cash-toast--success {
  background: #22c55e;
  color: #ecfdf5;
}

.cash-toast--error {
  background: #ef4444;
  color: #fef2f2;
}

/* Общие */

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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: default;
}

.btn-secondary {
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: rgba(148, 163, 184, 0.08);
}

.btn-sm {
  padding: 4px 10px;
  font-size: 12px;
}

.page-error {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-error);
}

.page-loading {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}
</style>
