<script setup lang="ts">
import { computed, ref } from "vue";
import { isAxiosError } from "axios";
import InputText from "primevue/inputtext";
import Message from "primevue/message";
import Password from "primevue/password";
import { CircleUserRound, KeyRound, UserRound } from "@lucide/vue";

import BaseButton from "@/components/base/BaseButton.vue";
import BaseCard from "@/components/base/BaseCard.vue";
import { updatePassword, updateProfile } from "@/services/auth";
import { useAuthStore } from "@/stores/auth";

type AccountSection = "profile" | "security";

const authStore = useAuthStore();
const activeSection = ref<AccountSection>("profile");
const username = ref(authStore.user?.username ?? "");
const email = ref(authStore.user?.email ?? "");
const emailTouched = ref(false);
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const currentPasswordTouched = ref(false);
const newPasswordTouched = ref(false);
const confirmPasswordTouched = ref(false);
const isProfileSubmitting = ref(false);
const isPasswordSubmitting = ref(false);
const profileMessage = ref("");
const profileMessageSeverity = ref<"success" | "error">("success");
const passwordMessage = ref("");
const passwordMessageSeverity = ref<"success" | "error">("success");

const displayInitial = computed(
  () => authStore.user?.username.trim().charAt(0).toUpperCase() || "R",
);
const roleLabel = computed(() =>
  authStore.user?.role === "admin" ? "管理員" : "跑者",
);
const emailError = computed(() => {
  if (!emailTouched.value) return "";

  const normalizedEmail = email.value.trim();

  if (!normalizedEmail) return "請輸入電子信箱";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    return "請輸入正確的電子信箱格式";
  }

  return "";
});
const currentPasswordError = computed(() => {
  if (!currentPasswordTouched.value) return "";
  if (!currentPassword.value) return "請輸入目前密碼";

  return "";
});
const newPasswordError = computed(() => {
  if (!newPasswordTouched.value) return "";
  if (!newPassword.value) return "請輸入密碼";
  if (newPassword.value.length < 8) return "密碼至少需要 8 個字元";

  return "";
});
const confirmPasswordError = computed(() => {
  if (!confirmPasswordTouched.value) return "";
  if (!confirmPassword.value) return "請再次輸入密碼";
  if (confirmPassword.value !== newPassword.value)
    return "兩次輸入的密碼不一致";

  return "";
});

const getPasswordStrength = (password: string) => {
  if (password.length < 8) {
    return { level: "weak", label: "密碼強度較弱" };
  }

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasLetter && hasNumber && hasSymbol) {
    return { level: "strong", label: "密碼強度良好" };
  }

  return { level: "medium", label: "密碼強度中等" };
};

function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError<{ message?: string }>(error)) {
    return error.response?.data.message ?? fallback;
  }

  return fallback;
}

async function handleProfileSubmit() {
  profileMessage.value = "";
  const normalizedUsername = username.value.trim();
  const normalizedEmail = email.value.trim().toLowerCase();
  emailTouched.value = true;

  if (normalizedUsername.length < 2 || normalizedUsername.length > 20) {
    profileMessageSeverity.value = "error";
    profileMessage.value = "跑者名稱需要 2 到 20 個字元";
    return;
  }

  if (emailError.value) return;

  isProfileSubmitting.value = true;

  try {
    const response = await updateProfile({
      username: normalizedUsername,
      email: normalizedEmail,
    });

    authStore.updateUser(response.user);
    username.value = response.user.username;
    email.value = response.user.email;
    profileMessageSeverity.value = "success";
    profileMessage.value = response.message;
  } catch (error: unknown) {
    profileMessageSeverity.value = "error";
    profileMessage.value = getErrorMessage(
      error,
      "更新基本資料失敗，請稍後再試",
    );
  } finally {
    isProfileSubmitting.value = false;
  }
}

async function handlePasswordSubmit() {
  passwordMessage.value = "";
  currentPasswordTouched.value = true;
  newPasswordTouched.value = true;
  confirmPasswordTouched.value = true;

  if (
    currentPasswordError.value ||
    newPasswordError.value ||
    confirmPasswordError.value
  )
    return;

  isPasswordSubmitting.value = true;

  try {
    const response = await updatePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    });

    currentPassword.value = "";
    newPassword.value = "";
    confirmPassword.value = "";
    currentPasswordTouched.value = false;
    newPasswordTouched.value = false;
    confirmPasswordTouched.value = false;
    passwordMessageSeverity.value = "success";
    passwordMessage.value = response.message;
  } catch (error: unknown) {
    passwordMessageSeverity.value = "error";
    passwordMessage.value = getErrorMessage(error, "更新密碼失敗，請稍後再試");
  } finally {
    isPasswordSubmitting.value = false;
  }
}
</script>

