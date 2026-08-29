import { ref } from 'vue'

import { getRunnerProgress } from '@/services/runnerProgress'
import type { RunnerProgress } from '@/types/runnerProgress'
import { getApiErrorMessage } from '@/utils/apiError'

export const useRunnerProgress = () => {
  const runnerProgress = ref<RunnerProgress | null>(null)
  const isRunnerProgressLoading = ref(true)
  const runnerProgressError = ref('')

  const loadRunnerProgress = async () => {
    isRunnerProgressLoading.value = true
    runnerProgressError.value = ''

    try {
      const response = await getRunnerProgress()

      runnerProgress.value = response.runnerProgress
    } catch (error: unknown) {
      runnerProgressError.value = getApiErrorMessage(error, '無法取得玩家成長進度，請稍後再試。')
    } finally {
      isRunnerProgressLoading.value = false
    }
  }

  return {
    runnerProgress,
    isRunnerProgressLoading,
    runnerProgressError,
    loadRunnerProgress,
  }
}
