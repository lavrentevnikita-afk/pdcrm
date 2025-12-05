<template>
  <div class="directories-page">
    <div class="page-title">Справочники</div>
    <div class="page-subtitle">
      Управляйте списками через удобные таблицы и форму — без всплывающих окон и плейсхолдеров.
    </div>

    <div class="directories-grid">
      <section v-for="directory in directories" :key="directory.key" class="directory-card">
        <div>
          <div class="card-title">{{ directory.title }}</div>
          <div class="card-subtitle">{{ directory.description }}</div>
        </div>
        <div class="card-meta">
          <div class="meta-count">
            <span class="count-number">{{ (records[directory.key] || []).length }}</span>
            <span class="count-label">записей</span>
          </div>
          <div class="meta-tags">
            <span v-for="tag in directory.tags" :key="tag" class="badge">{{ tag }}</span>
          </div>
        </div>
        <div class="card-actions">
          <button class="btn" type="button" @click="openDirectory(directory.key)">
            Открыть
          </button>
          <button class="btn btn-primary" type="button" @click="startCreate(directory.key)">
            Добавить
          </button>
        </div>
      </section>
    </div>

    <div v-if="activeDirectory" class="modal-backdrop" @click.self="closeModal">
      <div class="modal" :style="tableStyle">
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
              v-model="filters[activeDirectory].search"
              type="text"
              placeholder="Введите текст для поиска"
            />
          </label>
          <label v-if="currentConfig.filterKey" class="filter-field">
            <span class="input-label">{{ currentConfig.filterLabel }}</span>
            <select v-model="filters[activeDirectory].filter">
              <option value="">Все</option>
              <option
                v-for="option in availableFilters"
                :key="option.value ?? option"
                :value="option.value ?? option"
              >
                {{ option.label ?? option }}
              </option>
            </select>
          </label>
          <button class="btn btn-primary" type="button" @click="startCreate(activeDirectory)">
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
          <div v-for="record in filteredRecords" :key="record.id || record._id" class="table-row">
            <div v-for="column in currentConfig.columns" :key="column.key">
              {{ formatValue(record[column.key]) }}
            </div>
            <div class="actions-col actions-col-body">
              <button class="btn" type="button" @click="startEdit(record)">Редактировать</button>
              <button class="btn btn-danger" type="button" @click="deleteRecord(record)">
                Удалить
              </button>
            </div>
          </div>
          <div v-if="filteredRecords.length === 0" class="empty-state">
            {{ hasAnyRecords ? 'Нет записей по выбранным условиям' : 'Записей пока нет. Создайте первую.' }}
          </div>
        </div>

        <form class="form-grid" @submit.prevent="saveRecord">
          <div class="form-grid-title">
            {{ editingId ? 'Редактирование записи' : 'Создание записи' }}
          </div>
          <label v-for="field in currentConfig.fields" :key="field.key" :class="{ 'span-2': field.fullWidth }">
            {{ field.label }}
            <input
              v-if="field.type === 'text' || field.type === 'number' || field.type === 'datetime-local'"
              v-model="form[field.key]"
              :type="field.type"
              :step="field.step"
              :min="field.min"
              :placeholder="field.placeholder"
              :required="field.required"
            />
            <select v-else-if="field.type === 'select'" v-model="form[field.key]" :required="field.required">
              <option value="" disabled>Выберите</option>
              <option
                v-for="option in fieldOptions(field)"
                :key="option.value ?? option"
                :value="option.value ?? option"
              >
                {{ option.label ?? option }}
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
import { computed, onMounted, reactive, ref } from 'vue';
import axios from 'axios';

const directories = [
  {
    key: 'users',
    title: 'Пользователи',
    description: 'Сотрудники, роли и контакты.',
    tags: ['Доступы', 'Роли'],
  },
  {
    key: 'product-categories',
    title: 'Категории продукции',
    description: 'Группы номенклатуры для каталога и калькулятора.',
    tags: ['Категории', 'Группы'],
  },
  {
    key: 'products',
    title: 'Продукция',
    description: 'Каталог SKU с ценами и базовыми тиражами.',
    tags: ['SKU', 'Каталог'],
  },
  {
    key: 'cash-shifts',
    title: 'Кассовые смены',
    description: 'Смены кассы с ответственными и суммами.',
    tags: ['Касса', 'История'],
  },
  {
    key: 'clients',
    title: 'Клиенты',
    description: 'База клиентов и контактов.',
    tags: ['B2B', 'B2C'],
  },
  {
    key: 'organizations',
    title: 'Организации',
    description: 'Юридические лица и реквизиты.',
    tags: ['Юрлица', 'Реквизиты'],
  },
];

