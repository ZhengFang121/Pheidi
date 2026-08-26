<template>
  <section class="plaza-management-page">
    <ConfirmDialog />

    <div class="page-heading">
      <div>
        <p class="page-eyebrow">PLAZA MANAGEMENT</p>
        <h2 class="page-title">廣場管理</h2>
        <p class="page-description">管理跑友動態、留言與廣場內容。</p>
      </div>
    </div>

    <AdminStatisticsStrip
      :items="statisticItems"
      label="廣場統計"
      :loading="isStatisticsLoading"
    />

    <Message v-if="statisticsErrorMessage" severity="error" :closable="false">
      {{ statisticsErrorMessage }}
    </Message>

    <div class="management-panel">
      <Tabs :value="activeTab" @update:value="handleTabChange">
        <TabList>
          <Tab value="posts">貼文管理</Tab>
          <Tab value="comments">留言管理</Tab>
        </TabList>

        <TabPanels>
          <TabPanel value="posts">
            <form class="filter-form" @submit.prevent="handlePostSearch">
              <div class="filter-field filter-field--search">
                <label for="post-search" class="filter-label">搜尋貼文</label>
                <InputText
                  id="post-search"
                  v-model="postSearchInput"
                  type="search"
                  placeholder="輸入貼文內容或作者名稱"
                  class="filter-control"
                />
              </div>

              <div class="filter-field">
                <label for="post-image-filter" class="filter-label">圖片狀態</label>
                <Select
                  id="post-image-filter"
                  v-model="postImageFilter"
                  :options="imageFilterOptions"
                  option-label="label"
                  option-value="value"
                  class="filter-control"
                  @change="handlePostFilterChange"
                />
              </div>

              <div class="filter-field">
                <label for="post-sort" class="filter-label">建立時間</label>
                <Select
                  id="post-sort"
                  v-model="postSort"
                  :options="sortOptions"
                  option-label="label"
                  option-value="value"
                  class="filter-control"
                  @change="handlePostFilterChange"
                />
              </div>

              <div class="filter-actions">
                <Button type="submit" label="搜尋" :loading="isPostsLoading" />
                <Button
                  v-if="hasActivePostSearch"
                  type="button"
                  label="清除"
                  severity="secondary"
                  outlined
                  @click="clearPostSearch"
                />
              </div>
            </form>

            <Message v-if="postSuccessMessage" severity="success" :closable="false">
              {{ postSuccessMessage }}
            </Message>
            <Message v-if="postErrorMessage" severity="error" :closable="false">
              {{ postErrorMessage }}
            </Message>

            <DataTable
              :value="posts"
              :loading="isPostsLoading"
              :first="postFirst"
              :rows="postPagination.limit"
              :total-records="postPagination.total"
              :rows-per-page-options="[5, 10, 20, 50]"
              lazy
              paginator
              striped-rows
              scrollable
              table-style="min-width: 1080px"
              paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
              current-page-report-template="第 {currentPage} 頁，共 {totalPages} 頁"
              @page="handlePostPageChange"
            >
              <template #empty>
                <div class="table-empty">
                  {{ hasActivePostSearch ? '找不到符合條件的貼文。' : '目前沒有廣場貼文。' }}
                </div>
              </template>

              <Column header="作者" style="width: 150px">
                <template #body="{ data }">
                  <strong>{{ data.author.username }}</strong>
                </template>
              </Column>

              <Column header="貼文內容" style="min-width: 300px">
                <template #body="{ data }">
                  <p class="content-excerpt">{{ data.content }}</p>
                </template>
              </Column>

              <Column header="圖片" style="width: 110px">
                <template #body="{ data }">
                  <img
                    v-if="data.imageUrl"
                    :src="data.imageUrl"
                    :alt="`${data.author.username} 的貼文縮圖`"
                    class="post-thumbnail"
                    loading="lazy"
                  />
                  <Tag v-else value="無圖片" severity="secondary" />
                </template>
              </Column>

              <Column field="likeCount" header="按讚" style="width: 90px" />
              <Column field="commentCount" header="留言" style="width: 90px" />

              <Column header="建立時間" style="width: 150px">
                <template #body="{ data }">
                  {{ formatDate(data.createdAt) }}
                </template>
              </Column>

              <Column header="操作" style="width: 110px">
                <template #body="{ data }">
                  <Button
                    type="button"
                    label="刪除"
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    size="small"
                    :loading="deletingPostIds.has(data.id)"
                    @click="confirmDeletePost(data)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <TabPanel value="comments">
            <form class="filter-form" @submit.prevent="handleCommentSearch">
              <div class="filter-field filter-field--search">
                <label for="comment-search" class="filter-label">搜尋留言</label>
                <InputText
                  id="comment-search"
                  v-model="commentSearchInput"
                  type="search"
                  placeholder="輸入留言內容或作者名稱"
                  class="filter-control"
                />
              </div>

              <div class="filter-field">
                <label for="comment-sort" class="filter-label">建立時間</label>
                <Select
                  id="comment-sort"
                  v-model="commentSort"
                  :options="sortOptions"
                  option-label="label"
                  option-value="value"
                  class="filter-control"
                  @change="handleCommentFilterChange"
                />
              </div>

              <div class="filter-actions">
                <Button type="submit" label="搜尋" :loading="isCommentsLoading" />
                <Button
                  v-if="hasActiveCommentSearch"
                  type="button"
                  label="清除"
                  severity="secondary"
                  outlined
                  @click="clearCommentSearch"
                />
              </div>
            </form>

            <Message v-if="commentSuccessMessage" severity="success" :closable="false">
              {{ commentSuccessMessage }}
            </Message>
            <Message v-if="commentErrorMessage" severity="error" :closable="false">
              {{ commentErrorMessage }}
            </Message>

            <DataTable
              :value="comments"
              :loading="isCommentsLoading"
              :first="commentFirst"
              :rows="commentPagination.limit"
              :total-records="commentPagination.total"
              :rows-per-page-options="[5, 10, 20, 50]"
              lazy
              paginator
              striped-rows
              scrollable
              table-style="min-width: 980px"
              paginator-template="RowsPerPageDropdown FirstPageLink PrevPageLink CurrentPageReport NextPageLink LastPageLink"
              current-page-report-template="第 {currentPage} 頁，共 {totalPages} 頁"
              @page="handleCommentPageChange"
            >
              <template #empty>
                <div class="table-empty">
                  {{ hasActiveCommentSearch ? '找不到符合條件的留言。' : '目前沒有廣場留言。' }}
                </div>
              </template>

              <Column header="留言作者" style="width: 150px">
                <template #body="{ data }">
                  <strong>{{ data.author.username }}</strong>
                </template>
              </Column>

              <Column header="留言內容" style="min-width: 260px">
                <template #body="{ data }">
                  <p class="content-excerpt">{{ data.content }}</p>
                </template>
              </Column>

              <Column header="所屬貼文" style="min-width: 280px">
                <template #body="{ data }">
                  <div class="post-context">
                    <p class="content-excerpt">{{ data.postExcerpt }}</p>
                    <small>{{ data.postId }}</small>
                  </div>
                </template>
              </Column>

              <Column field="likeCount" header="按讚" style="width: 90px" />

              <Column header="建立時間" style="width: 150px">
                <template #body="{ data }">
                  {{ formatDate(data.createdAt) }}
                </template>
              </Column>

              <Column header="操作" style="width: 110px">
                <template #body="{ data }">
                  <Button
                    type="button"
                    label="刪除"
                    icon="pi pi-trash"
                    severity="danger"
                    outlined
                    size="small"
                    :loading="deletingCommentIds.has(data.id)"
                    @click="confirmDeleteComment(data)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'

