<template>
  <div class="order-items-table">
    <div class="order-items-header">
      <div>Продукция</div>
      <div>Тираж</div>
      <div>Цена за ед.</div>
      <div>Скидка, %</div>
      <div>Скидка, ₽</div>
      <div>Сумма</div>
      <div />
    </div>
    <OrderItemRow
      v-for="item in orders.newOrder.items"
      :key="item.id"
      :item="item"
      @update="onUpdate"
      @remove="onRemove"
    />
  </div>
</template>

<script setup>
import { useOrdersStore } from '../store/orders';
import OrderItemRow from './OrderItemRow.vue';

const orders = useOrdersStore();

function onUpdate(payload) {
  orders.updateItem(payload.id, payload.patch);
}

function onRemove(id) {
  orders.removeItemRow(id);
}
</script>
