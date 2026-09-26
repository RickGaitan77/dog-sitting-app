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
