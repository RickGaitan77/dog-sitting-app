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
import type { DogSittingDatabase } from '../db/database'
import { SETTINGS_PRIMARY_KEY } from '../db/defaults'
import { APP_VERSION } from '../config/appMetadata'

export const BACKUP_FORMAT_VERSION = 1
export const BACKUP_FILE_TYPE = 'application/json'

export type BackupRecordCounts = {
  clients: number
  pets: number
  bookings: number
  areas: number
  services: number
  generalEvents: number
  meals: number
  attachments: number
  settings: number
}

export type BackupManifest = {
  backupFormatVersion: number
  appVersion: string
  createdAt: string
  recordCounts: BackupRecordCounts
  attachmentCount: number
  attachmentBinariesIncluded: boolean
}

export type BackupAttachmentBlob = {
  attachmentId: string
  mimeType: string
  base64: string
}

export type BackupData = {
  clients: Client[]
  pets: Pet[]
  bookings: Booking[]
  areas: Area[]
  services: Service[]
  generalEvents: GeneralEvent[]
  meals: Meal[]
  attachments: Attachment[]
  attachmentBlobs: BackupAttachmentBlob[]
  settings: AppSettings
}

export type BackupDocument = {
  manifest: BackupManifest
  data: BackupData
}

export type CreatedBackup = {
  document: BackupDocument
  file: Blob
  fileName: string
}

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BackupValidationError'
  }
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || isString(value)
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString)
}

function isDateOnly(value: unknown): value is string {
  if (!isString(value) || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
}

function isIsoDate(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value))
}

function isClient(value: unknown): value is Client {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    typeof value.archived === 'boolean' &&
    isOptionalString(value.phone) &&
    isOptionalString(value.email) &&
    isOptionalString(value.address) &&
    isOptionalString(value.areaId) &&
    isOptionalString(value.notes) &&
    isOptionalString(value.emergencyContact) &&
    isOptionalString(value.veterinarianInfo)
}

function isPet(value: unknown): value is Pet {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.clientId) &&
    isString(value.name) &&
    typeof value.archived === 'boolean' &&
    isOptionalString(value.species) &&
    isOptionalString(value.breed) &&
    isOptionalString(value.photoUrl) &&
    isOptionalString(value.feedingInstructions) &&
    isOptionalString(value.medication) &&
    isOptionalString(value.behaviorInfo) &&
    isOptionalString(value.careNotes) &&
    isOptionalString(value.specialInstructions)
}

function isBooking(value: unknown): value is Booking {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.clientId) &&
    isStringArray(value.petIds) &&
    isDateOnly(value.startDate) &&
    isDateOnly(value.endDate) &&
    value.endDate >= value.startDate &&
    isString(value.areaId) &&
    isStringArray(value.serviceIds) &&
    isString(value.status) &&
    ['Tentative', 'Confirmed', 'Completed', 'Cancelled'].includes(
      value.status,
    ) &&
    isOptionalString(value.notes) &&
    isOptionalString(value.recurrenceSeriesId) &&
    (value.recurrenceInstanceDate === undefined ||
      isDateOnly(value.recurrenceInstanceDate))
}

function isArea(value: unknown): value is Area {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    isString(value.color) &&
    typeof value.sortOrder === 'number' &&
    Number.isFinite(value.sortOrder) &&
    typeof value.archived === 'boolean'
}

function isService(value: unknown): value is Service {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.name) &&
    typeof value.sortOrder === 'number' &&
    Number.isFinite(value.sortOrder) &&
    typeof value.archived === 'boolean'
}

function isGeneralEvent(value: unknown): value is GeneralEvent {
  return isObject(value) &&
    isString(value.id) &&
    isString(value.title) &&
    isDateOnly(value.startDate) &&
    isDateOnly(value.endDate) &&
    value.endDate >= value.startDate &&
    isOptionalString(value.areaId) &&
    isOptionalString(value.notes)
}

