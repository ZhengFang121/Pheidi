import type { EventStatus } from '@/types/event'

export type EventStatusSeverity = 'success' | 'warn' | 'secondary'

const eventStatusPresentation: Record<
  EventStatus,
  { label: string; severity: EventStatusSeverity }
> = {
  available: { label: '可參加', severity: 'success' },
  full: { label: '已額滿', severity: 'warn' },
  ended: { label: '已結束', severity: 'secondary' },
}

export const getEventStatusPresentation = (status: EventStatus) => {
  return eventStatusPresentation[status]
}

export const formatEventParticipantCount = (participantCount: number, capacity?: number) => {
  return capacity === undefined
    ? `${participantCount} 人參加`
    : `${participantCount} / ${capacity} 人`
}
