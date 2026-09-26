import { useMemo, type CSSProperties } from 'react'
import type {
  Area,
  Booking,
  Client,
  GeneralEvent,
  Pet,
  Service,
} from '../../Types'
import {
  buildMonthGrid,
  getMonthDateRange,
  getMonthLabel,
  type CalendarMonth,
} from './calendarDates'

type MonthCalendarProps = {
  month: CalendarMonth
  bookings: Booking[]
  clients: Client[]
  events: GeneralEvent[]
  pets: Pet[]
  areas: Area[]
  services: Service[]
  onNextMonth: () => void
  onOpenBooking: (bookingId: string) => void
  onOpenEvent: (eventId: string) => void
  onPreviousMonth: () => void
  onToday: () => void
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function MonthCalendar({
  month,
  bookings,
  clients,
  events,
  pets,
  areas,
  services,
  onNextMonth,
  onOpenBooking,
  onOpenEvent,
  onPreviousMonth,
  onToday,
}: MonthCalendarProps) {
  const days = useMemo(() => buildMonthGrid(month), [month])
  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )
  const petById = useMemo(
    () => new Map(pets.map((pet) => [pet.id, pet])),
    [pets],
  )
  const areaById = useMemo(
    () => new Map(areas.map((area) => [area.id, area])),
    [areas],
  )
  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  )
  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== 'Cancelled'),
    [bookings],
  )
  const monthRange = getMonthDateRange(month)
  const hasItemsThisMonth =
    activeBookings.some(
      (booking) =>
        booking.startDate <= monthRange.endDate &&
        booking.endDate >= monthRange.startDate,
    ) ||
    events.some(
      (event) =>
        event.startDate <= monthRange.endDate &&
        event.endDate >= monthRange.startDate,
    )

  return (
    <div className="month-calendar">
      <div className="calendar-toolbar">
        <button
          className="calendar-nav-button"
          type="button"
          onClick={onPreviousMonth}
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="calendar-title">
          <h2>{getMonthLabel(month)}</h2>
          <button className="text-button" type="button" onClick={onToday}>
            Today
          </button>
        </div>
        <button
          className="calendar-nav-button"
          type="button"
          onClick={onNextMonth}
          aria-label="Next month"
        >
          ›
        </button>
      </div>

      {!hasItemsThisMonth && (
        <p className="calendar-empty-note">No bookings or events this month.</p>
      )}

      <div className="calendar-grid" role="grid" aria-label={getMonthLabel(month)}>
        {WEEKDAYS.map((weekday) => (
          <div className="calendar-weekday" role="columnheader" key={weekday}>
            {weekday}
          </div>
        ))}

        {days.map((day) => {
          const dayBookings = activeBookings.filter(
            (booking) =>
              booking.startDate <= day.date && booking.endDate >= day.date,
          )
          const dayEvents = events.filter(
            (event) =>
              event.startDate <= day.date && event.endDate >= day.date,
          )

          return (
            <div
              className={[
                'calendar-day',
                day.isCurrentMonth ? '' : 'outside-month',
                day.isToday ? 'today' : '',
              ].filter(Boolean).join(' ')}
              role="gridcell"
              aria-label={day.date}
              key={day.date}
            >
              <span className="calendar-day-number">{day.dayNumber}</span>
              <div className="calendar-day-bookings">
                {dayBookings.map((booking) => {
                  const clientName =
                    clientById.get(booking.clientId)?.name ?? 'Unknown client'
                  const serviceSummary = booking.serviceIds
                    .map((id) => serviceById.get(id)?.name)
                    .filter((name): name is string => name !== undefined)
                    .join(', ')
                  const petSummary = booking.petIds
                    .map((id) => petById.get(id)?.name)
                    .filter((name): name is string => name !== undefined)
                    .join(', ')
                  const areaColor = areaById.get(booking.areaId)?.color ?? '#a89b96'
                  const style = {
                    '--booking-color': areaColor,
                  } as CSSProperties

                  return (
                    <button
                      className="calendar-booking"
                      type="button"
                      style={style}
                      title={`${clientName}: ${serviceSummary || petSummary}`}
                      aria-label={`${clientName} booking on ${day.date}`}
                      onClick={() => onOpenBooking(booking.id)}
                      key={booking.id}
                    >
                      <strong>{clientName}</strong>
                      {(serviceSummary || petSummary) && (
                        <span>{serviceSummary || petSummary}</span>
                      )}
                    </button>
                  )
                })}
                {dayEvents.map((event) => {
                  const areaColor = event.areaId === undefined
                    ? '#81767b'
                    : areaById.get(event.areaId)?.color ?? '#81767b'
                  const style = {
                    '--event-color': areaColor,
                  } as CSSProperties

                  return (
                    <button
                      className="calendar-event"
                      type="button"
                      style={style}
                      title={`Event: ${event.title}`}
                      aria-label={`${event.title} event on ${day.date}`}
                      onClick={() => onOpenEvent(event.id)}
                      key={event.id}
                    >
                      <strong>{event.title}</strong>
                      <span>Event</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MonthCalendar
