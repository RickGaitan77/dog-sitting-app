import type { Meal } from '../../Types'

export type MealWeekDay = {
  date: string
  weekday: string
  dateLabel: string
}

export type MealPrepState = 'none' | 'upcoming' | 'due' | 'overdue' | 'complete'

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function toDateString(date: Date): string {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export function addMealDateDays(date: string, days: number): string {
  const shifted = parseDateOnly(date)
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return toDateString(shifted)
}

export function getMealWeekStart(date: string): string {
  const weekday = parseDateOnly(date).getUTCDay()
  const daysSinceMonday = (weekday + 6) % 7
  return addMealDateDays(date, -daysSinceMonday)
}

export function moveMealWeek(weekStart: string, amount: number): string {
  return addMealDateDays(weekStart, amount * 7)
}

export function buildMealWeek(weekStart: string): MealWeekDay[] {
  return Array.from({ length: 7 }, (_, index) => {
    const date = addMealDateDays(weekStart, index)
    const parsed = parseDateOnly(date)
    return {
      date,
      weekday: new Intl.DateTimeFormat(undefined, {
        weekday: 'short',
        timeZone: 'UTC',
      }).format(parsed),
      dateLabel: new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }).format(parsed),
    }
  })
}

export function formatMealWeekRange(weekStart: string): string {
  const weekEnd = addMealDateDays(weekStart, 6)
  const start = parseDateOnly(weekStart)
  const end = parseDateOnly(weekEnd)
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear()
  const startLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: sameYear ? undefined : 'numeric',
    timeZone: 'UTC',
  }).format(start)
  const endLabel = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(end)

  return `${startLabel}–${endLabel}`
}

export function getMealPrepState(
  meal: Meal,
  today: string,
): MealPrepState {
  if (meal.prepCompleted) return 'complete'
  if (meal.prepDate === undefined) return 'none'
  if (meal.prepDate < today) return 'overdue'
  if (meal.prepDate === today) return 'due'
  return 'upcoming'
}
