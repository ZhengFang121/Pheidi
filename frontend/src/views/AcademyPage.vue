<template>
  <section class="layout-container academy-page">
    <Toast
      group="academy-lock"
      position="top-right"
      class="academy-lock-toast"
      :style="{
        right: 'var(--layout-gutter)',
        width: 'min(23rem, calc(100vw - (var(--layout-gutter) * 2)))',
      }"
    />

    <header class="academy-heading">
      <p class="academy-eyebrow">RUNNER ACADEMY</p>

      <h1 class="academy-title">跑者學院</h1>

      <p class="academy-description">
        從跑步知識、裝備選擇到補給與賽事， 陪你一步一步建立自己的跑步節奏。
      </p>
    </header>

    <div class="academy-controls">
      <form class="search-form" @submit.prevent="handleSearch">
        <InputText
          v-model="searchInput"
          type="search"
          placeholder="搜尋跑步文章"
          aria-label="搜尋跑步文章"
          class="search-input"
        />

        <BaseButton type="submit" label="搜尋" :loading="isLoading" :disabled="!runnerProgress" />

        <BaseButton
          v-if="activeSearch"
          type="button"
          label="清除"
          variant="outline"
          :disabled="!runnerProgress"
          @click="clearSearch"
        />
      </form>

      <div v-if="runnerProgress" class="category-filter" aria-label="文章分類">
        <Button
          v-for="option in categoryOptions"
          :key="option.label"
          type="button"
          :label="option.label"
          :outlined="activeCategory !== option.value"
          :severity="activeCategory === option.value ? undefined : 'secondary'"
          :aria-disabled="isCategoryLocked(option.value) || undefined"
          :aria-label="getCategoryAriaLabel(option.value, option.label)"
          size="small"
          class="category-button"
          :class="{ 'is-locked': isCategoryLocked(option.value) }"
          @click="handleCategoryChange(option.value)"
        >
          <template v-if="isCategoryLocked(option.value)" #icon>
            <Lock class="category-lock-icon" aria-hidden="true" />
          </template>
        </Button>
      </div>

      <div v-else class="category-filter category-filter-loading" aria-label="文章分類載入中">
        <Skeleton
          v-for="index in 5"
          :key="index"
          width="4.5rem"
          height="2.25rem"
          border-radius="var(--radius-sm)"
        />
      </div>
    </div>

    <Message v-if="pageErrorMessage" severity="error" :closable="false">
      <div class="error-content">
        <span>{{ pageErrorMessage }}</span>

        <BaseButton
          type="button"
          label="重新載入"
          variant="secondary"
          size="small"
          @click="loadPageData"
        />
      </div>
    </Message>

    <div v-if="pageIsLoading" class="article-grid" aria-label="文章載入中">
      <Skeleton v-for="index in 6" :key="index" height="24rem" border-radius="var(--radius-lg)" />
    </div>

    <div v-else-if="visibleArticles.length" class="article-grid">
      <BaseCard
        v-for="article in visibleArticles"
        :key="article.id"
        as="article"
        class="article-card"
      >
        <div class="article-cover">
          <img
            v-if="article.coverImageUrl"
            :src="article.coverImageUrl"
            :alt="`${article.title}封面`"
            class="article-cover-image"
          />

          <div v-else class="article-cover-placeholder">
            <BookOpen class="placeholder-icon" aria-hidden="true" />
          </div>
        </div>

        <div class="article-content">
          <div class="article-meta">
            <Tag :value="getCategoryLabel(article.category)" severity="secondary" />

            <time :datetime="article.publishedAt">
              {{ formatDate(article.publishedAt) }}
            </time>
          </div>

          <h2 class="article-title">
            {{ article.title }}
          </h2>

          <p class="article-summary">
            {{ article.summary }}
          </p>

          <div class="article-footer">
            <span>
              {{ article.author.username }}
            </span>

            <RouterLink
              :to="{
                name: 'article-detail',
                params: {
                  slug: article.slug,
                },
              }"
              class="base-button base-button--primary read-more"
              :aria-label="`閱讀文章：${article.title}`"
            >
              <span class="base-button__content">閱讀文章</span>

              <i class="pi pi-arrow-right base-button__content" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </BaseCard>
    </div>

    <BaseCard v-else-if="runnerProgress && !pageErrorMessage" class="empty-state">
      <BookOpen class="empty-icon" aria-hidden="true" />

      <h2>目前沒有符合條件的文章</h2>

      <p>可以嘗試其他關鍵字或文章分類。</p>
    </BaseCard>

    <Paginator
      v-if="runnerProgress && !pageErrorMessage && pagination.totalPages > 1"
      :first="first"
      :rows="pagination.limit"
      :total-records="pagination.total"
      :rows-per-page-options="[6, 12, 24]"
      template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
      current-page-report-template="第 {currentPage} 頁，共 {totalPages} 頁"
      class="article-paginator"
      @page="handlePageChange"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { BookOpen, Lock } from '@lucide/vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'

import BaseButton from '@/components/base/BaseButton.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import { useArticleList } from '@/composables/useArticleList'
import { useRunnerProgress } from '@/composables/useRunnerProgress'
import {
  articleCategoryOptions,
  canAccessAcademyCategory,
  getAcademyCategoryUnlockDetail,
  getArticleCategoryLabel,
} from '@/constants/article'
import type { ArticleCategory } from '@/types/article'
import { formatLongDate } from '@/utils/date'

