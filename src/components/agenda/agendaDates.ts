import type { Booking, GeneralEvent } from '../../Types'

export const AGENDA_INITIAL_PAST_DAYS = 90
export const AGENDA_INITIAL_FUTURE_DAYS = 365
export const AGENDA_RANGE_STEP_DAYS = 365

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function toDateString(date: Date): string {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export function addDays(date: string, days: number): string {
  const shiftedDate = parseDateOnly(date)
  shiftedDate.setUTCDate(shiftedDate.getUTCDate() + days)
  return toDateString(shiftedDate)
}

export function getAgendaRange(today: string) {
  return {
    startDate: addDays(today, -AGENDA_INITIAL_PAST_DAYS),
    endDate: addDays(today, AGENDA_INITIAL_FUTURE_DAYS),
  }
}

export function getAgendaBookings(
  bookings: Booking[],
  rangeStart: string,
  rangeEnd: string,
): Booking[] {
  return bookings
    .filter(
      (booking) =>
        booking.status !== 'Cancelled' &&
        booking.startDate <= rangeEnd &&
        booking.endDate >= rangeStart,
    )
    .sort(compareScheduleDates)
}

export function getAgendaEvents(
  events: GeneralEvent[],
  rangeStart: string,
  rangeEnd: string,
): GeneralEvent[] {
  return events
    .filter(
      (event) =>
        event.startDate <= rangeEnd && event.endDate >= rangeStart,
    )
    .sort(compareScheduleDates)
}

function compareScheduleDates(
  left: { id: string; startDate: string; endDate: string },
  right: { id: string; startDate: string; endDate: string },
) {
  return left.startDate.localeCompare(right.startDate) ||
    left.endDate.localeCompare(right.endDate) ||
    left.id.localeCompare(right.id)
}

export function getMonthKey(date: string): string {
  return date.slice(0, 7)
}

export function formatMonthHeading(monthKey: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDateOnly(`${monthKey}-01`))
}

export function formatTodayDivider(date: string): string {
  return `Today · ${new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(parseDateOnly(date))}`
}

export function formatBookingDateRange(
  startDate: string,
  endDate: string,
): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })
  const startLabel = formatter.format(parseDateOnly(startDate))

  if (startDate === endDate) return startLabel

  return `${startLabel} – ${formatter.format(parseDateOnly(endDate))}`
}

export function normalizeAgendaSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}
