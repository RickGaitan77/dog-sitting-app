import { useEffect, useMemo, type CSSProperties, type ReactNode } from 'react'
import type {
  Area,
  Booking,
  Client,
  GeneralEvent,
  Pet,
  Service,
} from '../../Types'
import type { ScheduleFilters } from '../../Types/ScheduleFilters'
import { getTodayDateString } from '../calendar/calendarDates'
import {
  formatBookingDateRange,
  formatMonthHeading,
  formatTodayDivider,
  getAgendaBookings,
  getAgendaEvents,
  getMonthKey,
  normalizeAgendaSearch,
} from './agendaDates'

type BookingAgendaItem = {
  kind: 'booking'
  id: string
  startDate: string
  endDate: string
  area?: Area
  booking: Booking
  clientName: string
  petNames: string[]
  serviceNames: string[]
  searchText: string
}

type EventAgendaItem = {
  kind: 'event'
  id: string
  startDate: string
  endDate: string
  area?: Area
  event: GeneralEvent
  searchText: string
}

type AgendaItem = BookingAgendaItem | EventAgendaItem

type AgendaListProps = {
  areas: Area[]
  bookings: Booking[]
  clients: Client[]
  events: GeneralEvent[]
  filters: ScheduleFilters
  pets: Pet[]
  rangeEnd: string
  rangeStart: string
  searchQuery: string
  services: Service[]
  onOpenBooking: (bookingId: string) => void
  onOpenEvent: (eventId: string) => void
  onShowEarlier: () => void
  onShowLater: () => void
}

function TodayDivider({ today }: { today: string }) {
  return (
    <div className="agenda-today-divider" id="agenda-today" role="separator">
      <span>{formatTodayDivider(today)}</span>
    </div>
  )
}

function AgendaList({
  areas,
  bookings,
  clients,
  events,
  filters,
  pets,
  rangeEnd,
  rangeStart,
  searchQuery,
  services,
  onOpenBooking,
  onOpenEvent,
  onShowEarlier,
  onShowLater,
}: AgendaListProps) {
  const today = getTodayDateString()
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
  const normalizedQuery = normalizeAgendaSearch(searchQuery)

  const items = useMemo(() => {
    const agendaItems: AgendaItem[] = []

    if (filters.bookings) {
      getAgendaBookings(bookings, rangeStart, rangeEnd).forEach((booking) => {
        const clientName = clientById.get(booking.clientId)?.name ?? 'Unknown client'
        const petNames = booking.petIds.map(
          (id) => petById.get(id)?.name ?? 'Unknown pet',
        )
        const serviceNames = booking.serviceIds.map(
          (id) => serviceById.get(id)?.name ?? 'Unknown service',
        )
        const area = areaById.get(booking.areaId)
        const searchText = normalizeAgendaSearch([
          clientName,
          ...petNames,
          area?.name,
          ...serviceNames,
          booking.notes,
          booking.status,
        ].filter(Boolean).join(' '))

        agendaItems.push({
          kind: 'booking',
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          area,
          booking,
          clientName,
          petNames,
          serviceNames,
          searchText,
        })
      })
    }

    if (filters.events) {
      getAgendaEvents(events, rangeStart, rangeEnd).forEach((event) => {
        const area = event.areaId === undefined
          ? undefined
          : areaById.get(event.areaId)
        const searchText = normalizeAgendaSearch([
          event.title,
          area?.name,
          event.notes,
        ].filter(Boolean).join(' '))

        agendaItems.push({
          kind: 'event',
          id: event.id,
          startDate: event.startDate,
          endDate: event.endDate,
          area,
          event,
          searchText,
        })
      })
    }

    return agendaItems
      .filter((item) => normalizedQuery === '' || item.searchText.includes(normalizedQuery))
      .sort(
        (left, right) =>
          left.startDate.localeCompare(right.startDate) ||
          left.endDate.localeCompare(right.endDate) ||
          left.kind.localeCompare(right.kind) ||
          left.id.localeCompare(right.id),
      )
  }, [
    areaById,
    bookings,
    clientById,
    events,
    filters.bookings,
    filters.events,
    normalizedQuery,
    petById,
    rangeEnd,
    rangeStart,
    serviceById,
  ])

  const groupedItems = useMemo(() => {
    const groups = new Map<string, AgendaItem[]>()
    items.forEach((item) => {
      const monthKey = getMonthKey(item.startDate)
      const monthItems = groups.get(monthKey)
      if (monthItems === undefined) groups.set(monthKey, [item])
      else monthItems.push(item)
    })
    return Array.from(groups.entries())
  }, [items])

  const firstFutureItem = items.find((item) => item.startDate >= today)
  const todayMonth = getMonthKey(today)
  const dividerBeforeMonth = firstFutureItem !== undefined &&
    getMonthKey(firstFutureItem.startDate) > todayMonth
      ? getMonthKey(firstFutureItem.startDate)
      : undefined
  const dividerBeforeItem = firstFutureItem !== undefined &&
    getMonthKey(firstFutureItem.startDate) === todayMonth
      ? `${firstFutureItem.kind}-${firstFutureItem.id}`
      : undefined

  useEffect(() => {
    document.getElementById('agenda-today')?.scrollIntoView({ block: 'start' })
  }, [])

  if (items.length === 0) {
    const filtersActive = !filters.bookings || !filters.events
    const title = normalizedQuery !== ''
      ? 'No results match your search'
      : filtersActive
        ? 'No visible schedule items'
        : 'No schedule in this range'

    return (
      <>
        <TodayDivider today={today} />
        <div className="empty-state agenda-empty-state">
          <h3>{title}</h3>
          <p>
            {normalizedQuery !== ''
              ? 'Try another search or clear it to restore the filtered schedule.'
              : filtersActive
                ? 'One or more Agenda filters are hiding schedule types.'
                : 'Use the range controls to browse earlier or later dates.'}
          </p>
        </div>
        <AgendaRangeControls
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onShowEarlier={onShowEarlier}
          onShowLater={onShowLater}
        />
      </>
    )
  }

  return (
    <div className="agenda-groups">
      {groupedItems.map(([monthKey, monthItems]) => {
        const monthId = `agenda-month-${monthKey}`
        const content: ReactNode[] = []

        if (dividerBeforeMonth === monthKey) {
          content.push(<TodayDivider today={today} key="today-divider" />)
        }

        content.push(
          <section className="agenda-month" aria-labelledby={monthId} key={monthKey}>
            <h3 className="agenda-month-heading" id={monthId}>
              {formatMonthHeading(monthKey)}
            </h3>
            <div className="agenda-list">
              {monthItems.map((item) => {
                const itemKey = `${item.kind}-${item.id}`
                return (
                  <div className="agenda-item-wrap" key={itemKey}>
                    {dividerBeforeItem === itemKey && <TodayDivider today={today} />}
                    <AgendaCard
                      item={item}
                      isPast={item.endDate < today}
                      onOpenBooking={onOpenBooking}
                      onOpenEvent={onOpenEvent}
                    />
                  </div>
                )
              })}
            </div>
          </section>,
        )

        return content
      })}
      {firstFutureItem === undefined && <TodayDivider today={today} />}
      <AgendaRangeControls
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onShowEarlier={onShowEarlier}
        onShowLater={onShowLater}
      />
    </div>
  )
}

