import type { GeneralEvent } from '../Types'
import type {
  AppRepositories,
  EntityUpdate,
} from '../repositories'
import {
  createEntityId,
  type IdFactory,
  type NewEntity,
} from './entityService'

export class GeneralEventValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeneralEventValidationError'
  }
}

export class GeneralEventService {
  private readonly repositories: AppRepositories
  private readonly idFactory: IdFactory

  constructor(
    repositories: AppRepositories,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repositories = repositories
    this.idFactory = idFactory
  }

  getById(id: string): Promise<GeneralEvent | undefined> {
    return this.repositories.generalEvents.getById(id)
  }

  getAll(): Promise<GeneralEvent[]> {
    return this.repositories.generalEvents.getAll()
  }

  async create(input: NewEntity<GeneralEvent>): Promise<GeneralEvent> {
    await this.validate(input)

    return this.repositories.generalEvents.add({
      ...input,
      id: this.idFactory(),
    })
  }

  async update(
    id: string,
    changes: EntityUpdate<GeneralEvent>,
  ): Promise<GeneralEvent> {
    const currentEvent = await this.repositories.generalEvents.getById(id)

    if (currentEvent === undefined) {
      return this.repositories.generalEvents.update(id, changes)
    }

    const updatedEvent: GeneralEvent = {
      ...currentEvent,
      ...changes,
      id,
    }

    await this.validate(updatedEvent, currentEvent)
    return this.repositories.generalEvents.update(id, changes)
  }

  delete(id: string): Promise<void> {
    return this.repositories.generalEvents.delete(id)
  }

  private async validate(
    event: NewEntity<GeneralEvent> | GeneralEvent,
    currentEvent?: GeneralEvent,
  ): Promise<void> {
    if (event.title.trim() === '') {
      throw new GeneralEventValidationError('A title is required.')
    }

    if (event.startDate === '') {
      throw new GeneralEventValidationError('A start date is required.')
    }

    if (event.endDate === '') {
      throw new GeneralEventValidationError('An end date is required.')
    }

    if (event.endDate < event.startDate) {
      throw new GeneralEventValidationError(
        'The end date cannot be before the start date.',
      )
    }

    if (event.areaId === undefined || event.areaId === '') return

    const area = await this.repositories.areas.getById(event.areaId)
    const preservesArea = currentEvent?.areaId === event.areaId

    if (area === undefined || (area.archived && !preservesArea)) {
      throw new GeneralEventValidationError(
        'The event area must be an active area.',
      )
    }
  }
}
