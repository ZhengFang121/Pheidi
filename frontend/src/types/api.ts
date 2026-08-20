export interface ApiErrorResponse {
  message?: string
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}
