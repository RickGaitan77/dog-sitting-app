import type { DogSittingDatabase } from '../db'
import type { Service } from '../Types'
import type { AppRepositories } from '../repositories'
import { createEntityId, type IdFactory } from './entityService'

export class ServiceValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ServiceValidationError'
  }
}

export type ServiceInput = {
  name: string
}

export function normalizeServiceName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

export class ServiceCatalogService {
  private readonly repositories: AppRepositories
  private readonly database: DogSittingDatabase
  private readonly idFactory: IdFactory

  constructor(
    repositories: AppRepositories,
    database: DogSittingDatabase,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repositories = repositories
    this.database = database
    this.idFactory = idFactory
  }

  async getAll(): Promise<Service[]> {
    const services = await this.repositories.services.getAll()
    return services.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name),
    )
  }

  async create(input: ServiceInput): Promise<Service> {
    const name = this.validateName(input.name)
    const services = await this.repositories.services.getAll()
    this.assertUniqueActiveName(name, services)
    const nextSortOrder = services.reduce(
      (maximum, service) => Math.max(maximum, service.sortOrder),
      -1,
    ) + 1

    return this.repositories.services.add({
      id: this.idFactory(),
      name,
      sortOrder: nextSortOrder,
      archived: false,
    })
  }

  async update(id: string, input: ServiceInput): Promise<Service> {
    const name = this.validateName(input.name)
    const services = await this.repositories.services.getAll()
    const service = services.find((item) => item.id === id)
    if (service === undefined) {
      throw new ServiceValidationError('Service not found.')
    }
    if (!service.archived) {
      this.assertUniqueActiveName(name, services, id)
    }

    return this.repositories.services.update(id, { name })
  }

  async reorder(activeServiceIds: string[]): Promise<Service[]> {
    await this.database.transaction('rw', this.database.services, async () => {
      const services = await this.database.services.toArray()
      const activeIds = services
        .filter((service) => !service.archived)
        .map((service) => service.id)
      if (
        activeIds.length !== activeServiceIds.length ||
        activeIds.some((id) => !activeServiceIds.includes(id))
      ) {
        throw new ServiceValidationError(
          'Services changed while reordering. Reload and try again.',
        )
      }

      await Promise.all(
        activeServiceIds.map((id, sortOrder) =>
          this.database.services.update(id, { sortOrder }),
        ),
      )
    })

    return this.getAll()
  }

  archive(id: string): Promise<Service> {
    return this.repositories.services.update(id, { archived: true })
  }

  async restore(id: string): Promise<Service> {
    const services = await this.repositories.services.getAll()
    const service = services.find((item) => item.id === id)
    if (service === undefined) {
      throw new ServiceValidationError('Service not found.')
    }
    this.assertUniqueActiveName(service.name, services, id)
    const nextSortOrder = services
      .filter((item) => !item.archived)
      .reduce((maximum, item) => Math.max(maximum, item.sortOrder), -1) + 1

    return this.repositories.services.update(id, {
      archived: false,
      sortOrder: nextSortOrder,
    })
  }

  private validateName(value: string): string {
    const name = value.trim().replace(/\s+/g, ' ')
    if (name === '') {
      throw new ServiceValidationError('Enter a Service name.')
    }
    return name
  }

  private assertUniqueActiveName(
    name: string,
    services: Service[],
    excludedId?: string,
  ): void {
    const normalizedName = normalizeServiceName(name)
    if (
      services.some(
        (service) =>
          !service.archived &&
          service.id !== excludedId &&
          normalizeServiceName(service.name) === normalizedName,
      )
    ) {
      throw new ServiceValidationError(
        'An active Service with that name already exists.',
      )
    }
  }
}
