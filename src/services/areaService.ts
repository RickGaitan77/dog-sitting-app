import type { DogSittingDatabase } from '../db'
import type { Area } from '../Types'
import type { AppRepositories } from '../repositories'
import {
  createEntityId,
  type IdFactory,
} from './entityService'

export class AreaValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AreaValidationError'
  }
}

export type AreaInput = {
  name: string
  color: string
}

export function normalizeAreaName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLocaleLowerCase()
}

function validateColor(color: string): string {
  const normalizedColor = color.trim()
  if (
    normalizedColor === '' ||
    (!/^#[\da-f]{6}$/i.test(normalizedColor) &&
      !/^[a-z]+$/i.test(normalizedColor))
  ) {
    throw new AreaValidationError('Select a valid Area color.')
  }
  return normalizedColor
}

export class AreaService {
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

  async getAll(): Promise<Area[]> {
    const areas = await this.repositories.areas.getAll()
    return areas.sort(
      (left, right) =>
        left.sortOrder - right.sortOrder ||
        left.name.localeCompare(right.name),
    )
  }

  async create(input: AreaInput): Promise<Area> {
    const name = input.name.trim().replace(/\s+/g, ' ')
    if (name === '') throw new AreaValidationError('Enter an Area name.')
    const color = validateColor(input.color)
    const areas = await this.repositories.areas.getAll()
    this.assertUniqueActiveName(name, areas)
    const nextSortOrder = areas.reduce(
      (maximum, area) => Math.max(maximum, area.sortOrder),
      -1,
    ) + 1

    return this.repositories.areas.add({
      id: this.idFactory(),
      name,
      color,
      sortOrder: nextSortOrder,
      archived: false,
    })
  }

  async update(
    id: string,
    input: AreaInput,
  ): Promise<Area> {
    const name = input.name.trim().replace(/\s+/g, ' ')
    if (name === '') throw new AreaValidationError('Enter an Area name.')
    const color = validateColor(input.color)
    const areas = await this.repositories.areas.getAll()
    const area = areas.find((item) => item.id === id)
    if (area === undefined) throw new AreaValidationError('Area not found.')
    if (!area.archived) this.assertUniqueActiveName(name, areas, id)

    return this.repositories.areas.update(id, { name, color })
  }

  async reorder(activeAreaIds: string[]): Promise<Area[]> {
    await this.database.transaction('rw', this.database.areas, async () => {
      const areas = await this.database.areas.toArray()
      const activeIds = areas
        .filter((area) => !area.archived)
        .map((area) => area.id)
      if (
        activeIds.length !== activeAreaIds.length ||
        activeIds.some((id) => !activeAreaIds.includes(id))
      ) {
        throw new AreaValidationError(
          'Areas changed while reordering. Reload and try again.',
        )
      }

      await Promise.all(
        activeAreaIds.map((id, sortOrder) =>
          this.database.areas.update(id, { sortOrder }),
        ),
      )
    })

    return this.getAll()
  }

  archive(id: string): Promise<Area> {
    return this.repositories.areas.update(id, { archived: true })
  }

  async restore(id: string): Promise<Area> {
    const areas = await this.repositories.areas.getAll()
    const area = areas.find((item) => item.id === id)
    if (area === undefined) throw new AreaValidationError('Area not found.')
    this.assertUniqueActiveName(area.name, areas, id)
    const nextSortOrder = areas
      .filter((item) => !item.archived)
      .reduce((maximum, item) => Math.max(maximum, item.sortOrder), -1) + 1

    return this.repositories.areas.update(id, {
      archived: false,
      sortOrder: nextSortOrder,
    })
  }

  private assertUniqueActiveName(
    name: string,
    areas: Area[],
    excludedId?: string,
  ): void {
    const normalizedName = normalizeAreaName(name)
    if (
      areas.some(
        (area) =>
          !area.archived &&
          area.id !== excludedId &&
          normalizeAreaName(area.name) === normalizedName,
      )
    ) {
      throw new AreaValidationError(
        'An active Area with that name already exists.',
      )
    }
  }
}
