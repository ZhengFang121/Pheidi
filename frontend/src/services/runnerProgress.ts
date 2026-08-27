import api from '@/services/api'
import type { GetRunnerProgressResponse } from '@/types/runnerProgress'

export const getRunnerProgress = async () => {
  const response = await api.get<GetRunnerProgressResponse>('/runner-progress')

  return response.data
}
