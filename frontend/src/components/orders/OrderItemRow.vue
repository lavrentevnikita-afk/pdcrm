<template>
  <div class="order-item-row">
    <div class="order-item-row__header">
      <div class="drawer-field order-item-row__category">
        <span class="drawer-label">Категория</span>
        <select v-model.number="state.categoryId">
          <option :value="undefined">Все категории</option>
          <option
            v-for="cat in categories"
            :key="cat.id"
            :value="cat.id"
          >
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="drawer-field order-item-row__product">
        <span class="drawer-label">Товар</span>
        <div class="order-item-row__product-inputs">
          <input
            v-model="search"
            type="text"
            class="order-item-row__search"
            placeholder="Поиск по названию…"
            @keyup.enter.prevent="loadProducts"
          />
          <select
            v-model.number="state.productId"
            class="order-item-row__product-select"
          >
            <option :value="undefined" disabled>Выберите товар</option>
            <option
              v-for="p in products"
              :key="p.id"
              :value="p.id"
            >
              {{ p.name }} ({{ p.unit }})
            </option>
          </select>
        </div>
        <div v-if="loadingProducts" class="drawer-help">
          Загрузка списка товаров…
        </div>
      </div>

      <button
        type="button"
        class="order-item-row__remove"
        @click="emit('remove', state.id)"
      >
        ×
      </button>
    </div>

    <div class="order-item-row__pricing">
      <div class="drawer-field order-item-row__qty">
        <span class="drawer-label">Тираж / количество</span>
        <input
          v-model.number="state.quantity"
          type="number"
          min="1"
          step="1"
        />
      </div>

      <div class="drawer-field order-item-row__unit">
        <span class="drawer-label">Ед.</span>
        <input
          v-model="state.unit"
          type="text"
          class="order-item-row__unit-input"
          placeholder="шт."
        />
      </div>

      <div class="drawer-field order-item-row__price">
        <span class="drawer-label">
          Цена за ед.
        </span>
        <input
          v-model.number="state.unitPrice"
          type="number"
          min="0"
          step="0.01"
        />
        <div v-if="loadingPrice" class="drawer-help">
          Пересчёт…
        </div>
      </div>

      <div class="drawer-field order-item-row__total">
        <span class="drawer-label">Итого</span>
        <div class="order-item-row__total-value">
          {{ formatMoney(state.totalPrice) }}
        </div>
      </div>
    </div>

    <div class="order-item-row__footer">
      <div class="order-item-row__discounts">
        <div class="drawer-field">
          <span class="drawer-label">Скидка, %</span>
          <input
            v-model.number="state.discountPercent"
            type="number"
            min="0"
            max="100"
            step="0.1"
          />
        </div>
        <div class="drawer-field">
          <span class="drawer-label">Скидка, ₽</span>
          <input
            v-model.number="state.discountValue"
            type="number"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      <div class="drawer-field order-item-row__comment">
        <span class="drawer-label">Комментарий</span>
        <input
          v-model="state.comment"
          type="text"
          placeholder="Печать, цветность, материалы…"
        />
      </div>
    </div>

    <div v-if="error" class="drawer-error drawer-error--inline">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import api from '../../utils/apiClient';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  categories: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue', 'remove']);

const state = reactive({
  id: props.modelValue.id,
  type: props.modelValue.type || 'product',
  categoryId: props.modelValue.categoryId,
  productId: props.modelValue.productId,
  productName: props.modelValue.productName || '',
  quantity: props.modelValue.quantity || 1,
  unit: props.modelValue.unit || 'шт.',
  basePrice: props.modelValue.basePrice || 0,
  unitPrice: props.modelValue.unitPrice || 0,
  discountPercent: props.modelValue.discountPercent || 0,
  discountValue: props.modelValue.discountValue || 0,
  totalPrice: props.modelValue.totalPrice || 0,
  comment: props.modelValue.comment || '',
});

const products = ref([]);
const search = ref('');
const loadingProducts = ref(false);
const loadingPrice = ref(false);
const error = ref('');

const selectedProduct = computed(() =>
  products.value.find((p) => p.id === state.productId) || null
);

let updatingFromPercent = false;
let updatingFromValue = false;

function emitChange() {
  emit('update:modelValue', { ...state });
}

async function loadProducts() {
  loadingProducts.value = true;
  error.value = '';
  try {
    const params = {};
    if (state.categoryId) {
      params.category_id = state.categoryId;
    }
    if (search.value && search.value.trim()) {
      params.search = search.value.trim();
    }
    const { data } = await api.get('/products', { params });
    products.value = data || [];
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    error.value = 'Не удалось загрузить список продукции';
  } finally {
    loadingProducts.value = false;
  }
}

