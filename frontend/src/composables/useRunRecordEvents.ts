import type { RunRecord } from '@/types/runRecord'

type RunRecordCreatedListener = (runRecord: RunRecord) => void

const runRecordCreatedListeners = new Set<RunRecordCreatedListener>()

export const useRunRecordEvents = () => {
  const emitRunRecordCreated = (runRecord: RunRecord) => {
    runRecordCreatedListeners.forEach((listener) => listener(runRecord))
  }

  const onRunRecordCreated = (listener: RunRecordCreatedListener) => {
    runRecordCreatedListeners.add(listener)

    return () => {
      runRecordCreatedListeners.delete(listener)
    }
  }

  return {
    emitRunRecordCreated,
    onRunRecordCreated,
  }
}
