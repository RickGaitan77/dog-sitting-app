import { useMemo, type CSSProperties } from 'react'
import type {
  Area,
  Booking,
  Client,
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
} from './agendaDates'

type AgendaListProps = {
  areas: Area[]
  bookings: Booking[]
  clients: Client[]
  pets: Pet[]
  services: Service[]
  onOpenBooking: (bookingId: string) => void
}

function AgendaList({
  areas,
  bookings,
  clients,
  pets,
  services,
  onOpenBooking,
}: AgendaListProps) {
  const today = getTodayDateString()
  const windowEnd = addDays(today, AGENDA_WINDOW_DAYS)
  const upcomingBookings = getUpcomingBookings(bookings, today)
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
  const groups = new Map<string, Booking[]>()

  upcomingBookings.forEach((booking) => {
    const dateBookings = groups.get(booking.startDate) ?? []
    dateBookings.push(booking)
    groups.set(booking.startDate, dateBookings)
  })

  const groupedBookings = Array.from(groups.entries())

  if (upcomingBookings.length === 0) {
    return (
      <div className="empty-state agenda-empty-state">
        <h3>No upcoming bookings</h3>
        <p>
          There are no active bookings scheduled between today and the next{' '}
          {AGENDA_WINDOW_DAYS} days.
        </p>
      </div>
    )
  }

  return (
    <div className="agenda-groups">
      {groupedBookings.map(([date, dateBookings]) => {
        const groupId = `agenda-date-${date}`

        return (
          <section className="agenda-group" aria-labelledby={groupId} key={date}>
            <h3 id={groupId}>{formatGroupDate(date, today)}</h3>
            <div className="agenda-list">
              {dateBookings.map((booking) => {
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
                  <article className="agenda-card" style={style} key={booking.id}>
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
        Showing bookings through {formatBookingDateRange(windowEnd, windowEnd)}.
      </p>
    </div>
  )
}

export default AgendaList
