import type {
  Area,
  Attachment,
  Booking,
  Client,
  GeneralEvent,
  Meal,
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

export class AppServices {
  readonly repositories: AppRepositories
  readonly clients: EntityService<Client>
  readonly pets: EntityService<Pet>
  readonly bookings: EntityService<Booking>
  readonly areas: EntityService<Area>
  readonly services: EntityService<Service>
  readonly generalEvents: EntityService<GeneralEvent>
  readonly meals: EntityService<Meal>
  readonly attachments: EntityService<Attachment>
  readonly settings: AppRepositories['settings']

  constructor(
    repositories: AppRepositories,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repositories = repositories
    this.clients = new EntityService(repositories.clients, idFactory)
    this.pets = new EntityService(repositories.pets, idFactory)
    this.bookings = new EntityService(repositories.bookings, idFactory)
    this.areas = new EntityService(repositories.areas, idFactory)
    this.services = new EntityService(repositories.services, idFactory)
    this.generalEvents = new EntityService(
      repositories.generalEvents,
      idFactory,
    )
    this.meals = new EntityService(repositories.meals, idFactory)
    this.attachments = new EntityService(
      repositories.attachments,
      idFactory,
    )
    this.settings = repositories.settings
  }
}

export const appServices = new AppServices(repositories)
