<template>
  <div class="login-page">
    <div class="login-card">
      <div class="page-title">Вход в систему</div>
      <p class="page-subtitle">
        Введите персональный код доступа, который выдаёт администратор.
      </p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="login-label">
          Код доступа
          <input
            v-model="code"
            type="password"
            autocomplete="one-time-code"
            placeholder="Например, 1111"
            :disabled="auth.loading"
          />
        </label>

        <button
          class="primary-button"
          type="submit"
          :disabled="auth.loading || !code"
        >
          {{ auth.loading ? 'Проверяем…' : 'Войти' }}
        </button>

        <p v-if="auth.error" class="form-error">
          {{ auth.error }}
        </p>
      </form>

      <div class="login-hint">
        <div class="login-hint-title">Тестовые аккаунты</div>
        <ul>
          <li>Дизайнер: код <code>1111</code></li>
          <li>Производство: код <code>2222</code></li>
          <li>Директор: код <code>3333</code></li>
          <li>Админ: код <code>4444</code></li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const code = ref('');

async function handleSubmit() {
  await auth.login(code.value.trim());
  if (auth.isAuthenticated) {
    const redirect = route.query.redirect || '/dashboard';
    router.push(redirect);
  }
}
</script>
