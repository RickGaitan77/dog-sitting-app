import type { AppSettings } from '../Types'
import { db, type DogSittingDatabase } from './database'
import {
  createDefaultSettings,
  DEFAULT_AREAS,
  DEFAULT_SERVICES,
  SETTINGS_PRIMARY_KEY,
} from './defaults'

const initializationPromises = new WeakMap<
  DogSittingDatabase,
  Promise<void>
>()

export async function seedDefaults(
  database: DogSittingDatabase,
): Promise<void> {
  await database.transaction(
    'rw',
    [database.settings, database.areas, database.services],
    async () => {
      const currentSettings = await database.settings.get(
        SETTINGS_PRIMARY_KEY,
      )

      if (currentSettings === undefined) {
        await database.settings.add(
          createDefaultSettings(),
          SETTINGS_PRIMARY_KEY,
        )
      } else {
        const settingsWithCurrentDefaults: AppSettings = {
          ...createDefaultSettings(),
          ...currentSettings,
        }

        await database.settings.put(
          settingsWithCurrentDefaults,
          SETTINGS_PRIMARY_KEY,
        )
      }

      const existingAreas = await database.areas.toArray()
      const existingAreaIds = new Set(
        existingAreas.map((area) => area.id),
      )
      const existingAreaNames = new Set(
        existingAreas.map((area) => area.name.trim().toLowerCase()),
      )
      const missingAreas = DEFAULT_AREAS.filter(
        (area) =>
          !existingAreaIds.has(area.id) &&
          !existingAreaNames.has(area.name.toLowerCase()),
      )

      if (missingAreas.length > 0) {
        await database.areas.bulkAdd(
          missingAreas.map((area) => ({ ...area })),
        )
      }

      const existingServices = await database.services.toArray()
      const existingServiceIds = new Set(
        existingServices.map((service) => service.id),
      )
      const existingServiceNames = new Set(
        existingServices.map((service) =>
          service.name.trim().toLowerCase(),
        ),
      )
      const missingServices = DEFAULT_SERVICES.filter(
        (service) =>
          !existingServiceIds.has(service.id) &&
          !existingServiceNames.has(service.name.toLowerCase()),
      )

      if (missingServices.length > 0) {
        await database.services.bulkAdd(
          missingServices.map((service) => ({ ...service })),
        )
      }
    },
  )
}

export function initializeDatabase(
  database: DogSittingDatabase = db,
): Promise<void> {
  const currentInitialization = initializationPromises.get(database)

  if (currentInitialization !== undefined) {
    return currentInitialization
  }

  const initialization = (async () => {
    await database.open()
    await seedDefaults(database)
  })()

  initializationPromises.set(database, initialization)

  void initialization.catch(() => {
    initializationPromises.delete(database)
  })

  return initialization
}
