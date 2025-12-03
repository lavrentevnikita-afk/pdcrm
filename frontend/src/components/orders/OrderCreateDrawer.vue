<template>
  <div v-if="visible" class="drawer-backdrop" @click.self="handleClose">
    <div class="drawer-panel">
      <div class="drawer-header">
        <div>
          <div class="drawer-title">Новый заказ</div>
          <div class="drawer-subtitle">
            Минимальная версия создания заказа: клиент, дедлайн и сумма. Остальное добавим в следующих фазах.
          </div>
        </div>
        <button type="button" class="drawer-close" @click="handleClose">×</button>
      </div>

      <div class="drawer-body">
        <div v-if="error" class="drawer-error">
          {{ error }}
        </div>

        <form @submit.prevent="handleSubmit" class="drawer-form">
          <div class="drawer-section">
            <div class="drawer-section-title">Клиент</div>

            <div class="drawer-radio-row">
              <label class="drawer-radio">
                <input
                  type="radio"
                  value="new"
                  v-model="clientMode"
                />
                <span>Новый клиент</span>
              </label>
              <label class="drawer-radio drawer-radio--disabled">
                <input
                  type="radio"
                  value="existing"
                  v-model="clientMode"
                  disabled
                />
                <span>Существующий клиент (будет позже)</span>
              </label>
            </div>

            <div class="drawer-grid-2">
              <label class="drawer-field">
                <span class="drawer-label">Имя</span>
                <input
                  v-model="form.clientFirstName"
                  type="text"
                  placeholder="Иван"
                />
              </label>

              <label class="drawer-field">
                <span class="drawer-label">Фамилия</span>
                <input
                  v-model="form.clientLastName"
                  type="text"
                  placeholder="Иванов"
                />
              </label>
            </div>

            <div class="drawer-grid-2">
              <label class="drawer-field">
                <span class="drawer-label">Телефон</span>
                <input
                  v-model="form.clientPhone"
                  type="tel"
                  placeholder="+7 900 000-00-00"
                  @blur="ensurePhoneMask"
                />
              </label>

              <label class="drawer-field">
                <span class="drawer-label">Email</span>
                <input
                  v-model="form.clientEmail"
                  type="email"
                  placeholder="client@example.com"
                />
              </label>
            </div>
          </div>

          <div class="drawer-section">
            <div class="drawer-section-title">Параметры заказа</div>

            <label class="drawer-field">
              <span class="drawer-label">Название заказа</span>
              <input
                v-model="form.title"
                type="text"
                placeholder="Например, визитки для ИП Смирнов"
              />
            </label>

            <div class="drawer-grid-2">
              <label class="drawer-field">
                <span class="drawer-label">Дата дедлайна</span>
                <input
                  v-model="form.deadlineDate"
                  type="date"
                />
              </label>

              <label class="drawer-field">
                <span class="drawer-label">Время</span>
                <input
                  v-model="form.deadlineTime"
                  type="time"
                />
              </label>
            </div>

            <label class="drawer-field">
              <span class="drawer-label">Сумма заказа, ₽</span>
              <input
                v-model.number="form.sumTotal"
                type="number"
                min="0"
                step="100"
                placeholder="0"
              />
            </label>

            <label class="drawer-checkbox">
              <input
                type="checkbox"
                v-model="form.isHot"
              />
              <span>Отметить как «горящий» заказ</span>
            </label>
          </div>

          <div class="drawer-section">
            <div class="drawer-section-title">Состав заказа (упрощённо)</div>

            <div class="drawer-grid-2">
              <label class="drawer-field">
                <span class="drawer-label">Продукция</span>
                <textarea
                  v-model="form.productsText"
                  rows="3"
                  placeholder="Кратко: визитки 500 шт, пакеты 100 шт…"
                ></textarea>
              </label>

              <label class="drawer-field">
                <span class="drawer-label">Постпечатка</span>
                <textarea
                  v-model="form.postprintText"
                  rows="3"
                  placeholder="Ламинация, тиснение, вырубка…"
                ></textarea>
              </label>
            </div>

            <div class="drawer-hint">
              Эти поля пока носят информационный характер и не участвуют в расчётах.
            </div>
          </div>

          <div class="drawer-footer">
            <button
              type="button"
              class="btn-secondary"
              @click="handleClose"
              :disabled="saving"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="saving"
            >
              <span v-if="!saving">Создать заказ</span>
              <span v-else>Создание…</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import axios from 'axios';

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'created']);

const clientMode = ref('new');

