import type { Reminder } from '../Types'

export type BrowserNotificationPermission =
  | NotificationPermission
  | 'unsupported'

const shownNotificationIds = new Set<string>()

export function getBrowserNotificationPermission(): BrowserNotificationPermission {
  return 'Notification' in window
    ? window.Notification.permission
    : 'unsupported'
}

export async function requestBrowserNotificationPermission(): Promise<BrowserNotificationPermission> {
  if (!('Notification' in window)) return 'unsupported'
  return window.Notification.requestPermission()
}

export function showBrowserNotifications(reminders: Reminder[]): void {
  if (
    !('Notification' in window) ||
    window.Notification.permission !== 'granted'
  ) {
    return
  }

  reminders.forEach((reminder) => {
    if (!reminder.isDue || shownNotificationIds.has(reminder.id)) return

    try {
      new window.Notification(reminder.title, {
        body: reminder.message,
        tag: reminder.id,
      })
      shownNotificationIds.add(reminder.id)
    } catch (error: unknown) {
      console.error('Failed to show browser notification', error)
    }
  })
}