function AgendaCard({
  item,
  isPast,
  onOpenBooking,
  onOpenEvent,
}: {
  item: AgendaItem
  isPast: boolean
  onOpenBooking: (bookingId: string) => void
  onOpenEvent: (eventId: string) => void
}) {
  const areaColor = item.area?.color ?? (item.kind === 'event' ? '#81767b' : '#a89b96')
  const style = { '--agenda-area-color': areaColor } as CSSProperties

  if (item.kind === 'event') {
    return (
      <article className={`agenda-card agenda-event-card${isPast ? ' past' : ''}`} style={style}>
        <button
          className="agenda-card-main"
          type="button"
          onClick={() => onOpenEvent(item.event.id)}
          aria-label={`Open ${item.event.title} event, ${formatBookingDateRange(item.startDate, item.endDate)}`}
        >
          <span className="agenda-date-range">{formatBookingDateRange(item.startDate, item.endDate)}</span>
          <span className="agenda-card-heading">
            <strong>{item.event.title}</strong>
            <span className="event-badge">Event</span>
          </span>
          <span className="agenda-area">
            <span className="agenda-area-dot" aria-hidden="true" />
            {item.area?.name ?? 'No area'}
          </span>
          {item.event.notes && <span className="agenda-notes">{item.event.notes}</span>}
        </button>
      </article>
    )
  }

  return (
    <article className={`agenda-card${isPast ? ' past' : ''}`} style={style}>
      <button
        className="agenda-card-main"
        type="button"
        onClick={() => onOpenBooking(item.booking.id)}
        aria-label={`Open ${item.clientName} booking, ${formatBookingDateRange(item.startDate, item.endDate)}`}
      >
        <span className="agenda-date-range">{formatBookingDateRange(item.startDate, item.endDate)}</span>
        <span className="agenda-card-heading">
          <strong>{item.clientName}</strong>
          <span className={`status-badge status-${item.booking.status.toLowerCase()}`}>
            {item.booking.status}
          </span>
        </span>
        <span className="agenda-area">
          <span className="agenda-area-dot" aria-hidden="true" />
          {item.area?.name ?? 'Unknown area'}
        </span>
        <span className="agenda-card-meta">
          <span>{item.petNames.join(' • ')}</span>
          <span>{item.serviceNames.join(' • ')}</span>
        </span>
      </button>
    </article>
  )
}

function AgendaRangeControls({
  rangeStart,
  rangeEnd,
  onShowEarlier,
  onShowLater,
}: {
  rangeStart: string
  rangeEnd: string
  onShowEarlier: () => void
  onShowLater: () => void
}) {
  return (
    <div className="agenda-range-controls">
      <p>Showing {formatBookingDateRange(rangeStart, rangeEnd)}</p>
      <div>
        <button className="secondary-button" type="button" onClick={onShowEarlier}>Show earlier</button>
        <button className="secondary-button" type="button" onClick={onShowLater}>Show later</button>
      </div>
    </div>
  )
}

export default AgendaList
