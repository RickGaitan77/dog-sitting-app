const CACHE_NAME = 'dog-sitting-shell-v2'
const REMINDER_DELIVERY_CACHE = 'dog-sitting-reminder-delivery-v1'
const REMINDER_STATE_MESSAGE_TYPE = 'DOG_SITTING_REMINDER_STATE'
const APP_SHELL_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png',
  '/pwa/icon-maskable-192.png',
  '/pwa/icon-maskable-512.png',
]
const CACHEABLE_DESTINATIONS = new Set([
  'document',
  'script',
  'style',
  'image',
  'font',
  'manifest',
])
let reminderMessageQueue = Promise.resolve()

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS)),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) =>
              cacheName.startsWith('dog-sitting-shell-') &&
              cacheName !== CACHE_NAME,
            )
            .map((cacheName) => caches.delete(cacheName)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

async function handleNavigation(request) {
  try {
    const response = await fetch(request)
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME)
      await cache.put('/index.html', response.clone())
    }
    return response
  } catch {
    return (
      (await caches.match('/index.html')) ??
      (await caches.match('/')) ??
      Response.error()
    )
  }
}

async function handleStaticAsset(request) {
  const cachedResponse = await caches.match(request)
  if (cachedResponse !== undefined) return cachedResponse

  const response = await fetch(request)
  if (response.ok) {
    const cache = await caches.open(CACHE_NAME)
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  if (request.method !== 'GET' || url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request))
    return
  }

  if (CACHEABLE_DESTINATIONS.has(request.destination)) {
    event.respondWith(handleStaticAsset(request))
  }
})

function isReminderStateMessage(value) {
  return (
    typeof value === 'object' &&
    value !== null &&
    value.type === REMINDER_STATE_MESSAGE_TYPE &&
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    Array.isArray(value.notifications) &&
    value.notifications.every(
      (notification) =>
        typeof notification === 'object' &&
        notification !== null &&
        typeof notification.id === 'string' &&
        notification.id !== '' &&
        typeof notification.title === 'string' &&
        typeof notification.body === 'string' &&
        notification.date === value.date,
    )
  )
}

function deliveryRequest(reminderId) {
  return new Request(
    `${self.location.origin}/__dog-sitting-reminder-delivery/${encodeURIComponent(reminderId)}`,
  )
}

async function pruneOldReminderDeliveries(cache, date) {
  const requests = await cache.keys()

  await Promise.all(
    requests.map(async (request) => {
      const response = await cache.match(request)
      if (response?.headers.get('X-Reminder-Date') !== date) {
        await cache.delete(request)
      }
    }),
  )
}

async function deliverReminderState(message) {
  const cache = await caches.open(REMINDER_DELIVERY_CACHE)
  await pruneOldReminderDeliveries(cache, message.date)

  for (const notification of message.notifications) {
    const request = deliveryRequest(notification.id)
    if ((await cache.match(request)) !== undefined) continue

    await cache.put(
      request,
      new Response('', {
        headers: { 'X-Reminder-Date': notification.date },
      }),
    )

    try {
      await self.registration.showNotification(notification.title, {
        body: notification.body,
        tag: notification.id,
        icon: '/pwa/icon-192.png',
        badge: '/pwa/icon-192.png',
        renotify: false,
        data: { url: '/' },
      })
    } catch (error) {
      await cache.delete(request)
      console.error('Failed to deliver reminder notification', error)
    }
  }
}

self.addEventListener('message', (event) => {
  if (!isReminderStateMessage(event.data)) return

  reminderMessageQueue = reminderMessageQueue
    .then(() => deliverReminderState(event.data))
    .catch((error) => {
      console.error('Failed to process reminder state', error)
    })
  event.waitUntil(reminderMessageQueue)
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = new URL(event.notification.data?.url ?? '/', self.location.origin)

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        const existingClient = windowClients.find(
          (client) => new URL(client.url).origin === targetUrl.origin,
        )

        if (existingClient !== undefined) return existingClient.focus()
        return self.clients.openWindow(targetUrl.href)
      }),
  )
})
