<template>
  <div class="directories-page">
    <div class="page-title">Справочники</div>
    <div class="page-subtitle">
      Управляйте пользовательскими ролями, номенклатурой продукции, клиентами и
      кассовыми сменами без лишних заглушек.
    </div>

    <div class="directory-groups">
      <section v-for="group in databaseGroups" :key="group.key" class="directory-group">
        <div class="group-head">
          <div class="group-title">{{ group.title }}</div>
          <div class="group-subtitle">{{ group.subtitle }}</div>
        </div>
        <div class="directories-grid">
          <article
            v-for="db in group.items"
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
          </article>
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

        <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

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
              {{ formatValue(item, column) }}
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
              <option value="" disabled>{{ field.placeholder || 'Выберите' }}</option>
              <option v-for="option in getFieldOptions(field)" :key="option" :value="option">
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
import { computed, onMounted, reactive, ref, watch } from 'vue';
import axios from 'axios';

const databaseGroups = [
  {
    key: 'operational',
    title: '🔥 Операционные справочники',
    subtitle: 'Рабочие базы для ежедневной обработки заказов и складских операций.',
    items: [
      {
        key: 'clients',
        title: 'Клиенты',
        description: 'Карточки клиентов для быстрых заказов, истории и тегов.',
        tags: ['B2B', 'B2C'],
      },
      {
        key: 'organizations',
        title: 'Организации',
        description: 'Юрлица с реквизитами, оплатой и контактами.',
        tags: ['Юрлица', 'Биллинг'],
      },
      {
        key: 'products',
        title: 'Продукция (SKU)',
        description: 'Готовые товарные позиции, связанные с техкартами и формулами.',
        tags: ['SKU', 'Калькулятор'],
      },
      {
        key: 'materials',
        title: 'Материалы',
        description: 'Складская база: остатки, минимумы, параметры и стоимость закупки.',
        tags: ['Склад', 'Закупки'],
      },
    ],
  },
  {
    key: 'technical',
    title: '⭐ Технические справочники',
    subtitle: 'Регулярно дополняемые базы, связанные с производством и закупками.',
    items: [
      {
        key: 'suppliers',
        title: 'Поставщики',
        description: 'Контрагенты, контакты, сроки доставки и история закупок.',
        tags: ['Закупки', 'Контракты'],
      },
      {
        key: 'equipment',
        title: 'Оборудование',
        description: 'Станки и постпечать с характеристиками, статусом и операторами.',
        tags: ['Мощности', 'Сервис'],
      },
      {
        key: 'productionStages',
        title: 'Этапы производства',
        description: 'Стандартизированные шаги цепочки выполнения заказов.',
        tags: ['Маршрут', 'Нормы времени'],
      },
      {
        key: 'postpress',
        title: 'Постпечать / операции',
        description: 'Финишные операции с ценой, временем и требуемым оборудованием.',
        tags: ['Финишинг', 'Производство'],
      },
    ],
  },
  {
    key: 'structural',
    title: '⚙️ Структурные справочники',
    subtitle: 'Редко меняемые справочники, задают структуру каталога и расчётов.',
    items: [
      {
        key: 'productCategories',
        title: 'Категории продукции',
        description: 'Группы SKU с типами продукции и описанием.',
        tags: ['Каталог', 'SKU'],
      },
      {
        key: 'materialCategories',
        title: 'Категории материалов',
        description: 'Группы материалов с базовыми единицами измерения.',
        tags: ['Материалы', 'Категории'],
      },
      {
        key: 'pricingFormulas',
        title: 'Формулы расчёта',
        description: 'Логика калькуляции с переменными, коэффициентами и минимумами.',
        tags: ['Ценообразование', 'Автоматизация'],
      },
    ],
  },
  {
    key: 'system',
    title: '🧱 Системные справочники',
    subtitle: 'Базовые настройки, которые меняет только администратор.',
    items: [
      {
        key: 'techCards',
        title: 'Спецификации / техкарты',
        description:
          'Маршруты производства: материалы, оборудование, этапы и нормы времени.',
        tags: ['Маршрут', 'Стандарты'],
      },
      {
        key: 'users',
        title: 'Пользователи',
        description: 'Сотрудники с ПИН-кодами, ролями, отделом и статусом.',
        tags: ['Доступ', 'Сотрудники'],
      },
      {
        key: 'staffRoles',
        title: 'Роли и навыки',
        description: 'Роли с правами, навыками и доступом к оборудованию.',
        tags: ['HR', 'Доступ'],
      },
      {
        key: 'clientSources',
        title: 'Источники клиентов',
        description: 'Каналы привлечения с типом и стоимостью лида.',
        tags: ['Маркетинг', 'Аналитика'],
      },
      {
        key: 'cashShifts',
        title: 'Кассовые смены',
        description: 'История смен с кассирами и итогами.',
        tags: ['Касса', 'История'],
      },
    ],
  },
];