function isMeal(value: unknown): value is Meal {
  return isObject(value) &&
    isString(value.id) &&
    isDateOnly(value.date) &&
    isString(value.name) &&
    isOptionalString(value.mealType) &&
    (value.prepDate === undefined || isDateOnly(value.prepDate)) &&
    isOptionalString(value.prepNotes) &&
    isOptionalString(value.notes) &&
    isStringArray(value.tags) &&
    typeof value.prepCompleted === 'boolean'
}

function isAttachment(value: unknown): value is Attachment {
  return isObject(value) &&
    isString(value.id) &&
    (value.ownerType === 'Client' || value.ownerType === 'Pet') &&
    isString(value.ownerId) &&
    isString(value.fileName) &&
    isString(value.mimeType) &&
    typeof value.fileSize === 'number' &&
    Number.isFinite(value.fileSize) &&
    value.fileSize >= 0 &&
    isIsoDate(value.createdAt) &&
    isOptionalString(value.notes)
}

function isSettings(value: unknown): value is AppSettings {
  return isObject(value) &&
    typeof value.showMealOverlay === 'boolean' &&
    typeof value.reduceMotion === 'boolean' &&
    typeof value.weeklyOverviewEnabled === 'boolean' &&
    typeof value.bookingStartReminderEnabled === 'boolean' &&
    typeof value.bookingEndReminderEnabled === 'boolean' &&
    typeof value.medicationReminderEnabled === 'boolean' &&
    typeof value.mealPlanningReminderEnabled === 'boolean' &&
    (value.lastBackupAt === undefined || isIsoDate(value.lastBackupAt))
}

function requireArray<T>(
  value: unknown,
  name: string,
  predicate: (record: unknown) => record is T,
): T[] {
  if (!Array.isArray(value)) {
    throw new BackupValidationError(`Backup is missing the ${name} dataset.`)
  }
  if (!value.every(predicate)) {
    throw new BackupValidationError(`Backup contains invalid ${name} records.`)
  }
  return value
}

function ensureUniqueIds(records: Array<{ id: string }>, name: string): void {
  const ids = new Set(records.map((record) => record.id))
  if (ids.size !== records.length || ids.has('')) {
    throw new BackupValidationError(`Backup contains duplicate or empty ${name} IDs.`)
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const chunkSize = 0x8000
  let binary = ''

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }

  return btoa(binary)
}

function base64ToBytes(base64: string): Uint8Array<ArrayBuffer> {
  if (
    !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64)
  ) {
    throw new BackupValidationError('Backup contains corrupted attachment data.')
  }

  try {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index)
    }
    return bytes
  } catch {
    throw new BackupValidationError('Backup contains corrupted attachment data.')
  }
}

function getCounts(data: BackupData): BackupRecordCounts {
  return {
    clients: data.clients.length,
    pets: data.pets.length,
    bookings: data.bookings.length,
    areas: data.areas.length,
    services: data.services.length,
    generalEvents: data.generalEvents.length,
    meals: data.meals.length,
    attachments: data.attachments.length,
    settings: 1,
  }
}

function validateCounts(
  value: unknown,
  expected: BackupRecordCounts,
): BackupRecordCounts {
  if (!isObject(value)) {
    throw new BackupValidationError('Backup manifest record counts are missing.')
  }

  for (const [name, count] of Object.entries(expected)) {
    if (value[name] !== count) {
      throw new BackupValidationError(`Backup manifest ${name} count is invalid.`)
    }
  }

  return expected
}

