import type { Meal } from '../Types'
import type {
  AppRepositories,
  EntityUpdate,
} from '../repositories'
import {
  createEntityId,
  type IdFactory,
  type NewEntity,
} from './entityService'

export class MealValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MealValidationError'
  }
}

export class MealService {
  private readonly repositories: AppRepositories
  private readonly idFactory: IdFactory

  constructor(
    repositories: AppRepositories,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repositories = repositories
    this.idFactory = idFactory
  }

  getById(id: string): Promise<Meal | undefined> {
    return this.repositories.meals.getById(id)
  }

  getAll(): Promise<Meal[]> {
    return this.repositories.meals.getAll()
  }

  async create(input: NewEntity<Meal>): Promise<Meal> {
    this.validate(input)

    return this.repositories.meals.add({
      ...input,
      id: this.idFactory(),
    })
  }

  async update(
    id: string,
    changes: EntityUpdate<Meal>,
  ): Promise<Meal> {
    const currentMeal = await this.repositories.meals.getById(id)

    if (currentMeal === undefined) {
      return this.repositories.meals.update(id, changes)
    }

    this.validate({ ...currentMeal, ...changes, id })
    return this.repositories.meals.update(id, changes)
  }

  delete(id: string): Promise<void> {
    return this.repositories.meals.delete(id)
  }

  private validate(meal: NewEntity<Meal> | Meal): void {
    if (meal.name.trim() === '') {
      throw new MealValidationError('A meal name is required.')
    }

    if (meal.date === '') {
      throw new MealValidationError('A meal date is required.')
    }
  }
}
