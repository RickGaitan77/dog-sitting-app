import type {
  Area,
  Client,
  Pet,
  Service,
} from '../Types'
import {
  repositories,
  type AppRepositories,
} from '../repositories'
import {
  createEntityId,
  EntityService,
  type IdFactory,
} from './entityService'
import { BookingService } from './bookingService'
import { GeneralEventService } from './generalEventService'
import { MealService } from './mealService'
import { AttachmentService } from './attachmentService'
import { ReminderService } from './reminderService'

export class AppServices {
  readonly repositories: AppRepositories
  readonly clients: EntityService<Client>
  readonly pets: EntityService<Pet>
  readonly bookings: BookingService
  readonly areas: EntityService<Area>
  readonly services: EntityService<Service>
  readonly generalEvents: GeneralEventService
  readonly meals: MealService
  readonly attachments: AttachmentService
  readonly reminders: ReminderService
  readonly settings: AppRepositories['settings']

  constructor(
    repositories: AppRepositories,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repositories = repositories
    this.clients = new EntityService(repositories.clients, idFactory)
    this.pets = new EntityService(repositories.pets, idFactory)
    this.bookings = new BookingService(repositories, idFactory)
    this.areas = new EntityService(repositories.areas, idFactory)
    this.services = new EntityService(repositories.services, idFactory)
    this.generalEvents = new GeneralEventService(
      repositories,
      idFactory,
    )
    this.meals = new MealService(repositories, idFactory)
    this.attachments = new AttachmentService(repositories, idFactory)
    this.reminders = new ReminderService(repositories)
    this.settings = repositories.settings
  }
}

export const appServices = new AppServices(repositories)
