<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { isAxiosError } from 'axios'
import Button from 'primevue/button'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import { resetPassword } from '@/services/auth'
import type { ApiErrorResponse } from '@/types/api'

const route = useRoute()

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const resetToken = computed(() => {
  return typeof route.query.token === 'string' ? route.query.token : ''
})

const hasValidTokenFormat = computed(() => {
  return /^[a-f0-9]{64}$/.test(resetToken.value)
})

const initialValues = {
  password: '',
  confirmPassword: '',
}

const resolver = ({ values }: { values: Record<string, unknown> }) => {
  const errors: Record<string, { message: string }[]> = {}
  const password = String(values.password ?? '')
  const confirmPassword = String(values.confirmPassword ?? '')

  if (!password) {
    errors.password = [{ message: '請輸入新密碼' }]
  } else if (password.length < 8) {
    errors.password = [{ message: '密碼至少需要 8 個字元' }]
  }

  if (!confirmPassword) {
    errors.confirmPassword = [{ message: '請再次輸入新密碼' }]
  } else if (confirmPassword !== password) {
    errors.confirmPassword = [{ message: '兩次輸入的密碼不一致' }]
  }

  return { errors }
}

const getPasswordStrength = (value: unknown) => {
  const password = String(value ?? '')

  if (password.length < 8) {
    return {
      level: 'weak',
      label: '密碼強度較弱',
    }
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSymbol = /[^a-zA-Z0-9]/.test(password)

  if (hasLetter && hasNumber && hasSymbol) {
    return {
      level: 'strong',
      label: '密碼強度良好',
    }
  }

  return {
    level: 'medium',
    label: '密碼強度中等',
  }
}

const getFormValues = (event: FormSubmitEvent) => {
  return Object.fromEntries(
    Object.entries(event.states).map(([fieldName, fieldState]) => [fieldName, fieldState.value]),
  )
}

const handleSubmit = async (event: FormSubmitEvent) => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!event.valid || !hasValidTokenFormat.value) return

  const values = getFormValues(event)

  isSubmitting.value = true

  try {
    const response = await resetPassword({
      token: resetToken.value,
      password: String(values.password ?? ''),
    })

    successMessage.value = response.message
    isSubmitted.value = true
  } catch (error: unknown) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      errorMessage.value = error.response?.data.message ?? '無法重設密碼，請稍後再試'
    } else {
      errorMessage.value = '發生未預期的錯誤，請稍後再試'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="reset-password-page">
    <section class="account-card">
      <header class="account-card__header">
        <h1 class="account-card__title">設定新密碼</h1>

        <p class="account-card__description">
          請設定新的登入密碼，完成後即可繼續你的跑者旅程。
        </p>
      </header>

      <div v-if="!hasValidTokenFormat" class="submit-result">
        <Message severity="error" variant="simple" aria-live="polite">
          密碼重設連結無效，請重新申請。
        </Message>

        <RouterLink class="back-link" to="/forgot-password">
          重新申請重設連結
        </RouterLink>
      </div>

      <div v-else-if="isSubmitted" class="submit-result">
        <Message severity="success" variant="simple" aria-live="polite">
          {{ successMessage }}
        </Message>

        <RouterLink class="back-link" to="/login">
          返回登入
        </RouterLink>
      </div>

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
          <label for="new-password" class="form-field__label">
            新密碼
          </label>

          <Password
            input-id="new-password"
            name="password"
            autocomplete="new-password"
            placeholder="請輸入新密碼"
            :feedback="false"
            toggle-mask
            fluid
          />

          <div
            v-if="$form.password?.value"
            class="password-strength"
            aria-live="polite"
          >
            <div class="password-strength__track">
              <span
                class="password-strength__bar"
                :class="`password-strength__bar--${getPasswordStrength($form.password.value).level}`"
              ></span>
            </div>

            <span class="password-strength__label">
              {{ getPasswordStrength($form.password.value).label }}
            </span>
          </div>

          <Message
            v-if="$form.password?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.password.error?.message }}
          </Message>
        </div>

        <div class="form-field">
          <label for="confirm-new-password" class="form-field__label">
            確認新密碼
          </label>

          <Password
            input-id="confirm-new-password"
            name="confirmPassword"
            autocomplete="new-password"
            placeholder="請再次輸入新密碼"
            :feedback="false"
            toggle-mask
            fluid
          />

          <Message
            v-if="$form.confirmPassword?.invalid"
            severity="error"
            size="small"
            variant="simple"
          >
            {{ $form.confirmPassword.error?.message }}
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
          label="更新密碼"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          fluid
        />
      </Form>
    </section>
  </main>
</template>

<style scoped>
.reset-password-page {
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

.password-strength {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.password-strength__track {
  width: 100%;
  height: 0.5rem;
  overflow: hidden;
  border-radius: 999px;
  background-color: var(--color-border);
}

.password-strength__bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  transition:
    width 200ms ease,
    background-color 200ms ease;
}

.password-strength__bar--weak {
  width: 33.333%;
  background-color: var(--color-error);
}

.password-strength__bar--medium {
  width: 66.666%;
  background-color: var(--color-warning);
}

.password-strength__bar--strong {
  width: 100%;
  background-color: var(--color-success);
}

.password-strength__label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-heading);
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
  .reset-password-page {
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
