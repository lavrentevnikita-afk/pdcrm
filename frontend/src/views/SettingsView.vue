<template>
  <div class="settings-page">
    <div class="page-title">Настройки</div>
    <div class="page-subtitle">
      Общие настройки системы, локализации и интеграций.
    </div>

    <section class="settings-card">
      <div class="card-header">
        <div>
          <div class="card-title">Очистка базы данных</div>
          <div class="card-subtitle">
            Перед очисткой выгружаем актуальные данные одним кликом — удобно для тестов
            и сброса демо-среды.
          </div>
        </div>
        <button class="btn btn-danger" type="button" @click="exportAndClear">
          Выгрузить и очистить
        </button>
      </div>
      <div class="card-body">
        <p class="hint">Вы получите .json-файл с данными, после чего локальное хранилище будет очищено.</p>
        <p v-if="statusMessage" class="status">{{ statusMessage }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const statusMessage = ref('');

function exportAndClear() {
  const payload = {
    exported_at: new Date().toISOString(),
    storage: { ...localStorage },
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `pdcrm-backup-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);

  localStorage.clear();
  statusMessage.value = 'Данные выгружены и локальное хранилище очищено.';
}
</script>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-card {
  background: var(--card-bg, #0f172a);
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.card-title {
  font-weight: 700;
  font-size: 18px;
}

.card-subtitle {
  color: #9ca3af;
  font-size: 14px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #e5e7eb;
}

.hint {
  color: #9ca3af;
}

.status {
  color: #22c55e;
  font-weight: 600;
}

.btn {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid #1f2937;
  background: #0b1221;
  color: #e5e7eb;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:hover {
  background: #111827;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fecdd3;
}

@media (max-width: 720px) {
  .card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .btn {
    width: 100%;
  }
}
</style>
