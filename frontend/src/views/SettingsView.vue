<template>
  <div class="settings-page">
    <div class="page-title">Настройки</div>
    <div class="page-subtitle">
      Общие настройки системы, локализации и интеграций.
    </div>

    <div class="card">
      <div>
        <div class="card-title">Очистка базы</div>
        <div class="card-subtitle">
          Перед очисткой создаётся резервная копия текущих данных в формате JSON.
        </div>
      </div>
      <div class="card-actions">
        <button class="btn btn-primary" type="button" :disabled="loading" @click="handleReset">
          <span v-if="loading">Выгрузка…</span>
          <span v-else>Выгрузить и очистить</span>
        </button>
      </div>
    </div>

    <div v-if="message" class="alert">{{ message }}</div>
    <div v-if="error" class="alert alert-error">{{ error }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const loading = ref(false);
const message = ref('');
const error = ref('');

function downloadBackup(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pdcrm-backup-${new Date().toISOString()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

async function handleReset() {
  loading.value = true;
  message.value = '';
  error.value = '';
  try {
    const { data } = await axios.post('/api/admin/export-and-reset');
    downloadBackup(data.backup || {});
    message.value = `Создана резервная копия, очищены таблицы: ${
      (data.cleared_tables || []).join(', ') || 'нет данных'
    }`;
  } catch (e) {
    error.value = e.response?.data?.message || 'Не удалось очистить базу';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--card-bg, #0f172a);
}

.card-title {
  font-size: 16px;
  font-weight: 700;
}

.card-subtitle {
  color: #9ca3af;
  font-size: 13px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid #374151;
  background: #111827;
  color: #e5e7eb;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  border-color: #2563eb;
}

.alert {
  padding: 12px;
  border-radius: 8px;
  background: #0f172a;
  border: 1px solid #1f2937;
  color: #e5e7eb;
}

.alert-error {
  border-color: #ef4444;
  color: #fecdd3;
}
</style>
