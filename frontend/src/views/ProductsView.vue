<template>
  <section class="page-section">
    <header class="page-header">
      <div>
        <h1 class="page-title">Справочник продукции</h1>
        <p class="page-subtitle">
          Нормализованный список продукции с категориями. Данные используются в калькуляторе и заказах.
        </p>
      </div>
    </header>

    <div class="card filters-card">
      <div class="filters-row">
        <div class="filters-group">
          <label class="filters-label" for="product-search">Поиск</label>
          <input
            id="product-search"
            v-model="search"
            type="text"
            class="input"
            placeholder="Название или комментарий"
            @keyup.enter="reload"
          />
        </div>

        <div class="filters-group">
          <label class="filters-label" for="category-filter">Категория</label>
          <select
            id="category-filter"
            v-model="categoryId"
            class="input"
            @change="reload"
          >
            <option value="">Все категории</option>
            <option
              v-for="category in categories"
              :key="category.id"
              :value="category.id"
            >
              {{ category.name }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="products.length" class="card table-card">
      <table class="table">
        <thead>
          <tr>
            <th>#</th>
            <th>Наименование</th>
            <th>Категория</th>
            <th>Базовая цена</th>
            <th>Комментарий</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="product in products" :key="product.id">
            <td>{{ product.id }}</td>
            <td>
              <div class="cell-main">
                <span class="cell-title">{{ product.name }}</span>
              </div>
            </td>
            <td>
              <span class="badge badge-soft">
                {{ product.category_name || 'Без категории' }}
              </span>
            </td>
            <td>{{ formatMoney(product.base_price) }}</td>
            <td class="cell-muted">
              {{ product.comment || '—' }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <p v-else class="empty-state">
      Продукция не найдена. Попробуйте изменить фильтры.
    </p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { fetchProducts } from '../api/products';
import { fetchProductCategories } from '../api/productCategories';

const products = ref([]);
const categories = ref([]);

const search = ref('');
const categoryId = ref('');

function formatMoney(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '–';
  return `${num.toLocaleString('ru-RU')} ₽`;
}

async function reload() {
  const params = {};

  if (search.value) {
    params.search = search.value;
  }

  if (categoryId.value) {
    params.category_id = categoryId.value;
  }

  products.value = await fetchProducts(params);
}

async function init() {
  categories.value = await fetchProductCategories();
  await reload();
}

onMounted(init);
</script>

<style scoped>
.page-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0 0 4px;
  font-size: 24px;
  font-weight: 600;
}

.page-subtitle {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}

.card {
  background: rgba(15, 23, 42, 0.6);
  border-radius: 12px;
  padding: 12px 14px;
  border: 1px solid rgba(148, 163, 184, 0.15);
  backdrop-filter: blur(8px);
}

.filters-card {
  font-size: 13px;
}

.filters-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.filters-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filters-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.7;
}

.input {
  min-width: 160px;
  padding: 6px 8px;
  border-radius: 8px;
  border: 1px solid rgba(148, 163, 184, 0.4);
  background-color: rgba(15, 23, 42, 0.7);
  color: inherit;
  font: inherit;
}

.input:focus {
  outline: none;
  border-color: rgba(96, 165, 250, 0.9);
  box-shadow: 0 0 0 1px rgba(37, 99, 235, 0.5);
}

.table-card {
  padding: 0;
  overflow: hidden;
}

.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.table thead {
  background: rgba(15, 23, 42, 0.95);
}

.table th,
.table td {
  padding: 8px 10px;
  border-bottom: 1px solid rgba(15, 23, 42, 0.9);
}

.table th {
  text-align: left;
  font-weight: 500;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.8;
}

.table tbody tr:hover {
  background: rgba(15, 23, 42, 0.7);
}

.cell-main {
  display: flex;
  flex-direction: column;
}

.cell-title {
  font-weight: 500;
}

.cell-muted {
  font-size: 12px;
  opacity: 0.8;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 11px;
}

.badge-soft {
  background: rgba(148, 163, 184, 0.15);
}

.empty-state {
  margin: 0;
  font-size: 13px;
  opacity: 0.8;
}
</style>
