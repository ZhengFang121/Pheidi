<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { isAxiosError } from 'axios'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import AccountPageLayout from '@/components/account/AccountPageLayout.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import { login, register } from '@/services/auth'
import { useAuthStore } from '@/stores/auth'
import type { ApiErrorResponse } from '@/types/api'

const router = useRouter()
const authStore = useAuthStore()

const rememberedEmailKey = 'pheidi_remembered_email'
const rememberedEmail = localStorage.getItem(rememberedEmailKey) ?? ''

const isLoggingIn = ref(false)
const loginSuccessMessage = ref('')
const loginErrorMessage = ref('')
const isRegistering = ref(false)
const registerSuccessMessage = ref('')
const registerErrorMessage = ref('')
const activeTab = ref<'login' | 'register'>('login')
const loginFormKey = ref(0)

const loginInitialValues = ref({
  email: rememberedEmail,
  password: '',
  rememberEmail: Boolean(rememberedEmail),
  keepSignedIn: false,
})

const loginResolver = ({ values }: { values: Record<string, unknown> }) => {
  const errors: Record<string, { message: string }[]> = {}
  const email = String(values.email ?? '').trim()
  const password = String(values.password ?? '')

  if (!email) {
    errors.email = [{ message: '請輸入電子信箱' }]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = [{ message: '請輸入正確的電子信箱格式' }]
  }

  if (!password) {
    errors.password = [{ message: '請輸入密碼' }]
  } else if (password.length < 8) {
    errors.password = [{ message: '密碼至少需要 8 個字元' }]
  }

  return { errors }
}

const registerInitialValues = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  agreeToTerms: false,
}

const registerResolver = ({ values }: { values: Record<string, unknown> }) => {
  const errors: Record<string, { message: string }[]> = {}
  const username = String(values.username ?? '').trim()
  const email = String(values.email ?? '').trim()
  const password = String(values.password ?? '')
  const confirmPassword = String(values.confirmPassword ?? '')
  const agreeToTerms = Boolean(values.agreeToTerms)

  if (!username) {
    errors.username = [{ message: '請輸入跑者名稱' }]
  } else if (username.length < 2 || username.length > 20) {
    errors.username = [{ message: '跑者名稱需要 2 到 20 個字元' }]
  }

  if (!email) {
    errors.email = [{ message: '請輸入電子信箱' }]
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = [{ message: '請輸入正確的電子信箱格式' }]
  }

  if (!password) {
    errors.password = [{ message: '請輸入密碼' }]
  } else if (password.length < 8) {
    errors.password = [{ message: '密碼至少需要 8 個字元' }]
  }

  if (!confirmPassword) {
    errors.confirmPassword = [{ message: '請再次輸入密碼' }]
  } else if (confirmPassword !== password) {
    errors.confirmPassword = [{ message: '兩次輸入的密碼不一致' }]
  }

  if (!agreeToTerms) {
    errors.agreeToTerms = [{ message: '請先閱讀並同意服務條款' }]
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

const handleLogin = async (event: FormSubmitEvent) => {
  loginSuccessMessage.value = ''
  loginErrorMessage.value = ''

  if (!event.valid) return

  const values = getFormValues(event)
  const email = String(values.email ?? '').trim()
  const rememberEmail = Boolean(values.rememberEmail)
  const keepSignedIn = Boolean(values.keepSignedIn)

  isLoggingIn.value = true

  try {
    const response = await login({
      email,
      password: String(values.password ?? ''),
    })

    if (rememberEmail) {
      localStorage.setItem(rememberedEmailKey, email)
    } else {
      localStorage.removeItem(rememberedEmailKey)
    }

    authStore.setAuth({
      token: response.token,
      user: response.user,
      keepSignedIn,
    })

    loginSuccessMessage.value = response.message

    await router.push('/home')
  } catch (error: unknown) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      loginErrorMessage.value = error.response?.data.message ?? '無法登入，請稍後再試'
    } else {
      loginErrorMessage.value = '發生未預期的錯誤，請稍後再試'
    }
  } finally {
    isLoggingIn.value = false
  }
}

const handleRegister = async (event: FormSubmitEvent) => {
  registerSuccessMessage.value = ''
  registerErrorMessage.value = ''

  if (!event.valid) return

  const values = getFormValues(event)
  const registeredEmail = String(values.email ?? '').trim()

  isRegistering.value = true

  try {
    const response = await register({
      username: String(values.username ?? '').trim(),
      email: registeredEmail,
      password: String(values.password ?? ''),
    })

    registerSuccessMessage.value = response.message
    event.reset()

    loginInitialValues.value = {
      email: registeredEmail,
      password: '',
      rememberEmail: false,
      keepSignedIn: false,
    }
    loginSuccessMessage.value = `${response.message}，請登入帳號`
    loginErrorMessage.value = ''
    loginFormKey.value += 1
    activeTab.value = 'login'
  } catch (error: unknown) {
    if (isAxiosError<ApiErrorResponse>(error)) {
      registerErrorMessage.value = error.response?.data.message ?? '無法建立帳號，請稍後再試'
    } else {
      registerErrorMessage.value = '發生未預期的錯誤，請稍後再試'
    }
  } finally {
    isRegistering.value = false
  }
}
</script>