const databases = databaseGroups.flatMap((group) => group.items);

const records = reactive(
  Object.fromEntries(databases.map((db) => [db.key, []]))
);

const loading = reactive(
  Object.fromEntries(databases.map((db) => [db.key, false]))
);

const saving = ref(false);
const errorMessage = ref('');

const productCategoryOptions = computed(() =>
  (records.productCategories || []).map((item) => item.name || item.code || `Категория #${item.id}`)
);

const materialCategoryOptions = computed(() =>
  (records.materialCategories || []).map((item) => item.name || item.code || `Категория #${item.id}`)
);

const materialOptions = computed(() =>
  (records.materials || []).map((item) => item.name || item.code || `Материал #${item.id}`)
);

const equipmentOptions = computed(() =>
  (records.equipment || []).map((item) => item.name || item.model || `Оборудование #${item.id}`)
);

const techCardOptions = computed(() =>
  (records.techCards || []).map((item) => item.name || `Техкарта #${item.id}`)
);

const pricingFormulaOptions = computed(() =>
  (records.pricingFormulas || []).map((item) => item.name || `Формула #${item.id}`)
);

const supplierOptions = computed(() =>
  (records.suppliers || []).map((item) => item.name || `Поставщик #${item.id}`)
);

const productOptions = computed(() =>
  (records.products || []).map((item) => item.name || `Продукт #${item.id}`)
);

const clientSourceOptions = computed(() =>
  (records.clientSources || []).map((item) => item.name || `Источник #${item.id}`)
);

const staffRoleOptions = computed(() =>
  (records.staffRoles || []).map((item) => item.name || item.role || `Роль #${item.id}`)
);