const categoryOptions = ref([]);
const userOptions = ref([]);

const records = reactive({
  users: [],
  'product-categories': [],
  products: [],
  'cash-shifts': [],
  clients: [],
  organizations: [],
});

const filters = reactive(
  directories.reduce((acc, directory) => {
    acc[directory.key] = { search: '', filter: '' };
    return acc;
  }, {})
);

const databaseConfigs = {
  users: {
    title: 'Пользователи',
    description: 'Сотрудники, их роли и контакты.',
    columns: [
      { key: 'name', label: 'Имя' },
      { key: 'role', label: 'Роль' },
      { key: 'department', label: 'Отдел' },
      { key: 'phone', label: 'Телефон' },
      { key: 'email', label: 'E-mail' },
      { key: 'is_active', label: 'Активен' },
    ],
    fields: [
      { key: 'name', label: 'Имя', type: 'text', required: true },
      {
        key: 'role',
        label: 'Роль',
        type: 'select',
        options: [
          { value: 'admin', label: 'Администратор' },
          { value: 'director', label: 'Директор' },
          { value: 'manager', label: 'Менеджер' },
          { value: 'production', label: 'Производство' },
          { value: 'designer', label: 'Дизайнер' },
        ],
        required: true,
      },
      { key: 'department', label: 'Отдел', type: 'text' },
      { key: 'phone', label: 'Телефон', type: 'text' },
      { key: 'email', label: 'E-mail', type: 'text' },
      { key: 'workload', label: 'Нагрузка', type: 'number', step: '1', min: '0' },
      { key: 'access_code', label: 'Код доступа (для входа)', type: 'text' },
      {
        key: 'is_active',
        label: 'Статус',
        type: 'select',
        options: [
          { value: 1, label: 'Активен' },
          { value: 0, label: 'Отключен' },
        ],
      },
    ],
    searchable: ['name', 'role', 'department', 'email', 'phone'],
  },
  'product-categories': {
    title: 'Категории продукции',
    description: 'Группы для номенклатуры, используются в каталоге и калькуляторе.',
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'slug', label: 'Слаг' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      { key: 'slug', label: 'Слаг', type: 'text', placeholder: 'Например, banners' },
    ],
    searchable: ['name', 'slug'],
  },
  products: {
    title: 'Каталог продукции',
    description: 'Добавляйте позиции, SKU, тиражи и цены для калькулятора.',
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'category', label: 'Категория' },
      { key: 'sku', label: 'SKU' },
      { key: 'unit', label: 'Ед.' },
      { key: 'base_price', label: 'Базовая цена' },
      { key: 'default_run', label: 'Тираж' },
      { key: 'note', label: 'Комментарий' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      {
        key: 'category_id',
        label: 'Категория',
        type: 'select',
        options: categoryOptions,
        required: true,
      },
      { key: 'sku', label: 'SKU', type: 'text', placeholder: 'PR-001', required: false },
      { key: 'unit', label: 'Ед. измерения', type: 'text', placeholder: 'шт.' },
      { key: 'base_price', label: 'Базовая цена', type: 'number', step: '0.01', required: true },
      { key: 'default_run', label: 'Тираж (по умолчанию)', type: 'number', min: '1', step: '1' },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'Материал, особенности', fullWidth: true },
    ],
    filterKey: 'category',
    filterLabel: 'Категория',
    searchable: ['name', 'note', 'sku'],
  },
  'cash-shifts': {
    title: 'Кассовые смены',
    description: 'История смен с ответственными и суммами.',
    columns: [
      { key: 'opened_at', label: 'Открыта' },
      { key: 'closed_at', label: 'Закрыта' },
      { key: 'opened_by_name', label: 'Открыл' },
      { key: 'closed_by_name', label: 'Закрыл' },
      { key: 'total_amount', label: 'Итого' },
    ],
    fields: [
      { key: 'opened_at', label: 'Открыта', type: 'datetime-local', required: true },
      { key: 'closed_at', label: 'Закрыта', type: 'datetime-local' },
      {
        key: 'opened_by',
        label: 'Открыл',
        type: 'select',
        options: userOptions,
        required: true,
      },
      { key: 'closed_by', label: 'Закрыл', type: 'select', options: userOptions },
      { key: 'total_amount', label: 'Сумма', type: 'number', step: '0.01', required: true },
    ],
    searchable: ['opened_by_name', 'closed_by_name'],
  },
  clients: {
    title: 'База клиентов',
    description: 'Сегменты клиентов, контакты и примечания.',
    columns: [
      { key: 'name', label: 'Клиент' },
      { key: 'segment', label: 'Сегмент' },
      { key: 'contact', label: 'Контакты' },
      { key: 'phone', label: 'Телефон' },
      { key: 'note', label: 'Комментарий' },
    ],
    fields: [
      { key: 'name', label: 'Название клиента', type: 'text', required: true },
      { key: 'segment', label: 'Сегмент', type: 'select', options: ['B2B', 'B2C', 'Госзаказ'], required: true },
      { key: 'contact', label: 'Контактное лицо', type: 'text', placeholder: 'ФИО' },
      { key: 'phone', label: 'Телефон', type: 'text', placeholder: '+7…' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'client@example.com' },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'Договор, скидка', fullWidth: true },
    ],
    filterKey: 'segment',
    filterLabel: 'Сегмент',
    searchable: ['name', 'contact', 'note', 'phone'],
  },
  organizations: {
    title: 'Организации',
    description: 'Юридические лица и реквизиты для заказов.',
    columns: [
      { key: 'name', label: 'Организация' },
      { key: 'tax_id', label: 'ИНН' },
      { key: 'contact', label: 'Контакт' },
      { key: 'phone', label: 'Телефон' },
      { key: 'email', label: 'Email' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      { key: 'tax_id', label: 'ИНН', type: 'text' },
      { key: 'contact', label: 'Контактное лицо', type: 'text' },
      { key: 'phone', label: 'Телефон', type: 'text' },
      { key: 'email', label: 'Email', type: 'text' },
      { key: 'note', label: 'Комментарий', type: 'text', fullWidth: true },
    ],
    searchable: ['name', 'contact', 'tax_id'],
  },
};