<template>
  <AccountPageLayout description="歡迎來到跑者菲迪，請登入或註冊新手跑者帳號。">
    <div class="account-tabs">
      <div class="segmented-control" role="group" aria-label="登入或註冊">
        <span
          class="segmented-control__indicator"
          :class="{ 'segmented-control__indicator--register': activeTab === 'register' }"
          aria-hidden="true"
        ></span>

        <button
          id="account-login-option"
          class="segmented-control__option"
          type="button"
          :aria-pressed="activeTab === 'login'"
          aria-controls="account-login-panel"
          @click="activeTab = 'login'"
        >
          <span class="segmented-control__label">登入</span>
        </button>

        <button
          id="account-register-option"
          class="segmented-control__option"
          type="button"
          :aria-pressed="activeTab === 'register'"
          aria-controls="account-register-panel"
          @click="activeTab = 'register'"
        >
          <span class="segmented-control__label">註冊</span>
        </button>
      </div>

      <div class="account-tabpanels">
        <div
          v-show="activeTab === 'login'"
          id="account-login-panel"
          class="account-tabpanel"
          role="region"
          aria-labelledby="account-login-option"
        >
          <Form
            :key="loginFormKey"
            v-slot="$form"
            :initial-values="loginInitialValues"
            :resolver="loginResolver"
            :validate-on-value-update="false"
            :validate-on-blur="true"
            class="account-form"
            @submit="handleLogin"
          >
            <div class="form-field">
              <label for="login-email" class="form-field__label"> 電子信箱 </label>

              <InputText
                id="login-email"
                name="email"
                type="email"
                autocomplete="email"
                placeholder="pheidi@runner.com"
                :aria-invalid="$form.email?.invalid || undefined"
                :aria-describedby="$form.email?.invalid ? 'login-email-error' : undefined"
                fluid
              />
              <Message
                v-if="$form.email?.invalid"
                id="login-email-error"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.email.error?.message }}
              </Message>
            </div>

            <div class="form-field">
              <label for="login-password" class="form-field__label"> 密碼 </label>

              <Password
                input-id="login-password"
                name="password"
                autocomplete="current-password"
                placeholder="請輸入密碼"
                :feedback="false"
                :invalid="$form.password?.invalid"
                :input-props="{
                  'aria-describedby': $form.password?.invalid ? 'login-password-error' : undefined,
                }"
                toggle-mask
                fluid
              />
              <Message
                v-if="$form.password?.invalid"
                id="login-password-error"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.password.error?.message }}
              </Message>
            </div>

            <div class="account-form__preferences">
              <div class="login-preferences">
                <div class="login-preference">
                  <Checkbox input-id="remember-email" name="rememberEmail" binary />

                  <label for="remember-email">記住電子信箱</label>
                </div>

                <div class="login-preference">
                  <Checkbox input-id="keep-signed-in" name="keepSignedIn" binary />

                  <label for="keep-signed-in">維持登入狀態</label>
                </div>
              </div>

              <RouterLink class="account-link" to="/forgot-password"> 忘記密碼？ </RouterLink>
            </div>

            <Message
              v-if="loginSuccessMessage"
              severity="success"
              size="small"
              variant="simple"
              aria-live="polite"
            >
              {{ loginSuccessMessage }}
            </Message>

            <Message
              v-if="loginErrorMessage"
              severity="error"
              size="small"
              variant="simple"
              aria-live="polite"
            >
              {{ loginErrorMessage }}
            </Message>

            <BaseButton
              class="account-submit"
              type="submit"
              label="登入"
              :loading="isLoggingIn"
              :disabled="isLoggingIn"
              fluid
            />
          </Form>
        </div>

        <div
          v-show="activeTab === 'register'"
          id="account-register-panel"
          class="account-tabpanel"
          role="region"
          aria-labelledby="account-register-option"
        >
          <Form
            v-slot="$form"
            :initial-values="registerInitialValues"
            :resolver="registerResolver"
            :validate-on-value-update="false"
            :validate-on-blur="true"
            class="account-form"
            @submit="handleRegister"
          >
            <div class="form-field">
              <label for="runner-name" class="form-field__label"> 跑者名稱 </label>

              <InputText
                id="runner-name"
                name="username"
                type="text"
                autocomplete="nickname"
                placeholder="請輸入跑者名稱"
                :maxlength="20"
                :aria-invalid="$form.username?.invalid || undefined"
                :aria-describedby="$form.username?.invalid ? 'register-username-error' : undefined"
                fluid
              />
              <Message
                v-if="$form.username?.invalid"
                id="register-username-error"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.username.error?.message }}
              </Message>
            </div>

            <div class="form-field">
              <label for="register-email" class="form-field__label"> 電子信箱 </label>

              <InputText
                id="register-email"
                name="email"
                type="email"
                autocomplete="email"
                placeholder="runner@example.com"
                :aria-invalid="$form.email?.invalid || undefined"
                :aria-describedby="$form.email?.invalid ? 'register-email-error' : undefined"
                fluid
              />
              <Message
                v-if="$form.email?.invalid"
                id="register-email-error"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.email.error?.message }}
              </Message>
            </div>

            <div class="form-field">
              <label for="register-password" class="form-field__label"> 密碼 </label>

              <Password
                input-id="register-password"
                name="password"
                autocomplete="new-password"
                placeholder="請設定密碼"
                :feedback="false"
                :invalid="$form.password?.invalid"
                :input-props="{
                  'aria-describedby': $form.password?.invalid
                    ? 'register-password-error'
                    : undefined,
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
                id="register-password-error"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.password.error?.message }}
              </Message>
            </div>

            <div class="form-field">
              <label for="confirm-password" class="form-field__label"> 確認密碼 </label>

              <Password
                input-id="confirm-password"
                name="confirmPassword"
                autocomplete="new-password"
                placeholder="請再次輸入密碼"
                :feedback="false"
                :invalid="$form.confirmPassword?.invalid"
                :input-props="{
                  'aria-describedby': $form.confirmPassword?.invalid
                    ? 'register-confirm-password-error'
                    : undefined,
                }"
                toggle-mask
                fluid
              />
              <Message
                v-if="$form.confirmPassword?.invalid"
                id="register-confirm-password-error"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.confirmPassword.error?.message }}
              </Message>
            </div>

            <div class="form-field">
              <div class="terms-option">
                <Checkbox
                  input-id="agree-to-terms"
                  name="agreeToTerms"
                  binary
                  :invalid="$form.agreeToTerms?.invalid"
                  :pt="{
                    input: {
                      'aria-describedby': $form.agreeToTerms?.invalid
                        ? 'agree-to-terms-error'
                        : undefined,
                    },
                  }"
                />

                <label for="agree-to-terms">
                  我已閱讀並同意
                  <RouterLink
                    to="/terms"
                    class="account-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    服務條款
                  </RouterLink>
                </label>
              </div>

              <Message
                v-if="$form.agreeToTerms?.invalid"
                id="agree-to-terms-error"
                severity="error"
                size="small"
                variant="simple"
              >
                {{ $form.agreeToTerms.error?.message }}
              </Message>
            </div>

            <Message
              v-if="registerSuccessMessage"
              severity="success"
              size="small"
              variant="simple"
              aria-live="polite"
            >
              {{ registerSuccessMessage }}
            </Message>

            <Message
              v-if="registerErrorMessage"
              severity="error"
              size="small"
              variant="simple"
              aria-live="polite"
            >
              {{ registerErrorMessage }}
            </Message>

            <BaseButton
              class="account-submit"
              type="submit"
              label="建立帳號"
              :loading="isRegistering"
              :disabled="isRegistering"
              fluid
            />
          </Form>
        </div>
      </div>
    </div>
  </AccountPageLayout>
