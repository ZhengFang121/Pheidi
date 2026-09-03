const createDateFormatter = (month: 'long' | '2-digit', timeZone?: string) => {
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month,
    day: 'numeric',
    timeZone,
  })
}

export const formatLongDate = (date: string) => {
  return createDateFormatter('long').format(new Date(date))
}

export const formatNumericDate = (date: string, timeZone?: string) => {
  return createDateFormatter('2-digit', timeZone).format(new Date(date))
}

const eventTimeZone = 'Asia/Taipei'

const eventMonthFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  timeZone: eventTimeZone,
})

const eventDayFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  timeZone: eventTimeZone,
})

const eventLongDateFormatter = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: eventTimeZone,
})

const eventTimeFormatter = new Intl.DateTimeFormat('zh-TW', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZone: eventTimeZone,
})

export const formatEventMonth = (date: string) => {
  return eventMonthFormatter.format(new Date(date)).toUpperCase()
}

export const formatEventDay = (date: string) => {
  return eventDayFormatter.format(new Date(date))
}

export const formatEventLongDate = (date: string) => {
  return eventLongDateFormatter.format(new Date(date))
}

export const formatEventTimeRange = (startAt: string, endAt: string) => {
  return `${eventTimeFormatter.format(new Date(startAt))}－${eventTimeFormatter.format(new Date(endAt))}`
}