const databaseConfigs = {
  techCards: {
    title: 'Спецификации / техкарты',
    description: 'Полные маршруты производства: формат, материалы, оборудование и нормы.',
    columns: [
      { key: 'name', label: 'Техкарта / продукт' },
      { key: 'product', label: 'SKU' },
      { key: 'format', label: 'Формат' },
      { key: 'material', label: 'Материал' },
      { key: 'default_equipment', label: 'Оборудование' },
      { key: 'stages', label: 'Этапы' },
      { key: 'consumption', label: 'Норма расхода', type: 'number' },
      { key: 'time_norm', label: 'Норма времени', type: 'number' },
    ],
    fields: [
      { key: 'name', label: 'Название продукции/техкарты', type: 'text', required: true },
      { key: 'product', label: 'Продукция (SKU)', type: 'select', options: () => productOptions.value, placeholder: 'Связать с продукцией', required: true },
      { key: 'format', label: 'Формат', type: 'text', placeholder: 'A4, 210x297' },
      {
        key: 'orientation',
        label: 'Ориентация',
        type: 'select',
        options: ['Портрет', 'Альбом'],
        placeholder: 'Выберите ориентацию',
      },
      { key: 'material', label: 'Материалы', type: 'text', placeholder: 'Список материалов или ссылки', fullWidth: true },
      { key: 'base_tirage', label: 'Базовый/рекомендованный тираж', type: 'text', inputType: 'number' },
      { key: 'color_profile', label: 'Цветность', type: 'select', options: ['4+4', '4+0', 'УФ', 'Pantone'] },
      {
        key: 'default_equipment',
        label: 'Оборудование по умолчанию',
        type: 'select',
        options: () => equipmentOptions.value,
        placeholder: 'Выберите оборудование',
      },
      { key: 'stages', label: 'Последовательность этапов', type: 'text', placeholder: 'Печать → Ламинация → Резка', fullWidth: true },
      { key: 'consumption', label: 'Нормы расхода (листов/м²)', type: 'text', inputType: 'number' },
      { key: 'time_norm', label: 'Норма времени, мин', type: 'text', inputType: 'number' },
      { key: 'quality_requirements', label: 'Требования к качеству', type: 'text', fullWidth: true },
      { key: 'settings', label: 'Настройки оборудования', type: 'text', placeholder: 'Профиль, температура, скорость' },
    ],
    filterKey: 'default_equipment',
    filterLabel: 'Оборудование',
    searchable: ['name', 'material', 'stages', 'format'],
  },
  equipment: {
    title: 'Оборудование',
    description: 'Станки, скорости, ограничения по формату и регламент обслуживания.',
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'type', label: 'Тип' },
      { key: 'speed', label: 'Скорость' },
      { key: 'max_format', label: 'Макс. формат' },
      { key: 'status', label: 'Статус' },
      { key: 'maintenance', label: 'Обслуживание' },
    ],
    fields: [
      { key: 'name', label: 'Название и модель', type: 'text', required: true },
      { key: 'type', label: 'Тип', type: 'select', options: ['Печать', 'Резка', 'Ламинация', 'Упаковка', 'Контроль', 'Другое'], required: true },
      { key: 'speed', label: 'Скорость работы', type: 'text', placeholder: 'м²/ч или шт/ч' },
      { key: 'max_format', label: 'Максимальный формат', type: 'text', placeholder: '320x450 мм' },
      { key: 'supported_materials', label: 'Поддерживаемые материалы', type: 'text', placeholder: 'Бумага, баннер, плёнка', fullWidth: true },
      { key: 'print_mode', label: 'Режимы/настройки', type: 'text', placeholder: 'DPI, скорость, температура', fullWidth: true },
      { key: 'status', label: 'Статус', type: 'select', options: ['Работает', 'Простаивает', 'Сервис'], required: true },
      { key: 'maintenance', label: 'График обслуживания', type: 'text', placeholder: 'Раз в 500 часов / дата сервиса' },
      { key: 'operators', label: 'Ответственные операторы', type: 'text', placeholder: 'ФИО или роли', fullWidth: true },
    ],
    filterKey: 'status',
    filterLabel: 'Статус',
    searchable: ['name', 'type', 'supported_materials', 'operators'],
  },
  productionStages: {
    title: 'Этапы производства',
    description: 'Шаги процесса с порядком, длительностью и требованиями.',
    columns: [
      { key: 'name', label: 'Этап' },
      { key: 'stage_type', label: 'Тип' },
      { key: 'order', label: 'Порядок', type: 'number' },
      { key: 'avg_duration', label: 'Длительность, мин', type: 'number' },
      { key: 'equipment', label: 'Оборудование' },
      { key: 'quality', label: 'Качество' },
    ],
    fields: [
      { key: 'name', label: 'Название этапа', type: 'text', required: true },
      { key: 'stage_type', label: 'Тип', type: 'select', options: ['Основной', 'Дополнительный'], required: true },
      { key: 'order', label: 'Порядок выполнения', type: 'text', inputType: 'number' },
      { key: 'avg_duration', label: 'Средняя длительность, мин', type: 'text', inputType: 'number' },
      { key: 'equipment', label: 'Оборудование/отдел', type: 'select', options: () => equipmentOptions.value, placeholder: 'Выберите оборудование' },
      { key: 'materials', label: 'Материалы', type: 'text', placeholder: 'Что потребляет этап', fullWidth: true },
      { key: 'quality', label: 'Требования к качеству', type: 'text', fullWidth: true },
    ],
    filterKey: 'stage_type',
    filterLabel: 'Тип этапа',
    searchable: ['name', 'materials', 'quality'],
  },
  materials: {
    title: 'Материалы и склад',
    description: 'Остатки, минимальные пороги, параметры и закупочная цена.',
    columns: [
      { key: 'name', label: 'Материал' },
      { key: 'category', label: 'Категория' },
      { key: 'unit', label: 'Ед.' },
      { key: 'stock', label: 'Остаток', type: 'number' },
      { key: 'min_stock', label: 'Мин. остаток', type: 'number' },
      { key: 'purchase_price', label: 'Цена закупки', type: 'currency' },
      { key: 'supplier', label: 'Поставщик' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      { key: 'category', label: 'Категория материала', type: 'select', options: () => materialCategoryOptions.value, placeholder: 'Выберите категорию', required: true },
      { key: 'unit', label: 'Единица измерения', type: 'text', placeholder: 'лист, м², рулон', required: true },
      { key: 'stock', label: 'Текущий остаток', type: 'text', inputType: 'number', placeholder: 'Автоматически по складу' },
      { key: 'min_stock', label: 'Минимальный остаток', type: 'text', inputType: 'number' },
      { key: 'purchase_price', label: 'Цена закупки', type: 'text', inputType: 'number' },
      { key: 'supplier', label: 'Поставщик', type: 'select', options: () => supplierOptions.value, placeholder: 'Выберите поставщика' },
      { key: 'parameters', label: 'Параметры (плотность, толщина, цвет)', type: 'text', fullWidth: true },
      { key: 'barcode', label: 'Штрихкод / партия', type: 'text' },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'Формат, упаковка, партия', fullWidth: true },
    ],
    filterKey: 'category',
    filterLabel: 'Категория',
    searchable: ['name', 'note', 'parameters', 'category'],
  },
  materialCategories: {
    title: 'Категории материалов',
    description: 'Группы материалов для фильтров и аналитики.',
    columns: [
      { key: 'name', label: 'Категория' },
      { key: 'code', label: 'Код' },
      { key: 'default_unit', label: 'Ед. измерения' },
      { key: 'description', label: 'Описание' },
    ],
    fields: [
      { key: 'name', label: 'Название категории', type: 'text', required: true },
      { key: 'code', label: 'Код', type: 'text', placeholder: 'paper, banner, vinyl' },
      { key: 'default_unit', label: 'Ед. измерения по умолчанию', type: 'text', placeholder: 'лист, м², рулон' },
      { key: 'description', label: 'Описание', type: 'text', fullWidth: true },
    ],
    filterKey: 'code',
    filterLabel: 'Код категории',
    searchable: ['name', 'description', 'code'],
  },
  productCategories: {
    title: 'Категории продукции',
    description: 'Структура каталога SKU и типовых характеристик.',
    columns: [
      { key: 'name', label: 'Категория' },
      { key: 'code', label: 'Код' },
      { key: 'product_type', label: 'Тип продукции' },
      { key: 'description', label: 'Описание' },
    ],
    fields: [
      { key: 'name', label: 'Название категории', type: 'text', required: true },
      { key: 'code', label: 'Код', type: 'text', placeholder: 'print, textile, souvenir' },
      { key: 'product_type', label: 'Тип продукции', type: 'select', options: ['Полиграфия', 'Наружка', 'Сувениры', 'Другое'], placeholder: 'Выберите тип' },
      { key: 'description', label: 'Описание', type: 'text', fullWidth: true },
    ],
    filterKey: 'code',
    filterLabel: 'Код категории',
    searchable: ['name', 'description', 'code'],
  },
  products: {
    title: 'Продукция (SKU)',
    description: 'Каталог товаров с техкартой, материалом и расчётом по тиражу.',
    columns: [
      { key: 'name', label: 'Название' },
      { key: 'category', label: 'Категория' },
      { key: 'base_format', label: 'Формат' },
      { key: 'material', label: 'Материал' },
      { key: 'tech_card', label: 'Техкарта' },
      { key: 'pricing_formula', label: 'Формула' },
      { key: 'unit_price', label: 'Базовая цена', type: 'currency' },
      { key: 'tirage', label: 'Тираж', type: 'number' },
      { key: 'discount', label: 'Скидка, %', type: 'number' },
      { key: 'total_price', label: 'Итог', type: 'currency' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', placeholder: 'Например, «Визитки премиум»', required: true },
      { key: 'category', label: 'Категория', type: 'select', options: () => productCategoryOptions.value, placeholder: 'Выберите категорию', required: true },
      { key: 'tech_card', label: 'Техкарта', type: 'select', options: () => techCardOptions.value, placeholder: 'Связать с техкартой' },
      { key: 'material', label: 'Материал по умолчанию', type: 'select', options: () => materialOptions.value, placeholder: 'Выберите материал' },
      { key: 'base_format', label: 'Базовый формат', type: 'text', placeholder: '100x70 мм, A4' },
      { key: 'standard_tirages', label: 'Стандартные тиражи', type: 'text', placeholder: '100 / 500 / 1000' },
      { key: 'unit_price', label: 'Цена за единицу, ₽', type: 'text', inputType: 'number', required: true },
      { key: 'tirage', label: 'Тираж', type: 'text', inputType: 'number', required: true },
      { key: 'discount', label: 'Скидка % (авто)', type: 'text', inputType: 'number', placeholder: 'Заполнится автоматически' },
      { key: 'total_price', label: 'Итог', type: 'text', inputType: 'number', placeholder: 'Автоподсчёт' },
      { key: 'pricing_formula', label: 'Формула расчёта', type: 'select', options: () => pricingFormulaOptions.value, placeholder: 'Выберите формулу' },
      { key: 'options', label: 'Доп. опции (ламин., вырубка)', type: 'text', fullWidth: true },
    ],
    filterKey: 'category',
    filterLabel: 'Категория',
    searchable: ['name', 'category', 'tech_card', 'base_format'],
  },
  pricingFormulas: {
    title: 'Формулы расчета',
    description: 'Типы формул, параметры, минимальная стоимость и правила округления.',
    columns: [
      { key: 'name', label: 'Формула' },
      { key: 'formula_type', label: 'Тип' },
      { key: 'materials', label: 'Материалы/коэф.' },
      { key: 'min_price', label: 'Мин. цена', type: 'currency' },
      { key: 'rounding', label: 'Округление' },
    ],
    fields: [
      { key: 'name', label: 'Название формулы', type: 'text', required: true },
      { key: 'formula_type', label: 'Тип', type: 'select', options: ['Линейная', 'По тиражу', 'Матричная'], required: true },
      { key: 'parameters', label: 'Параметры и переменные', type: 'text', fullWidth: true },
      { key: 'materials', label: 'Материалы и коэффициенты', type: 'text', placeholder: 'бумага=1.1; баннер=1.3', fullWidth: true },
      { key: 'min_price', label: 'Минимальная стоимость', type: 'text', inputType: 'number' },
      { key: 'rounding', label: 'Правила округления', type: 'text', placeholder: 'До 10 ₽ / до 1 рубля' },
    ],
    filterKey: 'formula_type',
    filterLabel: 'Тип формулы',
    searchable: ['name', 'parameters', 'materials'],
  },
  postpress: {
    title: 'Постпечать / операции',
    description: 'Финишные операции с ценой, временем, материалами и оборудованием.',
    columns: [
      { key: 'name', label: 'Операция' },
      { key: 'cost', label: 'Стоимость', type: 'currency' },
      { key: 'equipment', label: 'Оборудование' },
      { key: 'materials', label: 'Материалы' },
      { key: 'run_time', label: 'Время, мин', type: 'number' },
    ],
    fields: [
      { key: 'name', label: 'Название операции', type: 'text', required: true },
      { key: 'cost', label: 'Стоимость', type: 'text', inputType: 'number' },
      { key: 'equipment', label: 'Оборудование', type: 'select', options: () => equipmentOptions.value, placeholder: 'Оборудование' },
      { key: 'materials', label: 'Материалы', type: 'text', placeholder: 'Ламинационная плёнка, клей' },
      { key: 'run_time', label: 'Время выполнения, мин', type: 'text', inputType: 'number' },
      { key: 'requirements', label: 'Требования / примечания', type: 'text', fullWidth: true },
    ],
    filterKey: 'equipment',
    filterLabel: 'Оборудование',
    searchable: ['name', 'equipment', 'requirements', 'materials'],
  },
  suppliers: {
    title: 'Поставщики',
    description: 'Контакты, сроки доставки, ассортимент и история закупок.',
    columns: [
      { key: 'name', label: 'Поставщик' },
      { key: 'contact', label: 'Контакты' },
      { key: 'lead_time', label: 'Срок поставки' },
      { key: 'materials', label: 'Материалы' },
      { key: 'history', label: 'История закупок' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      { key: 'materials', label: 'Поставляемые материалы', type: 'text', fullWidth: true },
      { key: 'status', label: 'Статус', type: 'select', options: ['Активный', 'На проверке', 'Остановлен'], required: true },
      { key: 'contact', label: 'Контакты', type: 'text', placeholder: 'E-mail, телефон или менеджер', required: true },
      { key: 'lead_time', label: 'Сроки доставки', type: 'text', placeholder: '2-3 дня, самовывоз' },
      { key: 'prices', label: 'Цены / условия', type: 'text', placeholder: 'Прайс, скидки, предоплата', fullWidth: true },
      { key: 'history', label: 'История закупок', type: 'text', fullWidth: true },
    ],
    filterKey: 'status',
    filterLabel: 'Статус',
    searchable: ['name', 'materials', 'contact'],
  },
  users: {
    title: 'Пользователи',
    description: 'Сотрудники с ролями, отделом, контактами и статусом.',
    columns: [
      { key: 'name', label: 'Сотрудник' },
      { key: 'role', label: 'Роль' },
      { key: 'department', label: 'Отдел' },
      { key: 'phone', label: 'Телефон' },
      { key: 'status', label: 'Статус' },
    ],
    fields: [
      { key: 'name', label: 'Имя и фамилия', type: 'text', required: true },
      { key: 'pin', label: 'PIN / пароль', type: 'text', placeholder: 'Например, 1234', required: true, inputType: 'number' },
      { key: 'role', label: 'Роль', type: 'select', options: () => staffRoleOptions.value, placeholder: 'Выберите роль', required: true },
      { key: 'department', label: 'Отдел', type: 'text', placeholder: 'Производство, менеджеры' },
      { key: 'phone', label: 'Телефон', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'Контакт для связи' },
      { key: 'status', label: 'Активность', type: 'select', options: ['Активный', 'Скрыт'], required: true },
    ],
    filterKey: 'role',
    filterLabel: 'Роль',
    searchable: ['name', 'phone', 'email', 'role'],
  },
  clients: {
    title: 'Клиенты',
    description: 'Карточки физических лиц с контактами, тегами и источником.',
    columns: [
      { key: 'name', label: 'Клиент' },
      { key: 'phone', label: 'Телефон' },
      { key: 'email', label: 'Email' },
      { key: 'segment', label: 'Тип' },
      { key: 'tags', label: 'Теги' },
      { key: 'source', label: 'Источник' },
    ],
    fields: [
      { key: 'name', label: 'Имя клиента', type: 'text', required: true },
      { key: 'phone', label: 'Телефон', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'Опционально' },
      { key: 'segment', label: 'Тип', type: 'select', options: ['B2B', 'B2C'], required: true },
      { key: 'tags', label: 'Теги', type: 'text', placeholder: 'VIP, проблемный' },
      { key: 'source', label: 'Источник клиента', type: 'select', options: () => clientSourceOptions.value, placeholder: 'Выберите источник' },
    ],
    filterKey: 'segment',
    filterLabel: 'Сегмент',
    searchable: ['name', 'phone', 'email', 'tags'],
  },
  organizations: {
    title: 'Организации',
    description: 'Реквизиты, условия оплаты и контактные лица.',
    columns: [
      { key: 'name', label: 'Организация' },
      { key: 'inn', label: 'ИНН' },
      { key: 'kpp', label: 'КПП' },
      { key: 'legal_address', label: 'Юр. адрес' },
      { key: 'contact_person', label: 'Контакт' },
      { key: 'phone', label: 'Телефон' },
      { key: 'payment_terms', label: 'Оплата' },
    ],
    fields: [
      { key: 'name', label: 'Название', type: 'text', required: true },
      { key: 'inn', label: 'ИНН', type: 'text', inputType: 'number', required: true },
      { key: 'kpp', label: 'КПП', type: 'text', inputType: 'number' },
      { key: 'legal_address', label: 'Юридический адрес', type: 'text', required: true },
      { key: 'contact_person', label: 'Контактное лицо', type: 'text' },
      { key: 'phone', label: 'Телефон', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'Бухгалтерия/контракты' },
      { key: 'payment_terms', label: 'Платёжные условия', type: 'text', placeholder: 'постоплата, предоплата' },
    ],
    filterKey: 'payment_terms',
    filterLabel: 'Оплата',
    searchable: ['name', 'inn', 'kpp', 'contact_person', 'phone'],
  },
  clientSources: {
    title: 'Источники клиентов',
    description: 'Каналы привлечения с типом и стоимостью лида.',
    columns: [
      { key: 'name', label: 'Канал' },
      { key: 'cpl', label: 'Стоимость лида', type: 'currency' },
      { key: 'lead_type', label: 'Тип' },
    ],
    fields: [
      { key: 'name', label: 'Источник', type: 'text', required: true },
      { key: 'cpl', label: 'Стоимость лида', type: 'text', inputType: 'number' },
      { key: 'lead_type', label: 'Тип канала', type: 'select', options: ['Онлайн', 'Офлайн'] },
      { key: 'note', label: 'Комментарий', type: 'text', placeholder: 'UTM, кампания', fullWidth: true },
    ],
    filterKey: 'name',
    filterLabel: 'Источник',
    searchable: ['name', 'note', 'lead_type'],
  },
  staffRoles: {
    title: 'Роли, навыки и должности',
    description: 'Доступы, навыки и назначение на оборудование.',
    columns: [
      { key: 'name', label: 'Роль/должность' },
      { key: 'permissions', label: 'Разрешения' },
      { key: 'skills', label: 'Навыки' },
      { key: 'equipment_access', label: 'Оборудование' },
    ],
    fields: [
      { key: 'name', label: 'Роль или должность', type: 'text', required: true },
      { key: 'permissions', label: 'Разрешения', type: 'text', placeholder: 'Доступ к кассе/складу/аналитике' },
      { key: 'skills', label: 'Навыки', type: 'text', placeholder: 'Умеет работать: резак, УФ-принтер', fullWidth: true },
      { key: 'equipment_access', label: 'Работает на оборудовании', type: 'text', placeholder: 'HP Latex, ламинатор' },
      { key: 'duties', label: 'Должностные обязанности', type: 'text', fullWidth: true },
    ],
    filterKey: 'name',
    filterLabel: 'Роль',
    searchable: ['name', 'skills', 'equipment_access'],
  },
  cashShifts: {
    title: 'Кассовые смены',
    description: 'Фиксируйте открытия и закрытия смен с поправками.',
    columns: [
      { key: 'shift_date', label: 'Дата' },
      { key: 'cashier', label: 'Ответственный' },
      { key: 'opening_balance', label: 'Открытие, ₽', type: 'currency' },
      { key: 'closing_balance', label: 'Закрытие, ₽', type: 'currency' },
      { key: 'note', label: 'Комментарий' },
    ],
    fields: [
      { key: 'shift_date', label: 'Дата смены', type: 'text', inputType: 'date', required: true },
      { key: 'cashier', label: 'Кассир', type: 'text', required: true },
      { key: 'opening_balance', label: 'Открытие (₽)', type: 'text', inputType: 'number', required: true },
      { key: 'closing_balance', label: 'Закрытие (₽)', type: 'text', inputType: 'number', required: true },
      { key: 'note', label: 'Комментарий', type: 'text', fullWidth: true },
    ],
    filterKey: 'cashier',
    filterLabel: 'Кассир',
    searchable: ['cashier', 'note', 'shift_date'],
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
  const options = new Set((records[activeDatabase.value] || []).map((item) => item[filterKey]).filter(Boolean));
  return Array.from(options);
});

const filteredRecords = computed(() => {
  if (!activeDatabase.value) return [];
  const { search, filter } = filters[activeDatabase.value];
  const config = currentConfig.value;
  return (records[activeDatabase.value] || [])
    .map((item) => withDerivedFields(item))
    .filter((item) => {
      if (filter && config.filterKey) {
        return (item[config.filterKey] || '').toString().toLowerCase() === filter.toLowerCase();
      }
      return true;
    })
    .filter((item) => {
      if (!search) return true;
      const query = search.toLowerCase();
      return config.searchable.some((key) => String(item[key] || '').toLowerCase().includes(query));
    });
});

onMounted(() => {
  preloadAll();
});

function withDerivedFields(item) {
  if (activeDatabase.value === 'products') {
    const tirage = Number(item.tirage) || 0;
    const unitPrice = Number(item.unit_price) || 0;
    const discount = Number(item.discount) || autoDiscountForTirage(tirage);
    const total = Math.round(tirage * unitPrice * (1 - discount / 100));
    return {
      ...item,
      discount,
      total_price: total,
    };
  }
  return item;
}

function openDatabase(key) {
  activeDatabase.value = key;
  if (!(records[key] || []).length) {
    fetchRecords(key);
  }
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
    acc[field.key] = field.default ?? '';
    return acc;
  }, {});
  if (activeDatabase.value === 'products') {
    refreshProductTotals();
  }
}