<template>
  <section class="account-page">
    <div class="layout-container account-container">
      <header class="page-heading">
        <p class="page-eyebrow">ACCOUNT SETTINGS</p>
        <h2 class="page-title">帳號設定</h2>
        <p class="page-description">管理你的跑者資料與登入安全設定。</p>
      </header>

      <div class="account-layout">
        <BaseCard as="aside" class="account-sidebar" aria-label="帳號管理導覽">
          <div class="runner-summary">
            <div class="runner-avatar" aria-hidden="true">
              {{ displayInitial }}
            </div>
            <div>
              <strong>{{ authStore.user?.username }}</strong>
              <span>{{ roleLabel }}</span>
            </div>
          </div>

          <nav class="account-navigation">
            <button
              type="button"
              :class="{ 'is-active': activeSection === 'profile' }"
              @click="activeSection = 'profile'"
            >
              <UserRound aria-hidden="true" />
              <span>基本資料</span>
            </button>
            <button
              type="button"
              :class="{ 'is-active': activeSection === 'security' }"
              @click="activeSection = 'security'"
            >
              <KeyRound aria-hidden="true" />
              <span>帳號安全</span>
            </button>
          </nav>
        </BaseCard>

        <BaseCard as="main" class="settings-card">
          <form
            v-if="activeSection === 'profile'"
            novalidate
            @submit.prevent="handleProfileSubmit"
          >
            <div class="section-heading">
              <div class="section-icon">
                <CircleUserRound aria-hidden="true" />
              </div>
              <div>
                <h2>基本資料</h2>
                <p>這些資料會用於你的跑者身分與帳號聯絡。</p>
              </div>
            </div>

            <Message
              v-if="profileMessage"
              :severity="profileMessageSeverity"
              :closable="false"
            >
              {{ profileMessage }}
            </Message>

            <div class="form-fields">
              <div class="form-field">
                <label for="account-username">跑者名稱</label>
                <InputText
                  id="account-username"
                  v-model="username"
                  autocomplete="username"
                />
              </div>
              <div class="form-field">
                <label for="account-email">電子信箱</label>
                <InputText
                  id="account-email"
                  v-model="email"
                  type="email"
                  autocomplete="email"
                  :invalid="Boolean(emailError)"
                  aria-describedby="account-email-error"
                  @blur="emailTouched = true"
                />
                <Message
                  v-if="emailError"
                  id="account-email-error"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ emailError }}
                </Message>
              </div>
            </div>

            <div class="form-actions">
              <BaseButton
                type="submit"
                label="儲存變更"
                icon="pi pi-check"
                :loading="isProfileSubmitting"
                :disabled="isProfileSubmitting"
              />
            </div>
          </form>

          <form v-else novalidate @submit.prevent="handlePasswordSubmit">
            <div class="section-heading">
              <div class="section-icon"><KeyRound aria-hidden="true" /></div>
              <div>
                <h2>帳號安全</h2>
                <p>定期更新密碼，讓你的跑者旅程更加安全。</p>
              </div>
            </div>

            <Message
              v-if="passwordMessage"
              :severity="passwordMessageSeverity"
              :closable="false"
            >
              {{ passwordMessage }}
            </Message>

            <div class="form-fields">
              <div class="form-field">
                <label for="current-password">目前密碼</label>
                <Password
                  v-model="currentPassword"
                  input-id="current-password"
                  :feedback="false"
                  :invalid="Boolean(currentPasswordError)"
                  toggle-mask
                  autocomplete="current-password"
                  aria-describedby="current-password-error"
                  @blur="currentPasswordTouched = true"
                />
                <Message
                  v-if="currentPasswordError"
                  id="current-password-error"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ currentPasswordError }}
                </Message>
              </div>
              <div class="form-field">
                <label for="new-password">新密碼</label>
                <Password
                  v-model="newPassword"
                  input-id="new-password"
                  :feedback="false"
                  :invalid="Boolean(newPasswordError)"
                  toggle-mask
                  autocomplete="new-password"
                  aria-describedby="new-password-error"
                  @blur="newPasswordTouched = true"
                />
                <div
                  v-if="newPassword"
                  class="password-strength"
                  aria-live="polite"
                >
                  <div class="password-strength__track">
                    <span
                      class="password-strength__bar"
                      :class="`password-strength__bar--${getPasswordStrength(newPassword).level}`"
                    ></span>
                  </div>
                  <span class="password-strength__label">
                    {{ getPasswordStrength(newPassword).label }}
                  </span>
                </div>
                <Message
                  v-if="newPasswordError"
                  id="new-password-error"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ newPasswordError }}
                </Message>
              </div>
              <div class="form-field">
                <label for="confirm-password">再次輸入新密碼</label>
                <Password
                  v-model="confirmPassword"
                  input-id="confirm-password"
                  :feedback="false"
                  :invalid="Boolean(confirmPasswordError)"
                  toggle-mask
                  autocomplete="new-password"
                  aria-describedby="confirm-password-error"
                  @blur="confirmPasswordTouched = true"
                />
                <Message
                  v-if="confirmPasswordError"
                  id="confirm-password-error"
                  severity="error"
                  size="small"
                  variant="simple"
                >
                  {{ confirmPasswordError }}
                </Message>
              </div>
            </div>

            <div class="form-actions">
              <BaseButton
                type="submit"
                label="更新密碼"
                icon="pi pi-lock"
                :loading="isPasswordSubmitting"
                :disabled="isPasswordSubmitting"
              />
            </div>
          </form>
        </BaseCard>
      </div>
    </div>
  </section>
