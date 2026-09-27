import { useEffect, useState } from 'react'
import {
  appServices,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  type BrowserNotificationPermission,
} from '../services'
import type { AppSettings } from '../Types'

type ReminderSettingKey =
  | 'weeklyOverviewEnabled'
  | 'bookingStartReminderEnabled'
  | 'bookingEndReminderEnabled'
  | 'medicationReminderEnabled'
  | 'mealPlanningReminderEnabled'

const REMINDER_CONTROLS: ReadonlyArray<{
  key: ReminderSettingKey
  title: string
  description: string
}> = [
  {
    key: 'weeklyOverviewEnabled',
    title: 'Weekly Overview',
    description: 'Show a Sunday summary for the coming week.',
  },
  {
    key: 'bookingStartReminderEnabled',
    title: 'Booking Start Reminders',
    description: 'Remind me when a booking begins today.',
  },
  {
    key: 'bookingEndReminderEnabled',
    title: 'Booking End Reminders',
    description: 'Remind me when a booking ends today.',
  },
  {
    key: 'medicationReminderEnabled',
    title: 'Medication Reminders',
    description: 'Show today’s active bookings that include Medication service.',
  },
  {
    key: 'mealPlanningReminderEnabled',
    title: 'Meal Planning Reminders',
    description: 'Remind me about incomplete meal prep due today.',
  },
]

function permissionLabel(permission: BrowserNotificationPermission): string {
  switch (permission) {
    case 'default':
      return 'Not requested'
    case 'granted':
      return 'Granted'
    case 'denied':
      return 'Denied'
    case 'unsupported':
      return 'Unsupported in this browser'
  }
}

function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [permission, setPermission] = useState<BrowserNotificationPermission>(
    getBrowserNotificationPermission,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCurrent = true

    void appServices.settings
      .get()
      .then((storedSettings) => {
        if (isCurrent) setSettings(storedSettings)
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load settings', loadError)
        if (isCurrent) setError('Settings could not be loaded. Please try again.')
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const updateReminderSetting = async (
    key: ReminderSettingKey,
    enabled: boolean,
  ) => {
    setIsSaving(true)
    setError(null)

    try {
      const updatedSettings = await appServices.settings.update({
        [key]: enabled,
      })
      setSettings(updatedSettings)
    } catch (saveError: unknown) {
      console.error('Failed to update settings', saveError)
      setError('The setting could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const enableBrowserNotifications = async () => {
    setIsRequestingPermission(true)
    setError(null)

    try {
      setPermission(await requestBrowserNotificationPermission())
    } catch (permissionError: unknown) {
      console.error('Failed to request notification permission', permissionError)
      setPermission(getBrowserNotificationPermission())
      setError('Browser notification permission could not be requested.')
    } finally {
      setIsRequestingPermission(false)
    }
  }

  if (settings === null && error === null) {
    return <p className="status-message">Loading settings…</p>
  }

  return (
    <section className="settings-screen">
      <div className="view-heading settings-heading">
        <div>
          <p className="eyebrow">Local preferences</p>
          <h2>Settings</h2>
        </div>
      </div>

      {error !== null && <p className="error-message">{error}</p>}

      {settings !== null && (
        <section className="settings-card" aria-labelledby="reminder-settings-title">
          <div className="settings-section-heading">
            <h3 id="reminder-settings-title">Reminders</h3>
            <p>Reminders stay available in the app even without browser permission.</p>
          </div>

          <div className="settings-list">
            {REMINDER_CONTROLS.map((control) => (
              <label className="setting-toggle" key={control.key}>
                <span>
                  <strong>{control.title}</strong>
                  <small>{control.description}</small>
                </span>
                <input
                  type="checkbox"
                  checked={settings[control.key]}
                  disabled={isSaving}
                  onChange={(event) =>
                    void updateReminderSetting(control.key, event.target.checked)
                  }
                />
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="settings-card notification-permission-card" aria-labelledby="notification-permission-title">
        <div className="settings-section-heading">
          <h3 id="notification-permission-title">Browser notifications</h3>
          <p>
            Optional notifications can appear while this app is running. Closed-app
            delivery requires the later PWA stage.
          </p>
        </div>
        <div className="permission-row">
          <span>Permission: <strong>{permissionLabel(permission)}</strong></span>
          {permission === 'default' && (
            <button
              className="primary-button"
              type="button"
              disabled={isRequestingPermission}
              onClick={() => void enableBrowserNotifications()}
            >
              {isRequestingPermission ? 'Requesting…' : 'Enable browser notifications'}
            </button>
          )}
        </div>
        {permission === 'denied' && (
          <p className="permission-note">
            Permission is denied. In-app reminders will continue to work.
          </p>
        )}
        {permission === 'unsupported' && (
          <p className="permission-note">
            This browser does not support native notifications. In-app reminders
            will continue to work.
          </p>
        )}
      </section>
    </section>
  )
}

export default SettingsScreen
