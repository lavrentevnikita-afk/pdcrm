<template>
  <section>
    <h1>Клиенты</h1>
    <p style="opacity: 0.8; font-size: 14px;">
      Базовый список клиентов. В Phase 1 реализовано чтение из базы; расширенная работа с карточками клиента будет позже.
    </p>

    <table v-if="clients.length" style="width: 100%; border-collapse: collapse; font-size: 14px; margin-top: 12px;">
      <thead>
        <tr>
          <th>#</th>
          <th>Имя</th>
          <th>Телефон</th>
          <th>Email</th>
          <th>Организация</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="client in clients" :key="client.id">
          <td>{{ client.id }}</td>
          <td>{{ client.full_name }}</td>
          <td>{{ client.phone }}</td>
          <td>{{ client.email || '—' }}</td>
          <td>{{ client.organization_name || '—' }}</td>
        </tr>
      </tbody>
    </table>

    <p v-else style="opacity: 0.8;">Пока нет клиентов. Они создаются в сид-данных или через API.</p>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { fetchClients } from '../api/clients';

const clients = ref([]);

async function loadClients() {
  clients.value = await fetchClients();
}

onMounted(loadClients);
</script>