</template>

<style scoped>
.account-page {
  min-height: 700px;
  padding-block: var(--space-7) var(--space-8);
}
.account-container {
  max-width: 1200px;
}
.page-heading {
  margin-bottom: var(--space-6);
}
.page-eyebrow {
  margin: 0 0 var(--space-1);
  color: var(--color-dark-light);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}
.section-heading h2,
.section-heading p {
  margin: 0;
}
.page-title {
  margin: 0 0 var(--space-2);
  color: var(--color-text);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  line-height: var(--line-height-heading);
}
.page-description {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}
.account-layout {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: var(--space-6);
  align-items: start;
}
.account-sidebar,
.settings-card {
  border-radius: var(--radius-lg);
}
.account-sidebar {
  padding: var(--space-5);
}
.runner-summary {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.runner-avatar {
  display: grid;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  place-items: center;
  color: var(--color-dark);
  background: var(--color-primary-pale);
  border-radius: var(--radius-full);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-bold);
}
.runner-summary strong,
.runner-summary span {
  display: block;
}
.runner-summary strong {
  overflow: hidden;
  max-width: 160px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.runner-summary span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.account-navigation {
  display: grid;
  gap: var(--space-2);
  padding-top: var(--space-4);
}
.account-navigation button {
  display: flex;
  gap: var(--space-3);
  align-items: center;
  width: 100%;
  padding: var(--space-3) var(--space-4);
  color: var(--color-dark-light);
  background: transparent;
  border: 0;
  border-radius: var(--radius-md);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition:
    color 0.2s ease,
    background-color 0.2s ease;
}
.account-navigation button:hover,
.account-navigation button.is-active {
  color: var(--color-surface);
  background: var(--color-primary-light);
}
.account-navigation svg {
  width: 20px;
  height: 20px;
}
.settings-card {
  min-height: 520px;
  padding: var(--space-6);
}
.section-heading {
  display: flex;
  gap: var(--space-4);
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-5);
  border-bottom: 1px solid var(--color-border);
}
.section-icon {
  display: grid;
  flex: 0 0 48px;
  width: 48px;
  height: 48px;
  place-items: center;
  color: var(--color-primary);
  background: var(--color-primary-pale);
  border-radius: var(--radius-md);
}
.section-icon svg {
  width: 24px;
  height: 24px;
}
.section-heading h2 {
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}
.section-heading p {
  margin-top: var(--space-1);
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}
.form-fields {
  display: grid;
  gap: var(--space-5);
  max-width: 620px;
  margin-top: var(--space-5);
}
.form-field {
  display: grid;
  gap: var(--space-2);
}
.form-field label {
  font-weight: var(--font-weight-medium);
}
.form-field small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}
:deep(.form-field .p-inputtext),
:deep(.form-field .p-password),
:deep(.form-field .p-password-input) {
  width: 100%;
}
:deep(.form-field .p-inputtext) {
  padding: var(--space-3) var(--space-4);
  font-family: var(--font-family-base);
  letter-spacing: var(--letter-spacing-tight);
  border-color: var(--color-border);
  border-radius: var(--radius-md);
}
:deep(.form-field .p-inputtext:enabled:focus) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-pale);
}
:deep(.form-field .p-inputtext.p-invalid) {
  border-color: var(--color-error);
}
:deep(.form-field .p-inputtext.p-invalid:enabled:focus) {
  border-color: var(--color-error);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-error) 18%, transparent);
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
  border-radius: var(--radius-full);
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
.form-actions {
  display: flex;
  justify-content: center;
  margin-top: var(--space-7);
  padding-top: var(--space-5);
  border-top: 1px solid var(--color-border);
}
:deep(.form-actions .p-button) {
  border-color: var(--color-primary);
  background-color: var(--color-primary);
  color: var(--color-surface);
  font-family: var(--font-family-base);
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-base);
}
:deep(.form-actions .p-button:hover) {
  border-color: color-mix(in srgb, var(--color-primary) 85%, var(--color-dark));
  background-color: color-mix(
    in srgb,
    var(--color-primary) 85%,
    var(--color-dark)
  );
  color: var(--color-surface);
}
@media (max-width: 768px) {
  .account-page {
    padding-block: var(--space-6);
  }
  .page-title {
    font-size: var(--font-size-lg);
  }
  .account-layout {
    grid-template-columns: 1fr;
  }
  .account-navigation {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .settings-card {
    min-height: auto;
    padding: var(--space-5);
  }
}
@media (max-width: 480px) {
  .account-navigation {
    grid-template-columns: 1fr;
  }
  .section-heading {
    align-items: flex-start;
  }
  .form-actions :deep(.p-button) {
    width: 100%;
  }
}
</style>
