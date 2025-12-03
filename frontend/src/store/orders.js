import { defineStore } from 'pinia';
import api from '../utils/apiClient';
import { useProductsStore } from './products';

function emptyOrder() {
  return {
    title: '',
    client_name: '',
    client_phone: '',
    deadline_at: '',
    is_hot: false,
    items: [],
    order_discount_percent: 0,
    order_discount_value: 0,
    sum_total: 0,
    total_amount: 0,
  };
}

function emptyItem() {
  return {
    id: Math.random().toString(36).slice(2),
    product_id: null,
    product_name: '',
    unit: 'шт.',
    quantity: 1,
    base_price: 0,
    unit_price: 0,
    discount_percent: 0,
    discount_value: 0,
    total_price: 0,
    comment: '',
  };
}

export const useOrdersStore = defineStore('orders', {
  state: () => ({
    items: [],
    loading: false,
    error: null,

    isCreateDrawerOpen: false,
    newOrder: emptyOrder(),
    saving: false,
  }),

  getters: {
    totalSum(state) {
      return state.newOrder.items.reduce(
        (acc, item) => acc + Number(item.total_price || 0),
        0,
      );
    },
    finalAmount(state) {
      const base = state.newOrder.sum_total;
      return base - Number(state.newOrder.order_discount_value || 0);
    },
  },

  actions: {
    async fetchList() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await api.get('/orders');
        this.items = data.items || [];
      } catch (err) {
        this.error =
          err.response?.data?.message || 'Не удалось загрузить заказы.';
      } finally {
        this.loading = false;
      }
    },

    openCreateDrawer() {
      this.isCreateDrawerOpen = true;
      this.newOrder = emptyOrder();
      this.newOrder.items = [emptyItem()];
    },

    closeCreateDrawer() {
      this.isCreateDrawerOpen = false;
    },

    addItemRow() {
      this.newOrder.items.push(emptyItem());
    },

    removeItemRow(id) {
      this.newOrder.items = this.newOrder.items.filter((i) => i.id !== id);
      this.recalculateTotals();
    },

    updateItem(id, patch) {
      const item = this.newOrder.items.find((i) => i.id === id);
      if (!item) return;
      Object.assign(item, patch);
      this.recalculateItem(item);
      this.recalculateTotals();
    },

    recalculateItem(item) {
      const productsStore = useProductsStore();
      const product =
        productsStore.productsById.get(item.product_id) || null;

      if (product) {
        item.product_name = product.name;
        item.unit = product.unit || 'шт.';
        item.base_price = Number(product.base_price || 0);
      }

      const quantity = Number(item.quantity) || 0;
      const basePrice = Number(item.base_price) || 0;
      const discountPercent = Number(item.discount_percent) || 0;
      const discountValue = Number(item.discount_value) || 0;

      let unitPrice = basePrice;

      if (discountPercent > 0) {
        unitPrice = basePrice * (1 - discountPercent / 100);
      }

      item.unit_price = unitPrice;
      const totalWithoutManual = unitPrice * quantity;
      const total = totalWithoutManual - discountValue;

      item.total_price = total > 0 ? total : 0;
    },

    recalculateTotals() {
      const sum = this.newOrder.items.reduce(
        (acc, item) => acc + Number(item.total_price || 0),
        0,
      );
      this.newOrder.sum_total = sum;
      this.newOrder.total_amount =
        sum - Number(this.newOrder.order_discount_value || 0);
    },

    setOrderDiscountPercent(value) {
      this.newOrder.order_discount_percent = Number(value) || 0;
      const sum = this.newOrder.sum_total;
      const discount = (sum * this.newOrder.order_discount_percent) / 100;
      this.newOrder.order_discount_value = discount;
      this.newOrder.total_amount = sum - discount;
    },

    setOrderDiscountValue(value) {
      this.newOrder.order_discount_value = Number(value) || 0;
      const sum = this.newOrder.sum_total;
      if (sum > 0) {
        this.newOrder.order_discount_percent =
          (this.newOrder.order_discount_value / sum) * 100;
      }
      this.newOrder.total_amount = sum - this.newOrder.order_discount_value;
    },

    async createOrder() {
      this.saving = true;
      this.error = null;
      try {
        const payload = {
          title: this.newOrder.title,
          client_name: this.newOrder.client_name,
          client_phone: this.newOrder.client_phone,
          deadline_at: this.newOrder.deadline_at,
          status: 'new',
          is_hot: this.newOrder.is_hot,
          sum_total: this.newOrder.sum_total,
          total_amount: this.newOrder.total_amount,
          items: this.newOrder.items.map((i) => ({
            product_id: i.product_id,
            product_name: i.product_name,
            quantity: i.quantity,
            unit: i.unit,
            base_price: i.base_price,
            unit_price: i.unit_price,
            discount_percent: i.discount_percent,
            discount_value: i.discount_value,
            total_price: i.total_price,
            comment: i.comment,
          })),
          order_discount_percent: this.newOrder.order_discount_percent,
          order_discount_value: this.newOrder.order_discount_value,
        };

        const { data } = await api.post('/orders', payload);
        // вставляем новый заказ в начало списка
        this.items = [data, ...this.items];
        this.isCreateDrawerOpen = false;
      } catch (err) {
        this.error =
          err.response?.data?.message ||
          'Не удалось сохранить заказ. Проверьте данные.';
        throw err;
      } finally {
        this.saving = false;
      }
    },
  },
});
