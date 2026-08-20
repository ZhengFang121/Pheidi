<template>
  <section class="layout-container academy-page">
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

        <Button type="submit" label="搜尋" :loading="isLoading" />

        <Button
          v-if="activeSearch"
          type="button"
          label="清除"
          severity="secondary"
          outlined
          @click="clearSearch"
        />
      </form>

      <div class="category-filter" aria-label="文章分類">
        <Button
          v-for="option in categoryOptions"
          :key="option.label"
          type="button"
          :label="option.label"
          :outlined="activeCategory !== option.value"
          :severity="activeCategory === option.value ? undefined : 'secondary'"
          size="small"
          @click="handleCategoryChange(option.value)"
        />
      </div>
    </div>

    <Message v-if="errorMessage" severity="error" :closable="false">
      <div class="error-content">
        <span>{{ errorMessage }}</span>

        <Button
          type="button"
          label="重新載入"
          severity="secondary"
          size="small"
          @click="loadArticles()"
        />
      </div>
    </Message>

    <div v-if="isLoading" class="article-grid" aria-label="文章載入中">
      <Skeleton v-for="index in 6" :key="index" height="24rem" border-radius="var(--radius-lg)" />
    </div>

    <div v-else-if="articles.length" class="article-grid">
      <article v-for="article in articles" :key="article.id" class="article-card">
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
              class="read-more"
              :aria-label="`閱讀文章：${article.title}`"
            >
              閱讀文章

              <i class="pi pi-arrow-right" aria-hidden="true" />
            </RouterLink>
          </div>
        </div>
      </article>
    </div>

    <div v-else class="empty-state">
      <BookOpen class="empty-icon" aria-hidden="true" />

      <h2>目前沒有符合條件的文章</h2>

      <p>可以嘗試其他關鍵字或文章分類。</p>
    </div>

    <Paginator
      v-if="pagination.totalPages > 1"
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
import { onMounted } from 'vue'
import { BookOpen } from '@lucide/vue'

import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Paginator from 'primevue/paginator'
import Skeleton from 'primevue/skeleton'
import Tag from 'primevue/tag'

import { articleCategoryOptions, getArticleCategoryLabel } from '@/constants/article'
import { useArticleList } from '@/composables/useArticleList'
import { formatLongDate } from '@/utils/date'

const categoryOptions = [
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
  changeCategory: handleCategoryChange,
  changePage: handlePageChange,
} = useArticleList()

const getCategoryLabel = getArticleCategoryLabel
const formatDate = formatLongDate

onMounted(() => {
  void loadArticles()
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

  color: var(--color-primary);
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

  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);

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

  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
  text-decoration: none;

  transition: color 0.2s ease;
}

.read-more:hover {
  color: var(--color-accent);
}

.read-more:focus-visible {
  outline: 3px solid var(--color-primary-soft);
  outline-offset: 4px;
  border-radius: var(--radius-sm);
}

.empty-state {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-8) var(--space-5);

  color: var(--color-text-secondary);
  text-align: center;

  background: var(--color-surface);
  border: 1px solid var(--color-border);
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