import Button from 'primevue/button'
import Column from 'primevue/column'
import ConfirmDialog from 'primevue/confirmdialog'
import DataTable from 'primevue/datatable'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Select from 'primevue/select'
import Tab from 'primevue/tab'
import TabList from 'primevue/tablist'
import TabPanel from 'primevue/tabpanel'
import TabPanels from 'primevue/tabpanels'
import Tabs from 'primevue/tabs'
import Tag from 'primevue/tag'
import { useConfirm } from 'primevue/useconfirm'

import AdminStatisticsStrip from '@/components/admin/AdminStatisticsStrip.vue'
import {
  deleteAdminPlazaComment,
  deleteAdminPlazaPost,
  getAdminPlazaComments,
  getAdminPlazaPosts,
  getAdminPlazaStatistics,
} from '@/services/adminPlaza'
import type {
  AdminPlazaComment,
  AdminPlazaPost,
  AdminPlazaSort,
  AdminPlazaStatistics,
} from '@/types/adminPlaza'
import type { Pagination } from '@/types/api'
import { getApiErrorMessage } from '@/utils/apiError'
import { formatNumericDate } from '@/utils/date'

type PlazaManagementTab = 'posts' | 'comments'

interface PageEvent {
  rows: number
  page: number
}

const confirm = useConfirm()
const activeTab = ref<PlazaManagementTab>('posts')

const statistics = reactive<AdminPlazaStatistics>({
  totalPosts: 0,
  totalComments: 0,
  postsWithImages: 0,
  totalPostLikes: 0,
  totalCommentLikes: 0,
})
const statisticsErrorMessage = ref('')
const isStatisticsLoading = ref(false)

