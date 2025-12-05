<template>
  <div class="permissions-page">
    <div class="page-title">Разрешения</div>
    <div class="page-subtitle">
      Роли, права доступа и политика безопасности.
    </div>

    <div class="card">
      <div class="card-header">
        <div class="card-title">Матрица прав</div>
        <div class="card-subtitle">Переключите модули, доступные пользователю</div>
      </div>

      <div class="table">
        <div class="table-head">
          <div>Пользователь</div>
          <div>Роль</div>
          <div>Заказы</div>
          <div>Производство</div>
          <div>Касса</div>
          <div>Аналитика</div>
          <div>Склад</div>
        </div>
        <div v-for="user in users" :key="user.id" class="table-row">
          <div class="name">{{ user.name }}</div>
          <div class="muted">{{ user.role }}</div>
          <div v-for="key in permissionKeys" :key="key" class="cell-center">
            <input type="checkbox" :checked="user.permissions[key]" @change="toggle(user, key)" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import axios from 'axios';

const users = ref([]);
const permissionKeys = ['orders', 'production', 'cashbox', 'analytics', 'warehouse'];

async function loadPermissions() {
  const { data } = await axios.get('/api/permissions/users');
  users.value = data.users;
}

async function toggle(user, key) {
  const updated = { ...user.permissions, [key]: !user.permissions[key] };
  await axios.post(`/api/permissions/${user.id}`, { permissions: updated });
  user.permissions = updated;
}

onMounted(loadPermissions);
</script>

<style scoped>
.card {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
}

.card-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 10px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
}

.card-subtitle {
  color: #9ca3af;
  font-size: 13px;
}

.table {
  border: 1px solid #1f2937;
  border-radius: 10px;
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr repeat(5, 0.6fr);
  gap: 8px;
  padding: 10px 12px;
  align-items: center;
}

.table-head {
  background: #111827;
  color: #9ca3af;
  font-size: 13px;
}

.table-row:nth-child(odd) {
  background: #0b1221;
}

.table-row:nth-child(even) {
  background: #0d1528;
}

.name {
  font-weight: 600;
}

.muted {
  color: #9ca3af;
}

.cell-center {
  display: flex;
  justify-content: center;
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
}
</style>
