import { isAxiosError } from 'axios'

import type { ApiErrorResponse } from '@/types/api'

export const getApiErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (!isAxiosError<ApiErrorResponse>(error)) return fallbackMessage

  return error.response?.data.message ?? fallbackMessage
}

export const hasApiErrorStatus = (error: unknown, status: number) => {
  return isAxiosError(error) && error.response?.status === status
}
