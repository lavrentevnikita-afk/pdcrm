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
            <span class="count-number">{{ (records[db.key] || []).length }}</span>
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
      <div class="modal" :style="tableStyle">
        <div class="modal-header">
          <div>
            <div class="modal-title">{{ currentConfig.title }}</div>
            <div class="modal-subtitle">{{ currentConfig.description }}</div>
          </div>
          <button class="btn" type="button" @click="closeModal">Закрыть</button>
        </div>

        <div v-if="undoState.record" class="undo-banner">
          <span>
            {{ undoState.label }} удалена. Вернуть изменения?
          </span>
          <button class="btn btn-primary" type="button" @click="undoDelete">Отменить</button>
        </div>

        <div v-if="pendingNavigation.type && unsavedChanges" class="unsaved-banner">
          <div class="unsaved-text">Есть несохранённые данные.</div>
          <div class="unsaved-actions">
            <button class="btn" type="button" @click="discardAndContinue">Закрыть без сохранения</button>
            <button class="btn" type="button" @click="saveDraftAndContinue">Сохранить черновик</button>
            <button class="btn btn-primary" type="button" @click="saveAndContinue">Сохранить</button>
          </div>
        </div>

        <div class="modal-toolbar">
          <label class="search-field">
            <span class="input-label">Поиск</span>
            <input
              v-model="filters[activeDatabase].search"
              type="text"
              placeholder="Введите текст для поиска"
            />
          </label>
          <label v-if="currentConfig.filterKey" class="filter-field">
            <span class="input-label">{{ currentConfig.filterLabel }}</span>
            <select v-model="filters[activeDatabase].filter">
              <option value="">Все</option>
              <option
                v-for="option in availableFilters"
                :key="option.value || option"
                :value="option.value || option"
              >
                {{ option.label || option }}
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
              {{ displayValue(item, column) }}
            </div>
            <div class="actions-col actions-col-body">
              <button class="btn" type="button" @click="startEdit(item)">Редактировать</button>
              <button class="btn btn-danger" type="button" @click="deleteRecord(item.id)">
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
          <label
            v-for="field in currentConfig.fields"
            :key="field.key"
            :class="{ 'span-2': field.fullWidth, 'has-error': validationHints[field.key] }"
            :data-field-key="field.key"
          >
            {{ field.label }}
            <input
              v-if="field.type === 'text' || field.type === 'number' || field.type === 'datetime-local'"
              v-model="form[field.key]"
              :type="field.type"
              :step="field.step"
              :min="field.min"
              :placeholder="field.placeholder"
              :required="field.required"
              :list="emailListId(field)"
              @input="handleInput(field)"
            />
            <select
              v-else-if="field.type === 'select'"
              v-model="form[field.key]"
              :required="field.required"
              @change="handleInput(field)"
            >
              <option value="" disabled>Выберите</option>
              <option
                v-for="option in fieldOptions(field)"
                :key="option.value ?? option"
                :value="option.value ?? option"
              >
                {{ option.label ?? option }}
              </option>
            </select>
            <datalist v-if="emailListId(field)" :id="emailListId(field)">
              <option v-for="hint in emailHints[field.key] || []" :key="hint" :value="hint" />
            </datalist>
            <div v-if="validationHints[field.key]" class="field-hint">{{ validationHints[field.key] }}</div>
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
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';

const databases = [
  {
    key: 'users',
    title: 'Пользователи',
    description: 'Сотрудники, их роли и доступы.',
    tags: ['Доступы', 'Роли'],
  },
  {
    key: 'product-categories',
    title: 'Категории продукции',
    description: 'Группы и разрезы для каталога продукции.',
    tags: ['Категории', 'Группы'],
  },
  {
    key: 'products',
    title: 'Продукция',
    description: 'Каталог продукции с ценами для калькулятора и SKU.',
    tags: ['Категории', 'SKU', 'Тиражи'],
  },
  {
    key: 'cash-shifts',
    title: 'Кассовые смены',
    description: 'История смен с суммами и ответственных.',
    tags: ['Касса', 'История'],
  },
  {
    key: 'clients',
    title: 'Клиенты',
    description: 'Клиентская база с контактами.',
    tags: ['B2B', 'B2C'],
  },
  {
    key: 'organizations',
    title: 'Организации',
    description: 'Юрлица для заказов и счетов.',
    tags: ['Юрлица', 'B2B'],
  },
];

