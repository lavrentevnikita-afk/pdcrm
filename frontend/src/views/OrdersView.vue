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
            <th>Клиент</th>
            <th>Статус</th>
            <th>Комментарий</th>
            <th class="text-right">Сумма</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!orders.length">
            <td colspan="6" class="page-loading">Нет заказов</td>
          </tr>
          <tr
            v-for="order in orders"
            :key="order.id"
            class="orders-row"
            @click="openEdit(order.id)"
          >
            <td>{{ order.id }}</td>
            <td>{{ formatDate(order.created_at) }}</td>
            <td>{{ getClientName(order.client_id) }}</td>
            <td>
              <span class="status-badge" :class="`status-${order.status}`">
                {{ statusLabels[order.status] || order.status }}
              </span>
            </td>
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
            <span>Клиент</span>
            <div class="client-row">
              <div class="client-select">
                <input v-model="clientSearch" type="text" placeholder="Поиск клиента" />
                <select v-model="form.client_id">
                  <option :value="null">Без клиента</option>
                  <option v-for="client in filteredClients" :key="client.id" :value="client.id">
                    {{ client.name }}
                  </option>
                </select>
              </div>
              <button class="btn-secondary" type="button" @click="toggleNewClient">
                {{ showNewClientForm ? 'Скрыть' : 'Создать нового клиента' }}
              </button>
            </div>
            <div v-if="showNewClientForm" class="new-client-card">
              <div class="new-client-grid">
                <label>
                  <span>Название</span>
                  <input v-model="newClient.name" type="text" placeholder="ООО «Пример»" />
                </label>
                <label>
                  <span>Контактное лицо</span>
                  <input v-model="newClient.contact" type="text" placeholder="Имя" />
                </label>
                <label>
                  <span>Телефон</span>
                  <input v-model="newClient.phone" type="text" placeholder="+7" />
                </label>
                <label>
                  <span>Email</span>
                  <input v-model="newClient.email" type="email" placeholder="client@example.com" />
                </label>
              </div>
              <div class="new-client-actions">
                <button class="btn-secondary" type="button" @click="toggleNewClient">Отмена</button>
                <button
                  class="btn-primary"
                  type="button"
                  :disabled="creatingClient || !newClient.name"
                  @click="createClient"
                >
                  {{ creatingClient ? 'Сохранение…' : 'Сохранить клиента' }}
                </button>
              </div>
            </div>
          </label>

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
              <option value="done">done</option>
              <option value="canceled">canceled</option>
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
const clients = ref([]);
const clientSearch = ref('');
const showNewClientForm = ref(false);
const creatingClient = ref(false);

const statusLabels = {
  new: 'Новый',
  in_progress: 'В работе',
  done: 'Завершён',
  canceled: 'Отменён',
};

const form = reactive({
  id: null,
  client_id: null,
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
  form.client_id = null;
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

const filteredClients = computed(() => {
  const search = clientSearch.value.trim().toLowerCase();
  if (!search) return clients.value;
  return clients.value.filter((client) =>
    client.name?.toLowerCase().includes(search) || client.contact?.toLowerCase().includes(search)
  );
});

function getClientName(id) {
  if (!id) return '—';
  const found = clients.value.find((client) => client.id === id);
  return found?.name || '—';
}

async function loadClients() {
  try {
    const { data } = await api.get('/directories/clients');
    clients.value = Array.isArray(data.items)
      ? data.items.map((item) => ({
          id: item.id,
          name: item.name || 'Без названия',
          contact: item.contact || '',
          phone: item.phone || '',
          email: item.email || '',
        }))
      : [];
  } catch (err) {
    clients.value = [];
  }
}

function toggleNewClient() {
  showNewClientForm.value = !showNewClientForm.value;
  if (!showNewClientForm.value) {
    newClient.name = '';
    newClient.contact = '';
    newClient.phone = '';
    newClient.email = '';
  }
}

const newClient = reactive({
  name: '',
  contact: '',
  phone: '',
  email: '',
});

async function createClient() {
  creatingClient.value = true;
  try {
    const payload = { ...newClient };
    const { data } = await api.post('/directories/clients', payload);
    const created = {
      id: data.id,
      name: data.name || payload.name,
      contact: data.contact || payload.contact,
      phone: data.phone || payload.phone,
      email: data.email || payload.email,
    };
    clients.value.unshift(created);
    form.client_id = created.id;
    toggleNewClient();
  } catch (err) {
    error.value = err?.response?.data?.message || 'Не удалось создать клиента';
  } finally {
    creatingClient.value = false;
  }
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
    form.client_id = data.client_id || null;
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
    const clientId = form.client_id ? Number(form.client_id) : null;
    const payload = {
      client_id: clientId,
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
  loadClients().finally(() => loadOrders());
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

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-new {
  background: #e0f2fe;
  color: #0369a1;
}

.status-in_progress {
  background: #fef3c7;
  color: #b45309;
}

.status-done {
  background: #dcfce7;
  color: #15803d;
}

.status-canceled {
  background: #fee2e2;
  color: #b91c1c;
}

.client-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.client-select {
  display: flex;
  gap: 8px;
  align-items: center;
}

.client-select input {
  width: 180px;
}

.client-select select {
  min-width: 200px;
}

.new-client-card {
  margin-top: 8px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 12px;
  background: #f9fafb;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.new-client-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.new-client-grid label {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.new-client-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
