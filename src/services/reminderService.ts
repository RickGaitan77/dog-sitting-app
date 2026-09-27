import type {
  AppSettings,
  Booking,
  Reminder,
  ReminderSnapshot,
  ReminderSourceData,
  WeeklyOverview,
  WeeklyOverviewItem,
} from '../Types'
import type { AppRepositories } from '../repositories'
import { MEDICATION_SERVICE_ID } from '../db/defaults'

const WEEK_LENGTH_DAYS = 6

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

export function addDateOnlyDays(date: string, days: number): string {
  const shiftedDate = parseDateOnly(date)
  shiftedDate.setUTCDate(shiftedDate.getUTCDate() + days)
  return shiftedDate.toISOString().slice(0, 10)
}

export function isSunday(date: string): boolean {
  return parseDateOnly(date).getUTCDay() === 0
}

function formatDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parseDateOnly(date))
}

function formatDateRange(startDate: string, endDate: string): string {
  if (startDate === endDate) return formatDate(startDate)
  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

function reminderId(
  type: Reminder['type'],
  entityId: string,
  relevantDate: string,
): string {
  return `${type}:${entityId}:${relevantDate}`
}

function activeBooking(booking: Booking): boolean {
  return booking.status !== 'Cancelled'
}

function describeBooking(
  booking: Booking,
  data: ReminderSourceData,
): { title: string; summary: string } {
  const clientName =
    data.clients.find((client) => client.id === booking.clientId)?.name ??
    'Unknown client'
  const petNames = booking.petIds
    .map((petId) => data.pets.find((pet) => pet.id === petId)?.name)
    .filter((name): name is string => name !== undefined)
  const serviceNames = booking.serviceIds
    .map(
      (serviceId) =>
        data.services.find((service) => service.id === serviceId)?.name,
    )
    .filter((name): name is string => name !== undefined)
  const details = [...petNames, ...serviceNames]

  return {
    title: clientName,
    summary: details.length > 0 ? details.join(' · ') : 'Booking',
  }
}

function createBookingReminder(
  type: 'booking-start' | 'booking-end' | 'medication',
  booking: Booking,
  date: string,
  data: ReminderSourceData,
): Reminder {
  const description = describeBooking(booking, data)
  const label =
    type === 'booking-start'
      ? 'Booking starts today'
      : type === 'booking-end'
        ? 'Booking ends today'
        : 'Medication care today'

  return {
    id: reminderId(type, booking.id, date),
    type,
    entityId: booking.id,
    title: `${label}: ${description.title}`,
    message: description.summary,
    relevantDate: date,
    isDue: true,
  }
}

export function buildDueReminders(
  data: ReminderSourceData,
  date: string,
): Reminder[] {
  const reminders: Reminder[] = []
  const activeBookings = data.bookings.filter(activeBooking)

  if (data.settings.bookingStartReminderEnabled) {
    activeBookings
      .filter((booking) => booking.startDate === date)
      .forEach((booking) => {
        reminders.push(
          createBookingReminder('booking-start', booking, date, data),
        )
      })
  }

  if (data.settings.bookingEndReminderEnabled) {
    activeBookings
      .filter((booking) => booking.endDate === date)
      .forEach((booking) => {
        reminders.push(
          createBookingReminder('booking-end', booking, date, data),
        )
      })
  }

  if (data.settings.medicationReminderEnabled) {
    activeBookings
      .filter(
        (booking) =>
          booking.startDate <= date &&
          booking.endDate >= date &&
          booking.serviceIds.includes(MEDICATION_SERVICE_ID),
      )
      .forEach((booking) => {
        reminders.push(
          createBookingReminder('medication', booking, date, data),
        )
      })
  }

  if (data.settings.mealPlanningReminderEnabled) {
    data.meals
      .filter(
        (meal) => !meal.prepCompleted && meal.prepDate === date,
      )
      .forEach((meal) => {
        reminders.push({
          id: reminderId('meal-planning', meal.id, date),
          type: 'meal-planning',
          entityId: meal.id,
          title: `Meal prep today: ${meal.name}`,
          message: `Planned for ${formatDate(meal.date)}${
            meal.prepNotes === undefined || meal.prepNotes.trim() === ''
              ? ''
              : ` · ${meal.prepNotes.trim()}`
          }`,
          relevantDate: date,
          isDue: true,
        })
      })
  }

  return reminders.sort(
    (left, right) =>
      left.type.localeCompare(right.type) ||
      left.title.localeCompare(right.title) ||
      left.id.localeCompare(right.id),
  )
}

function bookingOverviewItem(
  booking: Booking,
  data: ReminderSourceData,
): WeeklyOverviewItem {
  const description = describeBooking(booking, data)
  const area = data.areas.find((item) => item.id === booking.areaId)

  return {
    id: `booking:${booking.id}`,
    kind: 'booking',
    title: description.title,
    dateLabel: formatDateRange(booking.startDate, booking.endDate),
    summary: `${description.summary} · ${booking.status}`,
    areaName: area?.name,
    areaColor: area?.color,
  }
}

export function buildWeeklyOverview(
  data: ReminderSourceData,
  date: string,
): WeeklyOverview | undefined {
  if (!data.settings.weeklyOverviewEnabled || !isSunday(date)) {
    return undefined
  }

  const endDate = addDateOnlyDays(date, WEEK_LENGTH_DAYS)
  const datedItems: Array<WeeklyOverviewItem & { sortDate: string }> = []

  data.bookings
    .filter(
      (booking) =>
        activeBooking(booking) &&
        booking.startDate <= endDate &&
        booking.endDate >= date,
    )
    .forEach((booking) => {
      datedItems.push({
        ...bookingOverviewItem(booking, data),
        sortDate: booking.startDate,
      })
    })

  data.events
    .filter(
      (event) => event.startDate <= endDate && event.endDate >= date,
    )
    .forEach((event) => {
      const area =
        event.areaId === undefined
          ? undefined
          : data.areas.find((item) => item.id === event.areaId)
      datedItems.push({
        id: `event:${event.id}`,
        kind: 'event',
        title: event.title,
        dateLabel: formatDateRange(event.startDate, event.endDate),
        summary: 'General event',
        areaName: area?.name,
        areaColor: area?.color,
        sortDate: event.startDate,
      })
    })

  data.meals
    .filter((meal) => meal.date >= date && meal.date <= endDate)
    .forEach((meal) => {
      const prepSummary = meal.prepCompleted
        ? 'Prep complete'
        : meal.prepDate === undefined
          ? 'No prep date'
          : `Prep ${formatDate(meal.prepDate)}`
      datedItems.push({
        id: `meal:${meal.id}`,
        kind: 'meal',
        title: meal.name,
        dateLabel: formatDate(meal.date),
        summary: prepSummary,
        sortDate: meal.date,
      })
    })

  const items = datedItems
    .sort(
      (left, right) =>
        left.sortDate.localeCompare(right.sortDate) ||
        left.kind.localeCompare(right.kind) ||
        left.title.localeCompare(right.title),
    )
    .map((item) => ({
      id: item.id,
      kind: item.kind,
      title: item.title,
      dateLabel: item.dateLabel,
      summary: item.summary,
      areaName: item.areaName,
      areaColor: item.areaColor,
    }))

  return { startDate: date, endDate, items }
}

export function buildReminderSnapshot(
  data: ReminderSourceData,
  date: string,
): ReminderSnapshot {
  return {
    date,
    settings: data.settings,
    reminders: buildDueReminders(data, date),
    weeklyOverview: buildWeeklyOverview(data, date),
  }
}

export class ReminderService {
  private readonly repositories: AppRepositories

  constructor(repositories: AppRepositories) {
    this.repositories = repositories
  }

  async getSnapshot(date: string): Promise<ReminderSnapshot> {
    const [
      settings,
      bookings,
      clients,
      pets,
      areas,
      services,
      events,
      meals,
    ] = await Promise.all([
      this.repositories.settings.get(),
      this.repositories.bookings.getAll(),
      this.repositories.clients.getAll(),
      this.repositories.pets.getAll(),
      this.repositories.areas.getAll(),
      this.repositories.services.getAll(),
      this.repositories.generalEvents.getAll(),
      this.repositories.meals.getAll(),
    ])

    return buildReminderSnapshot(
      { settings, bookings, clients, pets, areas, services, events, meals },
      date,
    )
  }
}

export function reminderSettingsEnabled(settings: AppSettings): boolean {
  return (
    settings.bookingStartReminderEnabled ||
    settings.bookingEndReminderEnabled ||
    settings.medicationReminderEnabled ||
    settings.mealPlanningReminderEnabled ||
    settings.weeklyOverviewEnabled
  )
}
