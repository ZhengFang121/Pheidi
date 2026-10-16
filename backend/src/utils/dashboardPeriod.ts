const dayMilliseconds = 24 * 60 * 60 * 1000
const taipeiOffsetMilliseconds = 8 * 60 * 60 * 1000
export const dashboardTimeZone = 'Asia/Taipei'

export const getTaipeiDayStart = (date: Date) => {
  const taipeiDate = new Date(date.getTime() + taipeiOffsetMilliseconds)
  taipeiDate.setUTCHours(0, 0, 0, 0)

  return new Date(taipeiDate.getTime() - taipeiOffsetMilliseconds)
}

export const resolveDashboardPeriod = (value: unknown, now = new Date()) => {
  // 僅接受介面提供的期間，避免無效日期被 Date 自動轉成其他月份。
  if (value !== undefined && value !== 'recent-30-days' && value !== '2026-09') {
    return null
  }

  const key = value ?? 'recent-30-days'
  const todayStart = getTaipeiDayStart(now)
  const start =
    key === '2026-09'
      ? new Date('2026-09-01T00:00:00+08:00')
      : new Date(todayStart.getTime() - 29 * dayMilliseconds)
  const end =
    key === '2026-09'
      ? new Date('2026-10-01T00:00:00+08:00')
      : new Date(todayStart.getTime() + dayMilliseconds)
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: dashboardTimeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const dateKeys = Array.from(
    { length: (end.getTime() - start.getTime()) / dayMilliseconds },
    (_, index) => formatter.format(new Date(start.getTime() + index * dayMilliseconds)),
  )

  return {
    start,
    end,
    dateKeys,
    metadata: {
      key,
      label: key === '2026-09' ? '2026 年 9 月' : '最近 30 天',
      startDate: formatter.format(start),
      endDate: formatter.format(new Date(end.getTime() - dayMilliseconds)),
      timeZone: dashboardTimeZone,
    },
  }
}
