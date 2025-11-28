<template>
  <section>
    <h1>Продукция</h1>
    <p style="opacity: 0.8; font-size: 14px;">
      Справочник продукции из Phase 1 (без сложного ценообразования).
    </p>

    <table v-if="products.length" style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
      <thead>
        <tr>
          <th>#</th>
          <th>Наименование</th>
          <th>Категория</th>
          <th>Базовая цена</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="product in products" :key="product.id">
          <td>{{ product.id }}</td>
          <td>{{ product.name }}</td>
          <td>{{ product.category }}</td>
          <td>{{ Number(product.base_price).toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' }) }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else style="opacity: 0.8;">Пока нет товаров. Они создаются в сид-данных или через API.</p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { fetchProducts } from '../api/products';

const products = ref([]);

async function loadProducts() {
  products.value = await fetchProducts();
}

onMounted(loadProducts);
</script>
