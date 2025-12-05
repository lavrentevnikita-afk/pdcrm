<template>
  <div class="warehouse-page">
    <div class="page-title">Склад</div>
    <div class="page-subtitle">
      Учёт остатков материалов, движения и заявок на закупку.
    </div>

    <div class="warehouse-grid">
      <section class="card">
        <header class="card-header">
          <div>
            <div class="card-title">Остатки материалов</div>
            <div class="card-subtitle">Подсветка низких остатков</div>
          </div>
          <button class="btn" type="button" @click="openAddItem">Добавить</button>
        </header>

        <div class="table">
          <div class="table-head">
            <div>Материал</div>
            <div>Ед.</div>
            <div>Остаток</div>
            <div>Точка заказа</div>
            <div>Поставщик</div>
            <div>Обновлено</div>
          </div>
          <div
            v-for="item in items"
            :key="item.id"
            class="table-row"
            :class="{ 'row-low': item.low_stock }"
          >
            <div class="name">
              {{ item.name }}
              <span v-if="item.low_stock" class="badge badge-alert"
                >Низкий остаток</span
              >
            </div>
            <div>{{ item.unit }}</div>
            <div>{{ item.stock }}</div>
            <div>{{ item.reorder_level }}</div>
            <div>{{ item.supplier }}</div>
            <div>{{ formatDate(item.last_movement_at) }}</div>
          </div>
        </div>
      </section>

      <section class="card">
        <header class="card-header">
          <div>
            <div class="card-title">Движения</div>
            <div class="card-subtitle">Приход/расход по складу</div>
          </div>
        </header>

        <form class="form-grid" @submit.prevent="createMovement">
          <label>
            Материал
            <select v-model="movementForm.item_id" required>
              <option disabled value="">Выберите</option>
              <option v-for="item in items" :key="item.id" :value="item.id">
                {{ item.name }}
              </option>
            </select>
          </label>
          <label>
            Тип
            <select v-model="movementForm.type" required>
              <option value="in">Приход</option>
              <option value="out">Расход</option>
            </select>
          </label>
          <label>
            Количество
            <input v-model.number="movementForm.quantity" type="number" min="1" required />
          </label>
          <label class="span-2">
            Примечание
            <input v-model="movementForm.note" type="text" placeholder="Комментарий" />
          </label>
          <button class="btn btn-primary span-2" type="submit">Записать движение</button>
        </form>
      </section>

      <section class="card">
        <header class="card-header">
          <div>
            <div class="card-title">Закупка</div>
            <div class="card-subtitle">Заявки на пополнение</div>
          </div>
          <button class="btn" type="button" @click="openPurchase">Новая заявка</button>
        </header>

        <div class="table">
          <div class="table-head">
            <div>Материал</div>
            <div>Количество</div>
            <div>Статус</div>
            <div>Запросил</div>
            <div>Дата</div>
          </div>
          <div v-for="req in requests" :key="req.id" class="table-row">
            <div class="name">{{ req.material }}</div>
            <div>{{ req.quantity }}</div>
            <div>
              <span class="badge" :class="statusClass(req.status)">{{ statusLabel(req.status) }}</span>
            </div>
            <div>{{ req.requested_by }}</div>
            <div>{{ formatDate(req.created_at) }}</div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="showAddItem" class="modal-backdrop" @click.self="closeModals">
      <div class="modal">
        <div class="modal-title">Добавление материала</div>
        <form class="form-grid" @submit.prevent="createItem">
          <label>
            Название
            <input v-model="itemForm.name" type="text" required />
          </label>
          <label>
            Единица
            <input v-model="itemForm.unit" type="text" placeholder="лист, м²" />
          </label>
          <label>
            Остаток
            <input v-model.number="itemForm.stock" type="number" min="0" />
          </label>
          <label>
            Точка заказа
            <input v-model.number="itemForm.reorder_level" type="number" min="0" />
          </label>
          <label class="span-2">
            Поставщик
            <input v-model="itemForm.supplier" type="text" />
          </label>
          <div class="modal-actions span-2">
            <button class="btn" type="button" @click="closeModals">Отмена</button>
            <button class="btn btn-primary" type="submit">Сохранить</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showPurchase" class="modal-backdrop" @click.self="closeModals">
      <div class="modal">
        <div class="modal-title">Заявка на закупку</div>
        <form class="form-grid" @submit.prevent="createPurchase">
          <label class="span-2">
            Материал
            <input v-model="purchaseForm.material" type="text" required />
          </label>
          <label class="span-2">
            Количество
            <input v-model.number="purchaseForm.quantity" type="number" min="1" required />
          </label>
          <div class="modal-actions span-2">
            <button class="btn" type="button" @click="closeModals">Отмена</button>
            <button class="btn btn-primary" type="submit">Создать</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';

