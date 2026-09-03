import api from '@/services/api'
import type {
  DeleteEventResponse,
  EventDetailResponse,
  EventFormPayload,
  EventListResponse,
} from '@/types/event'

export const getEvents = async () => {
  const response = await api.get<EventListResponse>('/events')

  return response.data
}

export const getEventById = async (eventId: string) => {
  const response = await api.get<EventDetailResponse>(`/events/${eventId}`)

  return response.data
}

export const createEvent = async (payload: EventFormPayload) => {
  const response = await api.post<EventDetailResponse>('/events', payload)

  return response.data
}

export const updateEvent = async (eventId: string, payload: EventFormPayload) => {
  const response = await api.patch<EventDetailResponse>(`/events/${eventId}`, payload)

  return response.data
}

export const deleteEvent = async (eventId: string) => {
  const response = await api.delete<DeleteEventResponse>(`/events/${eventId}`)

  return response.data
}

export const joinEvent = async (eventId: string) => {
  const response = await api.post<EventDetailResponse>(`/events/${eventId}/join`)

  return response.data
}

export const leaveEvent = async (eventId: string) => {
  const response = await api.delete<EventDetailResponse>(`/events/${eventId}/join`)

  return response.data
}
