<template>
  <form class="article-form" @submit.prevent="handleSubmit">
    <Message
      v-if="errorMessage"
      severity="error"
      :closable="false"
    >
      {{ errorMessage }}
    </Message>

    <div class="form-grid">
      <div class="form-field form-field--wide">
        <label for="article-title" class="form-label">
          文章標題
        </label>

        <InputText
          id="article-title"
          v-model="form.title"
          maxlength="100"
          placeholder="輸入文章標題"
          :invalid="Boolean(fieldErrors.title)"
          fluid
        />

        <small v-if="fieldErrors.title" class="field-error">
          {{ fieldErrors.title }}
        </small>
      </div>

      <div class="form-field">
        <label for="article-slug" class="form-label">
          網址識別
        </label>

        <InputText
          id="article-slug"
          v-model="form.slug"
          maxlength="120"
          placeholder="beginner-running-guide"
          :invalid="Boolean(fieldErrors.slug)"
          fluid
        />

        <small class="field-hint">
          只能使用小寫英文字母、數字與連字號。
        </small>

        <small v-if="fieldErrors.slug" class="field-error">
          {{ fieldErrors.slug }}
        </small>
      </div>

      <div class="form-field">
        <label for="article-category" class="form-label">
          文章分類
        </label>

        <Select
          id="article-category"
          v-model="form.category"
          :options="categoryOptions"
          option-label="label"
          option-value="value"
          fluid
        />
      </div>

      <div class="form-field form-field--full">
        <label for="article-summary" class="form-label">
          文章摘要
        </label>

        <Textarea
          id="article-summary"
          v-model="form.summary"
          rows="3"
          maxlength="300"
          placeholder="簡短說明文章內容，最多 300 個字元"
          :invalid="Boolean(fieldErrors.summary)"
          fluid
        />

        <div class="field-footer">
          <small v-if="fieldErrors.summary" class="field-error">
            {{ fieldErrors.summary }}
          </small>

          <small class="character-count">
            {{ form.summary.length }} / 300
          </small>
        </div>
      </div>

      <div class="form-field form-field--full">
        <label for="article-cover-image" class="form-label">
          封面圖片網址
        </label>

        <InputText
          id="article-cover-image"
          v-model="form.coverImageUrl"
          type="url"
          placeholder="https://example.com/images/article-cover.jpg"
          :invalid="Boolean(fieldErrors.coverImageUrl)"
          fluid
        />

        <small class="field-hint">
          目前先使用 HTTP 或 HTTPS 圖片網址，之後再串接圖片上傳。
        </small>

        <small
          v-if="fieldErrors.coverImageUrl"
          class="field-error"
        >
          {{ fieldErrors.coverImageUrl }}
        </small>
      </div>

      <div class="form-field form-field--full">
        <label class="form-label">
          文章內容
        </label>

        <Editor
          v-model="form.content"
          class="article-editor"
          :class="{
            'article-editor--invalid': fieldErrors.content,
          }"
        >
          <template #toolbar>
            <span class="ql-formats">
              <select class="ql-header">
                <option value="2">標題 2</option>
                <option value="3">標題 3</option>
                <option selected>內文</option>
              </select>
            </span>

            <span class="ql-formats">
              <button class="ql-bold" type="button" />
              <button class="ql-italic" type="button" />
              <button class="ql-underline" type="button" />
              <button class="ql-strike" type="button" />
            </span>

            <span class="ql-formats">
              <button
                class="ql-list"
                value="ordered"
                type="button"
              />
              <button
                class="ql-list"
                value="bullet"
                type="button"
              />
              <button class="ql-blockquote" type="button" />
            </span>

            <span class="ql-formats">
              <button class="ql-link" type="button" />
              <button class="ql-clean" type="button" />
            </span>
          </template>
        </Editor>

        <small v-if="fieldErrors.content" class="field-error">
          {{ fieldErrors.content }}
        </small>
      </div>
    </div>

    <div class="form-actions">
      <Button
        type="button"
        label="取消"
        severity="secondary"
        outlined
        :disabled="isSubmitting"
        @click="emit('cancel')"
      />

      <Button
        type="submit"
        :label="submitLabel"
        :loading="isSubmitting"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

import Button from 'primevue/button'
import Editor from 'primevue/editor'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'

import type {
  AdminArticleCategory,
  AdminArticleFormPayload,
} from '@/services/admin'

