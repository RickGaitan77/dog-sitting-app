import type {
  Entity,
  EntityRepository,
  EntityUpdate,
} from '../repositories'

export type NewEntity<T extends Entity> = Omit<T, 'id'>

export type IdFactory = () => string

export const createEntityId: IdFactory = () => crypto.randomUUID()

export class EntityService<T extends Entity> {
  private readonly repository: EntityRepository<T>
  private readonly idFactory: IdFactory

  constructor(
    repository: EntityRepository<T>,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repository = repository
    this.idFactory = idFactory
  }

  getById(id: string): Promise<T | undefined> {
    return this.repository.getById(id)
  }

  getAll(): Promise<T[]> {
    return this.repository.getAll()
  }

  create(input: NewEntity<T>): Promise<T> {
    const entity = {
      ...input,
      id: this.idFactory(),
    } as T

    return this.repository.add(entity)
  }

  update(id: string, changes: EntityUpdate<T>): Promise<T> {
    return this.repository.update(id, changes)
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(id)
  }
}
