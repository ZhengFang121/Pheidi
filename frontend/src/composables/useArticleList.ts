import { computed, reactive, ref } from 'vue'

import { getArticles } from '@/services/articles'
import type { Pagination } from '@/types/api'
import type { ArticleCategory, ArticleListItem } from '@/types/article'
import { getApiErrorMessage } from '@/utils/apiError'

interface PageChangeEvent {
  page: number
  rows: number
}

export const useArticleList = () => {
  const articles = ref<ArticleListItem[]>([])
  const searchInput = ref('')
  const activeSearch = ref('')
  const activeCategory = ref<ArticleCategory | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  const pagination = reactive<Pagination>({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  })

  const first = computed(() => (pagination.page - 1) * pagination.limit)

  const loadArticles = async (page = pagination.page, limit = pagination.limit) => {
    isLoading.value = true
    errorMessage.value = ''

    try {
      const response = await getArticles({
        page,
        limit,
        search: activeSearch.value || undefined,
        category: activeCategory.value || undefined,
      })

      articles.value = response.articles
      Object.assign(pagination, response.pagination)
    } catch (error: unknown) {
      errorMessage.value = getApiErrorMessage(error, '無法取得跑者學院文章，請稍後再試')
    } finally {
      isLoading.value = false
    }
  }

  const searchArticles = async () => {
    activeSearch.value = searchInput.value.trim()

    await loadArticles(1, pagination.limit)
  }

  const clearSearch = async () => {
    searchInput.value = ''
    activeSearch.value = ''

    await loadArticles(1, pagination.limit)
  }

  const changeCategory = async (category: ArticleCategory | null) => {
    if (activeCategory.value === category) return

    activeCategory.value = category

    await loadArticles(1, pagination.limit)
  }

  const changePage = async (event: PageChangeEvent) => {
    await loadArticles(event.page + 1, event.rows)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return {
    articles,
    searchInput,
    activeSearch,
    activeCategory,
    isLoading,
    errorMessage,
    pagination,
    first,
    loadArticles,
    searchArticles,
    clearSearch,
    changeCategory,
    changePage,
  }
}
