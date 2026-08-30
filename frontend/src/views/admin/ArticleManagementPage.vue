<template>
  <section class="article-management-page">
    <ConfirmDialog />

    <div class="page-heading">
      <div>
        <p class="page-eyebrow">ARTICLE MANAGEMENT</p>
        <h2 class="page-title">文章管理</h2>
        <p class="page-description">管理跑者學院的文章、分類與發布狀態。</p>
      </div>

      <div class="page-actions">
        <Button type="button" label="新增文章" @click="goToCreateArticle" />
      </div>
    </div>

    <AdminStatisticsStrip
      :items="statisticItems"
      label="文章統計"
      :loading="isStatisticsLoading"
    />

    <Message v-if="statisticsErrorMessage" severity="error" :closable="false">
      {{ statisticsErrorMessage }}
    </Message>

    <BaseCard class="management-panel">
      <form class="filter-form" @submit.prevent="handleSearch">
        <div class="filter-field search-field">
          <label for="article-search" class="filter-label"> 搜尋文章 </label>

          <InputText
            id="article-search"
            v-model="searchInput"
            type="search"
            placeholder="輸入標題、網址識別或摘要"
            class="filter-control"
          />
        </div>

        <div class="filter-field">
          <label for="article-category" class="filter-label"> 文章分類 </label>

          <Select
            id="article-category"
            v-model="categoryInput"
            :options="categoryOptions"
            option-label="label"
            option-value="value"
            placeholder="全部分類"
            show-clear
            class="filter-control"
          />
        </div>

        <div class="filter-field">
          <label for="article-status" class="filter-label"> 發布狀態 </label>

          <Select
            id="article-status"
            v-model="statusInput"
            :options="statusOptions"
            option-label="label"
            option-value="value"
            placeholder="全部狀態"
            show-clear
            class="filter-control"
          />
        </div>

        <div class="filter-actions">
          <Button type="submit" label="搜尋" :loading="isLoading" />

          <Button
            v-if="hasActiveFilters"
            type="button"
            label="清除"
            severity="secondary"
            outlined
            @click="clearFilters"
          />
        </div>
      </form>

      <Message v-if="successMessage" severity="success" :closable="false">
        {{ successMessage }}
      </Message>

      <Message v-if="errorMessage" severity="error" :closable="false">
        {{ errorMessage }}
      </Message>

      <DataTable
        :value="articles"
        :loading="isLoading"
        :first="first"
        :rows="pagination.limit"
        :total-records="pagination.total"
        :rows-per-page-options="[5, 10, 20, 50]"
        lazy
        paginator
        striped-rows
        scrollable
        table-style="min-width: 1240px"
        paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
        current-page-report-template="第 {currentPage} 頁，共 {totalPages} 頁"
        class="article-table"
        @page="handlePageChange"
      >
        <template #empty>
          <div class="table-empty">
            {{ hasActiveFilters ? '找不到符合條件的文章' : '目前還沒有文章資料' }}
          </div>
        </template>

        <Column field="title" header="文章">
          <template #body="{ data }">
            <div class="article-information">
              <strong class="article-title">
                {{ data.title }}
              </strong>

              <span class="article-slug"> /{{ data.slug }} </span>
            </div>
          </template>
        </Column>

        <Column field="category" header="分類">
          <template #body="{ data }">
            {{ getCategoryLabel(data.category) }}
          </template>
        </Column>

        <Column field="status" header="狀態">
          <template #body="{ data }">
            <Tag
              :value="getStatusLabel(data.status)"
              :severity="data.status === 'published' ? 'success' : 'secondary'"
            />
          </template>
        </Column>

        <Column header="作者">
          <template #body="{ data }">
            <div class="author-information">
              <span>{{ data.author.username }}</span>
              <small>{{ data.author.email }}</small>
            </div>
          </template>
        </Column>

        <Column field="createdAt" header="建立日期">
          <template #body="{ data }">
            {{ formatDate(data.createdAt) }}
          </template>
        </Column>

        <Column field="updatedAt" header="最後更新">
          <template #body="{ data }">
            {{ formatDate(data.updatedAt) }}
          </template>
        </Column>

        <Column header="操作" style="width: 300px">
          <template #body="{ data }">
            <div class="article-actions">
              <Button
                type="button"
                label="編輯"
                icon="pi pi-pencil"
                severity="secondary"
                outlined
                size="small"
                class="article-action-button"
                @click="goToEditArticle(data.id)"
              />

              <Button
                type="button"
                :label="data.status === 'published' ? '改為草稿' : '發布'"
                :icon="data.status === 'published' ? 'pi pi-undo' : 'pi pi-send'"
                :severity="data.status === 'published' ? 'warn' : 'success'"
                outlined
                size="small"
                class="article-action-button"
                :loading="updatingArticleStatusId === data.id"
                :disabled="updatingArticleStatusId !== null && updatingArticleStatusId !== data.id"
                @click="confirmArticleStatusChange(data)"
              />

              <Button
                type="button"
                label="刪除"
                icon="pi pi-trash"
                severity="danger"
                outlined
                size="small"
                class="article-action-button"
                :loading="deletingArticleId === data.id"
                :disabled="deletingArticleId !== null && deletingArticleId !== data.id"
                @click="confirmDeleteArticle(data)"
              />
            </div>
          </template>
        </Column>
      </DataTable>
    </BaseCard>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