</template>

<style scoped>
.account-tabs {
  width: 100%;
  background: transparent;
}

.segmented-control {
  position: relative;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: 100%;
  height: var(--account-control-height);
  overflow: hidden;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-full);
  background: transparent;
}

.segmented-control__indicator {
  position: absolute;
  inset-block: 0;
  inset-inline-start: 0;
  width: 50%;
  border-radius: var(--radius-full);
  background: linear-gradient(90deg, var(--color-primary), var(--color-primary-soft));
  pointer-events: none;
  transform: translateX(0);
  transition: transform 300ms cubic-bezier(0.2, 0, 0, 1);
}

.segmented-control__indicator--register {
  transform: translateX(100%);
}

.segmented-control__option {
  position: relative;
  z-index: 1;
  padding: 0 var(--space-4);
  border: 0;
  border-radius: var(--radius-full);
  color: var(--color-dark-light);
  background: transparent;
  font-family: var(--font-family-base);
  font-size: inherit;
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-base);
  cursor: pointer;
  transition: color 150ms ease;
}

.segmented-control__label {
  font-size: var(--font-size-sm);
}

.segmented-control__option[aria-pressed='true'] {
  color: var(--color-surface);
}

.segmented-control__option:focus-visible {
  outline: 2px solid var(--color-dark-light);
  outline-offset: -3px;
}

.account-tabpanels {
  padding: var(--space-5) 0 0;
  background: transparent;
}

.account-tabs :deep(.p-checkbox),
.account-tabs :deep(.p-checkbox-input),
.account-tabs :deep(.p-checkbox-box) {
  border-radius: var(--radius-full);
}

.account-tabs :deep(.p-checkbox:not(.p-checkbox-checked) .p-checkbox-box) {
  background: transparent;
}

.account-form__preferences {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-4);
}

.login-preferences {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.login-preference {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.login-preference label {
  cursor: pointer;
}

.terms-option {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.terms-option label {
  line-height: var(--line-height-heading);
  cursor: pointer;
}

@media (prefers-reduced-motion: reduce) {
  .segmented-control__indicator {
    transition: none;
  }
}
</style>
