<template>
  <div class="order-item-row">
    <div class="order-item-cell">
      <select v-model.number="local.product_id" @change="onProductChange">
        <option :value="null">Выберите продукт…</option>
        <option
          v-for="p in products.products"
          :key="p.id"
          :value="p.id"
        >
          {{ p.name }}
        </option>
      </select>
    </div>

    <div class="order-item-cell">
      <input
        v-model.number="local.quantity"
        type="number"
        min="1"
        step="1"
        @input="emitChange"
      />
    </div>

    <div class="order-item-cell">
      <input
        v-model.number="local.unit_price"
        type="number"
        min="0"
        step="0.01"
        @input="emitChange"
      />
    </div>

    <div class="order-item-cell">
      <input
        v-model.number="local.discount_percent"
        type="number"
        min="0"
        max="100"
        step="0.1"
        @input="emitChange"
      />
    </div>

    <div class="order-item-cell">
      <input
        v-model.number="local.discount_value"
        type="number"
        min="0"
        step="1"
        @input="emitChange"
      />
    </div>

    <div class="order-item-cell order-item-cell--sum">
      {{ formatMoney(local.total_price) }}
    </div>

    <div class="order-item-cell order-item-cell--actions">
      <button
        type="button"
        class="icon-button"
        title="Удалить позицию"
        @click="onRemove"
      >
        ✕
      </button>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch, onMounted } from 'vue';
import { useProductsStore } from '../store/products';

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update', 'remove']);

const products = useProductsStore();

const local = reactive({
  id: props.item.id,
  product_id: props.item.product_id,
  quantity: props.item.quantity,
  unit_price: props.item.unit_price,
  discount_percent: props.item.discount_percent,
  discount_value: props.item.discount_value,
  total_price: props.item.total_price,
});

onMounted(async () => {
  if (!products.products.length) {
    await products.fetchProducts();
  }
});

watch(
  () => ({ ...local }),
  (val) => {
    emitChange();
  },
  { deep: true },
);

function emitChange() {
  emit('update', {
    id: local.id,
    patch: {
      product_id: local.product_id,
      quantity: local.quantity,
      unit_price: local.unit_price,
      discount_percent: local.discount_percent,
      discount_value: local.discount_value,
    },
  });
}

function onRemove() {
  emit('remove', local.id);
}

function onProductChange() {
  emitChange();
}

function formatMoney(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(num);
}
</script>