function startEdit(item) {
  editingId.value = item.id;
  form.value = { ...item };
  if (activeDatabase.value === 'products') {
    refreshProductTotals();
  }
}

function resetForm() {
  if (!activeDatabase.value) return;
  const fields = databaseConfigs[activeDatabase.value].fields;
  form.value = fields.reduce((acc, field) => {
    acc[field.key] = field.default ?? '';
    return acc;
  }, {});
  editingId.value = null;
  if (activeDatabase.value === 'products') {
    refreshProductTotals();
  }
}

function deleteRecord(id) {
  if (!activeDatabase.value) return;
  axios
    .delete(`/api/directories/${activeDatabase.value}/${id}`)
    .then(() => fetchRecords(activeDatabase.value))
    .catch((err) => {
      console.error(err);
      errorMessage.value = err.response?.data?.message || 'Не удалось удалить запись';
    });
}

function saveRecord() {
  if (!activeDatabase.value || saving.value) return;
  saving.value = true;
  errorMessage.value = '';
  const payload = normalizePayload();

  const request = editingId.value
    ? axios.put(`/api/directories/${activeDatabase.value}/${editingId.value}`, payload)
    : axios.post(`/api/directories/${activeDatabase.value}`, payload);

  request
    .then(() => fetchRecords(activeDatabase.value))
    .catch((err) => {
      console.error(err);
      errorMessage.value = err.response?.data?.message || 'Не удалось сохранить запись';
    })
    .finally(() => {
      saving.value = false;
      resetForm();
    });
}

