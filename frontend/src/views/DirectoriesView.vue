<template>
  <div class="directories-page">
    <div class="page-title">Справочники</div>
    <div class="page-subtitle">
      Управление базами данных через удобные модальные окна с поиском, фильтрацией
      и быстрым редактированием.
    </div>

    <div class="directories-grid">
      <section
        v-for="db in databases"
        :key="db.key"
        class="directory-card"
      >
        <div>
          <div class="card-title">{{ db.title }}</div>
          <div class="card-subtitle">{{ db.description }}</div>
        </div>
        <div class="card-meta">
          <div class="meta-count">
            <span class="count-number">{{ records[db.key].length }}</span>
            <span class="count-label">записей</span>
          </div>
          <div class="meta-tags">
            <span v-for="tag in db.tags" :key="tag" class="badge">{{ tag }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn" type="button" @click="openDatabase(db.key)">
            Управлять
          </button>
          <button class="btn btn-primary" type="button" @click="startCreate(db.key)">
            Добавить
          </button>
        </div>
      </section>
    </div>

    <div v-if="activeDatabase" class="modal-backdrop" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ currentConfig.title }}</div>
            <div class="modal-subtitle">{{ currentConfig.description }}</div>
          </div>
          <button class="btn" type="button" @click="closeModal">Закрыть</button>
        </div>

        <div class="modal-toolbar">
          <label class="search-field">
            <span class="input-label">Поиск</span>
            <input
              v-model="filters[activeDatabase].search"
              type="text"
              placeholder="Введите название или комментарий"
            />
          </label>
          <label v-if="currentConfig.filterKey" class="filter-field">
            <span class="input-label">{{ currentConfig.filterLabel }}</span>
            <select v-model="filters[activeDatabase].filter">
              <option value="">Все</option>
              <option
                v-for="option in availableFilters"
                :key="option"
                :value="option"
              >
                {{ option }}
              </option>
            </select>
          </label>
          <button class="btn btn-primary" type="button" @click="startCreate(activeDatabase)">
            Новая запись
          </button>
        </div>

        <div class="table">
          <div class="table-head">
            <div v-for="column in currentConfig.columns" :key="column.key">
              {{ column.label }}
            </div>
            <div class="actions-col">Действия</div>
          </div>
          <div
            v-for="item in filteredRecords"
            :key="item.id"
            class="table-row"
          >
            <div v-for="column in currentConfig.columns" :key="column.key">
              {{ item[column.key] || '—' }}
            </div>
            <div class="actions-col actions-col-body">
              <button class="btn" type="button" @click="startEdit(item)">Редактировать</button>
              <button class="btn btn-danger" type="button" @click="deleteRecord(item.id)">
                Удалить
              </button>
            </div>
          </div>
          <div v-if="filteredRecords.length === 0" class="empty-state">
            Нет записей по выбранным условиям
          </div>
        </div>

        <form class="form-grid" @submit.prevent="saveRecord">
          <div class="form-grid-title">
            {{ editingId ? 'Редактирование записи' : 'Создание записи' }}
          </div>
          <label
            v-for="field in currentConfig.fields"
            :key="field.key"
            :class="{ 'span-2': field.fullWidth }"
          >
            {{ field.label }}
            <input
              v-if="field.type === 'text'"
              v-model="form[field.key]"
              :type="field.inputType || 'text'"
              :placeholder="field.placeholder"
              :required="field.required"
            />
            <select
              v-else-if="field.type === 'select'"
              v-model="form[field.key]"
              :required="field.required"
            >
              <option value="" disabled>Выберите</option>
              <option v-for="option in field.options" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </label>

          <div class="modal-actions span-2">
            <button class="btn" type="button" @click="resetForm">Очистить</button>
            <button class="btn btn-primary" type="submit">
              {{ editingId ? 'Сохранить изменения' : 'Добавить запись' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref } from 'vue';

const databases = [
  {
    key: 'products',
    title: 'Продукция',
    description: 'Каталог продукции разбит по категориям и типам работ.',
    tags: ['Категории', 'SKU', 'Тиражи'],
  },
  {
    key: 'clients',
    title: 'Клиенты',
    description: 'Сегменты клиентов, контактные данные и примечания.',
    tags: ['B2B', 'B2C'],
  },
  {
    key: 'materials',
    title: 'Материалы',
    description: 'Бумага, расходники и материалы для типографии.',
    tags: ['Склад', 'Закупки'],
  },
  {
    key: 'suppliers',
    title: 'Поставщики',
    description: 'Базы поставщиков с контактами и статусами.',
    tags: ['Контракты', 'Согласования'],
  },
];

const records = reactive({
  products: [
    { id: 1, name: 'Визитки стандарт', category: 'Печать', sku: 'PR-001', note: 'Бумага 350 г/м²' },
    { id: 2, name: 'Каталог А4', category: 'Печать', sku: 'PR-024', note: 'Скрепка, 32 страницы' },
    { id: 3, name: 'Бренд-пакеты', category: 'Сувениры', sku: 'PR-065', note: 'Крафт, полноцвет' },
    { id: 4, name: 'Роллап 85×200', category: 'Выставка', sku: 'PR-112', note: 'Серебро, сумка в комплекте' },
  ],
  clients: [
    { id: 5, name: 'ООО «Север»', segment: 'B2B', contact: 'sales@sever.ru', note: 'Регулярные тиражи буклетов' },
    { id: 6, name: 'ИП Иванова', segment: 'B2C', contact: 'ivanova@example.com', note: 'Рекламные листовки' },
    { id: 7, name: 'Digital Fox', segment: 'B2B', contact: 'hi@dfox.ru', note: 'Корпоративный мерч' },
  ],
  materials: [
    { id: 8, name: 'Мелованная бумага 170 г/м²', type: 'Бумага', unit: 'лист', note: 'Белая, глянец' },
    { id: 9, name: 'Баннер 440 г/м²', type: 'Баннер', unit: 'м²', note: 'Литой, широкоформат' },
    { id: 10, name: 'Ламинат 75 мкм', type: 'Пленка', unit: 'рулон', note: 'Матовый' },
  ],
  suppliers: [
    { id: 11, name: 'Поставка Плюс', status: 'Активный', contact: 'supply@plus.ru', note: 'Основной по бумаге' },
    { id: 12, name: 'Графика', status: 'На проверке', contact: 'hello@grafica.ru', note: 'Сувенирка' },
  ],
});

const databaseConfigs = {
  products: {
    title: 'Каталог продукции',
    description: 'Добавляйте новые позиции, редактируйте SKU и категории.',
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'category', label: 'Категория' },
      { key: 'sku', label: 'SKU' },
      { key: 'note', label: 'Комментарий' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', placeholder: 'Например, «Каталог А4»', required: true },
      { key: 'category', label: 'Категория', type: 'select', options: ['Печать', 'Выставка', 'Сувениры', 'Другое'], required: true },
      { key: 'sku', label: 'SKU', type: 'text', placeholder: 'PR-001', required: true },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'Материал, тираж или особенности', fullWidth: true },
    ],
    filterKey: 'category',
    filterLabel: 'Категория',
    searchable: ['name', 'note', 'sku'],
  },
  clients: {
    title: 'База клиентов',
    description: 'Сегменты клиентов, контакты и примечания.',
    columns: [
      { key: 'name', label: 'Клиент' },
      { key: 'segment', label: 'Сегмент' },
      { key: 'contact', label: 'Контакты' },
      { key: 'note', label: 'Комментарий' },
    ],
    fields: [
      { key: 'name', label: 'Название клиента', type: 'text', required: true },
      { key: 'segment', label: 'Сегмент', type: 'select', options: ['B2B', 'B2C', 'Госзаказ'], required: true },
      { key: 'contact', label: 'Контакты', type: 'text', placeholder: 'email или телефон' },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'Ответственные, договор, скидка', fullWidth: true },
    ],
    filterKey: 'segment',
    filterLabel: 'Сегмент',
    searchable: ['name', 'contact', 'note'],
  },
  materials: {
    title: 'Материалы и расходники',
    description: 'Управляйте типами материалов, единицами и статусом использования.',
    columns: [
      { key: 'name', label: 'Материал' },
      { key: 'type', label: 'Тип' },
      { key: 'unit', label: 'Ед.' },
      { key: 'note', label: 'Комментарий' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      { key: 'type', label: 'Тип', type: 'select', options: ['Бумага', 'Пленка', 'Баннер', 'Краска', 'Другое'], required: true },
      { key: 'unit', label: 'Единица измерения', type: 'text', placeholder: 'лист, м², рулон' },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'Формат, плотность, цвет', fullWidth: true },
    ],
    filterKey: 'type',
    filterLabel: 'Тип материала',
    searchable: ['name', 'note', 'type'],
  },
  suppliers: {
    title: 'Поставщики',
    description: 'Список поставщиков, статусы сотрудничества и контакты.',
    columns: [
      { key: 'name', label: 'Поставщик' },
      { key: 'status', label: 'Статус' },
      { key: 'contact', label: 'Контакты' },
      { key: 'note', label: 'Комментарий' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      { key: 'status', label: 'Статус', type: 'select', options: ['Активный', 'На проверке', 'Остановлен'], required: true },
      { key: 'contact', label: 'Контакты', type: 'text', placeholder: 'E-mail, телефон или менеджер' },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'Условия оплаты, контактное лицо', fullWidth: true },
    ],
    filterKey: 'status',
    filterLabel: 'Статус',
    searchable: ['name', 'note', 'contact'],
  },
};

