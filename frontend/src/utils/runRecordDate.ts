export interface MonthDateRange {
  start: string
  end: string
}

export interface CalendarDate {
  date: Date
  dateKey: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

const padDatePart = (value: number) =>
  String(value).padStart(2, '0')

export const getLocalDateKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    throw new Error('無效的日期時間')
  }

  const year = date.getFullYear()
  const month = padDatePart(date.getMonth() + 1)
  const day = padDatePart(date.getDate())

  return `${year}-${month}-${day}`
}

export const getLocalMonthRange = (
  year: number,
  monthIndex: number,
): MonthDateRange => {
  const startDate = new Date(year, monthIndex, 1)
  const endDate = new Date(year, monthIndex + 1, 1)

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  }
}

export const getMonthTitle = (
  year: number,
  monthIndex: number,
) => `${year} 年 ${monthIndex + 1} 月`

export const getMonthCalendarDates = (
  year: number,
  monthIndex: number,
): CalendarDate[] => {
  const firstDayOfMonth = new Date(year, monthIndex, 1)

  // JavaScript：星期日是 0；月曆需要星期一作為第一欄。
  const mondayBasedOffset =
    (firstDayOfMonth.getDay() + 6) % 7

  const firstCalendarDate = new Date(
    year,
    monthIndex,
    1 - mondayBasedOffset,
  )

  const todayKey = getLocalDateKey(new Date())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCalendarDate)

    date.setDate(firstCalendarDate.getDate() + index)

    return {
      date,
      dateKey: getLocalDateKey(date),
      dayNumber: date.getDate(),
      isCurrentMonth:
        date.getFullYear() === year &&
        date.getMonth() === monthIndex,
      isToday: getLocalDateKey(date) === todayKey,
    }
  })
}