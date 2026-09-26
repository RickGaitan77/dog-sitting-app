import type { Table } from 'dexie'
import type {
  AppSettings,
  Area,
  Attachment,
  AttachmentOwnerType,
  Booking,
  Client,
  GeneralEvent,
  Meal,
  Pet,
  Service,
} from '../Types'
import { db, type DogSittingDatabase } from '../db/database'
import {
  createDefaultSettings,
  SETTINGS_PRIMARY_KEY,
} from '../db/defaults'

export type Entity = { id: string }

export type EntityUpdate<T extends Entity> = Partial<
  Omit<T, 'id'>
>

export class EntityNotFoundError extends Error {
  constructor(entityName: string, id: string) {
    super(`${entityName} with id "${id}" was not found`)
    this.name = 'EntityNotFoundError'
  }
}

export class EntityRepository<T extends Entity> {
  protected readonly table: Table<T, string>
  private readonly entityName: string

  constructor(
    table: Table<T, string>,
    entityName: string,
  ) {
    this.table = table
    this.entityName = entityName
  }

  getById(id: string): Promise<T | undefined> {
    return this.table.get(id)
  }

  getAll(): Promise<T[]> {
    return this.table.toArray()
  }

  async add(entity: T): Promise<T> {
    await this.table.add(entity)
    return entity
  }

  async put(entity: T): Promise<T> {
    await this.table.put(entity)
    return entity
  }

  async update(id: string, changes: EntityUpdate<T>): Promise<T> {
    const updatedCount = await this.table.update(id, (entity) => {
      Object.assign(entity, changes)
    })

    if (updatedCount === 0) {
      throw new EntityNotFoundError(this.entityName, id)
    }

    const updatedEntity = await this.table.get(id)

    if (updatedEntity === undefined) {
      throw new EntityNotFoundError(this.entityName, id)
    }

    return updatedEntity
  }

  async delete(id: string): Promise<void> {
    await this.table.delete(id)
  }
}

export class ClientRepository extends EntityRepository<Client> {
  async getActive(): Promise<Client[]> {
    const clients = await this.table
      .filter((client) => !client.archived)
      .toArray()

    return clients.sort((left, right) =>
      left.name.localeCompare(right.name),
    )
  }
}

export class PetRepository extends EntityRepository<Pet> {
  async getByClientId(
    clientId: string,
    includeArchived = false,
  ): Promise<Pet[]> {
    const pets = await this.table
      .where('clientId')
      .equals(clientId)
      .filter((pet) => includeArchived || !pet.archived)
      .toArray()

    return pets.sort((left, right) =>
      left.name.localeCompare(right.name),
    )
  }
}

export class BookingRepository extends EntityRepository<Booking> {
  async getOverlappingDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Booking[]> {
    const bookings = await this.table
      .where('startDate')
      .belowOrEqual(endDate)
      .filter((booking) => booking.endDate >= startDate)
      .toArray()

    return bookings.sort((left, right) =>
      left.startDate.localeCompare(right.startDate),
    )
  }

  getByClientId(clientId: string): Promise<Booking[]> {
    return this.table.where('clientId').equals(clientId).sortBy('startDate')
  }

  getByPetId(petId: string): Promise<Booking[]> {
    return this.table.where('petIds').equals(petId).sortBy('startDate')
  }
}

type SortableArchivedEntity = Entity & {
  name: string
  sortOrder: number
  archived: boolean
}

export class SortableArchivedRepository<
  T extends SortableArchivedEntity,
> extends EntityRepository<T> {
  async getActive(): Promise<T[]> {
    const entities = await this.table
      .filter((entity) => !entity.archived)
      .toArray()

    return entities.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name),
    )
  }
}

export class GeneralEventRepository extends EntityRepository<GeneralEvent> {
  async getOverlappingDateRange(
    startDate: string,
    endDate: string,
  ): Promise<GeneralEvent[]> {
    const events = await this.table
      .where('startDate')
      .belowOrEqual(endDate)
      .filter((event) => event.endDate >= startDate)
      .toArray()

    return events.sort((left, right) =>
      left.startDate.localeCompare(right.startDate),
    )
  }
}

export class MealRepository extends EntityRepository<Meal> {
  getByDateRange(startDate: string, endDate: string): Promise<Meal[]> {
    return this.table
      .where('date')
      .between(startDate, endDate, true, true)
      .sortBy('date')
  }

  async getPendingPrep(): Promise<Meal[]> {
    const meals = await this.table
      .filter((meal) => !meal.prepCompleted)
      .toArray()

    return meals.sort((left, right) =>
      (left.prepDate ?? left.date).localeCompare(
        right.prepDate ?? right.date,
      ),
    )
  }
}

export class AttachmentRepository extends EntityRepository<Attachment> {
  getByOwner(
    ownerType: AttachmentOwnerType,
    ownerId: string,
  ): Promise<Attachment[]> {
    return this.table
      .where('[ownerType+ownerId]')
      .equals([ownerType, ownerId])
      .sortBy('createdAt')
  }
}

export class SettingsRepository {
  private readonly table: Table<AppSettings, string>

  constructor(table: Table<AppSettings, string>) {
    this.table = table
  }

  async get(): Promise<AppSettings> {
    const settings = await this.table.get(SETTINGS_PRIMARY_KEY)
    return settings ?? createDefaultSettings()
  }

  async update(changes: Partial<AppSettings>): Promise<AppSettings> {
    const settings = {
      ...(await this.get()),
      ...changes,
    }

    await this.table.put(settings, SETTINGS_PRIMARY_KEY)
    return settings
  }

  async reset(): Promise<AppSettings> {
    const settings = createDefaultSettings()
    await this.table.put(settings, SETTINGS_PRIMARY_KEY)
    return settings
  }
}

export type AppRepositories = ReturnType<typeof createRepositories>

export function createRepositories(database: DogSittingDatabase) {
  return {
    clients: new ClientRepository(database.clients, 'Client'),
    pets: new PetRepository(database.pets, 'Pet'),
    bookings: new BookingRepository(database.bookings, 'Booking'),
    areas: new SortableArchivedRepository<Area>(
      database.areas,
      'Area',
    ),
    services: new SortableArchivedRepository<Service>(
      database.services,
      'Service',
    ),
    generalEvents: new GeneralEventRepository(
      database.generalEvents,
      'General event',
    ),
    meals: new MealRepository(database.meals, 'Meal'),
    attachments: new AttachmentRepository(
      database.attachments,
      'Attachment',
    ),
    settings: new SettingsRepository(database.settings),
  }
}

export const repositories = createRepositories(db)