interface AcademyCategoryOption {
  label: string
  value: ArticleCategory | null
}

const toast = useToast()
const categoryOptions: AcademyCategoryOption[] = [
  {
    label: '全部',
    value: null,
  },
  ...articleCategoryOptions,
]

const {
  articles,
  searchInput,
  activeSearch,
  activeCategory,
  isLoading,
  errorMessage,
  pagination,
  first,
  loadArticles,
  searchArticles: handleSearch,
  clearSearch,
  changeCategory,
  changePage: handlePageChange,
} = useArticleList()

const { runnerProgress, isRunnerProgressLoading, runnerProgressError, loadRunnerProgress } =
  useRunnerProgress()

const getCategoryLabel = getArticleCategoryLabel
const formatDate = formatLongDate
const pageIsLoading = computed(() => isLoading.value || isRunnerProgressLoading.value)
const pageErrorMessage = computed(() => runnerProgressError.value || errorMessage.value)
const visibleArticles = computed(() => {
  const level = runnerProgress.value?.currentLevel.level

  if (!level) return []

  return articles.value.filter(({ category }) => canAccessAcademyCategory(level, category))
})

const isCategoryLocked = (category: ArticleCategory | null) => {
  if (!category) return false

  const level = runnerProgress.value?.currentLevel.level

  return level ? !canAccessAcademyCategory(level, category) : true
}

const getCategoryAriaLabel = (category: ArticleCategory | null, label: string) => {
  return isCategoryLocked(category) ? `${label}，尚未解鎖` : label
}

const handleCategoryChange = async (category: ArticleCategory | null) => {
  if (category && isCategoryLocked(category)) {
    toast.add({
      group: 'academy-lock',
      severity: 'info',
      summary: `${getArticleCategoryLabel(category)}尚未解鎖`,
      detail: getAcademyCategoryUnlockDetail(category),
      life: 4000,
    })
    return
  }

  await changeCategory(category)
}

const loadPageData = async () => {
  await loadRunnerProgress()

  if (runnerProgress.value) {
    await loadArticles()
  }
}

onMounted(() => {
  void loadPageData()
})
</script>

<style scoped>
.academy-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);

  padding-block: var(--space-7) var(--space-8);
}

.academy-heading {
  max-width: 720px;
}

.academy-eyebrow {
  margin: 0 0 var(--space-2);

  color: var(--color-dark-light);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  letter-spacing: var(--letter-spacing-wide);
}

.academy-title {
  margin: 0 0 var(--space-3);

  color: var(--color-text);
  font-size: var(--font-size-xl);
  line-height: var(--line-height-heading);
}

.academy-description {
  margin: 0;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
}

.academy-controls {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-5);
}

.search-form {
  display: flex;
  gap: var(--space-2);
}

.search-input {
  width: min(360px, 40vw);
}

.category-filter {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: var(--space-2);
}

.category-filter-loading {
  min-height: calc(var(--space-6) + var(--space-1));
}

.category-button.is-locked {
  color: var(--color-text-secondary);
  cursor: pointer;
  opacity: 0.65;
}

.category-lock-icon {
  width: var(--space-4);
  height: var(--space-4);
}

:global(.academy-lock-toast .p-toast-message-info) {
  border-color: var(--color-primary-soft);
  color: var(--color-text);
  background: var(--color-primary-pale);
  background: color-mix(in srgb, var(--color-primary-pale) 88%, transparent);
}

:global(.academy-lock-toast .p-toast-message-info .p-toast-message-icon),
:global(.academy-lock-toast .p-toast-message-info .p-toast-summary),
:global(.academy-lock-toast .p-toast-message-info .p-toast-close-button) {
  color: var(--color-dark);
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);

  width: 100%;
}

.article-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-5);
}

.article-card {
  overflow: hidden;

  border-radius: var(--radius-lg);

  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.article-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.article-cover {
  aspect-ratio: 16 / 9;
  overflow: hidden;

  background: var(--color-primary-pale);
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
  background: linear-gradient(135deg, var(--color-primary-pale), var(--color-secondary-pale));
}

.placeholder-icon {
  width: 48px;
  height: 48px;
}

.article-content {
  display: flex;
  min-height: 230px;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-5);
}

.article-meta,
.article-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.article-meta {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
}

.article-title {
  margin: 0;

  color: var(--color-text);
  font-size: var(--font-size-md);
  line-height: var(--line-height-heading);
}

.article-summary {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;

  color: var(--color-text-secondary);
  line-height: var(--line-height-base);

  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.article-footer {
  margin-top: auto;

  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
}

.read-more {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);

  text-decoration: none;
}

.empty-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-8) var(--space-5);

  color: var(--color-text-secondary);
  text-align: center;

  border-radius: var(--radius-lg);
}

.empty-state h2,
.empty-state p {
  margin: 0;
}

.empty-icon {
  width: 48px;
  height: 48px;

  color: var(--color-primary);
}

.article-paginator {
  align-self: center;
}

@media (max-width: 1024px) {
  .academy-controls {
    align-items: stretch;
    flex-direction: column;
  }

  .category-filter {
    justify-content: flex-start;
  }

  .article-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .academy-page {
    gap: var(--space-5);

    padding-block: var(--space-5) var(--space-7);
  }

  .academy-title {
    font-size: var(--font-size-lg);
  }

  .search-form {
    align-items: stretch;
    flex-direction: column;
  }

  .search-input {
    width: 100%;
  }

  .article-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .error-content {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
