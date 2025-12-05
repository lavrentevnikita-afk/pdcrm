<template>
  <div class="staff-page">
    <div class="page-title">Персонал</div>
    <div class="page-subtitle">
      Учет сотрудников, ролей и загрузки по заказам.
    </div>

    <div class="stats">
      <div class="stat-card">
        <div class="stat-label">Всего сотрудников</div>
        <div class="stat-value">{{ staff.length }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Дизайн / Цех / Менеджмент</div>
        <div class="stat-value">{{ counts.design }} / {{ counts.production }} / {{ counts.management }}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Средняя загрузка</div>
        <div class="stat-value">{{ avgWorkload }} задач</div>
      </div>
    </div>

    <div class="card">
      <div class="card-header">
        <div>
          <div class="card-title">Команда</div>
          <div class="card-subtitle">Роль, отдел и контакт</div>
        </div>
      </div>

      <div class="table">
        <div class="table-head">
          <div>Сотрудник</div>
          <div>Роль</div>
          <div>Отдел</div>
          <div>Телефон</div>
          <div>Почта</div>
          <div>Загрузка</div>
        </div>
        <div v-for="member in staff" :key="member.id" class="table-row">
          <div class="name">{{ member.name }}</div>
          <div>{{ member.role }}</div>
          <div>{{ member.department }}</div>
          <div>{{ member.phone }}</div>
          <div>{{ member.email }}</div>
          <div>
            <div class="workload-bar">
              <div class="workload-fill" :style="{ width: member.workload * 10 + '%' }"></div>
            </div>
            <span class="workload-label">{{ member.workload }} / 10</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import axios from 'axios';

const staff = ref([]);

const counts = computed(() => {
  return staff.value.reduce(
    (acc, member) => {
      if (member.department === 'Дизайн') acc.design += 1;
      if (member.department === 'Цех') acc.production += 1;
      if (member.department === 'Отдел продаж') acc.management += 1;
      return acc;
    },
    { design: 0, production: 0, management: 0 }
  );
});

const avgWorkload = computed(() => {
  if (!staff.value.length) return 0;
  const sum = staff.value.reduce((acc, m) => acc + (m.workload || 0), 0);
  return Math.round((sum / staff.value.length) * 10) / 10;
});

async function loadStaff() {
  const { data } = await axios.get('/api/staff');
  staff.value = data.staff;
}

onMounted(loadStaff);
</script>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.stat-card {
  background: #0f172a;
  border: 1px solid #1f2937;
  padding: 12px;
  border-radius: 12px;
}

.stat-label {
  color: #9ca3af;
  font-size: 13px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
}

.card {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-title {
  font-weight: 700;
  font-size: 18px;
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
  grid-template-columns: 1.2fr 0.9fr 0.9fr 1fr 1.2fr 1fr;
  gap: 8px;
  padding: 10px 12px;
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

.workload-bar {
  background: #0b1221;
  border: 1px solid #1f2937;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
}

.workload-fill {
  background: linear-gradient(135deg, #10b981, #22d3ee);
  height: 100%;
}

.workload-label {
  font-size: 12px;
  color: #9ca3af;
}
</style>
