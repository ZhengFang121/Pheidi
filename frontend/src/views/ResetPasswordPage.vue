<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { isAxiosError } from 'axios'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import AccountPageLayout from '@/components/account/AccountPageLayout.vue'
import BaseButton from '@/components/base/BaseButton.vue'
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
  <AccountPageLayout
    title="設定新密碼"
    description="請設定新的登入密碼，完成後即可繼續你的跑者旅程。"
  >
    <div v-if="!hasValidTokenFormat" class="account-result">
      <Message severity="error" variant="simple" aria-live="polite">
        密碼重設連結無效，請重新申請。
      </Message>

      <RouterLink class="account-link account-link--center" to="/forgot-password">
        重新申請重設連結
      </RouterLink>
    </div>

    <div v-else-if="isSubmitted" class="account-result">
      <Message severity="success" variant="simple" aria-live="polite">
        {{ successMessage }}
      </Message>

      <RouterLink class="account-link account-link--center" to="/login">返回登入</RouterLink>
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
        <label for="new-password" class="form-field__label"> 新密碼 </label>

        <Password
          input-id="new-password"
          name="password"
          autocomplete="new-password"
          placeholder="請輸入新密碼"
          :feedback="false"
          :invalid="$form.password?.invalid"
          :input-props="{
            'aria-describedby': $form.password?.invalid ? 'new-password-error' : undefined,
          }"
          toggle-mask
          fluid
        />

        <div v-if="$form.password?.value" class="password-strength" aria-live="polite">
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
          id="new-password-error"
          severity="error"
          size="small"
          variant="simple"
        >
          {{ $form.password.error?.message }}
        </Message>
      </div>

      <div class="form-field">
        <label for="confirm-new-password" class="form-field__label"> 確認新密碼 </label>

        <Password
          input-id="confirm-new-password"
          name="confirmPassword"
          autocomplete="new-password"
          placeholder="請再次輸入新密碼"
          :feedback="false"
          :invalid="$form.confirmPassword?.invalid"
          :input-props="{
            'aria-describedby': $form.confirmPassword?.invalid
              ? 'confirm-new-password-error'
              : undefined,
          }"
          toggle-mask
          fluid
        />

        <Message
          v-if="$form.confirmPassword?.invalid"
          id="confirm-new-password-error"
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

      <BaseButton
        class="account-submit"
        type="submit"
        label="更新密碼"
        :loading="isSubmitting"
        :disabled="isSubmitting"
        fluid
      />
    </Form>
  </AccountPageLayout>
</template>
