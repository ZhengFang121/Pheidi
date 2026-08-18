<script setup lang="ts">
import { Form, type FormSubmitEvent } from '@primevue/forms'
import { isAxiosError } from 'axios'
import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import api from '@/services/api'

interface AuthUser {
  id: string
  username: string
  email: string
  role: 'player' | 'admin'
}

interface RegisterResponse {
  message: string
  user: AuthUser
}

interface LoginResponse {
  message: string
  token: string
  user: AuthUser
}

interface ApiErrorResponse {
  message?: string
}

const authTokenKey = 'pheidi_auth_token'
const authUserKey = 'pheidi_auth_user'

const router = useRouter()

const isLoggingIn = ref(false)
const loginSuccessMessage = ref('')
const loginErrorMessage = ref('')
const isRegistering = ref(false)
const registerSuccessMessage = ref('')
const registerErrorMessage = ref('')

const loginInitialValues = {
  email: '',
  password: '',
  remember: false,
}

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
  const remember = Boolean(values.remember)

  isLoggingIn.value = true

  try {
    const response = await api.post<LoginResponse>('/users/login', {
      email: String(values.email ?? '').trim(),
      password: String(values.password ?? ''),
    })

    localStorage.removeItem(authTokenKey)
    localStorage.removeItem(authUserKey)
    sessionStorage.removeItem(authTokenKey)
    sessionStorage.removeItem(authUserKey)

    const storage = remember ? localStorage : sessionStorage

    storage.setItem(authTokenKey, response.data.token)
    storage.setItem(authUserKey, JSON.stringify(response.data.user))

    loginSuccessMessage.value = response.data.message

    await router.push('/')
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

  isRegistering.value = true

  try {
    const response = await api.post<RegisterResponse>('/users', {
      username: String(values.username ?? '').trim(),
      email: String(values.email ?? '').trim(),
      password: String(values.password ?? ''),
    })

    registerSuccessMessage.value = response.data.message
    event.reset()
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
  <main class="login-page">
    <section class="account-card">
      <header class="account-card__header">
        <h1 class="account-card__title">歡迎來到跑者菲迪</h1>

        <p class="account-card__description">登入帳號，或建立新的跑者身分。</p>
      </header>

      <Tabs value="login" class="account-tabs">
        <TabList>
          <Tab value="login">登入</Tab>
          <Tab value="register">註冊</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="login">
            <Form
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

              <div class="form-field">
                <label for="login-password" class="form-field__label"> 密碼 </label>

                <Password
                  input-id="login-password"
                  name="password"
                  autocomplete="current-password"
                  placeholder="請輸入密碼"
                  :feedback="false"
                  toggle-mask
                  fluid
                />
                <Message
                  v-if="$form.password?.invalid"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ $form.password.error?.message }}
                </Message>
              </div>

              <div class="account-form__options">
                <div class="remember-option">
                  <Checkbox input-id="remember" name="remember" binary />

                  <label for="remember">記住我</label>
                </div>

                <button class="forgot-password" type="button">忘記密碼？</button>
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

              <Button
                class="account-submit"
                type="submit"
                label="登入"
                :loading="isLoggingIn"
                :disabled="isLoggingIn"
                fluid
              />
            </Form>
          </TabPanel>

          <TabPanel value="register">
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
                  fluid
                />
                <Message
                  v-if="$form.username?.invalid"
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

              <div class="form-field">
                <label for="register-password" class="form-field__label"> 密碼 </label>

                <Password
                  input-id="register-password"
                  name="password"
                  autocomplete="new-password"
                  placeholder="請設定密碼"
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
                <label for="confirm-password" class="form-field__label"> 確認密碼 </label>

                <Password
                  input-id="confirm-password"
                  name="confirmPassword"
                  autocomplete="new-password"
                  placeholder="請再次輸入密碼"
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

              <div class="form-field">
                <div class="terms-option">
                  <Checkbox input-id="agree-to-terms" name="agreeToTerms" binary />

                  <label for="agree-to-terms">
                    我已閱讀並同意
                    <button class="terms-link" type="button">服務條款</button>
                  </label>
                </div>

                <Message
                  v-if="$form.agreeToTerms?.invalid"
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

              <Button
                class="account-submit"
                type="submit"
                label="建立帳號"
                :loading="isRegistering"
                :disabled="isRegistering"
                fluid
              />
            </Form>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </section>
  </main>
</template>

<style scoped>
.login-page {
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

.account-tabs {
  width: 100%;
}

.account-tabs__placeholder {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  text-align: center;
}

/* PrimeVue Tabs 樣式 */
.account-tabs :deep(.p-tablist-tab-list) {
  border-color: var(--color-border);
}

.account-tabs :deep(.p-tab) {
  flex: 1;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  color: var(--color-text-secondary);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-base);
}

.account-tabs :deep(.p-tab[data-p-active='true']) {
  color: var(--color-dark);
  border-color: var(--color-primary);
}

.account-tabs :deep(.p-tabpanels) {
  padding: var(--space-5) 0 0;
  background-color: transparent;
}

.account-form {
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

.account-form__options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.remember-option {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.remember-option label {
  cursor: pointer;
}

.forgot-password {
  padding: 0;
  border: 0;
  color: var(--color-dark-light);
  background: transparent;
  font-family: inherit;
  font-size: var(--font-size-sm);
  letter-spacing: inherit;
  cursor: pointer;
}

.forgot-password:hover {
  color: var(--color-dark);
  text-decoration: underline;
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

.terms-link {
  padding: 0;
  border: 0;
  color: var(--color-dark-light);
  background: transparent;
  font-family: inherit;
  font-size: inherit;
  font-weight: var(--font-weight-medium);
  letter-spacing: inherit;
  cursor: pointer;
}

.terms-link:hover {
  color: var(--color-dark);
  text-decoration: underline;
}

.account-submit {
  margin-top: var(--space-2);
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
  border-color: color-mix(in srgb, var(--color-primary) 85%, var(--color-dark));
  background-color: color-mix(in srgb, var(--color-primary) 85%, var(--color-dark));
  color: var(--color-surface);
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

@media (max-width: 480px) {
  .login-page {
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
