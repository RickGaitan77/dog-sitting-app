import type { ReminderSnapshot } from '../Types'
import {
  createReminderStateMessage,
  type NativeReminderNotification,
} from '../pwa/reminderMessages'
import { getServiceWorkerRegistration } from '../pwa/registerServiceWorker'

export type BrowserNotificationPermission =
  | NotificationPermission
  | 'unsupported'

const shownNotificationIds = new Set<string>()
const FALLBACK_DELIVERY_KEY = 'dog-sitting-notification-deliveries'

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  return 'Notification' in window
    ? window.Notification.permission
    : 'unsupported'
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!('Notification' in window)) return 'unsupported'
  return window.Notification.requestPermission()
}

function getFallbackDeliveryIds(date: string): Set<string> {
  try {
    const stored = window.localStorage.getItem(FALLBACK_DELIVERY_KEY)
    if (stored === null) return new Set()
    const value: unknown = JSON.parse(stored)
    if (
      typeof value !== 'object' ||
      value === null ||
      !('date' in value) ||
      value.date !== date ||
      !('ids' in value) ||
      !Array.isArray(value.ids)
    ) {
      return new Set()
    }
    return new Set(value.ids.filter((id): id is string => typeof id === 'string'))
  } catch {
    return new Set()
  }
}

function saveFallbackDeliveryIds(date: string, ids: Set<string>): void {
  try {
    window.localStorage.setItem(
      FALLBACK_DELIVERY_KEY,
      JSON.stringify({ date, ids: Array.from(ids) }),
    )
  } catch {
    // Native notification delivery remains best-effort when storage is unavailable.
  }
}

function showWindowNotifications(
  date: string,
  notifications: NativeReminderNotification[],
): void {
  const deliveredIds = getFallbackDeliveryIds(date)

  notifications.forEach((notification) => {
    if (
      shownNotificationIds.has(notification.id) ||
      deliveredIds.has(notification.id)
    ) {
      return
    }

    try {
      new window.Notification(notification.title, {
        body: notification.body,
        tag: notification.id,
      })
      shownNotificationIds.add(notification.id)
      deliveredIds.add(notification.id)
    } catch (error: unknown) {
      console.error('Failed to show browser notification', error)
    }
  })

  saveFallbackDeliveryIds(date, deliveredIds)
}

export async function showBrowserNotifications(
  snapshot: ReminderSnapshot,
): Promise<void> {
  if (
    !('Notification' in window) ||
    window.Notification.permission !== 'granted'
  ) {
    return
  }

  const message = createReminderStateMessage(snapshot)
  if (message.notifications.length === 0) return

  const registration = await getServiceWorkerRegistration()
  const worker = registration?.waiting ?? registration?.active
  if (worker !== null && worker !== undefined) {
    worker.postMessage(message)
    return
  }

  showWindowNotifications(snapshot.date, message.notifications)
}
