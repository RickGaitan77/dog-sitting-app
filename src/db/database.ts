import Dexie, { type Table } from 'dexie'
import type {
  AppSettings,
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
  DATABASE_NAME,
  DATABASE_VERSION,
  STORES,
} from './schema'

export class DogSittingDatabase extends Dexie {
  clients!: Table<Client, string>
  pets!: Table<Pet, string>
  bookings!: Table<Booking, string>
  areas!: Table<Area, string>
  services!: Table<Service, string>
  generalEvents!: Table<GeneralEvent, string>
  meals!: Table<Meal, string>
  attachments!: Table<Attachment, string>
  settings!: Table<AppSettings, string>

  constructor() {
    super(DATABASE_NAME)

    this.version(DATABASE_VERSION).stores({
      [STORES.clients]: 'id, name, areaId, archived',
      [STORES.pets]: 'id, clientId, name, archived',
      [STORES.bookings]:
        'id, clientId, startDate, endDate, areaId, status',
      [STORES.areas]: 'id, name, sortOrder, archived',
      [STORES.services]: 'id, name, sortOrder, archived',
      [STORES.generalEvents]:
        'id, title, startDate, endDate, areaId',
      [STORES.meals]: 'id, date, prepDate, prepCompleted',
      [STORES.attachments]:
        'id, ownerType, ownerId, createdAt',
      [STORES.settings]: '',
    })
  }
}

export const db = new DogSittingDatabase()