const activeDatabase = ref('');
const editingId = ref(null);
const form = ref({});

const filters = reactive(
  Object.keys(databaseConfigs).reduce((acc, key) => {
    acc[key] = { search: '', filter: '' };
    return acc;
  }, {})
);

const currentConfig = computed(() => databaseConfigs[activeDatabase.value] || {});
const availableFilters = computed(() => {
  if (!activeDatabase.value) return [];
  const filterKey = currentConfig.value.filterKey;
  if (!filterKey) return [];
  const options = new Set(records[activeDatabase.value].map((item) => item[filterKey]).filter(Boolean));
  return Array.from(options);
});

const filteredRecords = computed(() => {
  if (!activeDatabase.value) return [];
  const { search, filter } = filters[activeDatabase.value];
  const config = currentConfig.value;
  return records[activeDatabase.value]
    .filter((item) => {
      if (filter && config.filterKey) {
        return (item[config.filterKey] || '').toLowerCase() === filter.toLowerCase();
      }
      return true;
    })
    .filter((item) => {
      if (!search) return true;
      const query = search.toLowerCase();
      return config.searchable.some((key) => String(item[key] || '').toLowerCase().includes(query));
    });
});

function openDatabase(key) {
  activeDatabase.value = key;
  resetForm();
  filters[key].search = '';
  filters[key].filter = '';
}