interface CategoryOption {
  label: string
  value: AdminArticleCategory
}

interface Props {
  initialValue?: AdminArticleFormPayload
  submitLabel?: string
  isSubmitting?: boolean
  errorMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  initialValue: () => ({
    title: '',
    slug: '',
    summary: '',
    content: '',
    category: 'learning',
    coverImageUrl: '',
  }),
  submitLabel: '儲存草稿',
  isSubmitting: false,
  errorMessage: '',
})

const emit = defineEmits<{
  submit: [payload: AdminArticleFormPayload]
  cancel: []
}>()

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

const categoryOptions: CategoryOption[] = [
  {
    label: '學習',
    value: 'learning',
  },
  {
    label: '裝備',
    value: 'equipment',
  },
  {
    label: '補給',
    value: 'nutrition',
  },
  {
    label: '賽事',
    value: 'events',
  },
]

const form = reactive<AdminArticleFormPayload>({
  title: '',
  slug: '',
  summary: '',
  content: '',
  category: 'learning',
  coverImageUrl: '',
})

const fieldErrors = reactive<
  Partial<Record<keyof AdminArticleFormPayload, string>>
>({})

const clearFieldErrors = () => {
  for (const field of Object.keys(fieldErrors)) {
    delete fieldErrors[
      field as keyof AdminArticleFormPayload
    ]
  }
}

const isValidHttpUrl = (value: string) => {
  try {
    const url = new URL(value)

    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

const getPlainTextContent = (html: string) => {
  const container = document.createElement('div')
  container.innerHTML = html

  return container.textContent?.replace(/\u00a0/g, ' ').trim() ?? ''
}

const validateForm = () => {
  clearFieldErrors()

  const normalizedTitle = form.title.trim()
  const normalizedSlug = form.slug.trim().toLowerCase()
  const normalizedSummary = form.summary.trim()
  const normalizedCoverImageUrl = form.coverImageUrl.trim()

  if (normalizedTitle.length < 2) {
    fieldErrors.title = '文章標題至少需要 2 個字元'
  }

  if (!slugPattern.test(normalizedSlug)) {
    fieldErrors.slug =
      '網址識別只能包含小寫英文字母、數字與連字號'
  }

  if (!normalizedSummary) {
    fieldErrors.summary = '請填寫文章摘要'
  }

  if (
    normalizedCoverImageUrl &&
    !isValidHttpUrl(normalizedCoverImageUrl)
  ) {
    fieldErrors.coverImageUrl = '封面圖片網址格式不正確'
  }

  if (!getPlainTextContent(form.content)) {
    fieldErrors.content = '請填寫文章內容'
  }

  return Object.keys(fieldErrors).length === 0
}

const handleSubmit = () => {
  if (!validateForm()) return

  emit('submit', {
    title: form.title.trim(),
    slug: form.slug.trim().toLowerCase(),
    summary: form.summary.trim(),
    content: form.content,
    category: form.category,
    coverImageUrl: form.coverImageUrl.trim(),
  })
}

watch(
  () => props.initialValue,
  (initialValue) => {
    Object.assign(form, initialValue)
    clearFieldErrors()
  },
  {
    immediate: true,
    deep: true,
  },
)
</script>

<style scoped>
.article-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  padding: var(--space-4);

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-4);
}

.form-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
}

.form-field--wide,
.form-field--full {
  grid-column: 1 / -1;
}

.form-label {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.field-hint,
.character-count {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.field-error {
  color: var(--color-error);
  font-size: var(--font-size-xs);
}

.field-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--space-2);
}

.character-count {
  margin-left: auto;
}

.article-editor {
  overflow: hidden;

  border-radius: var(--radius-md);
}

.article-editor--invalid {
  outline: 1px solid var(--color-error);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-2);

  padding-top: var(--space-3);

  border-top: 1px solid var(--color-border);
}

:deep(.article-editor .p-editor-toolbar) {
  border-color: var(--color-border);
}

:deep(.article-editor .p-editor-content) {
  border-color: var(--color-border);
}

:deep(.article-editor .ql-editor) {
  min-height: 320px;

  color: var(--color-text);
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  line-height: var(--line-height-base);
}

@media (max-width: 768px) {
  .article-form {
    padding: var(--space-3);
  }

  .form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .form-field--wide,
  .form-field--full {
    grid-column: auto;
  }

  .form-actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }
}
</style>