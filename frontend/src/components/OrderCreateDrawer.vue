<template>
  <div class="drawer-backdrop" @click.self="onClose">
    <div class="drawer">
      <header class="drawer-header">
        <div>
          <div class="drawer-title">Новый заказ</div>
          <div class="drawer-subtitle">
            Выберите клиента, заполните дедлайн и добавьте позиции через калькулятор.
          </div>
        </div>
        <button class="drawer-close" type="button" @click="onClose">
          ✕
        </button>
      </header>

      <div class="drawer-body">
        <form class="drawer-form" @submit.prevent="onSave">
          <section class="drawer-section">
            <h3 class="drawer-section-title">Общие данные</h3>
            <div class="drawer-grid">
              <label class="form-field">
                <span>Название заказа *</span>
                <input
                  v-model="order.title"
                  type="text"
                  required
                  placeholder="Например, Визитки для ООО “Ромашка”"
                />
              </label>

              <label class="form-field">
                <span>Клиент</span>
                <input
                  v-model="order.client_name"
                  type="text"
                  placeholder="Имя или организация"
                />
              </label>

              <label class="form-field">
                <span>Телефон</span>
                <input
                  v-model="order.client_phone"
                  type="tel"
                  placeholder="+7…"
                />
              </label>

              <label class="form-field">
                <span>Дедлайн *</span>
                <input
                  v-model="order.deadline_at"
                  type="datetime-local"
                  required
                />
              </label>

              <label class="form-checkbox">
                <input v-model="order.is_hot" type="checkbox" />
                <span>Срочный (“горит”)</span>
              </label>
            </div>
          </section>

          <section class="drawer-section">
            <header class="drawer-section-header">
              <h3 class="drawer-section-title">Продукция</h3>
              <button
                class="secondary-button"
                type="button"
                @click="orders.addItemRow"
              >
                + Позиция
              </button>
            </header>

            <OrderItemsTable />
          </section>

          <section class="drawer-section">
            <h3 class="drawer-section-title">Итоги</h3>
            <div class="totals-grid">
              <div class="totals-row">
                <span>Сумма позиций</span>
                <span class="totals-value">
                  {{ formatMoney(orders.newOrder.sum_total) }}
                </span>
              </div>

              <div class="totals-row totals-row--discount">
                <label class="form-field-inline">
                  <span>Скидка на заказ, %</span>
                  <input
                    v-model.number="orders.newOrder.order_discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    @input="onOrderDiscountPercent"
                  />
                </label>
                <label class="form-field-inline">
                  <span>Скидка суммой</span>
                  <input
                    v-model.number="orders.newOrder.order_discount_value"
                    type="number"
                    min="0"
                    step="1"
                    @input="onOrderDiscountValue"
                  />
                </label>
              </div>

              <div class="totals-row totals-row--accent">
                <span>Итого к оплате</span>
                <span class="totals-value totals-value--accent">
                  {{ formatMoney(orders.newOrder.total_amount) }}
                </span>
              </div>
            </div>
          </section>

          <footer class="drawer-footer">
            <button type="button" class="secondary-button" @click="onClose">
              Отмена
            </button>
            <button
              class="primary-button"
              type="submit"
              :disabled="orders.saving"
            >
              <span v-if="orders.saving">Сохраняем…</span>
              <span v-else>Создать заказ</span>
            </button>
          </footer>

          <p v-if="orders.error" class="page-error">
            {{ orders.error }}
          </p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useOrdersStore } from '../store/orders';
import OrderItemsTable from './OrderItemsTable.vue';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

const orders = useOrdersStore();

const order = computed(() => orders.newOrder);

function onClose() {
  emit('close');
}

function formatMoney(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
  }).format(num);
}

function onOrderDiscountPercent() {
  orders.setOrderDiscountPercent(orders.newOrder.order_discount_percent);
}

function onOrderDiscountValue() {
  orders.setOrderDiscountValue(orders.newOrder.order_discount_value);
}

async function onSave() {
  await orders.createOrder();
}
</script>