import Button from 'primevue/button'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'

import AdminStatisticsStrip from '@/components/admin/AdminStatisticsStrip.vue'
import BaseCard from '@/components/base/BaseCard.vue'
import {
  articleCategoryOptions as categoryOptions,
  articleStatusOptions as statusOptions,
  getArticleCategoryLabel,
  getArticleStatusLabel,
} from '@/constants/article'
import { useAdminArticleList } from '@/composables/useAdminArticleList'
import {
  deleteAdminArticle,
  getAdminArticleStatistics,
  updateAdminArticleStatus,
} from '@/services/adminArticles'
import type { AdminArticle, AdminArticleStatistics, ArticleStatus } from '@/types/article'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatNumericDate } from '@/utils/date'

const router = useRouter()

const confirm = useConfirm()

const deletingArticleId = ref<string | null>(null)
const updatingArticleStatusId = ref<string | null>(null)
const successMessage = ref('')
const isStatisticsLoading = ref(false)
const statisticsErrorMessage = ref('')
const statistics = reactive<AdminArticleStatistics>({
  totalArticles: 0,
  publishedArticles: 0,
  draftArticles: 0,
  articlesWithCover: 0,
})

const {
  articles,
  searchInput,
  categoryInput,
  statusInput,
  isLoading,
  errorMessage,
  pagination,
  first,
  hasActiveFilters,
  loadArticles,
  searchArticles: handleSearch,
  clearFilters,
  changePage: handlePageChange,
} = useAdminArticleList()

const getCategoryLabel = getArticleCategoryLabel
const getStatusLabel = getArticleStatusLabel
const formatDate = formatNumericDate
const statisticItems = computed(() => [
  { label: '文章總數', value: statistics.totalArticles, icon: 'pi pi-file' },
  { label: '已發布文章', value: statistics.publishedArticles, icon: 'pi pi-send' },
  { label: '草稿文章', value: statistics.draftArticles, icon: 'pi pi-pencil' },
  { label: '含封面文章', value: statistics.articlesWithCover, icon: 'pi pi-image' },
])

const loadArticleStatistics = async () => {
  isStatisticsLoading.value = true
  statisticsErrorMessage.value = ''

  try {
    const response = await getAdminArticleStatistics()
    Object.assign(statistics, response.statistics)
  } catch (error: unknown) {
    statisticsErrorMessage.value = getApiErrorMessage(error, '無法取得文章統計，請稍後再試')
  } finally {
    isStatisticsLoading.value = false
  }
}

