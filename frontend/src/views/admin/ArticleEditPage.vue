<template>
  <section class="article-edit-page">
    <div class="page-heading">
      <div>
        <p class="page-eyebrow">EDIT ARTICLE</p>
        <h2 class="page-title">編輯文章</h2>
        <p class="page-description">
          修改跑者學院文章內容，儲存後會保留目前的發布狀態。
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

    <Message
      v-if="isLoading"
      severity="secondary"
      :closable="false"
    >
      正在載入文章資料……
    </Message>

    <Message
      v-else-if="loadErrorMessage"
      severity="error"
      :closable="false"
    >
      {{ loadErrorMessage }}
    </Message>

    <ArticleForm
      v-else-if="initialValue"
      :initial-value="initialValue"
      submit-label="儲存修改"
      :is-submitting="isSubmitting"
      :error-message="submitErrorMessage"
      @submit="handleSubmit"
      @cancel="goBack"
    />
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { isAxiosError } from 'axios'
import { useRoute, useRouter } from 'vue-router'

import Button from 'primevue/button'
import Message from 'primevue/message'

import ArticleForm from '@/components/admin/ArticleForm.vue'
import { getAdminArticle, updateAdminArticle } from '@/services/adminArticles'
import type { AdminArticleFormPayload } from '@/types/article'

const route = useRoute()
const router = useRouter()

const initialValue = ref<AdminArticleFormPayload | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)
const loadErrorMessage = ref('')
const submitErrorMessage = ref('')

const getArticleId = () => {
  const articleId = route.params.articleId

  return typeof articleId === 'string' ? articleId : ''
}

const goBack = () => {
  void router.push({
    name: 'admin-articles',
  })
}

const loadArticle = async () => {
  const articleId = getArticleId()

  if (!articleId) {
    loadErrorMessage.value = '文章識別資料不正確'
    isLoading.value = false
    return
  }

  isLoading.value = true
  loadErrorMessage.value = ''

  try {
    const response = await getAdminArticle(articleId)
    const article = response.article

    initialValue.value = {
      title: article.title,
      slug: article.slug,
      summary: article.summary,
      content: article.content,
      category: article.category,
      coverImageUrl: article.coverImageUrl ?? '',
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      loadErrorMessage.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '無法取得文章資料，請稍後再試'
    } else {
      loadErrorMessage.value = '無法取得文章資料，請稍後再試'
    }
  } finally {
    isLoading.value = false
  }
}

const handleSubmit = async (payload: AdminArticleFormPayload) => {
  const articleId = getArticleId()

  if (!articleId) {
    submitErrorMessage.value = '文章識別資料不正確'
    return
  }

  isSubmitting.value = true
  submitErrorMessage.value = ''

  try {
    await updateAdminArticle(articleId, payload)

    await router.push({
      name: 'admin-articles',
    })
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      submitErrorMessage.value =
        typeof error.response?.data?.message === 'string'
          ? error.response.data.message
          : '無法更新文章，請稍後再試'
    } else {
      submitErrorMessage.value = '無法更新文章，請稍後再試'
    }
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  void loadArticle()
})
</script>

<style scoped>
.article-edit-page {
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

  color: var(--color-dark-light);
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