const posts = ref<AdminPlazaPost[]>([])
const postSearchInput = ref('')
const activePostSearch = ref('')
const postImageFilter = ref<boolean | null>(null)
const postSort = ref<AdminPlazaSort>('newest')
const isPostsLoading = ref(false)
const postErrorMessage = ref('')
const postSuccessMessage = ref('')
const deletingPostIds = ref(new Set<string>())
const postPagination = reactive<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })

const comments = ref<AdminPlazaComment[]>([])
const commentSearchInput = ref('')
const activeCommentSearch = ref('')
const commentSort = ref<AdminPlazaSort>('newest')
const isCommentsLoading = ref(false)
const hasLoadedComments = ref(false)
const commentErrorMessage = ref('')
const commentSuccessMessage = ref('')
const deletingCommentIds = ref(new Set<string>())
const commentPagination = reactive<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 })

const imageFilterOptions = [
  { label: '全部貼文', value: null },
  { label: '有圖片', value: true },
  { label: '無圖片', value: false },
]

const sortOptions: Array<{ label: string; value: AdminPlazaSort }> = [
  { label: '最新優先', value: 'newest' },
  { label: '最舊優先', value: 'oldest' },
]

const statisticItems = computed(() => [
  { label: '貼文總數', value: statistics.totalPosts, icon: 'pi pi-file' },
  { label: '留言總數', value: statistics.totalComments, icon: 'pi pi-comments' },
  { label: '含圖片貼文', value: statistics.postsWithImages, icon: 'pi pi-image' },
  { label: '貼文按讚總數', value: statistics.totalPostLikes, icon: 'pi pi-heart' },
  { label: '留言按讚總數', value: statistics.totalCommentLikes, icon: 'pi pi-thumbs-up' },
])

const postFirst = computed(() => (postPagination.page - 1) * postPagination.limit)
const commentFirst = computed(() => (commentPagination.page - 1) * commentPagination.limit)
const hasActivePostSearch = computed(() => Boolean(activePostSearch.value))
const hasActiveCommentSearch = computed(() => Boolean(activeCommentSearch.value))

const formatDate = (date: string) => formatNumericDate(date, 'Asia/Taipei')

const loadStatistics = async () => {
  isStatisticsLoading.value = true
  statisticsErrorMessage.value = ''

  try {
    const response = await getAdminPlazaStatistics()
    Object.assign(statistics, response.statistics)
  } catch (error: unknown) {
    statisticsErrorMessage.value = getApiErrorMessage(error, '無法取得廣場統計，請稍後再試。')
  } finally {
    isStatisticsLoading.value = false
  }
}

const loadPosts = async (page = postPagination.page, limit = postPagination.limit) => {
  isPostsLoading.value = true
  postErrorMessage.value = ''

  try {
    const response = await getAdminPlazaPosts({
      page,
      limit,
      search: activePostSearch.value || undefined,
      hasImage: postImageFilter.value ?? undefined,
      sort: postSort.value,
    })

    posts.value = response.items
    Object.assign(postPagination, response.pagination)
  } catch (error: unknown) {
    postErrorMessage.value = getApiErrorMessage(error, '無法取得貼文列表，請稍後再試。')
  } finally {
    isPostsLoading.value = false
  }
}

const loadComments = async (page = commentPagination.page, limit = commentPagination.limit) => {
  isCommentsLoading.value = true
  commentErrorMessage.value = ''

  try {
    const response = await getAdminPlazaComments({
      page,
      limit,
      search: activeCommentSearch.value || undefined,
      sort: commentSort.value,
    })

    comments.value = response.items
    Object.assign(commentPagination, response.pagination)
    hasLoadedComments.value = true
  } catch (error: unknown) {
    commentErrorMessage.value = getApiErrorMessage(error, '無法取得留言列表，請稍後再試。')
  } finally {
    isCommentsLoading.value = false
  }
}

const handleTabChange = async (value: string | number) => {
  if (value !== 'posts' && value !== 'comments') return

  activeTab.value = value

  if (value === 'comments' && !hasLoadedComments.value) {
    await loadComments()
  }
}

const handlePostSearch = async () => {
  activePostSearch.value = postSearchInput.value.trim()
  postSuccessMessage.value = ''
  await loadPosts(1, postPagination.limit)
}

const clearPostSearch = async () => {
  postSearchInput.value = ''
  activePostSearch.value = ''
  postSuccessMessage.value = ''
  await loadPosts(1, postPagination.limit)
}

const handlePostFilterChange = async () => {
  postSuccessMessage.value = ''
  await loadPosts(1, postPagination.limit)
}

const handlePostPageChange = async (event: PageEvent) => {
  postSuccessMessage.value = ''
  await loadPosts(event.page + 1, event.rows)
}