const records = reactive({
  users: [],
  'product-categories': [],
  products: [],
  'cash-shifts': [],
  clients: [],
  organizations: [],
});

const categoryOptions = ref([]);
const userOptions = ref([]);
const validationHints = reactive({});
const emailHints = reactive({});
const undoState = reactive({ timer: null, record: null, type: '', label: '' });
const unsavedChanges = ref(false);
const formTouched = ref(false);
const suspendAutosave = ref(false);
const pendingNavigation = reactive({ type: '', target: '' });

const databaseConfigs = {
  users: {
    title: 'Пользователи',
    description: 'Сотрудники, их роли и контактные данные.',
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

const activeDatabase = ref('');
const editingId = ref(null);
const form = ref({});

const emailDomains = ['gmail.com', 'yandex.ru', 'mail.ru', 'icloud.com', 'outlook.com'];

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
  const options = new Map();
  (records[activeDatabase.value] || [])
    .map((item) => item[filterKey])
    .filter(Boolean)
    .forEach((value) => {
      const label = typeof value === 'object' ? value.label || value.name : value;
      const val = typeof value === 'object' ? value.value || value.id : value;
      options.set(val, label);
    });
  return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
});

const tableStyle = computed(() => {
  const columns = currentConfig.value?.columns?.length || 1;
  const baseWidth = 360 + columns * 160;
  return {
    '--column-count': columns,
    maxWidth: `${Math.min(Math.max(baseWidth, 640), 1440)}px`,
  };
});

const hasAnyRecords = computed(() => (records[activeDatabase.value] || []).length > 0);

const filteredRecords = computed(() => {
  if (!activeDatabase.value) return [];
  const { search, filter } = filters[activeDatabase.value];
  const config = currentConfig.value;
  const normalize = (value) =>
    String(value || '')
      .toLowerCase()
      .replace('ё', 'е')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

  return (records[activeDatabase.value] || [])
    .filter((item) => {
      if (filter && config.filterKey) {
        return String(item[config.filterKey] || '').toLowerCase() === String(filter).toLowerCase();
      }
      return true;
    })
    .filter((item) => {
      if (!search) return true;
      const query = normalize(search.trim());
      return (config.searchable || []).some((key) => normalize(item[key]).includes(query));
    });
});

const fieldOptions = (field) => {
  if (Array.isArray(field.options)) return field.options;
  if (field.options?.value) return field.options.value;
  if (Array.isArray(field.options?.value)) return field.options.value;
  return field.options || [];
};

const normalizeKey = (value) => String(value || '').replace(/[_\-\s]/g, '').toLowerCase();
const toCamel = (value) => value.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
const toSnake = (value) => value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

const keyVariants = (key) => {
  const base = [key, toCamel(key), toSnake(key), key.replace(/\s+/g, '')];
  const withSuffix = ['name', 'label', 'title', 'value', 'id'].flatMap((suffix) => [
    `${key}_${suffix}`,
    `${toCamel(key)}${suffix.charAt(0).toUpperCase() + suffix.slice(1)}`,
    `${toSnake(key)}_${suffix}`,
  ]);
  return new Set([...base, ...withSuffix].map((val) => normalizeKey(val)));
};

const findValue = (source, key) => {
  if (!source) return undefined;
  const variants = keyVariants(key);
  const entries = [
    ...(source ? Object.entries(source) : []),
    ...(source?.data ? Object.entries(source.data) : []),
  ];

  for (const [entryKey, value] of entries) {
    if (variants.has(normalizeKey(entryKey))) {
      return value;
    }
  }

  return undefined;
};

const displayValue = (record, column) => {
  const primary = findValue(record, column.key);
  const fallback = findValue(record?.__source, column.key);
  const value = primary ?? fallback;

  if (value === undefined || value === null) return '';
  if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
  if (typeof value === 'object') return value.label || value.name || value.title || JSON.stringify(value);
  return value;
};

