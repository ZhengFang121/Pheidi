<template>
  <section class="layout-container article-detail-page">
    <RouterLink
      :to="{ name: 'academy' }"
      class="back-link"
    >
      <ArrowLeft
        class="back-icon"
        aria-hidden="true"
      />
      返回跑者學院
    </RouterLink>

    <div v-if="isLoading" class="article-loading">
      <Skeleton
        width="8rem"
        height="1.5rem"
      />
      <Skeleton
        width="70%"
        height="3.5rem"
      />
      <Skeleton
        width="100%"
        height="22rem"
        border-radius="var(--radius-lg)"
      />
      <Skeleton
        width="100%"
        height="12rem"
      />
    </div>

    <BaseCard v-else-if="lockedCategory" class="locked-state">
      <Lock class="locked-icon" aria-hidden="true" />

      <h1>這篇內容尚未解鎖</h1>

      <p>{{ getUnlockDetail(lockedCategory) }}</p>

      <BaseButton label="返回跑者學院" @click="returnToAcademy" />
    </BaseCard>

    <Message
      v-else-if="errorMessage"
      severity="error"
      :closable="false"
    >
      <div class="error-content">
        <span>{{ errorMessage }}</span>

        <Button
          type="button"
          label="重新載入"
          severity="secondary"
          size="small"
          @click="loadArticle"
        />
      </div>
    </Message>

    <article v-else-if="article">
      <header class="article-header">
        <div class="article-meta">
          <Tag
            :value="
              getCategoryLabel(article.category)
            "
            severity="secondary"
          />

          <time :datetime="article.publishedAt">
            {{ formatDate(article.publishedAt) }}
          </time>
        </div>

        <h1 class="article-title">
          {{ article.title }}
        </h1>

        <p class="article-summary">
          {{ article.summary }}
        </p>

        <p class="article-author">
          作者：{{ article.author.username }}
        </p>
      </header>

      <div class="article-cover">
        <img
          v-if="article.coverImageUrl"
          :src="article.coverImageUrl"
          :alt="`${article.title}封面`"
          class="article-cover-image"
        />

        <div
          v-else
          class="article-cover-placeholder"
        >
          <BookOpen
            class="placeholder-icon"
            aria-hidden="true"
          />
        </div>
      </div>

      <!-- eslint-disable vue/no-v-html -->
      <div
        class="article-body"
        v-html="article.content"
      />
      <!-- eslint-enable vue/no-v-html -->
    </article>
  </section>
</template>

<script setup lang="ts">
import { isAxiosError } from 'axios'
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, BookOpen, Lock } from '@lucide/vue'

import Button from 'primevue/button'
import Message from 'primevue/message'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import {
  canAccessAcademyCategory,
  getAcademyCategoryUnlockDetail,
  getArticleCategoryLabel,
  isArticleCategory,
} from '@/constants/article'
import { getArticleBySlug } from '@/services/articles'
import { getRunnerProgress } from '@/services/runnerProgress'
import type { AcademyLockedResponse, ArticleCategory, ArticleDetail } from '@/types/article'
import { getApiErrorMessage, hasApiErrorStatus } from '@/utils/apiError'
import { formatLongDate } from '@/utils/date'

const route = useRoute()
const router = useRouter()

const article = ref<ArticleDetail | null>(null)
const lockedCategory = ref<ArticleCategory | null>(null)
const isLoading = ref(false)
const errorMessage = ref('')

const getCategoryLabel = getArticleCategoryLabel
const getUnlockDetail = getAcademyCategoryUnlockDetail
const formatDate = formatLongDate
const returnToAcademy = () => router.push({ name: 'academy' })

