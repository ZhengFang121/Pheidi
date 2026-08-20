<template>
  <form class="article-form" @submit.prevent="handleSubmit">
    <Message v-if="errorMessage" severity="error" :closable="false">
      {{ errorMessage }}
    </Message>

    <div class="form-grid">
      <div class="form-field form-field--wide">
        <label for="article-title" class="form-label"> 文章標題 </label>

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
        <label for="article-slug" class="form-label"> 網址識別 </label>

        <InputText
          id="article-slug"
          v-model="form.slug"
          maxlength="120"
          placeholder="beginner-running-guide"
          :invalid="Boolean(fieldErrors.slug)"
          fluid
        />

        <small class="field-hint"> 只能使用小寫英文字母、數字與連字號。 </small>

        <small v-if="fieldErrors.slug" class="field-error">
          {{ fieldErrors.slug }}
        </small>
      </div>

      <div class="form-field">
        <label for="article-category" class="form-label"> 文章分類 </label>

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
        <label for="article-summary" class="form-label"> 文章摘要 </label>

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

          <small class="character-count"> {{ form.summary.length }} / 300 </small>
        </div>
      </div>

      <div class="form-field form-field--full">
        <span class="form-label"> 封面圖片 </span>

        <input
          ref="coverImageInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="cover-file-input"
          @change="handleCoverImageChange"
        />

        <div class="cover-actions">
          <Button
            type="button"
            :label="form.coverImageUrl ? '更換封面圖片' : '上傳封面圖片'"
            icon="pi pi-upload"
            severity="secondary"
            outlined
            :loading="isUploadingCover"
            :disabled="isSubmitting"
            @click="openCoverImagePicker"
          />

          <Button
            v-if="form.coverImageUrl"
            type="button"
            label="移除封面"
            icon="pi pi-trash"
            severity="danger"
            text
            :disabled="isSubmitting || isUploadingCover"
            @click="removeCoverImage"
          />
        </div>

        <small class="field-hint"> 支援 JPG、PNG、WebP、GIF，檔案不能超過 5 MB。 </small>

        <Message v-if="coverUploadError" severity="error" :closable="false">
          {{ coverUploadError }}
        </Message>

        <div v-if="form.coverImageUrl" class="cover-preview">
          <img :src="form.coverImageUrl" alt="文章封面預覽" class="cover-preview-image" />
        </div>
      </div>

      <div class="form-field form-field--full">
        <label class="form-label"> 文章內容 </label>

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
              <button class="ql-list" value="ordered" type="button" />
              <button class="ql-list" value="bullet" type="button" />
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
        :disabled="isSubmitting || isUploadingCover"
        @click="emit('cancel')"
      />

      <Button
        type="submit"
        :label="submitLabel"
        :loading="isSubmitting"
        :disabled="isUploadingCover"
      />
    </div>
  </form>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { isAxiosError } from 'axios'

import Button from 'primevue/button'
import Editor from 'primevue/editor'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Textarea from 'primevue/textarea'

import { articleCategoryOptions as categoryOptions } from '@/constants/article'
import { uploadAdminArticleCover } from '@/services/uploads'
import type { AdminArticleFormPayload } from '@/types/article'

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

const maximumCoverImageSize = 5 * 1024 * 1024

const allowedCoverImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

const coverImageInput = ref<HTMLInputElement | null>(null)

const isUploadingCover = ref(false)
const coverUploadError = ref('')

const form = reactive<AdminArticleFormPayload>({
  title: '',
  slug: '',
  summary: '',
  content: '',
  category: 'learning',
  coverImageUrl: '',
})

const fieldErrors = reactive<Partial<Record<keyof AdminArticleFormPayload, string>>>({})

const clearFieldErrors = () => {
  for (const field of Object.keys(fieldErrors)) {
    delete fieldErrors[field as keyof AdminArticleFormPayload]
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

const openCoverImagePicker = () => {
  coverImageInput.value?.click()
}

const removeCoverImage = () => {
  form.coverImageUrl = ''
  coverUploadError.value = ''

  if (coverImageInput.value) {
    coverImageInput.value.value = ''
  }
}

const handleCoverImageChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  input.value = ''

  if (!file) return

  coverUploadError.value = ''

  if (!allowedCoverImageTypes.has(file.type)) {
    coverUploadError.value = '封面圖片只支援 JPG、PNG、WebP 或 GIF'
    return
  }

  if (file.size > maximumCoverImageSize) {
    coverUploadError.value = '封面圖片不能超過 5 MB'
    return
  }

  isUploadingCover.value = true

  try {
    const response = await uploadAdminArticleCover(file)

    form.coverImageUrl = response.image.url
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      coverUploadError.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '封面圖片上傳失敗，請稍後再試'
    } else {
      coverUploadError.value = '封面圖片上傳失敗，請稍後再試'
    }
  } finally {
    isUploadingCover.value = false
  }
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
    fieldErrors.slug = '網址識別只能包含小寫英文字母、數字與連字號'
  }

  if (!normalizedSummary) {
    fieldErrors.summary = '請填寫文章摘要'
  }

  if (normalizedCoverImageUrl && !isValidHttpUrl(normalizedCoverImageUrl)) {
    fieldErrors.coverImageUrl = '封面圖片網址格式不正確'
  }

  if (!getPlainTextContent(form.content)) {
    fieldErrors.content = '請填寫文章內容'
  }

  return Object.keys(fieldErrors).length === 0
}

const handleSubmit = () => {
  if (isUploadingCover.value) return
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
    coverUploadError.value = ''
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

.cover-file-input {
  position: absolute;

  width: 1px;
  height: 1px;
  padding: 0;
  overflow: hidden;

  white-space: nowrap;

  clip: rect(0, 0, 0, 0);
  border: 0;
}

.cover-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.cover-preview {
  width: min(100%, 640px);
  aspect-ratio: 16 / 9;
  overflow: hidden;

  background: var(--color-primary-pale);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.cover-preview-image {
  display: block;
  width: 100%;
  height: 100%;

  object-fit: cover;
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

  .cover-actions {
    align-items: stretch;
    flex-direction: column;
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
