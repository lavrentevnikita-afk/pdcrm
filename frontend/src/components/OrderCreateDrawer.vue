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
        <button type="button" class="drawer-close" @click="handleClose">
          ×
        </button>
      </div>

      <div class="drawer-body">
        <div v-if="error" class="drawer-error">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit">
          <!-- Базовые поля заказа -->
          <section class="drawer-section">
            <div class="drawer-section-title">
              Клиент и заказ
            </div>

            <div class="drawer-grid-2">
              <label class="drawer-field">
                <span class="drawer-label">Клиент</span>
                <input
                  v-model="form.clientName"
                  type="text"
                  placeholder="ФИО или компания"
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
                placeholder="Требования, материалы, цвета, размеры…"
              />
            </label>

            <div class="drawer-grid-2">
              <label class="drawer-field">
                <span class="drawer-label">Дедлайн</span>
                <input
                  v-model="form.deadline"
                  type="date"
                />
              </label>

              <label class="drawer-field drawer-field--checkbox">
                <input
                  v-model="form.isHot"
                  type="checkbox"
                />
                <span class="drawer-label-inline">
                  Горящий заказ
                </span>
              </label>
            </div>
          </section>

          <!-- Калькулятор: продукция -->
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
                v-model="itemsMap[item.id]"
                :categories="productCategories"
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
              Работы после печати: ламинация, вырубка, фальцовка и т.п.
              Можно вынести в отдельную категорию в справочнике.
            </div>

            <div class="drawer-items-list">
              <OrderItemRow
                v-for="item in postpressItems"
                :key="item.id"
                v-model="itemsMap[item.id]"
                :categories="productCategories"
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
          </section>

          <!-- Итоги и скидки -->
          <section class="drawer-section drawer-section--summary">
            <div class="drawer-section-title">
              Итоги по заказу
            </div>

            <div class="drawer-summary-grid">
              <div class="drawer-field">
                <span class="drawer-label">Сумма позиций, ₽</span>
                <div class="drawer-summary-value">
                  {{ itemsSubtotal.toFixed(2) }}
                </div>
              </div>

              <div class="drawer-field">
                <span class="drawer-label">Скидка на заказ, %</span>
                <input
                  v-model.number="form.orderDiscountPercent"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                />
              </div>

              <div class="drawer-field">
                <span class="drawer-label">Скидка на заказ, ₽</span>
                <input
                  v-model.number="form.orderDiscountValue"
                  type="number"
                  min="0"
                  step="0.01"
                />
              </div>

              <div class="drawer-field">
                <span class="drawer-label">Итого к оплате, ₽</span>
                <div class="drawer-summary-value drawer-summary-value--total">
                  {{ totalToPay.toFixed(2) }}
                </div>
              </div>
            </div>
          </section>

          <!-- Действия -->
          <section class="drawer-section drawer-section--actions">
            <button
              type="submit"
              class="btn-primary"
              :disabled="submitting"
            >
              {{ submitting ? 'Сохранение…' : 'Сохранить заказ' }}
            </button>
            <button
              type="button"
              class="btn-secondary"
              @click="handleClose"
            >
              Отмена
            </button>
          </section>
        </form>
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

const form = reactive({
  clientName: '',
  clientPhone: '',
  title: '',
  description: '',
  deadline: '',
  isHot: false,
  orderDiscountPercent: 0,
  orderDiscountValue: 0,
});

const items = ref([]);

const productCategories = ref([]);
const submitting = ref(false);
const error = ref('');

let nextId = 1;

function resetForm() {
  form.clientName = '';
  form.clientPhone = '';
  form.title = '';
  form.description = '';
  form.deadline = '';
  form.isHot = false;
  form.orderDiscountPercent = 0;
  form.orderDiscountValue = 0;
  items.value = [];
  error.value = '';
  nextId = 1;
}

function handleClose() {
  resetForm();
  emit('close');
}

