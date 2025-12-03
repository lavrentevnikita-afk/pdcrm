<template>
  <div class="page">
    <div class="page-header">
      <div>
        <div class="page-title">Справочники</div>
        <div class="page-subtitle">
          Каталог продукции, клиентов, материалов и других сущностей.
        </div>
      </div>
    </div>

    <div class="directories-layout">
      <aside class="directories-sidebar">
        <div class="directories-sidebar-title">Категории продукции</div>

        <button
          class="directories-category"
          :class="{ 'is-active': !selectedCategoryId }"
          type="button"
          @click="selectCategory(null)"
        >
          Все категории
        </button>

        <button
          v-for="cat in products.categories"
          :key="cat.id"
          class="directories-category"
          :class="{ 'is-active': selectedCategoryId === cat.id }"
          type="button"
          @click="selectCategory(cat.id)"
        >
          {{ cat.name }}
        </button>

        <div v-if="!products.categories.length && !products.loading" class="directories-empty">
          Категории ещё не заведены.
        </div>
      </aside>

      <main class="directories-main">
        <div class="directories-toolbar">
          <div class="directories-toolbar-left">
            <div class="directories-toolbar-title">Каталог продукции</div>
            <div class="directories-toolbar-subtitle">
              {{ filteredInfoText }}
            </div>
          </div>

          <div class="directories-toolbar-right">
            <input
              v-model="search"
              type="text"
              class="directories-search"
              placeholder="Поиск по названию или описанию…"
            />
          </div>
        </div>

        <div v-if="products.loading" class="directories-state">
          Загрузка справочника…
        </div>

        <div v-else-if="products.error" class="directories-state directories-state-error">
          {{ products.error }}
        </div>

        <div v-else-if="!products.products.length" class="directories-state">
          Нет продукции для выбранного фильтра.
        </div>

        <div v-else class="directories-table-wrapper">
          <table class="directories-table">
            <thead>
              <tr>
                <th>Наименование</th>
                <th>Категория</th>
                <th>Базовая цена</th>
                <th>Ед.</th>
                <th>Комментарий</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in products.products" :key="item.id">
                <td class="directories-cell-name">
                  <div class="directories-product-name">{{ item.name }}</div>
                  <div v-if="item.comment" class="directories-product-comment">
                    {{ item.comment }}
                  </div>
                </td>
                <td>{{ item.category_name }}</td>
                <td>{{ formatMoney(item.base_price) }}</td>
                <td>{{ item.unit }}</td>
                <td class="directories-cell-comment">
                  <span v-if="!item.comment">—</span>
                  <span v-else>{{ item.comment }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useProductsStore } from '../store/products';

const products = useProductsStore();

const selectedCategoryId = ref(null);
const search = ref('');

const filteredInfoText = computed(() => {
  if (!products.products.length) {
    return 'Пока нет заведённой продукции.';
  }
  if (!selectedCategoryId.value && !search.value) {
    return `Всего позиций: ${products.products.length}`;
  }
  return `Показано позиций: ${products.products.length}`;
});

function selectCategory(id) {
  selectedCategoryId.value = id;
}

function formatMoney(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 2,
  }).format(num);
}

async function loadProducts() {
  const params = {};
  if (selectedCategoryId.value) {
    params.category_id = selectedCategoryId.value;
  }
  if (search.value && search.value.trim()) {
    params.search = search.value.trim();
  }
  await products.fetchProducts(params);
}

onMounted(async () => {
  await products.fetchCategories();
  await loadProducts();
});

watch([selectedCategoryId, search], () => {
  // Небольшая задержка для удобства: запрос по мере изменения фильтров
  loadProducts();
});
</script>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.directories-layout {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.directories-sidebar {
  border-radius: 16px;
  background: rgba(10, 18, 40, 0.9);
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.directories-sidebar-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted);
  margin-bottom: 8px;
}

.directories-category {
  width: 100%;
  text-align: left;
  border: none;
  background: transparent;
  border-radius: 8px;
  padding: 6px 10px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.directories-category:hover {
  background: rgba(255, 255, 255, 0.04);
}

.directories-category.is-active {
  background: rgba(86, 139, 255, 0.18);
  color: #f7f9ff;
}

.directories-empty {
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.directories-main {
  border-radius: 16px;
  background: rgba(10, 18, 40, 0.92);
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  min-height: 260px;
}

.directories-toolbar {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.directories-toolbar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.directories-toolbar-subtitle {
  margin-top: 4px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.directories-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.directories-search {
  min-width: 260px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  background: rgba(8, 14, 32, 0.9);
  padding: 6px 12px;
  font-size: 13px;
  color: var(--color-text);
}

.directories-search::placeholder {
  color: var(--color-text-muted);
}

.directories-search:focus {
  outline: none;
  border-color: rgba(86, 139, 255, 0.8);
}

.directories-state {
  margin-top: 16px;
  font-size: 13px;
  color: var(--color-text-muted);
}

.directories-state-error {
  color: var(--color-error);
}

.directories-table-wrapper {
  margin-top: 8px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.directories-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.directories-table thead {
  background: rgba(16, 28, 64, 0.96);
}

.directories-table th,
.directories-table td {
  padding: 8px 10px;
  text-align: left;
}

.directories-table th {
  font-weight: 500;
  color: var(--color-text-muted);
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
}

.directories-table tbody tr:nth-child(even) {
  background: rgba(12, 22, 48, 0.95);
}

.directories-table tbody tr:nth-child(odd) {
  background: rgba(8, 16, 40, 0.95);
}

.directories-cell-name {
  max-width: 280px;
}

.directories-product-name {
  font-weight: 500;
}

.directories-product-comment {
  margin-top: 2px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.directories-cell-comment {
  max-width: 260px;
}

@media (max-width: 1024px) {
  .directories-layout {
    grid-template-columns: 1fr;
  }

  .directories-sidebar {
    order: 2;
  }

  .directories-main {
    order: 1;
  }
}
</style>
