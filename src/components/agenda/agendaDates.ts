import type { Booking, GeneralEvent } from '../../Types'

export const AGENDA_WINDOW_DAYS = 30

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

export function getUpcomingBookings(
  bookings: Booking[],
  today: string,
  windowDays = AGENDA_WINDOW_DAYS,
): Booking[] {
  const windowEnd = addDays(today, windowDays)

  return bookings
    .filter(
      (booking) =>
        booking.status !== 'Cancelled' &&
        booking.startDate >= today &&
        booking.startDate <= windowEnd,
    )
    .sort(
      (left, right) =>
        left.startDate.localeCompare(right.startDate) ||
        left.endDate.localeCompare(right.endDate) ||
        left.id.localeCompare(right.id),
    )
}

export function getUpcomingEvents(
  events: GeneralEvent[],
  today: string,
  windowDays = AGENDA_WINDOW_DAYS,
): GeneralEvent[] {
  const windowEnd = addDays(today, windowDays)

  return events
    .filter(
      (event) =>
        event.startDate >= today && event.startDate <= windowEnd,
    )
    .sort(
      (left, right) =>
        left.startDate.localeCompare(right.startDate) ||
        left.endDate.localeCompare(right.endDate) ||
        left.id.localeCompare(right.id),
    )
}

export function formatGroupDate(date: string, today: string): string {
  const label = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDateOnly(date))

  return date === today ? `Today · ${label}` : label
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
