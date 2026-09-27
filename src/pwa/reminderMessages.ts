import type { ReminderSnapshot } from '../Types'

export const REMINDER_STATE_MESSAGE_TYPE = 'DOG_SITTING_REMINDER_STATE'

export type NativeReminderNotification = {
  id: string
  title: string
  body: string
  date: string
}

export type ReminderStateMessage = {
  type: typeof REMINDER_STATE_MESSAGE_TYPE
  date: string
  notifications: NativeReminderNotification[]
}

export function createReminderStateMessage(
  snapshot: ReminderSnapshot,
): ReminderStateMessage {
  const notifications: NativeReminderNotification[] = snapshot.reminders
    .filter(
      (reminder) =>
        reminder.isDue && reminder.relevantDate === snapshot.date,
    )
    .map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      body: reminder.message,
      date: snapshot.date,
    }))

  if (snapshot.weeklyOverview !== undefined) {
    const itemCount = snapshot.weeklyOverview.items.length
    notifications.push({
      id: `weekly-overview:weekly:${snapshot.date}`,
      title: 'Your week at a glance',
      body:
        itemCount === 0
          ? 'Nothing is scheduled Sunday through Saturday.'
          : `${itemCount} ${itemCount === 1 ? 'item is' : 'items are'} scheduled Sunday through Saturday.`,
      date: snapshot.date,
    })
  }

  return {
    type: REMINDER_STATE_MESSAGE_TYPE,
    date: snapshot.date,
    notifications,
  }
}
