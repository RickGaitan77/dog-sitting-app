export const DATABASE_NAME = 'dog-sitting-app'

export const DATABASE_VERSION = 2

export const STORES = {
  clients: 'clients',
  pets: 'pets',
  bookings: 'bookings',
  areas: 'areas',
  services: 'services',
  generalEvents: 'generalEvents',
  meals: 'meals',
  attachments: 'attachments',
  settings: 'settings',
} as const

export const STORE_SCHEMA_VERSION_1 = {
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
} as const

export const STORE_SCHEMA = {
  [STORES.clients]: 'id, name, areaId',
  [STORES.pets]: 'id, clientId, name',
  [STORES.bookings]:
    'id, clientId, startDate, endDate, areaId, status, *petIds, *serviceIds',
  [STORES.areas]: 'id, name, sortOrder',
  [STORES.services]: 'id, name, sortOrder',
  [STORES.generalEvents]:
    'id, title, startDate, endDate, areaId',
  [STORES.meals]: 'id, date, prepDate',
  [STORES.attachments]:
    'id, ownerType, ownerId, [ownerType+ownerId], createdAt',
  [STORES.settings]: '',
} as const
