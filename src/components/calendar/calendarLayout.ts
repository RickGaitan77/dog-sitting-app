import type { Booking, GeneralEvent } from '../../Types'

export type CalendarWorkItem = {
  id: string
  key: string
  kind: 'booking' | 'event'
  startDate: string
  endDate: string
  areaId?: string
}

export type CalendarLaidOutItem = CalendarWorkItem & {
  lane: number
}

export type CalendarSegmentPosition =
  | 'single'
  | 'start'
  | 'middle'
  | 'end'

export function buildCalendarWorkLayout(
  bookings: Booking[],
  events: GeneralEvent[],
  visibleStart: string,
  visibleEnd: string,
  showBookings: boolean,
  showEvents: boolean,
): CalendarLaidOutItem[] {
  const items: CalendarWorkItem[] = []

  if (showBookings) {
    bookings
      .filter(
        (booking) =>
          booking.status !== 'Cancelled' &&
          booking.startDate <= visibleEnd &&
          booking.endDate >= visibleStart,
      )
      .forEach((booking) => items.push({
        id: booking.id,
        key: `booking:${booking.id}`,
        kind: 'booking',
        startDate: booking.startDate,
        endDate: booking.endDate,
        areaId: booking.areaId,
      }))
  }

  if (showEvents) {
    events
      .filter(
        (event) =>
          event.startDate <= visibleEnd && event.endDate >= visibleStart,
      )
      .forEach((event) => items.push({
        id: event.id,
        key: `event:${event.id}`,
        kind: 'event',
        startDate: event.startDate,
        endDate: event.endDate,
        areaId: event.areaId,
      }))
  }

  items.sort(
    (left, right) =>
      left.startDate.localeCompare(right.startDate) ||
      right.endDate.localeCompare(left.endDate) ||
      left.kind.localeCompare(right.kind) ||
      left.id.localeCompare(right.id),
  )

  const laneEndDates: string[] = []

  return items.map((item) => {
    const availableLane = laneEndDates.findIndex(
      (endDate) => endDate < item.startDate,
    )
    const lane = availableLane === -1
      ? laneEndDates.length
      : availableLane

    laneEndDates[lane] = item.endDate
    return { ...item, lane }
  })
}

export function getCalendarSegmentPosition(
  item: CalendarWorkItem,
  date: string,
  columnIndex: number,
  visibleStart: string,
  visibleEnd: string,
): CalendarSegmentPosition {
  const continuesBefore =
    item.startDate < date && columnIndex > 0 && date > visibleStart
  const continuesAfter =
    item.endDate > date && columnIndex < 6 && date < visibleEnd

  if (!continuesBefore && !continuesAfter) return 'single'
  if (!continuesBefore) return 'start'
  if (!continuesAfter) return 'end'
  return 'middle'
}

export function workItemsForDate(
  items: CalendarLaidOutItem[],
  date: string,
): CalendarLaidOutItem[] {
  return items.filter(
    (item) => item.startDate <= date && item.endDate >= date,
  )
}
