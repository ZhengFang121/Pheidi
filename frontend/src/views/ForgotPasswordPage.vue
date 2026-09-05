<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { isAxiosError } from 'axios'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import { ref } from 'vue'

import AccountPageLayout from '@/components/account/AccountPageLayout.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { forgotPassword } from '@/services/auth'
import type { ApiErrorResponse } from '@/types/api'

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
    Object.entries(event.states).map(([fieldName, fieldState]) => [fieldName, fieldState.value]),
  )
}

const handleSubmit = async (event: FormSubmitEvent) => {
  successMessage.value = ''
  errorMessage.value = ''

  if (!event.valid) return

  const values = getFormValues(event)

  isSubmitting.value = true

  try {
    const response = await forgotPassword(String(values.email ?? '').trim())

    successMessage.value = response.message
    isSubmitted.value = true
  } catch (error: unknown) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      errorMessage.value = error.response?.data.message ?? '無法處理密碼重設申請，請稍後再試'
    } else {
      errorMessage.value = '發生未預期的錯誤，請稍後再試'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <AccountPageLayout
    title="忘記密碼？"
    description="請輸入註冊時使用的電子信箱，將會寄送密碼重設連結。"
  >
    <template v-if="isSubmitted">
      <div class="account-result">
        <Message severity="success" variant="simple" aria-live="polite">
          {{ successMessage }}
        </Message>

        <p class="account-hint">請檢查收件匣與垃圾郵件匣，重設連結將在 30 分鐘後失效。</p>

        <RouterLink class="account-link account-link--center" to="/login">返回登入</RouterLink>
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
        <label for="forgot-password-email" class="form-field__label">電子信箱</label>

        <InputText
          id="forgot-password-email"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="pheidi@runner.com"
          :aria-invalid="$form.email?.invalid || undefined"
          :aria-describedby="$form.email?.invalid ? 'forgot-password-email-error' : undefined"
          fluid
        />

        <Message
          v-if="$form.email?.invalid"
          id="forgot-password-email-error"
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

      <BaseButton
        class="account-submit"
        type="submit"
        label="寄送重設連結"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        fluid
      />

      <RouterLink class="account-link account-link--center" to="/login">返回登入</RouterLink>
    </Form>
  </AccountPageLayout>
</template>