function validateRelationships(data: BackupData): void {
  const clientIds = new Set(data.clients.map((record) => record.id))
  const petById = new Map(data.pets.map((record) => [record.id, record]))
  const areaIds = new Set(data.areas.map((record) => record.id))
  const serviceIds = new Set(data.services.map((record) => record.id))

  data.clients.forEach((client) => {
    if (client.areaId !== undefined && !areaIds.has(client.areaId)) {
      throw new BackupValidationError('A client references an unknown Area.')
    }
  })

  data.pets.forEach((pet) => {
    if (!clientIds.has(pet.clientId)) {
      throw new BackupValidationError('A pet references an unknown Client.')
    }
  })

  data.bookings.forEach((booking) => {
    if (!clientIds.has(booking.clientId)) {
      throw new BackupValidationError('A booking references an unknown Client.')
    }
    if (!areaIds.has(booking.areaId)) {
      throw new BackupValidationError('A booking references an unknown Area.')
    }
    if (booking.petIds.length === 0 || booking.serviceIds.length === 0) {
      throw new BackupValidationError('A booking is missing Pets or Services.')
    }
    booking.petIds.forEach((petId) => {
      const pet = petById.get(petId)
      if (pet === undefined || pet.clientId !== booking.clientId) {
        throw new BackupValidationError('A booking has an invalid Pet relationship.')
      }
    })
    if (booking.serviceIds.some((serviceId) => !serviceIds.has(serviceId))) {
      throw new BackupValidationError('A booking references an unknown Service.')
    }
  })

  data.generalEvents.forEach((event) => {
    if (event.areaId !== undefined && !areaIds.has(event.areaId)) {
      throw new BackupValidationError('A general event references an unknown Area.')
    }
  })

  data.attachments.forEach((attachment) => {
    const ownerExists = attachment.ownerType === 'Client'
      ? clientIds.has(attachment.ownerId)
      : petById.has(attachment.ownerId)
    if (!ownerExists) {
      throw new BackupValidationError('An attachment references an unknown owner.')
    }
  })
}

export function validateBackupDocument(value: unknown): BackupDocument {
  if (!isObject(value) || !isObject(value.manifest) || !isObject(value.data)) {
    throw new BackupValidationError('This is not a valid Dog Sitting App backup.')
  }

  const manifestValue = value.manifest
  if (manifestValue.backupFormatVersion !== BACKUP_FORMAT_VERSION) {
    throw new BackupValidationError(
      `Unsupported backup format. This app supports format ${BACKUP_FORMAT_VERSION}.`,
    )
  }
  if (!isString(manifestValue.appVersion) || !isIsoDate(manifestValue.createdAt)) {
    throw new BackupValidationError('Backup manifest metadata is invalid.')
  }
  if (manifestValue.attachmentBinariesIncluded !== true) {
    throw new BackupValidationError('Backup does not include attachment files.')
  }

  const dataValue = value.data
  const clients = requireArray(dataValue.clients, 'Clients', isClient)
  const pets = requireArray(dataValue.pets, 'Pets', isPet)
  const bookings = requireArray(dataValue.bookings, 'Bookings', isBooking)
  const areas = requireArray(dataValue.areas, 'Areas', isArea)
  const services = requireArray(dataValue.services, 'Services', isService)
  const generalEvents = requireArray(
    dataValue.generalEvents,
    'General Events',
    isGeneralEvent,
  )
  const meals = requireArray(dataValue.meals, 'Meals', isMeal)
  const attachments = requireArray(
    dataValue.attachments,
    'Attachments',
    isAttachment,
  )
  if (!isSettings(dataValue.settings)) {
    throw new BackupValidationError('Backup App Settings are missing or invalid.')
  }
  if (!Array.isArray(dataValue.attachmentBlobs)) {
    throw new BackupValidationError('Backup attachment files are missing.')
  }

  const attachmentBlobs: BackupAttachmentBlob[] = dataValue.attachmentBlobs.map(
    (record) => {
      if (
        !isObject(record) ||
        !isString(record.attachmentId) ||
        !isString(record.mimeType) ||
        !isString(record.base64)
      ) {
        throw new BackupValidationError('Backup attachment file data is invalid.')
      }
      return {
        attachmentId: record.attachmentId,
        mimeType: record.mimeType,
        base64: record.base64,
      }
    },
  )

  const datasets = [
    [clients, 'Client'],
    [pets, 'Pet'],
    [bookings, 'Booking'],
    [areas, 'Area'],
    [services, 'Service'],
    [generalEvents, 'General Event'],
    [meals, 'Meal'],
    [attachments, 'Attachment'],
  ] as const
  datasets.forEach(([records, name]) => ensureUniqueIds(records, name))

  const data: BackupData = {
    clients,
    pets,
    bookings,
    areas,
    services,
    generalEvents,
    meals,
    attachments,
    attachmentBlobs,
    settings: dataValue.settings,
  }
  validateRelationships(data)

  const attachmentById = new Map(
    attachments.map((attachment) => [attachment.id, attachment]),
  )
  const blobIds = new Set<string>()
  attachmentBlobs.forEach((blobRecord) => {
    const attachment = attachmentById.get(blobRecord.attachmentId)
    if (
      attachment === undefined ||
      blobIds.has(blobRecord.attachmentId) ||
      attachment.mimeType !== blobRecord.mimeType
    ) {
      throw new BackupValidationError('Backup has invalid attachment file references.')
    }
    const bytes = base64ToBytes(blobRecord.base64)
    if (bytes.byteLength !== attachment.fileSize) {
      throw new BackupValidationError('Backup attachment file size is invalid.')
    }
    blobIds.add(blobRecord.attachmentId)
  })
  if (blobIds.size !== attachments.length) {
    throw new BackupValidationError('Backup is missing an attachment file.')
  }

  const recordCounts = validateCounts(
    manifestValue.recordCounts,
    getCounts(data),
  )
  if (manifestValue.attachmentCount !== attachments.length) {
    throw new BackupValidationError('Backup manifest attachment count is invalid.')
  }

  return {
    manifest: {
      backupFormatVersion: BACKUP_FORMAT_VERSION,
      appVersion: manifestValue.appVersion,
      createdAt: manifestValue.createdAt,
      recordCounts,
      attachmentCount: attachments.length,
      attachmentBinariesIncluded: true,
    },
    data,
  }
}

