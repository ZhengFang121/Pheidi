import sanitizeHtml from 'sanitize-html'

export type EventStatus = 'available' | 'full' | 'ended'

interface EventStatusSource {
  endAt: Date
  capacity?: number | undefined
  participantCount: number
}

export const resolveEventStatus = (
  event: EventStatusSource,
  now: Date = new Date(),
): EventStatus => {
  if (event.endAt.getTime() <= now.getTime()) return 'ended'
  if (event.capacity !== undefined && event.participantCount >= event.capacity) return 'full'

  return 'available'
}

export interface EventFormData {
  title: string
  summary: string
  content?: string | undefined
  location: string
  startAt: Date
  endAt: Date
  distance: string
  capacity?: number | undefined
  notes: string[]
}

type EventValidationResult =
  { isValid: true; data: EventFormData } | { isValid: false; message: string }

const sanitizeText = (value: string) =>
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {},
  }).trim()

const validateRequiredText = (
  value: unknown,
  label: string,
  maximumLength: number,
): { value: string } | { error: string } => {
  if (typeof value !== 'string' || !value.trim()) return { error: `請輸入${label}` }

  const sanitizedValue = sanitizeText(value)

  if (!sanitizedValue) return { error: `${label}不能只有 HTML 標籤` }
  if (sanitizedValue.length > maximumLength) {
    return { error: `${label}不能超過 ${maximumLength} 個字元` }
  }

  return { value: sanitizedValue }
}

interface EventValidationOptions {
  requireFutureStart?: boolean
  now?: Date
}

export const validateEventFormData = (
  body: unknown,
  options: EventValidationOptions = {},
): EventValidationResult => {
  if (typeof body !== 'object' || body === null) {
    return { isValid: false, message: '活動資料格式不正確' }
  }

  const { title, summary, content, location, startAt, endAt, distance, capacity, notes } =
    body as Record<string, unknown>

  const requiredFields = [
    ['title', title, '活動名稱', 120],
    ['summary', summary, '活動簡介', 300],
    ['location', location, '活動地點', 160],
    ['distance', distance, '活動距離', 80],
  ] as const
  const validatedText = new Map<string, string>()

  for (const [key, value, label, maximumLength] of requiredFields) {
    const result = validateRequiredText(value, label, maximumLength)

    if ('error' in result) return { isValid: false, message: result.error }
    validatedText.set(key, result.value)
  }

  if (typeof startAt !== 'string' || typeof endAt !== 'string') {
    return { isValid: false, message: '請選擇完整的活動日期與時間' }
  }

  const parsedStartAt = new Date(startAt)
  const parsedEndAt = new Date(endAt)

  if (Number.isNaN(parsedStartAt.getTime()) || Number.isNaN(parsedEndAt.getTime())) {
    return { isValid: false, message: '活動日期或時間格式不正確' }
  }

  if (parsedEndAt.getTime() <= parsedStartAt.getTime()) {
    return { isValid: false, message: '活動結束時間必須晚於開始時間' }
  }

  const now = options.now ?? new Date()

  if (parsedEndAt.getTime() <= now.getTime()) {
    return { isValid: false, message: '活動結束時間必須晚於現在' }
  }

  if (options.requireFutureStart && parsedStartAt.getTime() <= now.getTime()) {
    return { isValid: false, message: '活動開始時間必須晚於現在' }
  }

  let normalizedCapacity: number | undefined

  if (capacity !== undefined && capacity !== null && capacity !== '') {
    if (typeof capacity !== 'number' || !Number.isInteger(capacity) || capacity < 1) {
      return { isValid: false, message: '參加人數上限必須是大於 0 的整數' }
    }

    normalizedCapacity = capacity
  }

  let normalizedContent: string | undefined

  if (content !== undefined && content !== null && content !== '') {
    if (typeof content !== 'string') {
      return { isValid: false, message: '活動詳細介紹格式不正確' }
    }

    normalizedContent = sanitizeText(content)

    if (normalizedContent.length > 5000) {
      return { isValid: false, message: '活動詳細介紹不能超過 5000 個字元' }
    }
  }

  let normalizedNotes: string[] = []

  if (notes !== undefined && notes !== null) {
    if (!Array.isArray(notes) || notes.some((note) => typeof note !== 'string')) {
      return { isValid: false, message: '活動提醒格式不正確' }
    }

    normalizedNotes = notes.map((note) => sanitizeText(note as string)).filter(Boolean)

    if (normalizedNotes.length > 10) {
      return { isValid: false, message: '活動提醒最多 10 項' }
    }

    if (normalizedNotes.some((note) => note.length > 200)) {
      return { isValid: false, message: '每項活動提醒不能超過 200 個字元' }
    }
  }

  return {
    isValid: true,
    data: {
      title: validatedText.get('title')!,
      summary: validatedText.get('summary')!,
      location: validatedText.get('location')!,
      startAt: parsedStartAt,
      endAt: parsedEndAt,
      distance: validatedText.get('distance')!,
      notes: normalizedNotes,
      ...(normalizedContent ? { content: normalizedContent } : {}),
      ...(normalizedCapacity !== undefined ? { capacity: normalizedCapacity } : {}),
    },
  }
}