const activeDirectory = ref('');
const editingId = ref(null);
const form = ref({});

const currentConfig = computed(() => databaseConfigs[activeDirectory.value] || { columns: [], fields: [] });

const availableFilters = computed(() => {
  const filterKey = currentConfig.value.filterKey;
  if (!filterKey || !activeDirectory.value) return [];

  const values = new Map();
  (records[activeDirectory.value] || []).forEach((item) => {
    const value = item[filterKey];
    const label = typeof value === 'object' ? value.label || value.name || value.title : value;
    const val = typeof value === 'object' ? value.value || value.id : value;
    if (val !== undefined && val !== null) {
      values.set(String(val), label ?? val);
    }
  });

  return Array.from(values.entries()).map(([value, label]) => ({ value, label }));
});

const tableStyle = computed(() => {
  const columns = currentConfig.value.columns?.length || 1;
  const baseWidth = 360 + columns * 160;
  return {
    '--column-count': columns,
    maxWidth: `${Math.min(Math.max(baseWidth, 640), 1440)}px`,
  };
});

const hasAnyRecords = computed(() => (records[activeDirectory.value] || []).length > 0);

const filteredRecords = computed(() => {
  if (!activeDirectory.value) return [];
  const { search, filter } = filters[activeDirectory.value];
  const searchQuery = search.trim().toLowerCase();

  return (records[activeDirectory.value] || [])
    .filter((item) => {
      if (!currentConfig.value.filterKey || !filter) return true;
      return String(item[currentConfig.value.filterKey] ?? '').toLowerCase() === String(filter).toLowerCase();
    })
    .filter((item) => {
      if (!searchQuery) return true;
      return (currentConfig.value.searchable || []).some((key) =>
        String(item[key] ?? '').toLowerCase().includes(searchQuery)
      );
    });
});

function fieldOptions(field) {
  if (Array.isArray(field.options)) return field.options;
  if (Array.isArray(field.options?.value)) return field.options.value;
  return field.options || [];
}

