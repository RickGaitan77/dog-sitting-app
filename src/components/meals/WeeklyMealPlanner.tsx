import { useMemo, useState, type CSSProperties } from 'react'
import type {
  Area,
  Booking,
  Client,
  GeneralEvent,
  Meal,
  Service,
} from '../../Types'
import { formatMealDate } from './mealDates'
import {
  addMealDateDays,
  buildMealWeek,
  formatMealWeekRange,
  getMealPrepState,
  type MealPrepState,
} from './mealWeekDates'

type WeeklyMealPlannerProps = {
  areas: Area[]
  bookings: Booking[]
  clients: Client[]
  events: GeneralEvent[]
  meals: Meal[]
  services: Service[]
  today: string
  weekStart: string
  onAddMeal: (date: string) => void
  onCurrentWeek: () => void
  onNextWeek: () => void
  onOpenMeal: (mealId: string) => void
  onPreviousWeek: () => void
}

const PREP_LABELS: Readonly<Record<MealPrepState, string>> = {
  none: 'No prep date',
  upcoming: 'Prep upcoming',
  due: 'Prep due today',
  overdue: 'Prep overdue',
  complete: 'Prep complete',
}

function WeeklyMealPlanner({
  areas,
  bookings,
  clients,
  events,
  meals,
  services,
  today,
  weekStart,
  onAddMeal,
  onCurrentWeek,
  onNextWeek,
  onOpenMeal,
  onPreviousWeek,
}: WeeklyMealPlannerProps) {
  const [planningMode, setPlanningMode] = useState(false)
  const days = useMemo(() => buildMealWeek(weekStart), [weekStart])
  const weekEnd = addMealDateDays(weekStart, 6)
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
  const activeBookings = useMemo(
    () => bookings.filter((booking) => booking.status !== 'Cancelled'),
    [bookings],
  )
  const weekMeals = meals.filter(
    (meal) => meal.date >= weekStart && meal.date <= weekEnd,
  )
  const plannedDays = new Set(weekMeals.map((meal) => meal.date)).size
  const prepItems = weekMeals.filter((meal) => meal.prepDate !== undefined).length
  const overduePrep = weekMeals.filter(
    (meal) => getMealPrepState(meal, today) === 'overdue',
  ).length

  return (
    <div className={`weekly-meal-planner${planningMode ? ' planning-mode' : ''}`}>
      <section className="meal-week-summary" aria-label="Weekly meal planning progress">
        <div className="meal-week-progress-heading">
          <div>
            <strong>{plannedDays} of 7 days planned</strong>
            <span>{weekMeals.length} meal{weekMeals.length === 1 ? '' : 's'} · {prepItems} prep item{prepItems === 1 ? '' : 's'}{overduePrep > 0 ? ` · ${overduePrep} overdue` : ''}</span>
          </div>
          <button
            className={planningMode ? 'secondary-button' : 'primary-button'}
            type="button"
            aria-pressed={planningMode}
            onClick={() => setPlanningMode((current) => !current)}
          >
            {planningMode ? 'Done Planning' : 'Plan This Week'}
          </button>
        </div>
        <div className="meal-week-progress-track" aria-hidden="true">
          <span style={{ width: `${(plannedDays / 7) * 100}%` }} />
        </div>
        {planningMode && plannedDays < 7 && (
          <p>Unplanned days are highlighted. Choose Add Meal to fill the gaps.</p>
        )}
      </section>

      <div className="meal-week-toolbar">
        <button className="calendar-nav-button" type="button" onClick={onPreviousWeek} aria-label="Previous week">‹</button>
        <div className="meal-week-title">
          <h3>{formatMealWeekRange(weekStart)}</h3>
          <button className="text-button" type="button" onClick={onCurrentWeek}>Current Week</button>
        </div>
        <button className="calendar-nav-button" type="button" onClick={onNextWeek} aria-label="Next week">›</button>
      </div>

      <div className="meal-week-days">
        {days.map((day) => {
          const dayMeals = weekMeals.filter((meal) => meal.date === day.date)
          const dayBookings = activeBookings.filter(
            (booking) =>
              booking.startDate <= day.date && booking.endDate >= day.date,
          )
          const dayEvents = events.filter(
            (event) => event.startDate <= day.date && event.endDate >= day.date,
          )
          const hasSchedule = dayBookings.length > 0 || dayEvents.length > 0

          return (
            <article
              className={[
                'meal-day-card',
                day.date === today ? 'today' : '',
                planningMode && dayMeals.length === 0 ? 'unplanned-highlight' : '',
              ].filter(Boolean).join(' ')}
              key={day.date}
            >
              <header className="meal-day-heading">
                <strong>{day.weekday}</strong>
                <span>{day.dateLabel}</span>
                {day.date === today && <em>Today</em>}
              </header>

              <section className="meal-day-schedule" aria-label={`Schedule for ${day.date}`}>
                <span className="meal-day-section-label">Schedule</span>
                {!hasSchedule && <p className="meal-home-state">No scheduled commitments</p>}
                {dayBookings.map((booking) => {
                  const areaColor = areaById.get(booking.areaId)?.color ?? '#81767b'
                  const serviceSummary = booking.serviceIds
                    .map((id) => serviceById.get(id)?.name)
                    .filter((name): name is string => name !== undefined)
                    .join(', ')
                  const style = { '--schedule-color': areaColor } as CSSProperties
                  return (
                    <div className="meal-schedule-item" style={style} key={booking.id}>
                      <i aria-hidden="true" />
                      <strong>{clientById.get(booking.clientId)?.name ?? 'Unknown client'}</strong>
                      {serviceSummary && <span>{serviceSummary}</span>}
                    </div>
                  )
                })}
                {dayEvents.map((event) => {
                  const areaColor = event.areaId === undefined
                    ? '#81767b'
                    : areaById.get(event.areaId)?.color ?? '#81767b'
                  const style = { '--schedule-color': areaColor } as CSSProperties
                  return (
                    <div className="meal-schedule-item event" style={style} key={event.id}>
                      <i aria-hidden="true" />
                      <strong>{event.title}</strong>
                      <span>Event</span>
                    </div>
                  )
                })}
              </section>

              <section className="meal-day-plan" aria-label={`Meals for ${day.date}`}>
                <span className="meal-day-section-label">Meals</span>
                {planningMode && dayMeals.length === 0 && (
                  <p className="meal-unplanned-prompt">
                    <strong>Meal not planned</strong>
                    <span>Add a Meal for this day.</span>
                  </p>
                )}
                {dayMeals.map((meal) => {
                  const prepState = getMealPrepState(meal, today)
                  return (
                    <button
                      className="weekly-meal-entry"
                      type="button"
                      onClick={() => onOpenMeal(meal.id)}
                      key={meal.id}
                    >
                      <span className="weekly-meal-entry-heading">
                        <strong>{meal.name}</strong>
                        {meal.mealType && <span>{meal.mealType}</span>}
                      </span>
                      {meal.tags.length > 0 && (
                        <span className="meal-tags compact">
                          {meal.tags.map((tag) => <span key={tag}>{tag}</span>)}
                        </span>
                      )}
                      {(meal.prepDate !== undefined || meal.prepNotes) && (
                        <span className={`weekly-prep-state prep-${prepState}`}>
                          <strong>{PREP_LABELS[prepState]}</strong>
                          {meal.prepDate !== undefined && (
                            <span>{formatMealDate(meal.prepDate)}</span>
                          )}
                          {meal.prepNotes && <small>{meal.prepNotes}</small>}
                        </span>
                      )}
                    </button>
                  )
                })}
                <button
                  className={dayMeals.length === 0 ? 'add-day-meal-button' : 'text-button add-another-meal'}
                  type="button"
                  onClick={() => onAddMeal(day.date)}
                >
                  {dayMeals.length === 0 ? 'Add Meal' : 'Add another meal'}
                </button>
              </section>
            </article>
          )
        })}
      </div>
    </div>
  )
}

export default WeeklyMealPlanner
