<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">Заказы</div>
        <div class="page-subtitle">
          Простая карточка заказа с позициями и автоматическим пересчётом суммы.
        </div>
      </div>
      <div class="page-actions">
        <button class="btn-primary" type="button" @click="openCreate">Создать заказ</button>
      </div>
    </div>

    <div class="card">
      <div v-if="loading" class="page-loading">Загрузка…</div>
      <div v-else-if="error" class="page-error">{{ error }}</div>
      <table v-else class="orders-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Дата</th>
            <th>Комментарий</th>
            <th class="text-right">Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!orders.length">
            <td colspan="4" class="page-loading">Нет заказов</td>
          </tr>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="orders-row"
            @click="openEdit(order.id)"
          >
            <td>{{ order.id }}</td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>{{ order.comment || '—' }}</td>
            <td class="text-right">{{ formatMoney(order.total_amount) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div class="modal-title">
            {{ form.id ? `Редактирование заказа #${form.id}` : 'Новый заказ' }}
          </div>
          <button class="icon-button" type="button" @click="closeModal">×</button>
        </div>

        <div class="modal-body">
          <label class="field">
            <span>Комментарий</span>
            <textarea v-model="form.comment" rows="2" />
          </label>

          <label class="field">
            <span>Дедлайн (опционально)</span>
            <input v-model="form.deadline" type="datetime-local" />
          </label>

          <label class="field">
            <span>Статус</span>
            <select v-model="form.status">
              <option value="new">new</option>
              <option value="in_progress">in_progress</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>

          <div class="items-block">
            <div class="items-header">
              <div>Позиции заказа</div>
              <button class="btn-secondary" type="button" @click="addItem">+ Добавить</button>
            </div>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Кол-во</th>
                  <th>Цена</th>
                  <th>Сумма</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in form.items" :key="item.key">
                  <td>
                    <input v-model="item.name" type="text" @input="updateItem(index)" />
                  </td>
                  <td>
                    <input
                      v-model.number="item.qty"
                      type="number"
                      min="0"
                      step="1"
                      @input="updateItem(index)"
                    />
                  </td>
                  <td>
                    <input
                      v-model.number="item.price"
                      type="number"
                      min="0"
                      step="0.01"
                      @input="updateItem(index)"
                    />
                  </td>
                  <td class="text-right">{{ formatMoney(item.line_total) }}</td>
                  <td>
                    <button class="icon-button" type="button" @click="removeItem(index)">×</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div class="modal-footer">
          <div class="total">Сумма заказа: {{ formatMoney(totalAmount) }}</div>
          <div class="footer-actions">
            <button class="btn-secondary" type="button" @click="closeModal">Отмена</button>
            <button class="btn-primary" type="button" :disabled="saving" @click="saveOrder">
              {{ saving ? 'Сохранение…' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import api from '../utils/apiClient';

const orders = ref([]);
const loading = ref(false);
const error = ref('');
const saving = ref(false);
const isModalOpen = ref(false);

const form = reactive({
  id: null,
  comment: '',
  deadline: '',
  status: 'new',
  items: [],
});

const totalAmount = computed(() =>
  form.items.reduce((acc, item) => acc + Number(item.line_total || 0), 0)
);

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(value) {
  return (Number(value) || 0).toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  });
}

function resetForm() {
  form.id = null;
  form.comment = '';
  form.deadline = '';
  form.status = 'new';
  form.items = [createItem()];
}

function createItem() {
  return { key: crypto.randomUUID(), name: '', qty: 1, price: 0, line_total: 0 };
}

function addItem() {
  form.items.push(createItem());
}

function removeItem(index) {
  form.items.splice(index, 1);
  if (!form.items.length) form.items.push(createItem());
  recalcTotals();
}

function recalcTotals() {
  form.items.forEach((item) => {
    const qty = Number(item.qty) || 0;
    const price = Number(item.price) || 0;
    item.line_total = qty * price;
  });
}

function updateItem(index) {
  if (!form.items[index]) return;
  recalcTotals();
}

async function loadOrders() {
  loading.value = true;
  error.value = '';
  try {
    const { data } = await api.get('/orders');
    orders.value = Array.isArray(data.items) ? data.items : [];
  } catch (err) {
    error.value = err?.response?.data?.message || 'Не удалось загрузить заказы';
  } finally {
    loading.value = false;
  }
}

async function openEdit(id) {
  try {
    const { data } = await api.get(`/orders/${id}`);
    form.id = data.id;
    form.comment = data.comment || '';
    form.deadline = data.deadline ? data.deadline.slice(0, 16) : '';
    form.status = data.status || 'new';
    form.items = (data.items || []).map((item) => ({
      key: crypto.randomUUID(),
      name: item.name,
      qty: item.qty,
      price: item.price,
      line_total: item.line_total,
    }));
    if (!form.items.length) form.items.push(createItem());
    isModalOpen.value = true;
  } catch (err) {
    error.value = err?.response?.data?.message || 'Не удалось открыть заказ';
  }
}

function openCreate() {
  resetForm();
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

async function saveOrder() {
  saving.value = true;
  try {
    recalcTotals();
    const payload = {
      comment: form.comment,
      deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
      status: form.status,
      items: form.items,
    };

    if (form.id) {
      await api.put(`/orders/${form.id}`, payload);
    } else {
      await api.post('/orders', payload);
    }

    await loadOrders();
    closeModal();
  } catch (err) {
    error.value = err?.response?.data?.message || 'Не удалось сохранить заказ';
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  resetForm();
  loadOrders();
});
</script>

<style scoped>
.card {
  background: var(--color-bg-alt);
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
}

.orders-table,
.items-table {
  width: 100%;
  border-collapse: collapse;
}

.orders-table th,
.orders-table td,
.items-table th,
.items-table td {
  padding: 8px;
  border-bottom: 1px solid var(--color-border);
  text-align: left;
}

.text-right {
  text-align: right;
}

.orders-row {
  cursor: pointer;
}

.orders-row:hover {
  background: rgba(0, 0, 0, 0.02);
}

.btn-primary,
.btn-secondary {
  border-radius: 8px;
  padding: 8px 12px;
  border: none;
  cursor: pointer;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-secondary {
  background: #e5e7eb;
  color: #111827;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  z-index: 100;
}

.modal {
  background: #fff;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
}

.modal-header,
.modal-footer {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-footer {
  border-top: 1px solid var(--color-border);
  border-bottom: none;
}

.modal-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: auto;
}

.modal-title {
  font-weight: 600;
  font-size: 18px;
}

.icon-button {
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 18px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field input,
.field textarea,
.field select {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
  font-size: 14px;
}

.items-block {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 8px;
}

.items-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.footer-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.total {
  font-weight: 600;
}
</style>