function closeModal() {
  activeDatabase.value = '';
  editingId.value = null;
}

function startCreate(key) {
  if (key) {
    activeDatabase.value = key;
  }
  editingId.value = null;
  const fields = databaseConfigs[activeDatabase.value].fields;
  form.value = fields.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {});
}

function startEdit(item) {
  editingId.value = item.id;
  form.value = { ...item };
}

function resetForm() {
  if (!activeDatabase.value) return;
  const fields = databaseConfigs[activeDatabase.value].fields;
  form.value = fields.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {});
  editingId.value = null;
}

function deleteRecord(id) {
  if (!activeDatabase.value) return;
  records[activeDatabase.value] = records[activeDatabase.value].filter((item) => item.id !== id);
}

function saveRecord() {
  if (!activeDatabase.value) return;
  if (editingId.value) {
    records[activeDatabase.value] = records[activeDatabase.value].map((item) =>
      item.id === editingId.value ? { ...item, ...form.value } : item
    );
  } else {
    const maxId = Math.max(0, ...Object.values(records).flat().map((item) => item.id));
    records[activeDatabase.value].push({
      id: maxId + 1,
      ...form.value,
    });
  }
  resetForm();
}
</script>

<style scoped>
.directories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.directory-card {
  background: var(--card-bg, #0f172a);
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.card-title {
  font-weight: 700;
  font-size: 18px;
}

.card-subtitle {
  color: #9ca3af;
  font-size: 13px;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-count {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.count-number {
  font-size: 24px;
  font-weight: 800;
}

.count-label {
  color: #9ca3af;
  font-size: 12px;
}

.meta-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 999px;
  background: #1f2937;
  color: #e5e7eb;
  font-size: 12px;
  border: 1px solid #273449;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
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

.btn-primary {
  background: linear-gradient(135deg, #2563eb, #7c3aed);
  border: none;
}

.btn-danger {
  background: rgba(239, 68, 68, 0.14);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fecdd3;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 32px 16px;
  overflow: auto;
  z-index: 30;
}

.modal {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 16px;
  padding: 20px;
  width: min(1200px, 100%);
  display: flex;
  flex-direction: column;
  gap: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.modal-title {
  font-size: 20px;
  font-weight: 800;
}

.modal-subtitle {
  color: #9ca3af;
  font-size: 13px;
}

.modal-toolbar {
  display: grid;
  grid-template-columns: 1fr 240px 140px;
  gap: 12px;
  align-items: end;
}

.search-field,
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  color: #e5e7eb;
  font-size: 14px;
}

.input-label {
  font-size: 13px;
  color: #9ca3af;
}

input,
select {
  background: #0b1221;
  border: 1px solid #1f2937;
  color: #e5e7eb;
  border-radius: 10px;
  padding: 10px 12px;
}

.table {
  border: 1px solid #1f2937;
  border-radius: 12px;
  overflow: hidden;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)) 150px;
  gap: 10px;
  padding: 12px;
}

.table-head {
  background: #111827;
  color: #9ca3af;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.table-row:nth-child(odd) {
  background: #0b1221;
}

.table-row:nth-child(even) {
  background: #0d1528;
}

.actions-col {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.actions-col-body {
  align-items: center;
}

.empty-state {
  padding: 14px 16px;
  text-align: center;
  color: #9ca3af;
  border-top: 1px solid #1f2937;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #1f2937;
}

.form-grid-title {
  grid-column: 1 / -1;
  font-weight: 700;
  font-size: 16px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #e5e7eb;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.span-2 {
  grid-column: span 2;
}

@media (max-width: 900px) {
  .modal-toolbar {
    grid-template-columns: 1fr;
  }

  .table-head,
  .table-row {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  }

  .actions-col {
    justify-content: flex-start;
  }
}
</style>
