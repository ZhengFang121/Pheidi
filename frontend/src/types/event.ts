export type EventStatus = 'available' | 'full' | 'ended'

export interface EventCreator {
  id: string
  username: string
}

export interface RunningEvent {
  id: string
  title: string
  summary: string
  content?: string
  location: string
  startAt: string
  endAt: string
  distance: string
  capacity?: number
  participantCount: number
  isParticipant: boolean
  status: EventStatus
  createdBy: EventCreator
  notes: string[]
}

export type RunningEventListItem = Omit<RunningEvent, 'content' | 'notes'>

export interface EventFormPayload {
  title: string
  summary: string
  content?: string
  location: string
  startAt: string
  endAt: string
  distance: string
  capacity?: number
  notes?: string[]
}

export interface EventListResponse {
  message: string
  events: RunningEventListItem[]
}

export interface EventDetailResponse {
  message: string
  event: RunningEvent
}

export interface DeleteEventResponse {
  message: string
}
