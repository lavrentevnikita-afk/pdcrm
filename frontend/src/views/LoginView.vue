<template>
  <div class="login-page">
    <AppCard
      class="login-card"
      title="Вход в систему"
      subtitle="Введите персональный код доступа, который выдаёт администратор"
    >
      <form class="login-form" @submit.prevent="handleSubmit">
        <AppInput
          v-model="code"
          label="Код доступа"
          type="password"
          autocomplete="one-time-code"
          placeholder="Например, 1111"
          :disabled="auth.loading"
          :error="auth.error"
        />

        <AppButton
          class="login-button"
          variant="primary"
          block
          type="submit"
          :loading="auth.loading"
          :disabled="!code"
        >
          Войти
        </AppButton>
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
    </AppCard>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../store/auth';
import AppCard from '../components/ui/AppCard.vue';
import AppInput from '../components/ui/AppInput.vue';
import AppButton from '../components/ui/AppButton.vue';

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