export async function parseBackupFile(file: Blob): Promise<BackupDocument> {
  let value: unknown
  try {
    value = JSON.parse(await file.text())
  } catch {
    throw new BackupValidationError('The selected backup is not valid JSON.')
  }
  return validateBackupDocument(value)
}

export class BackupService {
  private readonly database: DogSittingDatabase

  constructor(database: DogSittingDatabase) {
    this.database = database
  }

  async createBackup(): Promise<CreatedBackup> {
    const [
      clients,
      pets,
      bookings,
      areas,
      services,
      generalEvents,
      meals,
      attachments,
      storedBlobs,
      settings,
    ] = await this.database.transaction(
      'r',
      [
        this.database.clients,
        this.database.pets,
        this.database.bookings,
        this.database.areas,
        this.database.services,
        this.database.generalEvents,
        this.database.meals,
        this.database.attachments,
        this.database.attachmentBlobs,
        this.database.settings,
      ],
      () => Promise.all([
        this.database.clients.toArray(),
        this.database.pets.toArray(),
        this.database.bookings.toArray(),
        this.database.areas.toArray(),
        this.database.services.toArray(),
        this.database.generalEvents.toArray(),
        this.database.meals.toArray(),
        this.database.attachments.toArray(),
        this.database.attachmentBlobs.toArray(),
        this.database.settings.get(SETTINGS_PRIMARY_KEY),
      ]),
    )

    if (settings === undefined) {
      throw new BackupValidationError('App Settings could not be read for backup.')
    }

    const blobByAttachmentId = new Map(
      storedBlobs.map((record) => [record.attachmentId, record.data]),
    )
    const attachmentBlobs = await Promise.all(
      attachments.map(async (attachment): Promise<BackupAttachmentBlob> => {
        const blob = blobByAttachmentId.get(attachment.id)
        if (blob === undefined) {
          throw new BackupValidationError(
            `Attachment file data is missing for ${attachment.fileName}.`,
          )
        }
        if (
          blob.size !== attachment.fileSize ||
          (blob.type !== '' && blob.type !== attachment.mimeType)
        ) {
          throw new BackupValidationError(
            `Attachment file data is invalid for ${attachment.fileName}.`,
          )
        }
        return {
          attachmentId: attachment.id,
          mimeType: attachment.mimeType,
          base64: arrayBufferToBase64(await blob.arrayBuffer()),
        }
      }),
    )

    if (storedBlobs.length !== attachments.length) {
      throw new BackupValidationError('Orphaned attachment file data was found.')
    }

    const createdAt = new Date().toISOString()
    const data: BackupData = {
      clients,
      pets,
      bookings,
      areas,
      services,
      generalEvents,
      meals,
      attachments,
      attachmentBlobs,
      settings,
    }
    const document: BackupDocument = {
      manifest: {
        backupFormatVersion: BACKUP_FORMAT_VERSION,
        appVersion: APP_VERSION,
        createdAt,
        recordCounts: getCounts(data),
        attachmentCount: attachments.length,
        attachmentBinariesIncluded: true,
      },
      data,
    }
    validateBackupDocument(document)

    return {
      document,
      file: new Blob([JSON.stringify(document)], { type: BACKUP_FILE_TYPE }),
      fileName: `dog-sitting-backup-${createdAt.slice(0, 10)}.json`,
    }
  }

