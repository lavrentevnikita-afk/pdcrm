<template>
  <div v-if="visible" class="drawer-backdrop" @click.self="handleClose">
    <div class="drawer-panel">
      <div class="drawer-header">
        <div>
          <div class="drawer-title">Новый заказ</div>
          <div class="drawer-subtitle">
            Клиент, дедлайн и калькулятор заказа с позициями и скидками.
          </div>
        </div>
        <button type="button" class="drawer-close" @click="handleClose">×</button>
      </div>

      <div class="drawer-body">
        <div v-if="error" class="drawer-error">
          {{ error }}
        </div>

        <div class="drawer-grid">
          <section class="drawer-section">
            <div class="drawer-section-title">Клиент</div>

            <div class="drawer-radio-row">
              <label class="drawer-radio">
                <input
                  v-model="form.clientType"
                  type="radio"
                  value="retail"
                />
                <span>Розница</span>
              </label>
              <label class="drawer-radio">
                <input
                  v-model="form.clientType"
                  type="radio"
                  value="org"
                />
                <span>Организация</span>
              </label>
            </div>

            <div class="drawer-two-cols">
              <label class="drawer-field">
                <span class="drawer-label">
                  Имя / организация
                </span>
                <input
                  v-model="form.clientName"
                  type="text"
                  placeholder="Клиент или компания"
                />
              </label>

              <label class="drawer-field">
                <span class="drawer-label">Телефон</span>
                <input
                  v-model="form.clientPhone"
                  type="tel"
                  placeholder="+7…"
                />
              </label>
            </div>

            <label class="drawer-field">
              <span class="drawer-label">
                Название заказа
              </span>
              <input
                v-model="form.title"
                type="text"
                placeholder="Например: Визитки для ООО «Ромашка»"
              />
            </label>

            <label class="drawer-field">
              <span class="drawer-label">Комментарий к заказу</span>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="Требования к макету, сроки, комментарии…"
              />
            </label>

            <div class="drawer-section-title drawer-section-title--mt">
              Дедлайн
            </div>

            <div class="drawer-two-cols">
              <label class="drawer-field">
                <span class="drawer-label">Дата</span>
                <input
                  v-model="form.deadlineDate"
                  type="date"
                />
              </label>

              <label class="drawer-field">
                <span class="drawer-label">Время</span>
                <input
                  v-model="form.deadlineTime"
                  type="time"
                />
              </label>
            </div>

            <label class="drawer-checkbox">
              <input
                v-model="form.isHot"
                type="checkbox"
              />
              <span>Горящий заказ</span>
            </label>
          </section>

          <section class="drawer-section">
            <div class="drawer-section-title">
              Продукция
            </div>

            <div class="drawer-help">
              Добавьте позиции заказа. Цена за единицу подбирается автоматически по тиражу.
            </div>

            <div class="drawer-items-list">
              <OrderItemRow
                v-for="item in productItems"
                :key="item.id"
                :model-value="item"
                :categories="productCategories"
                @update:model-value="updateItem(item.id, $event)"
                @remove="removeItem"
              />
            </div>

            <button
              type="button"
              class="btn-secondary drawer-add-btn"
              @click="addItem('product')"
            >
              + Продукция
            </button>

            <div class="drawer-section-title drawer-section-title--mt">
              Постпечатка
            </div>

            <div class="drawer-help">
              Ламинация, вырубка, фольгирование и другие дополнительные услуги.
            </div>

            <div class="drawer-items-list">
              <OrderItemRow
                v-for="item in postpressItems"
                :key="item.id"
                :model-value="item"
                :categories="productCategories"
                @update:model-value="updateItem(item.id, $event)"
                @remove="removeItem"
              />
            </div>

            <button
              type="button"
              class="btn-secondary drawer-add-btn"
              @click="addItem('postpress')"
            >
              + Постпечатка
            </button>

            <div class="drawer-section-title drawer-section-title--mt">
              Итоги
            </div>

            <div class="drawer-totals">
              <div class="drawer-totals-row">
                <span>Сумма позиций</span>
                <span>{{ formatMoney(itemsSubtotal) }}</span>
              </div>

              <div class="drawer-two-cols">
                <label class="drawer-field">
                  <span class="drawer-label">Скидка на заказ, %</span>
                  <input
                    v-model.number="form.orderDiscountPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </label>

                <label class="drawer-field">
                  <span class="drawer-label">Скидка, ₽</span>
                  <input
                    v-model.number="form.orderDiscountValue"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </label>
              </div>

              <div class="drawer-totals-row drawer-totals-row--total">
                <span>Итого к оплате</span>
                <span>{{ formatMoney(totalToPay) }}</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <div class="drawer-footer">
        <button
          type="button"
          class="btn-secondary"
          @click="handleClose"
          :disabled="saving"
        >
          Отмена
        </button>
        <button
          type="button"
          class="btn-primary"
          @click="handleSubmit"
          :disabled="saving || !canSubmit"
        >
          <span v-if="saving">Сохраняем…</span>
          <span v-else>Создать заказ</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import api from '../../utils/apiClient';
import OrderItemRow from './OrderItemRow.vue';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'created']);

const saving = ref(false);
const error = ref('');

const form = reactive({
  clientType: 'retail',
  clientName: '',
  clientPhone: '',
  title: '',
  description: '',
  deadlineDate: '',
  deadlineTime: '',
  isHot: false,
  orderDiscountPercent: 0,
  orderDiscountValue: 0,
});

const items = ref([]);
const productCategories = ref([]);

const productItems = computed(() =>
  items.value.filter((i) => i.type === 'product')
);
const postpressItems = computed(() =>
  items.value.filter((i) => i.type === 'postpress')
);