function normalizePayload() {
  const payload = { ...form.value };
  if (activeDatabase.value === 'products') {
    const tirage = Number(payload.tirage) || 0;
    payload.discount = autoDiscountForTirage(tirage);
    const unitPrice = Number(payload.unit_price) || 0;
    payload.total_price = Math.round(tirage * unitPrice * (1 - payload.discount / 100));
  }
  return payload;
}

function autoDiscountForTirage(tirage) {
  if (tirage >= 1000) return 15;
  if (tirage >= 500) return 10;
  if (tirage >= 100) return 5;
  return 0;
}

function refreshProductTotals() {
  const tirage = Number(form.value.tirage) || 0;
  const unitPrice = Number(form.value.unit_price) || 0;
  form.value.discount = autoDiscountForTirage(tirage);
  form.value.total_price = Math.round(tirage * unitPrice * (1 - Number(form.value.discount) / 100));
}

function getFieldOptions(field) {
  if (!field.options) return [];
  if (typeof field.options === 'function') {
    return field.options() || [];
  }
  return field.options;
}

async function fetchRecords(type) {
  loading[type] = true;
  errorMessage.value = '';
  try {
    const { data } = await axios.get(`/api/directories/${type}`);
    records[type] = (data.items || []).map((item) => ({ ...item }));
  } catch (err) {
    console.error(err);
    errorMessage.value = err.response?.data?.message || 'Не удалось загрузить справочник';
  } finally {
    loading[type] = false;
  }
}

async function preloadAll() {
  await Promise.all(Object.keys(records).map((key) => fetchRecords(key)));
}

watch(
  () => [form.value.tirage, form.value.unit_price],
  () => {
    if (activeDatabase.value === 'products') {
      refreshProductTotals();
    }
  }
);

function formatValue(item, column) {
  const value = item[column.key];
  if (value === undefined || value === '') return '—';
  if (column.type === 'currency') {
    const numberValue = Number(value) || 0;
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 }).format(numberValue);
  }
  if (column.type === 'number') {
    return new Intl.NumberFormat('ru-RU').format(Number(value) || 0);
  }
  return value;
}
</script>

<style scoped>
.directory-groups {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin-top: 16px;
}

.directory-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.group-head {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.group-title {
  font-size: 18px;
  font-weight: 800;
}

.group-subtitle {
  color: #9ca3af;
  font-size: 13px;
}

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

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fecdd3;
  padding: 10px 12px;
  border-radius: 10px;
  font-size: 14px;
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
