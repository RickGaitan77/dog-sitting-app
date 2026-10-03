import type { Booking, Meal } from '../Types'

export type UrgencyLevel = 0 | 1 | 2 | 3 | 4

export type UrgencyState = {
  level: UrgencyLevel
  animate: boolean
  label: string
}

const DAY_IN_MILLISECONDS = 86_400_000

function parseDateOnly(date: string): number {
  const [year, month, day] = date.split('-').map(Number)
  return Date.UTC(year, month - 1, day)
}

function formatLocalDate(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-')
}

export function addDateOnlyDays(date: string, days: number): string {
  const shifted = new Date(parseDateOnly(date))
  shifted.setUTCDate(shifted.getUTCDate() + days)
  return [
    shifted.getUTCFullYear(),
    String(shifted.getUTCMonth() + 1).padStart(2, '0'),
    String(shifted.getUTCDate()).padStart(2, '0'),
  ].join('-')
}

export function urgencyClassName(
  state: Pick<UrgencyState, 'level' | 'animate'>,
): string {
  return `urgency urgency-level-${state.level}${state.animate ? ' urgency-animated' : ''}`
}

export function getTentativeBookingUrgency(
  booking: Booking,
  today: string,
): UrgencyState {
  if (booking.status !== 'Tentative' || booking.endDate < today) {
    return { level: 0, animate: false, label: 'Normal' }
  }

  const isNearTerm = booking.startDate <= addDateOnlyDays(today, 3)
  return isNearTerm
    ? { level: 2, animate: true, label: 'Tentative · starts within 3 days' }
    : { level: 1, animate: false, label: 'Tentative · review recommended' }
}

export function getMealPrepUrgency(meal: Meal, today: string): UrgencyState {
  if (
    meal.prepCompleted ||
    meal.prepDate === undefined ||
    meal.prepDate >= today
  ) {
    return { level: 0, animate: false, label: 'Normal' }
  }

  return { level: 3, animate: true, label: 'Prep overdue' }
}

export function getBackupUrgency(
  lastBackupAt: string | undefined,
  now = new Date(),
): UrgencyState {
  if (lastBackupAt === undefined) {
    return { level: 3, animate: true, label: 'Backup overdue · no backup recorded' }
  }

  const backupDate = new Date(lastBackupAt)
  if (Number.isNaN(backupDate.getTime())) {
    return { level: 3, animate: true, label: 'Backup overdue · date unavailable' }
  }

  const ageInDays = Math.max(
    0,
    Math.floor(
      (parseDateOnly(formatLocalDate(now)) -
        parseDateOnly(formatLocalDate(backupDate))) /
        DAY_IN_MILLISECONDS,
    ),
  )

  if (ageInDays < 7) {
    return { level: 0, animate: false, label: 'Backup current' }
  }
  if (ageInDays < 14) {
    return { level: 1, animate: false, label: `Backup recommended · ${ageInDays} days ago` }
  }
  return { level: 3, animate: true, label: `Backup overdue · ${ageInDays} days ago` }
}