function addItem(type = 'product') {
  items.value.push({
    id: nextId++,
    type,
    categoryId: undefined,
    productId: undefined,
    productName: '',
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

const itemsMap = computed({
  get() {
    const map = {};
    for (const item of items.value) {
      map[item.id] = item;
    }
    return map;
  },
  set(newMap) {
    items.value = Object.values(newMap);
  },
});

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
    const base = itemsSubtotal.value;
    const discount = (Number(val) || 0) * (base / 100);
    form.orderDiscountValue = Number(discount.toFixed(2));
    discountGuard.fromPercent = false;
  }
);

watch(
  () => form.orderDiscountValue,
  (val) => {
    if (discountGuard.fromPercent) return;
    discountGuard.fromValue = true;
    const base = itemsSubtotal.value;
    const discount = Number(val) || 0;
    const percent = base ? (discount / base) * 100 : 0;
    form.orderDiscountPercent = Number(percent.toFixed(2));
    discountGuard.fromValue = false;
  }
);

const totalToPay = computed(() => {
  const base = itemsSubtotal.value;
  const discount = Number(form.orderDiscountValue) || 0;
  const total = base - discount;
  return total > 0 ? total : 0;
});

async function loadCategories() {
  try {
    const { data } = await api.get('/product-categories');
    productCategories.value = data || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
}

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm();
      addItem('product');
      loadCategories();
    }
  }
);

async function handleSubmit() {
  if (!items.value.length) {
    error.value = 'Добавьте хотя бы одну позицию заказа';
    return;
  }

  submitting.value = true;
  error.value = '';

  try {
    const payloadItems = items.value.map((item) => ({
      product_id: item.productId,
      product_name: item.productName,
      quantity: item.quantity,
      unit: item.unit,
      base_price: item.basePrice,
      unit_price: item.unitPrice,
      discount_percent: item.discountPercent,
      discount_value: item.discountValue,
      total_price: item.totalPrice,
      comment: item.comment,
      type: item.type,
    }));

    const deadlineAt = form.deadline || null;

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
    handleClose();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    error.value = 'Не удалось сохранить заказ. Попробуйте ещё раз.';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  justify-content: flex-end;
  z-index: 40;
}

.drawer-panel {
  width: 720px;
  max-width: 100%;
  background: var(--bg-elevated);
  box-shadow: var(--shadow-lg);
  padding: 20px 24px 24px;
  overflow-y: auto;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.drawer-title {
  font-size: 20px;
  font-weight: 600;
}

.drawer-subtitle {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 4px;
}

.drawer-close {
  border: none;
  background: transparent;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-muted);
}

.drawer-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drawer-section {
  border-top: 1px solid var(--border-subtle);
  padding-top: 12px;
  margin-top: 12px;
}

.drawer-section-title {
  font-weight: 600;
  margin-bottom: 8px;
}

.drawer-section-title--mt {
  margin-top: 16px;
}

.drawer-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.drawer-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.drawer-field--checkbox {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  margin-top: 22px;
}

.drawer-label {
  font-size: 12px;
  color: var(--text-muted);
}

.drawer-label-inline {
  font-size: 13px;
}

.drawer-help {
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
}

.drawer-items-list {
  margin-top: 8px;
}

.drawer-section--summary {
  background: var(--bg-subtle);
  border-radius: 8px;
  padding: 12px;
}

.drawer-summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.drawer-summary-value {
  padding: 8px;
  border-radius: 6px;
  background: var(--bg-elevated);
  font-weight: 500;
}

.drawer-summary-value--total {
  font-size: 16px;
}

.drawer-section--actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  align-items: center;
}

.drawer-error {
  margin-bottom: 8px;
}

.drawer-add-btn {
  margin-top: 8px;
}

@media (max-width: 900px) {
  .drawer-panel {
    width: 100%;
  }

  .drawer-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .drawer-grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
