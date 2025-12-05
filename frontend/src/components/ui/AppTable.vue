<template>
  <div class="app-table" :class="{ 'app-table--loading': loading }">
    <div class="app-table__header" v-if="title || $slots.actions">
      <div class="app-table__title">{{ title }}</div>
      <div><slot name="actions"></slot></div>
    </div>
    <div class="app-table__scroll">
      <table>
        <thead>
          <tr>
            <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td :colspan="columns.length">
              <div class="app-table__skeleton"></div>
            </td>
          </tr>
          <tr v-else-if="!rows.length">
            <td :colspan="columns.length" class="app-table__empty">Нет данных</td>
          </tr>
          <tr v-else v-for="row in rows" :key="row.id || row.key">
            <td v-for="col in columns" :key="col.key">
              <slot :name="`col-${col.key}`" :row="row">
                {{ row[col.key] }}
              </slot>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  columns: {
    type: Array,
    default: () => [],
  },
  rows: {
    type: Array,
    default: () => [],
  },
  title: String,
  loading: Boolean,
});
</script>

<style scoped>
.app-table {
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-lg);
  background: var(--bg-elevated);
  overflow: hidden;
}

.app-table__header {
  padding: 12px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-subtle);
}

.app-table__title {
  font-weight: 700;
}

.app-table__scroll {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 10px 14px;
  text-align: left;
  font-size: 14px;
  border-bottom: 1px solid var(--border-subtle);
}

th {
  color: var(--text-muted);
  font-weight: 600;
  background: var(--bg-subtle);
}

.app-table__empty {
  text-align: center;
  color: var(--text-muted);
}

.app-table__skeleton {
  width: 100%;
  height: 12px;
  background: linear-gradient(90deg, rgba(148, 163, 184, 0.2), rgba(148, 163, 184, 0.35), rgba(148, 163, 184, 0.2));
  animation: shimmer 1.6s infinite;
}

@keyframes shimmer {
  0% {
    background-position: -200px 0;
  }
  100% {
    background-position: 200px 0;
  }
}
</style>
