import { computed, reactive, ref } from 'vue'

import { getAdminArticles } from '@/services/adminArticles'
import type { Pagination } from '@/types/api'
import type { AdminArticle, ArticleCategory, ArticleStatus } from '@/types/article'
import { getApiErrorMessage } from '@/utils/apiError'

interface PageChangeEvent {
  page: number
  rows: number
}

export const useAdminArticleList = () => {
  const articles = ref<AdminArticle[]>([])
  const searchInput = ref('')
  const categoryInput = ref<ArticleCategory | null>(null)
  const statusInput = ref<ArticleStatus | null>(null)

  const activeSearch = ref('')
  const activeCategory = ref<ArticleCategory | null>(null)
  const activeStatus = ref<ArticleStatus | null>(null)

  const isLoading = ref(false)
  const errorMessage = ref('')

  const pagination = reactive<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  const first = computed(() => (pagination.page - 1) * pagination.limit)

  const hasActiveFilters = computed(() =>
    Boolean(activeSearch.value || activeCategory.value || activeStatus.value),
  )

  const loadArticles = async (page = pagination.page, limit = pagination.limit) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await getAdminArticles({
        page,
        limit,
        search: activeSearch.value || undefined,
        category: activeCategory.value || undefined,
        status: activeStatus.value || undefined,
      })

      articles.value = response.articles
      Object.assign(pagination, response.pagination)
    } catch (error: unknown) {
      errorMessage.value = getApiErrorMessage(error, '無法取得文章列表，請稍後再試')
    } finally {
      isLoading.value = false
    }
  }

  const searchArticles = async () => {
    activeSearch.value = searchInput.value.trim()
    activeCategory.value = categoryInput.value
    activeStatus.value = statusInput.value

    await loadArticles(1, pagination.limit)
  }

  const clearFilters = async () => {
    searchInput.value = ''
    categoryInput.value = null
    statusInput.value = null

    activeSearch.value = ''
    activeCategory.value = null
    activeStatus.value = null

    await loadArticles(1, pagination.limit)
  }

  const changePage = async (event: PageChangeEvent) => {
    await loadArticles(event.page + 1, event.rows)
  }

  return {
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
    searchArticles,
    clearFilters,
    changePage,
  }
}
