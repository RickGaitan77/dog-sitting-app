import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from 'react'
import type {
  Area,
  Booking,
  Client,
  GeneralEvent,
  Meal,
  Pet,
  Service,
} from '../../Types'
import type { ScheduleFilters } from '../../Types/ScheduleFilters'
import { formatBookingDateRange } from '../agenda/agendaDates'
import { getReadableTextColor } from '../../utils/areaColors'
import CalendarBottomSheet from './CalendarBottomSheet'
import ScheduleQuickDetailSheet from './ScheduleQuickDetailSheet'
import {
  buildMonthGrid,
  getMonthDateRange,
  getMonthLabel,
  type CalendarMonth,
} from './calendarDates'
import {
  buildCalendarWorkLayout,
  getCalendarSegmentPosition,
  workItemsForDate,
  type CalendarLaidOutItem,
} from './calendarLayout'
import { buildMealCalendarItems } from './mealCalendarItems'

type MonthCalendarProps = {
  month: CalendarMonth
  bookings: Booking[]
  clients: Client[]
  events: GeneralEvent[]
  meals: Meal[]
  pets: Pet[]
  areas: Area[]
  services: Service[]
  onAddBooking: (date: string) => void
  onAddEvent: (date: string) => void
  onEditBooking: (bookingId: string) => void
  onEditEvent: (eventId: string) => void
  onNextMonth: () => void
  onOpenMeal: (mealId: string) => void
  onOpenSettings: () => void
  onPreviousMonth: () => void
  onToday: () => void
  onViewBooking: (bookingId: string) => void
  onViewEvent: (eventId: string) => void
  showMealOverlay: boolean
  filters: ScheduleFilters
  onFiltersChange: (filters: ScheduleFilters) => void
}

type CalendarOverlay =
  | { name: 'booking'; id: string }
  | { name: 'day'; date: string }
  | { name: 'event'; id: string }
  | { name: 'filters' }
  | { name: 'legend' }
  | null

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE_WORK_LANES = 2
const SWIPE_THRESHOLD_PX = 54

function formatDaySummaryDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00.000Z`))
}

function MonthCalendar({
  month,
  bookings,
  clients,
  events,
  meals,
  pets,
  areas,
  services,
  onAddBooking,
  onAddEvent,
  onEditBooking,
  onEditEvent,
  onNextMonth,
  onOpenMeal,
  onOpenSettings,
  onPreviousMonth,
  onToday,
  onViewBooking,
  onViewEvent,
  showMealOverlay,
  filters,
  onFiltersChange,
}: MonthCalendarProps) {
  const [overlay, setOverlay] = useState<CalendarOverlay>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const didSwipe = useRef(false)
  const days = useMemo(() => buildMonthGrid(month), [month])
  const visibleStart = days[0].date
  const visibleEnd = days[days.length - 1].date
  const monthRange = getMonthDateRange(month)
  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )
  const areaById = useMemo(
    () => new Map(areas.map((area) => [area.id, area])),
    [areas],
  )
  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  )
  const bookingById = useMemo(
    () => new Map(bookings.map((booking) => [booking.id, booking])),
    [bookings],
  )
  const eventById = useMemo(
    () => new Map(events.map((event) => [event.id, event])),
    [events],
  )
  const workItems = useMemo(
    () => buildCalendarWorkLayout(
      bookings,
      events,
      visibleStart,
      visibleEnd,
      filters.bookings,
      filters.events,
    ),
    [bookings, events, filters.bookings, filters.events, visibleEnd, visibleStart],
  )
  const mealItems = useMemo(
    () => buildMealCalendarItems(
      meals,
      showMealOverlay && filters.meals,
    ),
    [filters.meals, meals, showMealOverlay],
  )
  const referencedAreaIds = useMemo(
    () => new Set(workItems.map((item) => item.areaId).filter(Boolean)),
    [workItems],
  )
  const legendAreas = areas.filter(
    (area) => !area.archived || referencedAreaIds.has(area.id),
  )
  const hasItemsThisMonth =
    workItems.some(
      (item) =>
        item.startDate <= monthRange.endDate &&
        item.endDate >= monthRange.startDate,
    ) ||
    mealItems.some(
      (item) =>
        item.date >= monthRange.startDate && item.date <= monthRange.endDate,
    )

  const openDay = (date: string) => setOverlay({ name: 'day', date })
  const openWorkItem = (item: CalendarLaidOutItem) => {
    setOverlay(
      item.kind === 'booking'
        ? { name: 'booking', id: item.id }
        : { name: 'event', id: item.id },
    )
  }
  const handleDayClick = (event: MouseEvent<HTMLDivElement>, date: string) => {
    if (didSwipe.current) {
      didSwipe.current = false
      return
    }
    if (!(event.target as Element).closest('button')) openDay(date)
  }
  const handleDayKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
    date: string,
  ) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openDay(date)
    }
  }
  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0]
    touchStart.current = { x: touch.clientX, y: touch.clientY }
    didSwipe.current = false
  }
  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStart.current === null) return
    const touch = event.changedTouches[0]
    const horizontalDistance = touch.clientX - touchStart.current.x
    const verticalDistance = touch.clientY - touchStart.current.y
    touchStart.current = null

    if (
      Math.abs(horizontalDistance) < SWIPE_THRESHOLD_PX ||
      Math.abs(horizontalDistance) <= Math.abs(verticalDistance) * 1.25
    ) {
      return
    }

    didSwipe.current = true
    if (horizontalDistance < 0) onNextMonth()
    else onPreviousMonth()
  }

  const renderWorkBar = (
    item: CalendarLaidOutItem,
    date: string,
    columnIndex: number,
  ) => {
    const booking = item.kind === 'booking' ? bookingById.get(item.id) : undefined
    const event = item.kind === 'event' ? eventById.get(item.id) : undefined
    const clientName = booking === undefined
      ? undefined
      : clientById.get(booking.clientId)?.name ?? 'Unknown client'
    const qualifier = booking === undefined
      ? 'Event'
      : booking.serviceIds
          .map((id) => serviceById.get(id)?.name)
          .filter((name): name is string => name !== undefined)
          .join(', ')
    const label = event?.title ?? clientName ?? 'Calendar item'
    const color = item.areaId === undefined
      ? '#81767b'
      : areaById.get(item.areaId)?.color ?? '#81767b'
    const segmentPosition = getCalendarSegmentPosition(
      item,
      date,
      columnIndex,
      visibleStart,
      visibleEnd,
    )
    const showLabel =
      segmentPosition === 'single' || segmentPosition === 'start'
    const style = {
      '--calendar-item-color': color,
      '--calendar-item-text-color': getReadableTextColor(color),
      '--calendar-lane': item.lane + 1,
    } as CSSProperties

    return (
      <button
        className={`calendar-work-bar calendar-work-${item.kind} segment-${segmentPosition}`}
        type="button"
        style={style}
        title={`${label}${qualifier ? `: ${qualifier}` : ''}`}
        aria-label={`${label} ${item.kind} on ${date}`}
        data-calendar-item-id={item.id}
        onClick={() => openWorkItem(item)}
        key={item.key}
      >
        {showLabel && <strong>{label}</strong>}
        {showLabel && qualifier && <span>{qualifier}</span>}
      </button>
    )
  }

  const selectedBooking = overlay?.name === 'booking'
    ? bookingById.get(overlay.id)
    : undefined
  const selectedEvent = overlay?.name === 'event'
    ? eventById.get(overlay.id)
    : undefined

  return (
    <div className="month-calendar">
      <div className="calendar-control-row" aria-label="Calendar controls">
        <button className="secondary-button" type="button" onClick={() => setOverlay({ name: 'filters' })}>Filter</button>
        <button className="secondary-button" type="button" onClick={() => setOverlay({ name: 'legend' })}>Legend</button>
        <button className="secondary-button" type="button" onClick={onOpenSettings}>Settings</button>
      </div>

      <div className="calendar-toolbar">
        <button className="calendar-nav-button" type="button" onClick={onPreviousMonth} aria-label="Previous month">‹</button>
        <div className="calendar-title">
          <h2>{getMonthLabel(month)}</h2>
          <button className="text-button" type="button" onClick={onToday}>Today</button>
        </div>
        <button className="calendar-nav-button" type="button" onClick={onNextMonth} aria-label="Next month">›</button>
      </div>

      {!hasItemsThisMonth && (
        <p className="calendar-empty-note">
          {showMealOverlay && filters.meals
            ? 'No visible bookings, events, or meals this month.'
            : 'No visible bookings or events this month.'}
        </p>
      )}

      <div
        className="calendar-grid"
        role="grid"
        aria-label={getMonthLabel(month)}
        onClickCapture={(event) => {
          if (!didSwipe.current) return
          event.preventDefault()
          event.stopPropagation()
          window.setTimeout(() => {
            didSwipe.current = false
          }, 0)
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {WEEKDAYS.map((weekday) => (
          <div className="calendar-weekday" role="columnheader" key={weekday}>{weekday}</div>
        ))}

        {days.map((day, index) => {
          const columnIndex = index % 7
          const dayWorkItems = workItemsForDate(workItems, day.date)
          const visibleWorkItems = dayWorkItems.filter(
            (item) => item.lane < MAX_VISIBLE_WORK_LANES,
          )
          const hiddenWorkCount = dayWorkItems.length - visibleWorkItems.length
          const dayMealItems = mealItems.filter((item) => item.date === day.date)

          return (
            <div
              className={[
                'calendar-day',
                day.isCurrentMonth ? '' : 'outside-month',
                day.isToday ? 'today' : '',
              ].filter(Boolean).join(' ')}
              role="gridcell"
              aria-label={`${day.date}, open day summary`}
              tabIndex={0}
              onClick={(event) => handleDayClick(event, day.date)}
              onKeyDown={(event) => handleDayKeyDown(event, day.date)}
              key={day.date}
            >
              <span className="calendar-day-number">{day.dayNumber}</span>
              <div className="calendar-work-lanes">
                {visibleWorkItems.map((item) => renderWorkBar(item, day.date, columnIndex))}
                {hiddenWorkCount > 0 && (
                  <button className="calendar-more-button" type="button" onClick={() => openDay(day.date)}>+{hiddenWorkCount} more</button>
                )}
              </div>
              {dayMealItems.length > 0 && (
                <div className="calendar-meal-overlay">
                  <button
                    className={`calendar-meal calendar-meal-${dayMealItems[0].kind}`}
                    type="button"
                    onClick={() => onOpenMeal(dayMealItems[0].meal.id)}
                    title={`${dayMealItems[0].kind === 'prep' ? 'Meal prep' : 'Meal'}: ${dayMealItems[0].meal.name}`}
                  >
                    <strong>{dayMealItems[0].meal.name}</strong>
                  </button>
                  {dayMealItems.length > 1 && (
                    <button className="calendar-more-meals" type="button" onClick={() => openDay(day.date)}>+{dayMealItems.length - 1} meal{dayMealItems.length === 2 ? '' : 's'}</button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {overlay?.name === 'filters' && (
        <CalendarBottomSheet title="Calendar filters" onClose={() => setOverlay(null)}>
          <p className="calendar-sheet-intro">Choose what appears in this Calendar. Saved records are unchanged.</p>
          <div className="calendar-filter-list">
            <label><span><strong>Bookings</strong><small>Client work and recurring instances</small></span><input type="checkbox" checked={filters.bookings} onChange={(event) => onFiltersChange({ ...filters, bookings: event.target.checked })} /></label>
            <label><span><strong>General Events</strong><small>Personal and non-client commitments</small></span><input type="checkbox" checked={filters.events} onChange={(event) => onFiltersChange({ ...filters, events: event.target.checked })} /></label>
            <label className={!showMealOverlay ? 'disabled' : ''}><span><strong>Meal Overlay</strong><small>{showMealOverlay ? 'Meals and prep dates' : 'Disabled in Settings'}</small></span><input type="checkbox" checked={showMealOverlay && filters.meals} disabled={!showMealOverlay} onChange={(event) => onFiltersChange({ ...filters, meals: event.target.checked })} /></label>
          </div>
        </CalendarBottomSheet>
      )}

      {overlay?.name === 'legend' && (
        <CalendarBottomSheet title="Calendar legend" onClose={() => setOverlay(null)}>
          <p className="calendar-sheet-intro">Area colors update automatically when Areas are changed.</p>
          <div className="calendar-legend-list">
            {legendAreas.map((area) => (
              <div key={area.id}><i style={{ backgroundColor: area.color }} /><span><strong>{area.name}</strong>{area.archived && <small>Archived · shown for a visible record</small>}</span></div>
            ))}
            {filters.events && <div><i className="neutral-event-swatch" /><span><strong>Event without Area</strong><small>Neutral event treatment</small></span></div>}
            {showMealOverlay && filters.meals && <div><i className="meal-overlay-swatch" /><span><strong>Meal Overlay</strong><small>Meals and prep stay secondary</small></span></div>}
          </div>
        </CalendarBottomSheet>
      )}

      {overlay?.name === 'day' && (() => {
        const dayWorkItems = workItemsForDate(workItems, overlay.date)
        const dayMealItems = mealItems.filter((item) => item.date === overlay.date)
        return (
          <CalendarBottomSheet title={formatDaySummaryDate(overlay.date)} onClose={() => setOverlay(null)}>
            <div className="calendar-day-summary-list">
              {dayWorkItems.length === 0 && dayMealItems.length === 0 && <p className="calendar-sheet-empty">Nothing scheduled for this date.</p>}
              {dayWorkItems.map((item) => {
                const booking = item.kind === 'booking' ? bookingById.get(item.id) : undefined
                const event = item.kind === 'event' ? eventById.get(item.id) : undefined
                const label = event?.title ?? (booking === undefined ? 'Unknown booking' : clientById.get(booking.clientId)?.name ?? 'Unknown client')
                const area = item.areaId === undefined ? undefined : areaById.get(item.areaId)
                return (
                  <button type="button" data-calendar-item-id={item.id} onClick={() => openWorkItem(item)} key={item.key}>
                    <i style={{ backgroundColor: area?.color ?? '#81767b' }} />
                    <span><strong>{label}</strong><small>{item.kind === 'booking' ? 'Booking' : 'General Event'} · {formatBookingDateRange(item.startDate, item.endDate)}</small></span>
                  </button>
                )
              })}
              {dayMealItems.map((item) => (
                <button type="button" onClick={() => onOpenMeal(item.meal.id)} key={`${item.kind}:${item.meal.id}`}>
                  <i className="meal-overlay-swatch" />
                  <span><strong>{item.meal.name}</strong><small>{item.kind === 'prep' ? 'Meal prep' : item.meal.mealType ?? 'Meal'}</small></span>
                </button>
              ))}
            </div>
            <div className="calendar-sheet-actions">
              <button className="primary-button" type="button" onClick={() => onAddBooking(overlay.date)}>Add Booking</button>
              <button className="secondary-button" type="button" onClick={() => onAddEvent(overlay.date)}>Add Event</button>
            </div>
          </CalendarBottomSheet>
        )
      })()}

      {selectedBooking !== undefined && (
        <ScheduleQuickDetailSheet
          areas={areas}
          booking={selectedBooking}
          clients={clients}
          pets={pets}
          services={services}
          onClose={() => setOverlay(null)}
          onViewDetails={() => onViewBooking(selectedBooking.id)}
          onEdit={() => onEditBooking(selectedBooking.id)}
        />
      )}

      {selectedEvent !== undefined && (
        <ScheduleQuickDetailSheet
          areas={areas}
          event={selectedEvent}
          clients={clients}
          pets={pets}
          services={services}
          onClose={() => setOverlay(null)}
          onViewDetails={() => onViewEvent(selectedEvent.id)}
          onEdit={() => onEditEvent(selectedEvent.id)}
        />
      )}
    </div>
  )
}

export default MonthCalendar
