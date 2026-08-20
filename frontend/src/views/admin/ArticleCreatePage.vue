<template>
  <section class="article-create-page">
    <div class="page-heading">
      <div>
        <p class="page-eyebrow">CREATE ARTICLE</p>
        <h2 class="page-title">新增文章</h2>
        <p class="page-description">
          建立跑者學院文章，儲存後會先保留為草稿。
        </p>
      </div>

      <Button
        type="button"
        label="返回文章列表"
        severity="secondary"
        outlined
        @click="goBack"
      />
    </div>

    <ArticleForm
      submit-label="儲存草稿"
      :is-submitting="isSubmitting"
      :error-message="errorMessage"
      @submit="handleSubmit"
      @cancel="goBack"
    />
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { isAxiosError } from 'axios'
import { useRouter } from 'vue-router'

import Button from 'primevue/button'

import ArticleForm from '@/components/admin/ArticleForm.vue'
import { createAdminArticle } from '@/services/adminArticles'
import type { AdminArticleFormPayload } from '@/types/article'

const router = useRouter()

const isSubmitting = ref(false)
const errorMessage = ref('')

const goBack = () => {
  void router.push({
    name: 'admin-articles',
  })
}

const handleSubmit = async (payload: AdminArticleFormPayload) => {
  isSubmitting.value = true
  errorMessage.value = ''

  try {
    await createAdminArticle(payload)

    await router.push({
      name: 'admin-articles',
    })
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      errorMessage.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '無法建立文章，請稍後再試'
    } else {
      errorMessage.value = '無法建立文章，請稍後再試'
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.article-create-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.page-heading {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
}

.page-eyebrow {
  margin: 0 0 var(--space-1);

  color: var(--color-primary);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
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

@media (max-width: 768px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