async function loadDatabase(key) {
  const { data } = await axios.get(`/api/directories/${key}`);

  const config = databaseConfigs[key];
  const columnKeys = config?.columns?.map((c) => c.key) || [];
  const fieldKeys = config?.fields?.map((f) => f.key) || [];
  const filterKey = config?.filterKey ? [config.filterKey] : [];
  const keysToHydrate = Array.from(new Set([...columnKeys, ...fieldKeys, ...filterKey]));

  records[key] = (data.records || []).map((record) => {
    const hydrated = keysToHydrate.reduce((acc, fieldKey) => {
      const value = findValue(record, fieldKey);
      if (value !== undefined) {
        acc[fieldKey] = value;
      }
      return acc;
    }, {});

    return { ...record, ...hydrated, __source: record };
  });

  if (key === 'products') {
    categoryOptions.value = (data.meta?.categories || []).map((c) => ({
      value: c.id,
      label: c.name,
    }));
  }

  if (key === 'cash-shifts') {
    userOptions.value = (data.meta?.users || []).map((u) => ({
      value: u.id,
      label: u.name,
    }));
  }

  if (key === 'users' && data.records) {
    userOptions.value = data.records.map((u) => ({ value: u.id, label: u.name }));
  }
}

async function loadAll() {
  await Promise.all(databases.map((db) => loadDatabase(db.key)));
}

function applyNavigation(target = '') {
  if (pendingNavigation.type === 'switch') {
    activateDatabase(target || pendingNavigation.target);
  }
  if (pendingNavigation.type === 'close') {
    activeDatabase.value = '';
    editingId.value = null;
  }
  pendingNavigation.type = '';
  pendingNavigation.target = '';
}

function requestNavigation(type, target = '') {
  if (unsavedChanges.value) {
    pendingNavigation.type = type;
    pendingNavigation.target = target;
    return true;
  }
  return false;
}

function activateDatabase(key) {
  activeDatabase.value = key;
  loadDatabase(key);
  resetForm();
  filters[key].search = '';
  filters[key].filter = '';
}

function openDatabase(key) {
  const blocked = requestNavigation('switch', key);
  if (blocked) return;
  activateDatabase(key);
}

function closeModal() {
  const blocked = requestNavigation('close');
  if (blocked) return;
  activeDatabase.value = '';
  editingId.value = null;
}

function startCreate(key) {
  if (key) {
    activeDatabase.value = key;
  }
  editingId.value = null;
  const fields = databaseConfigs[activeDatabase.value].fields;
  const draft = readDraft(activeDatabase.value);
  suspendAutosave.value = true;
  formTouched.value = false;
  form.value = fields.reduce((acc, field) => {
    const draftValue = draft?.[field.key];
    if (draftValue !== undefined) {
      acc[field.key] = draftValue;
    } else if (field.type === 'datetime-local') {
      acc[field.key] = new Date().toISOString().slice(0, 16);
    } else {
      acc[field.key] = '';
    }
    return acc;
  }, {});
  validationHintsReset();
  unsavedChanges.value = false;
  nextTick(() => focusField(fields.find((f) => f.required)?.key));
  suspendAutosave.value = false;
}

function startEdit(item) {
  editingId.value = item.id;
  const { __source, ...rest } = item;
  form.value = { ...rest };
  validationHintsReset();
  formTouched.value = false;
}

function resetForm() {
  if (!activeDatabase.value) return;
  const fields = databaseConfigs[activeDatabase.value].fields;
  form.value = fields.reduce((acc, field) => {
    acc[field.key] = '';
    return acc;
  }, {});
  editingId.value = null;
  validationHintsReset();
  unsavedChanges.value = false;
  formTouched.value = false;
}

async function deleteRecord(id) {
  if (!activeDatabase.value) return;
  const current = (records[activeDatabase.value] || []).find((item) => item.id === id);
  await axios.delete(`/api/directories/${activeDatabase.value}/${id}`);
  await loadDatabase(activeDatabase.value);
  if (undoState.timer) clearTimeout(undoState.timer);
  undoState.record = current || null;
  undoState.type = activeDatabase.value;
  undoState.label = current?.name || 'Запись';
  undoState.timer = setTimeout(() => {
    undoState.record = null;
    undoState.type = '';
    undoState.label = '';
  }, 10000);
}