const handleCommentSearch = async () => {
  activeCommentSearch.value = commentSearchInput.value.trim()
  commentSuccessMessage.value = ''
  await loadComments(1, commentPagination.limit)
}

const clearCommentSearch = async () => {
  commentSearchInput.value = ''
  activeCommentSearch.value = ''
  commentSuccessMessage.value = ''
  await loadComments(1, commentPagination.limit)
}

const handleCommentFilterChange = async () => {
  commentSuccessMessage.value = ''
  await loadComments(1, commentPagination.limit)
}

const handleCommentPageChange = async (event: PageEvent) => {
  commentSuccessMessage.value = ''
  await loadComments(event.page + 1, event.rows)
}

const deletePost = async (post: AdminPlazaPost) => {
  deletingPostIds.value = new Set(deletingPostIds.value).add(post.id)
  postErrorMessage.value = ''
  postSuccessMessage.value = ''

  try {
    const response = await deleteAdminPlazaPost(post.id)
    const nextPage =
      posts.value.length === 1 && postPagination.page > 1
        ? postPagination.page - 1
        : postPagination.page

    await Promise.all([loadPosts(nextPage, postPagination.limit), loadStatistics()])
    postSuccessMessage.value = response.message
  } catch (error: unknown) {
    postErrorMessage.value = getApiErrorMessage(error, '刪除貼文失敗，請稍後再試。')
  } finally {
    const pendingIds = new Set(deletingPostIds.value)
    pendingIds.delete(post.id)
    deletingPostIds.value = pendingIds
  }
}

const deleteComment = async (comment: AdminPlazaComment) => {
  deletingCommentIds.value = new Set(deletingCommentIds.value).add(comment.id)
  commentErrorMessage.value = ''
  commentSuccessMessage.value = ''

  try {
    const response = await deleteAdminPlazaComment(comment.id)
    const nextPage =
      comments.value.length === 1 && commentPagination.page > 1
        ? commentPagination.page - 1
        : commentPagination.page

    await Promise.all([loadComments(nextPage, commentPagination.limit), loadStatistics()])
    commentSuccessMessage.value = response.message
  } catch (error: unknown) {
    commentErrorMessage.value = getApiErrorMessage(error, '刪除留言失敗，請稍後再試。')
  } finally {
    const pendingIds = new Set(deletingCommentIds.value)
    pendingIds.delete(comment.id)
    deletingCommentIds.value = pendingIds
  }
}

const confirmDeletePost = (post: AdminPlazaPost) => {
  confirm.require({
    header: '刪除貼文',
    message: '刪除貼文會連同其所有留言一起刪除，且無法復原。確定要繼續嗎？',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '刪除貼文',
    acceptClass: 'p-button-danger',
    accept: () => void deletePost(post),
  })
}

const confirmDeleteComment = (comment: AdminPlazaComment) => {
  confirm.require({
    header: '刪除留言',
    message: '刪除留言後無法復原。確定要繼續嗎？',
    icon: 'pi pi-exclamation-triangle',
    rejectLabel: '取消',
    acceptLabel: '刪除留言',
    acceptClass: 'p-button-danger',
    accept: () => void deleteComment(comment),
  })
}

onMounted(() => {
  void Promise.all([loadStatistics(), loadPosts()])
})
</script>

<style scoped>
.plaza-management-page {
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
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
  font-weight: var(--font-weight-bold);
  letter-spacing: var(--letter-spacing-wide);
}

.page-title {
  margin: 0;
  font-size: var(--font-size-lg);
  line-height: var(--line-height-heading);
}

.page-description {
  margin: var(--space-1) 0 0;
  color: var(--color-text-secondary);
}

.management-panel {
  padding: var(--space-4);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.filter-form {
  display: flex;
  align-items: flex-end;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}

.filter-field {
  display: flex;
  min-width: 180px;
  flex-direction: column;
  gap: var(--space-1);
}

.filter-field--search {
  width: min(100%, 420px);
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

.content-excerpt {
  display: -webkit-box;
  margin: 0;
  overflow: hidden;
  line-height: var(--line-height-base);
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.post-thumbnail {
  display: block;
  width: 64px;
  height: 48px;
  object-fit: cover;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.post-context {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.post-context small {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: var(--font-size-xs);
  letter-spacing: normal;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-empty {
  padding: var(--space-4);
  color: var(--color-text-secondary);
  text-align: center;
}

:deep(.p-tabpanels) {
  padding: var(--space-4) 0 0;
}

@media (max-width: 1100px) {
  .filter-form {
    flex-wrap: wrap;
  }
}

@media (max-width: 640px) {
  .page-title {
    font-size: var(--font-size-md);
  }

  .management-panel {
    padding: var(--space-3);
  }

  .filter-form,
  .filter-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .filter-field,
  .filter-field--search {
    width: 100%;
  }
}
</style>
