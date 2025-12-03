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
        <div class="order-item-row__product-input">
          <input
            v-model="search"
            type="text"
            placeholder="Поиск по названию…"
            @input="handleSearchInput"
          />
          <select
            v-model.number="state.productId"
            class="order-item-row__product-select"
          >
            <option :value="undefined" disabled>Выберите товар…</option>
            <option
              v-for="product in products"
              :key="product.id"
              :value="product.id"
            >
              {{ product.name }}
            </option>
          </select>
        </div>
        <div v-if="loadingProducts" class="drawer-hint">
          Загрузка товаров…
        </div>
      </div>

      <button
        type="button"
        class="order-item-row__remove"
        @click="$emit('remove', state.id)"
      >
        ✕
      </button>
    </div>

    <div class="order-item-row__body">
      <div class="drawer-field">
        <span class="drawer-label">Тираж / кол-во</span>
        <input
          v-model.number="state.quantity"
          type="number"
          min="1"
          step="1"
          @change="handleQuantityChange"
        />
      </div>

      <div class="drawer-field order-item-row__unit">
        <span class="drawer-label">Ед.</span>
        <input
          v-model="state.unit"
          type="text"
          placeholder="шт., м², комплект…"
          @change="emitChange"
        />
      </div>

      <div class="drawer-field">
        <span class="drawer-label">
          Базовая цена (₽)
        </span>
        <input
          v-model.number="state.basePrice"
          type="number"
          min="0"
          step="0.01"
          @change="handleBasePriceChange"
        />
      </div>

      <div class="drawer-field">
        <span class="drawer-label">
          Цена за ед. (₽)
        </span>
        <div class="order-item-row__inline-input">
          <input
            v-model.number="state.unitPrice"
            type="number"
            min="0"
            step="0.01"
            @change="handleUnitPriceChange"
          />
          <button
            type="button"
            class="btn-secondary btn-small"
            :disabled="!state.productId || loadingPrice"
            @click="autoRecalculateByQuantity"
          >
            {{ loadingPrice ? 'Расчёт…' : 'Подобрать по тиражу' }}
          </button>
        </div>
      </div>

      <div class="drawer-field order-item-row__discounts">
        <div>
          <span class="drawer-label">
            Скидка, %
          </span>
          <input
            v-model.number="state.discountPercent"
            type="number"
            min="0"
            max="100"
            step="0.1"
            @input="handlePercentChange"
          />
        </div>

        <div>
          <span class="drawer-label">
            Скидка, ₽
          </span>
          <input
            v-model.number="state.discountValue"
            type="number"
            min="0"
            step="0.01"
            @input="handleValueChange"
          />
        </div>
      </div>

      <div class="drawer-field">
        <span class="drawer-label">Итого по строке</span>
        <div class="order-item-row__total">
          <span>{{ formattedTotal }}</span>
        </div>
      </div>
    </div>

    <div class="order-item-row__footer">
      <div class="drawer-field order-item-row__comment">
        <span class="drawer-label">Комментарий к позиции</span>
        <input
          v-model="state.comment"
          type="text"
          placeholder="Размер, цветность, материалы…"
          @input="emitChange"
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

const selectedProduct = computed(
  () => products.value.find((p) => p.id === state.productId) || null
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
    error.value = 'Не удалось загрузить список товаров';
  } finally {
    loadingProducts.value = false;
  }
}

function handleSearchInput() {
  loadProducts();
}

function handleQuantityChange() {
  recalcTotals(true);
}

function handleBasePriceChange() {
  if (!state.unitPrice) {
    state.unitPrice = state.basePrice || 0;
  }
  recalcTotals(true);
}

function handleUnitPriceChange() {
  recalcTotals(true);
}

async function autoRecalculateByQuantity() {
  if (!state.productId) return;
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
          unitPrice = Number(matched.price_per_unit) || 0;
        } else if (matched.discount_percent != null) {
          const discountPerc = Number(matched.discount_percent) || 0;
          unitPrice = basePrice * (1 - discountPerc / 100);
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

  if (force) {
    if (updatingFromPercent) {
      updatingFromPercent = false;
    } else if (updatingFromValue) {
      updatingFromValue = false;
    }
  }

  if (discountPercent && !updatingFromValue) {
    updatingFromPercent = true;
    discountValue = (base * discountPercent) / 100;
    state.discountValue = Number(discountValue.toFixed(2));
    updatingFromPercent = false;
  } else if (discountValue && !updatingFromPercent) {
    updatingFromValue = true;
    discountPercent = base ? (discountValue / base) * 100 : 0;
    state.discountPercent = Number(discountPercent.toFixed(2));
    updatingFromValue = false;
  }

  const total = base - discountValue;
  state.totalPrice = total > 0 ? Number(total.toFixed(2)) : 0;

  emitChange();
}

function handlePercentChange() {
  recalcTotals(true);
}

function handleValueChange() {
  recalcTotals(true);
}

watch(
  () => state.categoryId,
  () => {
    state.productId = undefined;
    loadProducts();
    emitChange();
  }
);

watch(
  () => state.productId,
  (val) => {
    const product = products.value.find((p) => p.id === val);
    if (product) {
      state.productName = product.name;
      if (!state.basePrice && product.base_price != null) {
        state.basePrice = Number(product.base_price) || 0;
      }
    }
    emitChange();
  }
);

watch(
  () => ({
    quantity: state.quantity,
    unitPrice: state.unitPrice,
    discountPercent: state.discountPercent,
    discountValue: state.discountValue,
  }),
  () => {
    recalcTotals(false);
  }
);

onMounted(() => {
  loadProducts();
  recalcTotals(false);
});
</script>

<style scoped>
.order-item-row {
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
  background: var(--bg-elevated);
}

.order-item-row__header {
  display: grid;
  grid-template-columns: minmax(0, 160px) minmax(0, 1fr) auto;
  gap: 8px;
  align-items: flex-end;
  margin-bottom: 8px;
}

.order-item-row__product-input {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 200px);
  gap: 6px;
}

.order-item-row__body {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-bottom: 8px;
}

.order-item-row__unit input {
  max-width: 80px;
}

.order-item-row__discounts {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.order-item-row__total {
  font-weight: 600;
  font-size: 14px;
  padding: 6px 8px;
  border-radius: 6px;
  background: var(--bg-subtle);
}

.order-item-row__footer {
  margin-top: 4px;
}

.order-item-row__comment input {
  width: 100%;
}

.order-item-row__remove {
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 4px 8px;
  align-self: flex-start;
  font-size: 16px;
  color: var(--text-muted);
}

.order-item-row__remove:hover {
  color: var(--danger);
}

.order-item-row__inline-input {
  display: flex;
  gap: 8px;
  align-items: center;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
}

.drawer-error--inline {
  margin-top: 4px;
}
</style>
