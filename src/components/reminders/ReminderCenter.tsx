import { liveQuery } from 'dexie'
import { useEffect, useState, type CSSProperties } from 'react'
import { getTodayDateString } from '../calendar/calendarDates'
import {
  appServices,
  reminderSettingsEnabled,
  showBrowserNotifications,
} from '../../services'
import type { ReminderSnapshot } from '../../Types'

const DATE_CHECK_INTERVAL_MS = 60_000

function ReminderCenter() {
  const [snapshot, setSnapshot] = useState<ReminderSnapshot | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    const applySnapshot = (nextSnapshot: ReminderSnapshot) => {
      if (!isCurrent) return
      setSnapshot(nextSnapshot)
      setError(null)
      showBrowserNotifications(nextSnapshot.reminders)
    }

    const subscription = liveQuery(() =>
      appServices.reminders.getSnapshot(getTodayDateString()),
    ).subscribe({
      next: applySnapshot,
      error: (loadError: unknown) => {
        console.error('Failed to load reminders', loadError)
        if (isCurrent) {
          setError('Reminders could not be loaded. Your saved data is unchanged.')
        }
      },
    })

    const refreshForDateChange = () => {
      void appServices.reminders
        .getSnapshot(getTodayDateString())
        .then(applySnapshot)
        .catch((loadError: unknown) => {
          console.error('Failed to refresh reminders', loadError)
        })
    }
    const intervalId = window.setInterval(
      refreshForDateChange,
      DATE_CHECK_INTERVAL_MS,
    )
    window.addEventListener('focus', refreshForDateChange)

    return () => {
      isCurrent = false
      subscription.unsubscribe()
      window.clearInterval(intervalId)
      window.removeEventListener('focus', refreshForDateChange)
    }
  }, [])

  if (error !== null) {
    return <p className="error-message reminder-load-error">{error}</p>
  }

  if (snapshot === null) return null

  const settingsEnabled = reminderSettingsEnabled(snapshot.settings)
  const weeklyOverview = snapshot.weeklyOverview

  return (
    <aside className="reminder-center" aria-labelledby="reminder-center-title">
      <div className="reminder-center-heading">
        <div>
          <p className="eyebrow">Today</p>
          <h2 id="reminder-center-title">Reminders</h2>
        </div>
        <span className="reminder-count" aria-label={`${snapshot.reminders.length} reminders due`}>
          {snapshot.reminders.length}
        </span>
      </div>

      {!settingsEnabled && (
        <p className="reminder-empty">Reminder settings are currently off.</p>
      )}

      {settingsEnabled && snapshot.reminders.length === 0 && (
        <p className="reminder-empty">No reminders are due today.</p>
      )}

      {snapshot.reminders.length > 0 && (
        <div className="reminder-list">
          {snapshot.reminders.map((reminder) => (
            <article className="reminder-card" key={reminder.id}>
              <strong>{reminder.title}</strong>
              <span>{reminder.message}</span>
            </article>
          ))}
        </div>
      )}

      {weeklyOverview !== undefined && (
        <section className="weekly-overview" aria-labelledby="weekly-overview-title">
          <div className="weekly-overview-heading">
            <div>
              <p className="eyebrow">Sunday through Saturday</p>
              <h3 id="weekly-overview-title">This week</h3>
            </div>
            <span>{weeklyOverview.startDate} – {weeklyOverview.endDate}</span>
          </div>

          {weeklyOverview.items.length === 0 ? (
            <p className="reminder-empty">Nothing is scheduled this week.</p>
          ) : (
            <div className="weekly-overview-list">
              {weeklyOverview.items.map((item) => {
                const style = item.areaColor === undefined
                  ? undefined
                  : ({ '--overview-color': item.areaColor } as CSSProperties)

                return (
                  <article className={`weekly-overview-item overview-${item.kind}`} style={style} key={item.id}>
                    <span className="weekly-overview-kind">{item.kind}</span>
                    <strong>{item.title}</strong>
                    <span>{item.dateLabel}</span>
                    {item.summary !== undefined && <span>{item.summary}</span>}
                    {item.areaName !== undefined && <span>{item.areaName}</span>}
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </aside>
  )
}

export default ReminderCenter
