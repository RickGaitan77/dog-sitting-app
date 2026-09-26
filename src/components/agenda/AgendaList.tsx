import { useMemo, type CSSProperties } from 'react'
import type {
  Area,
  Booking,
  Client,
  GeneralEvent,
  Pet,
  Service,
} from '../../Types'
import { getTodayDateString } from '../calendar/calendarDates'
import {
  AGENDA_WINDOW_DAYS,
  addDays,
  formatBookingDateRange,
  formatGroupDate,
  getUpcomingBookings,
  getUpcomingEvents,
} from './agendaDates'

type AgendaItem =
  | { kind: 'booking'; booking: Booking }
  | { kind: 'event'; event: GeneralEvent }

type AgendaListProps = {
  areas: Area[]
  bookings: Booking[]
  clients: Client[]
  events: GeneralEvent[]
  pets: Pet[]
  services: Service[]
  onOpenBooking: (bookingId: string) => void
  onOpenEvent: (eventId: string) => void
}

function AgendaList({
  areas,
  bookings,
  clients,
  events,
  pets,
  services,
  onOpenBooking,
  onOpenEvent,
}: AgendaListProps) {
  const today = getTodayDateString()
  const windowEnd = addDays(today, AGENDA_WINDOW_DAYS)
  const upcomingBookings = getUpcomingBookings(bookings, today)
  const upcomingEvents = getUpcomingEvents(events, today)
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
  const groups = new Map<string, AgendaItem[]>()

  upcomingBookings.forEach((booking) => {
    const dateBookings = groups.get(booking.startDate) ?? []
    dateBookings.push({ kind: 'booking', booking })
    groups.set(booking.startDate, dateBookings)
  })

  upcomingEvents.forEach((event) => {
    const dateItems = groups.get(event.startDate) ?? []
    dateItems.push({ kind: 'event', event })
    groups.set(event.startDate, dateItems)
  })

  const groupedItems = Array.from(groups.entries())
    .sort(([leftDate], [rightDate]) => leftDate.localeCompare(rightDate))

  if (upcomingBookings.length === 0 && upcomingEvents.length === 0) {
    return (
      <div className="empty-state agenda-empty-state">
        <h3>No upcoming bookings or events</h3>
        <p>
          There is nothing scheduled between today and the next{' '}
          {AGENDA_WINDOW_DAYS} days.
        </p>
      </div>
    )
  }

  return (
    <div className="agenda-groups">
      {groupedItems.map(([date, dateItems]) => {
        const groupId = `agenda-date-${date}`

        return (
          <section className="agenda-group" aria-labelledby={groupId} key={date}>
            <h3 id={groupId}>{formatGroupDate(date, today)}</h3>
            <div className="agenda-list">
              {dateItems.map((item) => {
                if (item.kind === 'event') {
                  const event = item.event
                  const area = event.areaId === undefined
                    ? undefined
                    : areaById.get(event.areaId)
                  const areaColor = area?.color ?? '#81767b'
                  const style = {
                    '--agenda-area-color': areaColor,
                  } as CSSProperties

                  return (
                    <article
                      className="agenda-card agenda-event-card"
                      style={style}
                      key={`event-${event.id}`}
                    >
                      <button
                        className="agenda-card-main"
                        type="button"
                        onClick={() => onOpenEvent(event.id)}
                        aria-label={`Open ${event.title} event, ${formatBookingDateRange(event.startDate, event.endDate)}`}
                      >
                        <span className="agenda-card-heading">
                          <strong>{event.title}</strong>
                          <span className="event-badge">Event</span>
                        </span>
                        <span className="agenda-date-range">
                          {formatBookingDateRange(event.startDate, event.endDate)}
                        </span>
                        <span className="agenda-area">
                          <span className="agenda-area-dot" aria-hidden="true" />
                          {area?.name ?? 'No area'}
                        </span>
                      </button>
                    </article>
                  )
                }

                const booking = item.booking
                const clientName =
                  clientById.get(booking.clientId)?.name ?? 'Unknown client'
                const petNames = booking.petIds
                  .map((id) => petById.get(id)?.name ?? 'Unknown pet')
                  .join(', ')
                const serviceNames = booking.serviceIds
                  .map((id) => serviceById.get(id)?.name ?? 'Unknown service')
                  .join(', ')
                const area = areaById.get(booking.areaId)
                const areaColor = area?.color ?? '#a89b96'
                const style = {
                  '--agenda-area-color': areaColor,
                } as CSSProperties

                return (
                  <article className="agenda-card" style={style} key={`booking-${booking.id}`}>
                    <button
                      className="agenda-card-main"
                      type="button"
                      onClick={() => onOpenBooking(booking.id)}
                      aria-label={`Open ${clientName} booking, ${formatBookingDateRange(booking.startDate, booking.endDate)}`}
                    >
                      <span className="agenda-card-heading">
                        <strong>{clientName}</strong>
                        <span className={`status-badge status-${booking.status.toLowerCase()}`}>
                          {booking.status}
                        </span>
                      </span>
                      <span className="agenda-date-range">
                        {formatBookingDateRange(booking.startDate, booking.endDate)}
                      </span>
                      <span className="agenda-card-meta">
                        <span>{petNames}</span>
                        <span aria-hidden="true">·</span>
                        <span>{serviceNames}</span>
                      </span>
                      <span className="agenda-area">
                        <span className="agenda-area-dot" aria-hidden="true" />
                        {area?.name ?? 'Unknown area'}
                      </span>
                    </button>
                  </article>
                )
              })}
            </div>
          </section>
        )
      })}
      <p className="agenda-window-note">
        Showing the schedule through {formatBookingDateRange(windowEnd, windowEnd)}.
      </p>
    </div>
  )
}

export default AgendaList
