<template>
  <section class="login-page">
    <div class="login-card">
      <h1 class="login-title">Вход в Print CRM</h1>
      <p class="login-subtitle">
        Введите персональный код доступа, чтобы начать работу.
      </p>

      <form class="login-form" @submit.prevent="handleSubmit">
        <label class="login-label">
          <span>Код доступа</span>
          <input
            v-model="accessCode"
            type="password"
            inputmode="numeric"
            autocomplete="one-time-code"
            maxlength="8"
            class="login-input"
            placeholder="Например, 1001"
            required
          />
        </label>

        <button class="login-button" type="submit" :disabled="isDisabled">
          <span v-if="authStore.loading">Входим…</span>
          <span v-else>Войти</span>
        </button>

        <p v-if="error" class="login-error">
          {{ error }}
        </p>
      </form>

      <p class="login-hint">
        Демо-доступы прописаны в сид-данных (см. <code>docs/launch.md</code>).
      </p>
    </div>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const accessCode = ref('');
const error = ref('');

const redirectTo = computed(() => route.query.redirect || '/');

const isDisabled = computed(() => !accessCode.value.trim() || authStore.loading);

async function handleSubmit() {
  error.value = '';

  try {
    await authStore.loginWithCode(accessCode.value.trim());
    router.push(redirectTo.value);
  } catch (err) {
    // Пытаемся вытащить сообщение об ошибке из ответа backend
    const backendMessage =
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message;

    error.value = backendMessage || 'Не удалось выполнить вход. Проверьте код доступа.';
  }
}
</script>
