export type CalendarMonth = {
  year: number
  monthIndex: number
}

export type CalendarDay = {
  date: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

type DateParts = {
  year: number
  monthIndex: number
  day: number
}

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toDateString(parts: DateParts): string {
  return `${parts.year}-${pad(parts.monthIndex + 1)}-${pad(parts.day)}`
}

function shiftDate(parts: DateParts, days: number): DateParts {
  const date = new Date(
    Date.UTC(parts.year, parts.monthIndex, parts.day + days),
  )

  return {
    year: date.getUTCFullYear(),
    monthIndex: date.getUTCMonth(),
    day: date.getUTCDate(),
  }
}

export function getTodayDateString(now = new Date()): string {
  return toDateString({
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
    day: now.getDate(),
  })
}

export function getCurrentMonth(now = new Date()): CalendarMonth {
  return {
    year: now.getFullYear(),
    monthIndex: now.getMonth(),
  }
}

export function moveMonth(
  month: CalendarMonth,
  amount: number,
): CalendarMonth {
  const absoluteMonth = month.year * 12 + month.monthIndex + amount

  return {
    year: Math.floor(absoluteMonth / 12),
    monthIndex: ((absoluteMonth % 12) + 12) % 12,
  }
}

export function getMonthLabel(month: CalendarMonth): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(month.year, month.monthIndex, 1)))
}

export function getMonthDateRange(month: CalendarMonth): {
  startDate: string
  endDate: string
} {
  const finalDay = new Date(
    Date.UTC(month.year, month.monthIndex + 1, 0),
  ).getUTCDate()

  return {
    startDate: toDateString({ ...month, day: 1 }),
    endDate: toDateString({ ...month, day: finalDay }),
  }
}

export function buildMonthGrid(
  month: CalendarMonth,
  today = getTodayDateString(),
): CalendarDay[] {
  const firstWeekday = new Date(
    Date.UTC(month.year, month.monthIndex, 1),
  ).getUTCDay()
  const gridStart = shiftDate(
    { year: month.year, monthIndex: month.monthIndex, day: 1 },
    -firstWeekday,
  )

  return Array.from({ length: 42 }, (_, index) => {
    const dateParts = shiftDate(gridStart, index)
    const date = toDateString(dateParts)

    return {
      date,
      dayNumber: dateParts.day,
      isCurrentMonth:
        dateParts.year === month.year &&
        dateParts.monthIndex === month.monthIndex,
      isToday: date === today,
    }
  })
}