async function fetchPriceForQty() {
  if (!state.productId || !state.quantity) return;

  loadingPrice.value = true;
  error.value = '';
  try {
    let basePrice = state.basePrice;
    const product = selectedProduct.value;
    if (!basePrice && product && product.base_price != null) {
      basePrice = Number(product.base_price) || 0;
      state.basePrice = basePrice;
    }

    const { data: tiers } = await api.get(
      `/products/${state.productId}/price-tiers`
    );

    let unitPrice = basePrice;
    if (Array.isArray(tiers) && tiers.length) {
      const qty = Number(state.quantity) || 0;
      let matched = tiers.find(
        (t) =>
          qty >= Number(t.min_qty) &&
          (t.max_qty == null || qty <= Number(t.max_qty))
      );
      if (!matched) {
        matched = tiers
          .filter((t) => qty >= Number(t.min_qty))
          .sort((a, b) => Number(b.min_qty) - Number(a.min_qty))[0];
      }

      if (matched) {
        if (matched.price_per_unit != null) {
          unitPrice = Number(matched.price_per_unit) || unitPrice;
        } else if (matched.discount_percent != null) {
          const discount = Number(matched.discount_percent) || 0;
          unitPrice = basePrice * (1 - discount / 100);
        }
      }
    }

    state.unitPrice = unitPrice;
    recalcTotals(false);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    error.value = 'Не удалось рассчитать цену по тиражу';
  } finally {
    loadingPrice.value = false;
    emitChange();
  }
}

function recalcTotals(force = false) {
  const qty = Number(state.quantity) || 0;
  const unitPrice = Number(state.unitPrice) || 0;
  const base = qty * unitPrice;

  let discountValue = Number(state.discountValue) || 0;
  let discountPercent = Number(state.discountPercent) || 0;

  if (base <= 0) {
    state.discountValue = 0;
    state.discountPercent = 0;
    state.totalPrice = 0;
    emitChange();
    return;
  }

  if (updatingFromPercent || force) {
    discountValue = (base * discountPercent) / 100;
    state.discountValue = discountValue;
  } else if (updatingFromValue) {
    discountPercent = base ? (discountValue / base) * 100 : 0;
    state.discountPercent = discountPercent;
  }

  if (discountValue > base) {
    discountValue = base;
    state.discountValue = base;
    state.discountPercent = 100;
  }

  state.totalPrice = base - discountValue;
  emitChange();
}

function formatMoney(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('ru-RU', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

watch(
  () => [state.categoryId, search.value],
  () => {
    loadProducts();
  }
);

watch(
  () => state.productId,
  () => {
    const product = selectedProduct.value;
    if (product) {
      state.productName = product.name;
      state.unit = product.unit || 'шт.';
      state.basePrice = Number(product.base_price) || 0;
      fetchPriceForQty();
    }
    emitChange();
  }
);

watch(
  () => [state.quantity, state.unitPrice],
  () => {
    updatingFromPercent = false;
    updatingFromValue = false;
    recalcTotals(true);
  }
);

watch(
  () => state.discountPercent,
  () => {
    updatingFromPercent = true;
    updatingFromValue = false;
    recalcTotals(true);
    updatingFromPercent = false;
  }
);

watch(
  () => state.discountValue,
  () => {
    updatingFromPercent = false;
    updatingFromValue = true;
    recalcTotals(true);
    updatingFromValue = false;
  }
);

watch(
  () => props.modelValue,
  (val) => {
    if (!val) return;
    Object.assign(state, val);
  }
);

onMounted(() => {
  loadProducts();
  recalcTotals(true);
  emitChange();
});
</script>

<style scoped>
.order-item-row {
  padding: 12px 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.order-item-row__header {
  display: grid;
  grid-template-columns: minmax(0, 140px) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: flex-end;
}

.order-item-row__product-inputs {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.order-item-row__search {
  width: 100%;
}

.order-item-row__product-select {
  width: 100%;
}

.order-item-row__remove {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  padding: 2px 6px;
}

.order-item-row__remove:hover {
  color: var(--color-error);
}

.order-item-row__pricing {
  display: grid;
  grid-template-columns: minmax(0, 160px) 80px minmax(0, 160px) minmax(0, 120px);
  gap: 12px;
}

.order-item-row__unit-input {
  max-width: 80px;
}

.order-item-row__total-value {
  font-weight: 600;
  font-size: 15px;
}

.order-item-row__footer {
  display: grid;
  grid-template-columns: minmax(0, 260px) minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.order-item-row__discounts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.order-item-row__comment input {
  width: 100%;
}

.drawer-error--inline {
  margin-top: 4px;
}
</style>