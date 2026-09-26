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
  STORE_SCHEMA,
  STORE_SCHEMA_VERSION_1,
  STORE_SCHEMA_VERSION_2,
} from './schema'
import type { AttachmentBlobRecord } from './attachmentBlob'

export class DogSittingDatabase extends Dexie {
  clients!: Table<Client, string>
  pets!: Table<Pet, string>
  bookings!: Table<Booking, string>
  areas!: Table<Area, string>
  services!: Table<Service, string>
  generalEvents!: Table<GeneralEvent, string>
  meals!: Table<Meal, string>
  attachments!: Table<Attachment, string>
  attachmentBlobs!: Table<AttachmentBlobRecord, string>
  settings!: Table<AppSettings, string>

  constructor(databaseName = DATABASE_NAME) {
    super(databaseName)

    this.version(1).stores(STORE_SCHEMA_VERSION_1)
    this.version(2).stores(STORE_SCHEMA_VERSION_2)
    this.version(DATABASE_VERSION).stores(STORE_SCHEMA)
  }
}

export const db = new DogSittingDatabase()