const itemsSubtotal = computed(() =>
  items.value.reduce(
    (sum, item) => sum + (Number(item.totalPrice) || 0),
    0
  )
);

const discountGuard = {
  fromPercent: false,
  fromValue: false,
};

watch(
  () => form.orderDiscountPercent,
  (val) => {
    if (discountGuard.fromValue) return;
    discountGuard.fromPercent = true;
    const subtotal = itemsSubtotal.value;
    const percent = Number(val) || 0;
    form.orderDiscountValue =
      subtotal > 0 ? (subtotal * percent) / 100 : 0;
    discountGuard.fromPercent = false;
  }
);

watch(
  () => form.orderDiscountValue,
  (val) => {
    if (discountGuard.fromPercent) return;
    discountGuard.fromValue = true;
    const subtotal = itemsSubtotal.value;
    const v = Number(val) || 0;
    form.orderDiscountPercent =
      subtotal > 0 ? (v / subtotal) * 100 : 0;
    discountGuard.fromValue = false;
  }
);

const totalToPay = computed(() => {
  const subtotal = itemsSubtotal.value;
  const discount = Number(form.orderDiscountValue) || 0;
  const total = subtotal - discount;
  return total > 0 ? total : 0;
});

const canSubmit = computed(() => {
  const hasTitleOrClient =
    (form.title && form.title.trim().length > 0) ||
    (form.clientName && form.clientName.trim().length > 0);

  return (
    !!form.deadlineDate &&
    hasTitleOrClient &&
    items.value.length > 0 &&
    itemsSubtotal.value > 0
  );
});

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm();
      loadCategories();
      if (!items.value.length) {
        addItem('product');
      }
    }
  }
);

function resetForm() {
  form.clientType = 'retail';
  form.clientName = '';
  form.clientPhone = '';
  form.title = '';
  form.description = '';
  form.deadlineDate = '';
  form.deadlineTime = '';
  form.isHot = false;
  form.orderDiscountPercent = 0;
  form.orderDiscountValue = 0;
  items.value = [];
  error.value = '';
}

function addItem(type = 'product') {
  items.value.push({
    id: Date.now() + Math.random(),
    type,
    productId: undefined,
    productName: '',
    categoryId: undefined,
    quantity: 1,
    unit: 'шт.',
    basePrice: 0,
    unitPrice: 0,
    discountPercent: 0,
    discountValue: 0,
    totalPrice: 0,
    comment: '',
  });
}

function removeItem(id) {
  items.value = items.value.filter((i) => i.id !== id);
}

function updateItem(id, newValue) {
  const index = items.value.findIndex((i) => i.id === id);
  if (index !== -1) {
    items.value[index] = {
      ...items.value[index],
      ...newValue,
    };
  }
}

async function loadCategories() {
  try {
    const { data } = await api.get('/product-categories');
    productCategories.value = data || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildDeadlineIso() {
  if (!form.deadlineDate) return null;
  const date = form.deadlineDate;
  const time = form.deadlineTime || '18:00';
  return `${date}T${time}:00`;
}

async function handleSubmit() {
  if (!canSubmit.value || saving.value) return;

  saving.value = true;
  error.value = '';

  try {
    const deadlineAt = buildDeadlineIso();
    if (!deadlineAt) {
      error.value = 'Укажите дату дедлайна';
      saving.value = false;
      return;
    }

    if (!items.value.length) {
      error.value = 'Добавьте хотя бы одну позицию заказа';
      saving.value = false;
      return;
    }

    const payloadItems = items.value.map((item) => ({
      product_id: item.productId,
      product_name: item.productName || 'Позиция заказа',
      quantity: item.quantity,
      unit: item.unit,
      base_price: item.basePrice,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent,
      discount_value: item.discountValue,
      total_price: item.totalPrice,
      comment: item.comment || null,
    }));

    const payload = {
      title:
        form.title ||
        form.clientName ||
        'Новый заказ',
      client_name: form.clientName || null,
      client_phone: form.clientPhone || null,
      deadline_at: deadlineAt,
      sum_total: totalToPay.value,
      is_hot: form.isHot,
      items: payloadItems,
    };

    const { data } = await api.post('/orders', payload);
    emit('created', data);
    resetForm();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    error.value =
      e.response?.data?.message ||
      'Ошибка при сохранении заказа';
  } finally {
    saving.value = false;
  }
}

function handleClose() {
  if (saving.value) return;
  emit('close');
}
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 40;
}

.drawer-panel {
  width: 480px;
  max-width: 100%;
  height: 100%;
  background: var(--color-bg-alt);
  box-shadow: -12px 0 32px rgba(15, 23, 42, 0.5);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
}

.drawer-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
}

.drawer-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px 20px;
}

.drawer-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.drawer-section {
  background: var(--color-bg);
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
}

.drawer-section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.drawer-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 768px) {
  .drawer-grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

.drawer-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.drawer-field input,
.drawer-field textarea {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  outline: none;
}

.drawer-field input:focus,
.drawer-field textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary-soft);
}

.drawer-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.drawer-radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.drawer-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.drawer-radio--disabled {
  opacity: 0.6;
}

.drawer-radio input {
  width: 14px;
  height: 14px;
}

.drawer-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-top: 8px;
}

.drawer-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
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

.drawer-error {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--color-error);
}


.drawer-items-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.drawer-add-btn {
  width: 100%;
  justify-content: center;
}

.drawer-totals {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--color-bg-soft);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.drawer-totals-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.drawer-totals-row--total {
  font-weight: 600;
  font-size: 15px;
}

</style>