  async markBackupSuccessful(createdAt: string): Promise<AppSettings> {
    const settings = await this.database.settings.get(SETTINGS_PRIMARY_KEY)
    if (settings === undefined) {
      throw new BackupValidationError('App Settings could not be updated.')
    }
    const updatedSettings = { ...settings, lastBackupAt: createdAt }
    await this.database.settings.put(updatedSettings, SETTINGS_PRIMARY_KEY)
    return updatedSettings
  }

  async restore(document: BackupDocument): Promise<void> {
    const validated = validateBackupDocument(document)
    const decodedBlobs = validated.data.attachmentBlobs.map((record) => {
      const attachment = validated.data.attachments.find(
        (item) => item.id === record.attachmentId,
      )
      if (attachment === undefined) {
        throw new BackupValidationError('Backup attachment metadata is missing.')
      }
      return {
        attachmentId: record.attachmentId,
        data: new Blob([base64ToBytes(record.base64)], {
          type: attachment.mimeType,
        }),
      }
    })

    const tables = [
      this.database.clients,
      this.database.pets,
      this.database.bookings,
      this.database.areas,
      this.database.services,
      this.database.generalEvents,
      this.database.meals,
      this.database.attachments,
      this.database.attachmentBlobs,
      this.database.settings,
    ] as const

    await this.database.transaction('rw', [...tables], async () => {
      await Promise.all(tables.map((table) => table.clear()))

      const bulkAdds: Promise<unknown>[] = []
      if (validated.data.clients.length > 0) {
        bulkAdds.push(this.database.clients.bulkAdd(validated.data.clients))
      }
      if (validated.data.pets.length > 0) {
        bulkAdds.push(this.database.pets.bulkAdd(validated.data.pets))
      }
      if (validated.data.bookings.length > 0) {
        bulkAdds.push(this.database.bookings.bulkAdd(validated.data.bookings))
      }
      if (validated.data.areas.length > 0) {
        bulkAdds.push(this.database.areas.bulkAdd(validated.data.areas))
      }
      if (validated.data.services.length > 0) {
        bulkAdds.push(this.database.services.bulkAdd(validated.data.services))
      }
      if (validated.data.generalEvents.length > 0) {
        bulkAdds.push(
          this.database.generalEvents.bulkAdd(validated.data.generalEvents),
        )
      }
      if (validated.data.meals.length > 0) {
        bulkAdds.push(this.database.meals.bulkAdd(validated.data.meals))
      }
      if (validated.data.attachments.length > 0) {
        bulkAdds.push(
          this.database.attachments.bulkAdd(validated.data.attachments),
        )
        bulkAdds.push(this.database.attachmentBlobs.bulkAdd(decodedBlobs))
      }

      await Promise.all(bulkAdds)
      await this.database.settings.put(
        validated.data.settings,
        SETTINGS_PRIMARY_KEY,
      )
    })
  }
}
