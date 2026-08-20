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