const loadArticle = async () => {
  const slug = typeof route.params.slug === 'string' ? route.params.slug : ''

  if (!slug) {
    errorMessage.value = '文章網址不正確'
    return
  }

  isLoading.value = true
  errorMessage.value = ''
  article.value = null
  lockedCategory.value = null

  try {
    const progressResponse = await getRunnerProgress()
    const articleResponse = await getArticleBySlug(slug)

    if (
      !canAccessAcademyCategory(
        progressResponse.runnerProgress.currentLevel.level,
        articleResponse.article.category,
      )
    ) {
      lockedCategory.value = articleResponse.article.category
      return
    }

    article.value = articleResponse.article
  } catch (error: unknown) {
    if (hasApiErrorStatus(error, 403) && isAxiosError<AcademyLockedResponse>(error)) {
      const category = error.response?.data.category

      if (isArticleCategory(category)) {
        lockedCategory.value = category
      } else {
        errorMessage.value = '此跑者學院內容尚未解鎖'
      }
    } else if (hasApiErrorStatus(error, 404)) {
      errorMessage.value = '找不到這篇文章，文章可能尚未發布或已不存在'
    } else {
      errorMessage.value = getApiErrorMessage(error, '無法取得文章，請稍後再試')
    }
  } finally {
    isLoading.value = false
  }
}

void loadArticle()
</script>

<style scoped>
.article-detail-page {
  padding-block: var(--space-7)
    var(--space-8);
}

.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);

  margin-bottom: var(--space-6);

  color: var(--color-dark-light);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
}

.back-link:hover {
  color: var(--color-dark);
}

.back-icon {
  width: 20px;
  height: 20px;
}

.article-loading {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
}

.locked-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 640px;
  margin-inline: auto;
  padding: var(--space-8) var(--space-5);
  border-radius: var(--radius-lg);
  color: var(--color-text-secondary);
  text-align: center;
}

.locked-state h1,
.locked-state p {
  margin: 0;
}

.locked-state h1 {
  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.locked-icon {
  width: var(--space-7);
  height: var(--space-7);
  color: var(--color-primary);
}

.article-header {
  max-width: 880px;
  margin: 0 auto var(--space-7);

  text-align: center;
}

.article-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);

  margin-bottom: var(--space-4);

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.article-title {
  margin: 0 0 var(--space-4);

  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
}

.article-summary {
  margin: 0 0 var(--space-3);

  color: var(--color-text-secondary);
  font-size: var(--font-size-md);
  line-height: var(--line-height-base);
}

.article-author {
  margin: 0;

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.article-cover {
  max-width: 1080px;
  aspect-ratio: 16 / 7;
  margin: 0 auto var(--space-7);
  overflow: hidden;

  background: var(--color-primary-pale);
  border-radius: var(--radius-lg);
}

.article-cover-image {
  width: 100%;
  height: 100%;

  object-fit: cover;
}

.article-cover-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  color: var(--color-primary);
  background:
    linear-gradient(
      135deg,
      var(--color-primary-pale),
      var(--color-secondary-pale)
    );
}

.placeholder-icon {
  width: 64px;
  height: 64px;
}

.article-body {
  max-width: 780px;
  margin-inline: auto;

  color: var(--color-text);
  font-size: var(--font-size-base);
  line-height: 2;
}

.article-body :deep(h1),
.article-body :deep(h2),
.article-body :deep(h3) {
  margin: var(--space-7) 0 var(--space-3);

  line-height: var(--line-height-heading);
}

.article-body :deep(h1) {
  font-size: var(--font-size-lg);
}

.article-body :deep(h2) {
  font-size: var(--font-size-md);
}

.article-body :deep(h3) {
  font-size: var(--font-size-base);
}

.article-body :deep(p),
.article-body :deep(ul),
.article-body :deep(ol),
.article-body :deep(blockquote) {
  margin: 0 0 var(--space-5);
}

.article-body :deep(a) {
  color: var(--color-dark-light);
}

.article-body :deep(blockquote) {
  padding: var(--space-4) var(--space-5);

  color: var(--color-text-secondary);

  background: var(--color-primary-pale);
  border-left: 4px solid
    var(--color-primary);
  border-radius: var(--radius-sm);
}

.article-body :deep(li + li) {
  margin-top: var(--space-2);
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);

  width: 100%;
}

@media (max-width: 640px) {
  .article-detail-page {
    padding-block: var(--space-5)
      var(--space-7);
  }

  .article-title {
    font-size: var(--font-size-lg);
  }

  .article-summary {
    font-size: var(--font-size-base);
  }

  .article-cover {
    aspect-ratio: 4 / 3;
  }

  .error-content {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
