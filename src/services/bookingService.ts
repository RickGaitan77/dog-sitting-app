import type { Booking, BookingStatus } from '../Types'
import type {
  AppRepositories,
  EntityUpdate,
} from '../repositories'
import {
  createEntityId,
  type IdFactory,
  type NewEntity,
} from './entityService'

export const BOOKING_STATUSES: readonly BookingStatus[] = [
  'Tentative',
  'Confirmed',
  'Completed',
  'Cancelled',
]

export type WeeklyRecurrenceInput = {
  frequency: 'weekly'
  weekdays: number[]
  endDate: string
}

function parseDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function addDays(date: string, days: number): string {
  const shiftedDate = parseDateOnly(date)
  shiftedDate.setUTCDate(shiftedDate.getUTCDate() + days)
  return toDateString(shiftedDate)
}

function differenceInDays(startDate: string, endDate: string): number {
  return Math.round(
    (parseDateOnly(endDate).getTime() - parseDateOnly(startDate).getTime()) /
      86_400_000,
  )
}

function stableHash(value: string): string {
  let first = 0x811c9dc5
  let second = 0x9e3779b9

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index)
    first = Math.imul(first ^ code, 0x01000193)
    second = Math.imul(second ^ code, 0x85ebca6b)
  }

  return `${(first >>> 0).toString(16).padStart(8, '0')}${(second >>> 0).toString(16).padStart(8, '0')}`
}

function createSeriesId(
  booking: NewEntity<Booking>,
  recurrence: WeeklyRecurrenceInput,
): string {
  const signature = JSON.stringify({
    clientId: booking.clientId,
    petIds: [...booking.petIds].sort(),
    startDate: booking.startDate,
    endDate: booking.endDate,
    areaId: booking.areaId,
    serviceIds: [...booking.serviceIds].sort(),
    status: booking.status,
    notes: booking.notes ?? null,
    weekdays: [...recurrence.weekdays].sort(),
    recurrenceEndDate: recurrence.endDate,
  })

  return `weekly-${stableHash(signature)}`
}

export class BookingValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BookingValidationError'
  }
}

export class BookingService {
  private readonly repositories: AppRepositories
  private readonly idFactory: IdFactory

  constructor(
    repositories: AppRepositories,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repositories = repositories
    this.idFactory = idFactory
  }

  getById(id: string): Promise<Booking | undefined> {
    return this.repositories.bookings.getById(id)
  }

  getAll(): Promise<Booking[]> {
    return this.repositories.bookings.getAll()
  }

  async create(input: NewEntity<Booking>): Promise<Booking> {
    await this.validate(input)

    return this.repositories.bookings.add({
      ...input,
      id: this.idFactory(),
    })
  }

  async createWeekly(
    input: NewEntity<Booking>,
    recurrence: WeeklyRecurrenceInput,
  ): Promise<Booking[]> {
    await this.validate(input)

    const weekdays = Array.from(new Set(recurrence.weekdays)).sort()

    if (
      weekdays.length === 0 ||
      weekdays.some(
        (weekday) => !Number.isInteger(weekday) || weekday < 0 || weekday > 6,
      )
    ) {
      throw new BookingValidationError(
        'Select at least one weekday for weekly recurrence.',
      )
    }

    if (recurrence.endDate === '') {
      throw new BookingValidationError('A recurrence end date is required.')
    }

    if (recurrence.endDate < input.startDate) {
      throw new BookingValidationError(
        'The recurrence end date cannot be before the booking start date.',
      )
    }

    const durationDays = differenceInDays(input.startDate, input.endDate)
    const seriesId = createSeriesId(input, { ...recurrence, weekdays })
    const instances: Booking[] = []

    for (
      let occurrenceDate = input.startDate;
      occurrenceDate <= recurrence.endDate;
      occurrenceDate = addDays(occurrenceDate, 1)
    ) {
      if (!weekdays.includes(parseDateOnly(occurrenceDate).getUTCDay())) {
        continue
      }

      instances.push({
        ...input,
        id: `${seriesId}:${occurrenceDate}`,
        startDate: occurrenceDate,
        endDate: addDays(occurrenceDate, durationDays),
        recurrenceSeriesId: seriesId,
        recurrenceInstanceDate: occurrenceDate,
      })
    }

    if (instances.length === 0) {
      throw new BookingValidationError(
        'The recurrence does not produce any bookings in the selected date range.',
      )
    }

    return this.repositories.bookings.addMissing(instances)
  }

  async update(
    id: string,
    changes: EntityUpdate<Booking>,
  ): Promise<Booking> {
    const currentBooking = await this.repositories.bookings.getById(id)

    if (currentBooking === undefined) {
      return this.repositories.bookings.update(id, changes)
    }

    const updatedBooking: Booking = {
      ...currentBooking,
      ...changes,
      id,
    }

    await this.validate(updatedBooking, currentBooking)
    return this.repositories.bookings.update(id, changes)
  }

  cancel(id: string): Promise<Booking> {
    return this.update(id, { status: 'Cancelled' })
  }

  private async validate(
    booking: NewEntity<Booking> | Booking,
    currentBooking?: Booking,
  ): Promise<void> {
    if (booking.clientId === '') {
      throw new BookingValidationError('A client is required.')
    }

    if (booking.petIds.length === 0) {
      throw new BookingValidationError('At least one pet is required.')
    }

    if (booking.startDate === '') {
      throw new BookingValidationError('A start date is required.')
    }

    if (booking.endDate === '') {
      throw new BookingValidationError('An end date is required.')
    }

    if (booking.endDate < booking.startDate) {
      throw new BookingValidationError(
        'The end date cannot be before the start date.',
      )
    }

    if (booking.areaId === '') {
      throw new BookingValidationError('An area is required.')
    }

    if (booking.serviceIds.length === 0) {
      throw new BookingValidationError('At least one service is required.')
    }

    if (!BOOKING_STATUSES.includes(booking.status)) {
      throw new BookingValidationError('A valid status is required.')
    }

    const client = await this.repositories.clients.getById(booking.clientId)
    const preservesClient = currentBooking?.clientId === booking.clientId

    if (client === undefined || (client.archived && !preservesClient)) {
      throw new BookingValidationError(
        'The booking client must be an active client.',
      )
    }

    const pets = await Promise.all(
      booking.petIds.map((petId) => this.repositories.pets.getById(petId)),
    )

    pets.forEach((pet, index) => {
      const petId = booking.petIds[index]
      const preservesPet = currentBooking?.petIds.includes(petId) ?? false

      if (
        pet === undefined ||
        pet.clientId !== booking.clientId ||
        (pet.archived && !preservesPet)
      ) {
        throw new BookingValidationError(
          'Every selected pet must be active and belong to the booking client.',
        )
      }
    })

    const area = await this.repositories.areas.getById(booking.areaId)
    const preservesArea = currentBooking?.areaId === booking.areaId

    if (area === undefined || (area.archived && !preservesArea)) {
      throw new BookingValidationError(
        'The booking area must be an active area.',
      )
    }

    const services = await Promise.all(
      booking.serviceIds.map((serviceId) =>
        this.repositories.services.getById(serviceId),
      ),
    )

    services.forEach((service, index) => {
      const serviceId = booking.serviceIds[index]
      const preservesService =
        currentBooking?.serviceIds.includes(serviceId) ?? false

      if (service === undefined || (service.archived && !preservesService)) {
        throw new BookingValidationError(
          'Every selected service must be active.',
        )
      }
    })
  }
}