async function saveRecord() {
  if (!activeDatabase.value) return;
  const missing = (currentConfig.value.fields || []).filter(
    (field) => field.required && !form.value[field.key]
  );
  validationHintsReset();
  if (missing.length) {
    missing.forEach((field) => {
      validationHints[field.key] = 'Заполните обязательное поле';
    });
    nextTick(() => focusField(missing[0]?.key));
    return;
  }
  const payload = { ...form.value };
  if (editingId.value) {
    await axios.put(`/api/directories/${activeDatabase.value}/${editingId.value}`, payload);
  } else {
    await axios.post(`/api/directories/${activeDatabase.value}`, payload);
  }
  await loadDatabase(activeDatabase.value);
  resetForm();
  unsavedChanges.value = false;
  formTouched.value = false;
  clearDraft(activeDatabase.value);
  if (pendingNavigation.type) {
    applyNavigation();
  }
}

function validationHintsReset() {
  Object.keys(validationHints).forEach((key) => delete validationHints[key]);
}

function readDraft(key) {
  try {
    const raw = localStorage.getItem(`directories-draft-${key}`);
    return raw ? JSON.parse(raw).form : null;
  } catch (e) {
    return null;
  }
}

function clearDraft(key) {
  localStorage.removeItem(`directories-draft-${key}`);
}

function handleInput(field) {
  const value = form.value[field.key];
  if (!value && value !== 0) {
    formTouched.value = true;
    unsavedChanges.value = true;
    return;
  }

  if (/phone/i.test(field.key)) {
    const digits = String(value).replace(/\D/g, '').replace(/^8/, '7').slice(0, 11);
    const formatted = digits
      .replace(/^7?/, '')
      .replace(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2}).*/, (_, a, b, c, d) =>
        `+7${a ? ` (${a}` : ''}${a && a.length === 3 ? ')' : ''}${b ? ` ${b}` : ''}${c ? `-${c}` : ''}${d ? `-${d}` : ''}`.trim()
      )
      .replace(/\s+$/, '');
    form.value[field.key] = formatted;
  }

  if (/name|contact/i.test(field.key) && typeof value === 'string') {
    const capitalized = value
      .split(/\s+/)
      .filter(Boolean)
      .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
      .join(' ');
    form.value[field.key] = capitalized;
  }

  if (/email/i.test(field.key) && typeof value === 'string') {
    const [localPart] = value.split('@');
    emailHints[field.key] = emailDomains.map((domain) => `${localPart}@${domain}`);
  }

  unsavedChanges.value = true;
  formTouched.value = true;
}

function emailListId(field) {
  if (/email/i.test(field.key)) return `email-hints-${field.key}`;
  return null;
}

function focusField(key) {
  if (!key) return;
  const fieldEl = document.querySelector(`[data-field-key="${key}"] input, [data-field-key="${key}"] select`);
  if (fieldEl) {
    fieldEl.focus();
    fieldEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

async function undoDelete() {
  if (!undoState.record || !undoState.type) return;
  const payload = { ...undoState.record };
  delete payload.id;
  await axios.post(`/api/directories/${undoState.type}`, payload);
  await loadDatabase(undoState.type);
  undoState.record = null;
  undoState.type = '';
  undoState.label = '';
}

function saveAndContinue() {
  saveRecord();
}

function saveDraftAndContinue() {
  if (!activeDatabase.value) return;
  if (formTouched.value) {
    localStorage.setItem(
      `directories-draft-${activeDatabase.value}`,
      JSON.stringify({ form: form.value, timestamp: Date.now() })
    );
  }
  unsavedChanges.value = false;
  applyNavigation();
}

function discardAndContinue() {
  unsavedChanges.value = false;
  formTouched.value = false;
  applyNavigation();
}

watch(
  () => ({ ...form.value, db: activeDatabase.value }),
  () => {
    if (!activeDatabase.value || suspendAutosave.value || !formTouched.value) return;
    localStorage.setItem(
      `directories-draft-${activeDatabase.value}`,
      JSON.stringify({ form: form.value, timestamp: Date.now() })
    );
    unsavedChanges.value = true;
  },
  { deep: true }
);

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

.undo-banner {
  background: #0f172a;
  border: 1px dashed #374151;
  padding: 10px 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.unsaved-banner {
  background: rgba(255, 193, 7, 0.08);
  border: 1px solid rgba(255, 193, 7, 0.4);
  color: #fbbf24;
  padding: 12px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.unsaved-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.has-error input,
.has-error select {
  border-color: #ef4444;
  box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.3);
}

.field-hint {
  color: #f87171;
  font-size: 12px;
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