const goToCreateArticle = () => {
  void router.push({
    name: 'admin-article-create',
  })
}

const goToEditArticle = (articleId: string) => {
  void router.push({
    name: 'admin-article-edit',
    params: {
      articleId,
    },
  })
}

const updateArticleStatus = async (article: AdminArticle) => {
  const nextStatus: ArticleStatus = article.status === 'published' ? 'draft' : 'published'

  updatingArticleStatusId.value = article.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await updateAdminArticleStatus(article.id, nextStatus)

    articles.value = articles.value.map((currentArticle) =>
      currentArticle.id === response.article.id ? response.article : currentArticle,
    )

    await loadArticleStatistics()
    successMessage.value = response.message
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, '無法更新文章發布狀態，請稍後再試')
  } finally {
    updatingArticleStatusId.value = null
  }
}

const confirmArticleStatusChange = (article: AdminArticle) => {
  const isPublished = article.status === 'published'

  confirm.require({
    header: isPublished ? '確認取消發布' : '確認發布文章',
    message: isPublished
      ? `確定要將「${article.title}」改回草稿嗎？改為草稿後，前台將不再顯示這篇文章。`
      : `確定要發布「${article.title}」嗎？發布後，文章將可以顯示於前台。`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: isPublished ? '改為草稿' : '確認發布',
    rejectLabel: '取消',
    acceptClass: isPublished ? 'p-button-warn' : 'p-button-success',
    accept: () => {
      void updateArticleStatus(article)
    },
  })
}

const deleteArticle = async (article: AdminArticle) => {
  deletingArticleId.value = article.id
  errorMessage.value = ''
  successMessage.value = ''

  try {
    const response = await deleteAdminArticle(article.id)

    successMessage.value = response.message

    const targetPage =
      articles.value.length === 1 && pagination.page > 1 ? pagination.page - 1 : pagination.page

    await Promise.all([
      loadArticles(targetPage, pagination.limit),
      loadArticleStatistics(),
    ])
  } catch (error: unknown) {
    errorMessage.value = getApiErrorMessage(error, '無法刪除文章，請稍後再試')
  } finally {
    deletingArticleId.value = null
  }
}

const confirmDeleteArticle = (article: AdminArticle) => {
  confirm.require({
    header: '確認刪除文章',
    message: `確定要永久刪除「${article.title}」嗎？此操作無法復原。`,
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: '確認刪除',
    rejectLabel: '取消',
    acceptClass: 'p-button-danger',
    accept: () => {
      void deleteArticle(article)
    },
  })
}

onMounted(() => {
  void Promise.all([loadArticleStatistics(), loadArticles()])
})
</script>

<style scoped>
.article-management-page {
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

.page-actions {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
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

.management-panel {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  padding: var(--space-4);

  border-radius: var(--radius-lg);
}

.filter-form {
  display: grid;
  grid-template-columns:
    minmax(240px, 1.5fr)
    minmax(160px, 0.75fr)
    minmax(160px, 0.75fr)
    auto;
  align-items: end;
  gap: var(--space-3);
}

.filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: var(--space-1);
}

.filter-label {
  color: var(--color-text);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.filter-control {
  width: 100%;
}

.filter-actions {
  display: flex;
  gap: var(--space-2);
}

.article-information,
.author-information {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.article-title {
  color: var(--color-text);
}

.article-slug,
.author-information small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  letter-spacing: var(--letter-spacing-tight);
}

.article-actions {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.article-action-button {
  white-space: nowrap;
}

.table-empty {
  padding: var(--space-4);

  color: var(--color-text-secondary);
  text-align: center;
}

@media (max-width: 1100px) {
  .filter-form {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .search-field {
    grid-column: 1 / -1;
  }
}

@media (max-width: 768px) {
  .page-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .page-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .management-panel {
    padding: var(--space-3);
  }

  .filter-form {
    grid-template-columns: minmax(0, 1fr);
  }

  .search-field {
    grid-column: auto;
  }

  .filter-actions {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