const form = reactive({
  clientFirstName: '',
  clientLastName: '',
  clientPhone: '+7 ',
  clientEmail: '',
  title: '',
  deadlineDate: '',
  deadlineTime: '',
  sumTotal: 0,
  isHot: false,
  productsText: '',
  postprintText: '',
});

const saving = ref(false);
const error = ref('');

watch(
  () => props.visible,
  (val) => {
    if (val) {
      resetForm();
    }
  }
);

function resetForm() {
  form.clientFirstName = '';
  form.clientLastName = '';
  form.clientPhone = '+7 ';
  form.clientEmail = '';
  form.title = '';
  form.deadlineDate = '';
  form.deadlineTime = '';
  form.sumTotal = 0;
  form.isHot = false;
  form.productsText = '';
  form.postprintText = '';
  error.value = '';
  clientMode.value = 'new';
}

function ensurePhoneMask() {
  if (!form.clientPhone || !form.clientPhone.startsWith('+7')) {
    form.clientPhone = '+7 ';
  }
}

function handleClose() {
  if (saving.value) return;
  emit('close');
}

function buildDeadlineIso() {
  if (!form.deadlineDate) return null;
  const date = form.deadlineDate;
  const time = form.deadlineTime || '09:00';
  const iso = new Date(`${date}T${time}:00`);
  if (Number.isNaN(iso.getTime())) return null;
  return iso.toISOString();
}

async function handleSubmit() {
  error.value = '';

  const clientName = `${form.clientFirstName || ''} ${form.clientLastName || ''}`.trim();
  if (!clientName) {
    error.value = 'Заполните хотя бы имя клиента.';
    return;
  }

  if (!form.clientPhone || !form.clientPhone.startsWith('+7')) {
    error.value = 'Укажите телефон клиента в формате +7…';
    return;
  }

  if (!form.title) {
    error.value = 'Укажите название заказа.';
    return;
  }

  const deadlineIso = buildDeadlineIso();
  if (!deadlineIso) {
    error.value = 'Укажите корректный дедлайн (дата и время).';
    return;
  }

  if (!form.sumTotal || form.sumTotal < 0) {
    error.value = 'Укажите сумму заказа больше нуля.';
    return;
  }

  const payload = {
    title: form.title,
    client_name: clientName,
    client_phone: form.clientPhone,
    deadline_at: deadlineIso,
    sum_total: form.sumTotal,
    is_hot: form.isHot,
  };

  saving.value = true;
  try {
    const { data } = await axios.post('/api/orders', payload);
    emit('created', data);
    resetForm();
  } catch (err) {
    console.error('Create order error', err);
    error.value =
      err?.response?.data?.message || 'Не удалось создать заказ. Попробуйте ещё раз.';
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: flex-end;
  z-index: 40;
}

.drawer-panel {
  width: 480px;
  max-width: 100%;
  height: 100%;
  background: var(--color-bg-alt);
  box-shadow: -12px 0 32px rgba(15, 23, 42, 0.5);
  display: flex;
  flex-direction: column;
}

.drawer-header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.drawer-title {
  font-size: 18px;
  font-weight: 600;
}

.drawer-subtitle {
  font-size: 12px;
  color: var(--color-text-muted);
}

.drawer-close {
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
  color: var(--color-text-muted);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px 20px;
}

.drawer-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.drawer-section {
  background: var(--color-bg);
  border-radius: 14px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
}

.drawer-section-title {
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 8px;
}

.drawer-grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

@media (max-width: 768px) {
  .drawer-grid-2 {
    grid-template-columns: minmax(0, 1fr);
  }
}

.drawer-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
}

.drawer-field input,
.drawer-field textarea {
  font-size: 13px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-bg-alt);
  outline: none;
}

.drawer-field input:focus,
.drawer-field textarea:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 1px var(--color-primary-soft);
}

.drawer-label {
  font-size: 12px;
  color: var(--color-text-muted);
}

.drawer-radio-row {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
}

.drawer-radio {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.drawer-radio--disabled {
  opacity: 0.6;
}

.drawer-radio input {
  width: 14px;
  height: 14px;
}

.drawer-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-top: 8px;
}

.drawer-hint {
  margin-top: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 4px;
}

.btn-primary,
.btn-secondary {
  border-radius: 999px;
  padding: 6px 14px;
  font-size: 13px;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}

.btn-primary {
  background: var(--color-primary);
  color: #ffffff;
  border-color: var(--color-primary);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background: var(--color-bg-alt);
  color: var(--color-text-muted);
  border-color: var(--color-border);
}

.btn-secondary:hover {
  background: #e5e7f0;
}

.drawer-error {
  margin-bottom: 10px;
  font-size: 13px;
  color: var(--color-error);
}
</style>