const items = ref([]);
const requests = ref([]);
const showAddItem = ref(false);
const showPurchase = ref(false);

const itemForm = ref({
  name: '',
  unit: '',
  stock: 0,
  reorder_level: 0,
  supplier: '',
});

const movementForm = ref({
  item_id: '',
  type: 'out',
  quantity: 1,
  note: '',
});

const purchaseForm = ref({
  material: '',
  quantity: 1,
});

function formatDate(value) {
  return new Date(value).toLocaleString();
}

function statusLabel(status) {
  if (status === 'approved') return 'Согласовано';
  if (status === 'rejected') return 'Отклонено';
  return 'На рассмотрении';
}

function statusClass(status) {
  return {
    'badge-alert': status === 'pending',
    'badge-success': status === 'approved',
    'badge-muted': status === 'rejected',
  };
}

function openAddItem() {
  showAddItem.value = true;
}

function openPurchase() {
  showPurchase.value = true;
}

function closeModals() {
  showAddItem.value = false;
  showPurchase.value = false;
}

async function loadWarehouse() {
  const [itemsRes, purchaseRes] = await Promise.all([
    axios.get('/api/warehouse/items'),
    axios.get('/api/warehouse/purchase-requests'),
  ]);
  items.value = itemsRes.data.items;
  requests.value = purchaseRes.data.requests;
}

async function createItem() {
  await axios.post('/api/warehouse/items', itemForm.value);
  await loadWarehouse();
  closeModals();
  itemForm.value = { name: '', unit: '', stock: 0, reorder_level: 0, supplier: '' };
}

async function createMovement() {
  await axios.post('/api/warehouse/movements', movementForm.value);
  await loadWarehouse();
  movementForm.value = { item_id: '', type: 'out', quantity: 1, note: '' };
}

async function createPurchase() {
  await axios.post('/api/warehouse/purchase-requests', purchaseForm.value);
  await loadWarehouse();
  closeModals();
  purchaseForm.value = { material: '', quantity: 1 };
}

onMounted(loadWarehouse);
</script>

<style scoped>
.warehouse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 16px;
}

.card {
  background: var(--card-bg, #111827);
  border: 1px solid var(--card-border, #1f2937);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.card-title {
  font-weight: 700;
  font-size: 18px;
}

.card-subtitle {
  color: #9ca3af;
  font-size: 13px;
}

.table {
  border: 1px solid #1f2937;
  border-radius: 10px;
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1.4fr 0.6fr 0.6fr 0.8fr 1fr 1fr;
  gap: 8px;
  padding: 10px 12px;
}

.table-head {
  background: #111827;
  color: #9ca3af;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.02em;
}

.table-row:nth-child(odd) {
  background: #0b1221;
}

.table-row:nth-child(even) {
  background: #0d1528;
}

.table-row.row-low {
  border-left: 3px solid #ef4444;
}

.name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  background: #1f2937;
  color: #9ca3af;
}

.badge-alert {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.25);
}

.badge-success {
  background: rgba(16, 185, 129, 0.12);
  color: #6ee7b7;
  border: 1px solid rgba(16, 185, 129, 0.25);
}

.badge-muted {
  background: rgba(156, 163, 175, 0.12);
  color: #d1d5db;
  border: 1px solid rgba(156, 163, 175, 0.2);
}

.btn {
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid #1f2937;
  background: #0f172a;
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #111827;
}

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border: none;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #e5e7eb;
}

input,
select {
  background: #0b1221;
  border: 1px solid #1f2937;
  color: #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}

.span-2 {
  grid-column: span 2;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  z-index: 20;
}

.modal {
  background: #0f172a;
  border-radius: 12px;
  border: 1px solid #1f2937;
  padding: 18px;
  width: min(520px, 100%);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 12px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