function formatValue(value) {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return value.map(formatValue).join(', ');
  if (typeof value === 'object') return value.label || value.name || value.title || value.value || value.id || '';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  return value;
}

function resetForm(key = activeDirectory.value) {
  if (!key) return;
  const template = {};
  (databaseConfigs[key]?.fields || []).forEach((field) => {
    template[field.key] = '';
  });
  form.value = { ...template };
  editingId.value = null;
}

async function loadOptions() {
  try {
    const [{ data: categories }, { data: users }] = await Promise.all([
      axios.get('/api/directories/product-categories'),
      axios.get('/api/directories/users'),
    ]);

    categoryOptions.value = (categories.records || []).map((item) => ({
      value: item.id,
      label: item.name,
    }));

    userOptions.value = (users.records || []).map((item) => ({
      value: item.id,
      label: item.name,
    }));
  } catch (e) {
    // keep defaults on failure
  }
}

async function loadDirectory(key) {
  try {
    const { data } = await axios.get(`/api/directories/${key}`);
    records[key] = data.records || [];
  } catch (e) {
    records[key] = [];
  }
}

async function loadAll() {
  await loadOptions();
  await Promise.all(directories.map((directory) => loadDirectory(directory.key)));
}

function openDirectory(key) {
  activeDirectory.value = key;
  resetForm(key);
  loadDirectory(key);
}

function closeModal() {
  activeDirectory.value = '';
  editingId.value = null;
}

function startCreate(key) {
  if (key && key !== activeDirectory.value) {
    openDirectory(key);
    return;
  }
  resetForm(key || activeDirectory.value);
}

function startEdit(record) {
  if (!activeDirectory.value) return;
  editingId.value = record.id || record._id;
  form.value = { ...record };
}

async function saveRecord() {
  if (!activeDirectory.value) return;
  const key = activeDirectory.value;
  const payload = { ...form.value };

  if (editingId.value) {
    await axios.put(`/api/directories/${key}/${editingId.value}`, payload);
  } else {
    await axios.post(`/api/directories/${key}`, payload);
  }

  await loadDirectory(key);
  resetForm(key);
}

async function deleteRecord(record) {
  if (!activeDirectory.value) return;
  const key = activeDirectory.value;
  const id = record.id || record._id;
  if (!id) return;

  await axios.delete(`/api/directories/${key}/${id}`);
  await loadDirectory(key);
}

onMounted(loadAll);
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
}

.card-title {
  font-size: 16px;
  font-weight: 700;
}

.card-subtitle {
  margin-top: 4px;
  color: #9ca3af;
  font-size: 13px;
}

.card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.meta-count {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.count-number {
  font-size: 20px;
  font-weight: 700;
}

.count-label {
  color: #9ca3af;
  font-size: 12px;
}

.meta-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.badge {
  padding: 2px 8px;
  background: #1f2937;
  border-radius: 999px;
  font-size: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 8px 12px;
  border: 1px solid #374151;
  border-radius: 8px;
  background: #111827;
  color: #e5e7eb;
  cursor: pointer;
}

.btn-primary {
  background: #2563eb;
  border-color: #2563eb;
}

.btn-danger {
  background: #ef4444;
  border-color: #ef4444;
  color: #fff;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 30;
}

.modal {
  background: #0b1221;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px;
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-toolbar {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-field,
.filter-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 240px;
}

.input-label {
  font-size: 12px;
  color: #9ca3af;
}

.table {
  border: 1px solid #1f2937;
  border-radius: 12px;
  overflow-x: auto;
}

.table-head,
.table-row {
  display: grid;
  grid-template-columns: repeat(var(--column-count, 3), minmax(140px, 1fr)) 180px;
  gap: 8px;
  padding: 12px;
  align-items: center;
}

.table-head {
  background: #0f172a;
  border-bottom: 1px solid #1f2937;
  font-weight: 600;
}

.table-row:nth-child(even) {
  background: #0f172a;
}

.actions-col {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.actions-col-body {
  align-items: center;
}

.empty-state {
  padding: 12px;
  text-align: center;
  color: #9ca3af;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 12px;
}

.form-grid-title {
  grid-column: 1 / -1;
  font-weight: 700;
}

label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

input,
select {
  background: #0f172a;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 8px;
  color: #e5e7eb;
}

.modal-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.span-2 {
  grid-column: span 2;
}
</style>
