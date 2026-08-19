<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { isAxiosError } from 'axios'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { ref } from 'vue'

import api from '@/services/api'

interface ForgotPasswordResponse {
  message: string
}

interface ApiErrorResponse {
  message?: string
}

const initialValues = {
  email: '',
}

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const resolver = ({ values }: { values: Record<string, unknown> }) => {
  const errors: Record<string, { message: string }[]> = {}
  const email = String(values.email ?? '').trim()

  if (!email) {
    errors.email = [{ message: '請輸入電子信箱' }]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = [{ message: '請輸入正確的電子信箱格式' }]
  }

  return { errors }
}

const getFormValues = (event: FormSubmitEvent) => {
  return Object.fromEntries(
    Object.entries(event.states).map(([fieldName, fieldState]) => [
      fieldName,
      fieldState.value,
    ]),
  )
}

const handleSubmit = async (event: FormSubmitEvent) => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!event.valid) return

  const values = getFormValues(event)

  isSubmitting.value = true

  try {
    const response = await api.post<ForgotPasswordResponse>(
      '/users/forgot-password',
      {
        email: String(values.email ?? '').trim(),
      },
    )

    successMessage.value = response.data.message
    isSubmitted.value = true
  } catch (error: unknown) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      errorMessage.value =
        error.response?.data.message ?? '無法處理密碼重設申請，請稍後再試'
    } else {
      errorMessage.value = '發生未預期的錯誤，請稍後再試'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="forgot-password-page">
    <section class="account-card">
      <header class="account-card__header">
        <h1 class="account-card__title">忘記密碼？</h1>

        <p class="account-card__description">
          請輸入註冊時使用的電子信箱，將會寄送密碼重設連結給您。
        </p>
      </header>

      <template v-if="isSubmitted">
        <div class="submit-result">
          <Message
            severity="success"
            variant="simple"
            aria-live="polite"
          >
            {{ successMessage }}
          </Message>

          <p class="submit-result__hint">
            請檢查收件匣與垃圾郵件匣。重設連結將在 30 分鐘後失效。
          </p>

          <RouterLink class="back-link" to="/login">
            返回登入
          </RouterLink>
        </div>
      </template>

      <Form
        v-else
        v-slot="$form"
        :initial-values="initialValues"
        :resolver="resolver"
        :validate-on-value-update="false"
        :validate-on-blur="true"
        class="account-form"
        @submit="handleSubmit"
      >
        <div class="form-field">
          <label for="forgot-password-email" class="form-field__label">
            電子信箱
          </label>

          <InputText
            id="forgot-password-email"
            name="email"
            type="email"
            autocomplete="email"
            placeholder="runner@example.com"
            fluid
          />

          <Message
            v-if="$form.email?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.email.error?.message }}
          </Message>
        </div>

        <Message
          v-if="errorMessage"
          severity="error"
          size="small"
          variant="simple"
          aria-live="polite"
        >
          {{ errorMessage }}
        </Message>

        <Button
          class="account-submit"
          type="submit"
          label="寄送重設連結"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          fluid
        />

        <RouterLink class="back-link" to="/login">
          返回登入
        </RouterLink>
      </Form>
    </section>
  </main>
</template>

<style scoped>
.forgot-password-page {
  display: grid;
  min-height: 100vh;
  padding: var(--space-5);
  background-color: var(--color-primary-pale);
  place-items: center;
}

.account-card {
  width: min(100%, 30rem);
  padding: var(--space-6);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  background-color: var(--color-surface);
  box-shadow: var(--shadow-lg);
}

.account-card__header {
  margin-bottom: var(--space-5);
  text-align: center;
}

.account-card__title {
  margin: 0;
  color: var(--color-text);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
  letter-spacing: var(--letter-spacing-tight);
}

.account-card__description {
  margin: var(--space-2) 0 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
}

.account-form,
.submit-result {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form-field__label {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-heading);
}

.submit-result__hint {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-base);
  letter-spacing: var(--letter-spacing-base);
}

.back-link {
  color: var(--color-dark-light);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  text-align: center;
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-dark);
  text-decoration: underline;
}

.back-link:focus-visible {
  border-radius: var(--radius-sm);
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

:deep(.account-submit.p-button) {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-base);
}

:deep(.account-submit.p-button:hover) {
  border-color: color-mix(
    in srgb,
    var(--color-primary) 85%,
    var(--color-dark)
  );
  background-color: color-mix(
    in srgb,
    var(--color-primary) 85%,
    var(--color-dark)
  );
  color: var(--color-surface);
}

@media (max-width: 480px) {
  .forgot-password-page {
    padding: var(--space-4);
  }

  .account-card {
    padding: var(--space-5);
    border-radius: var(--radius-lg);
  }

  .account-card__title {
    font-size: var(--font-size-base);
  }
}
</style>