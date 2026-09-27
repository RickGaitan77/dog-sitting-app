import { useEffect, useState } from 'react'
import {
  appServices,
  getBrowserNotificationPermission,
  parseBackupFile,
  requestBrowserNotificationPermission,
  type BackupDocument,
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

function formatBackupDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

type PendingRestore = {
  document: BackupDocument
  fileName: string
}

function SettingsScreen() {
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [permission, setPermission] = useState<BrowserNotificationPermission>(
    getBrowserNotificationPermission,
  )
  const [isSaving, setIsSaving] = useState(false)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [isDataBusy, setIsDataBusy] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null)
  const [backupMessage, setBackupMessage] = useState<string | null>(null)
  const [backupError, setBackupError] = useState<string | null>(null)
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

  const createBackup = async () => {
    setIsDataBusy(true)
    setBackupMessage(null)
    setBackupError(null)

    try {
      const backup = await appServices.backups.createBackup()
      const url = URL.createObjectURL(backup.file)
      const link = document.createElement('a')
      link.href = url
      link.download = backup.fileName
      document.body.append(link)

      try {
        link.click()
      } finally {
        link.remove()
        window.setTimeout(() => URL.revokeObjectURL(url), 0)
      }

      const updatedSettings = await appServices.backups.markBackupSuccessful(
        backup.document.manifest.createdAt,
      )
      setSettings(updatedSettings)
      setBackupMessage(`Backup created: ${backup.fileName}`)
    } catch (backupFailure: unknown) {
      console.error('Failed to create backup', backupFailure)
      setBackupError(
        backupFailure instanceof Error
          ? backupFailure.message
          : 'The backup could not be created. Please try again.',
      )
    } finally {
      setIsDataBusy(false)
    }
  }

  const selectRestoreFile = async (file: File | undefined) => {
    setPendingRestore(null)
    setBackupMessage(null)
    setBackupError(null)
    if (file === undefined) return

    setIsDataBusy(true)
    try {
      const document = await parseBackupFile(file)
      setPendingRestore({ document, fileName: file.name })
      setBackupMessage(`Backup validated: ${file.name}`)
    } catch (validationFailure: unknown) {
      console.error('Failed to validate backup', validationFailure)
      setBackupError(
        validationFailure instanceof Error
          ? validationFailure.message
          : 'The selected file is not a valid backup.',
      )
    } finally {
      setIsDataBusy(false)
    }
  }

  const restoreBackup = async () => {
    if (pendingRestore === null) return

    const confirmed = window.confirm(
      'Restore this backup? All current local app data will be replaced by the selected backup.',
    )
    if (!confirmed) return

    setIsDataBusy(true)
    setBackupMessage(null)
    setBackupError(null)
    try {
      await appServices.backups.restore(pendingRestore.document)
      setBackupMessage('Restore complete. Reloading the app…')
      window.setTimeout(() => window.location.reload(), 800)
    } catch (restoreFailure: unknown) {
      console.error('Failed to restore backup', restoreFailure)
      setBackupError(
        restoreFailure instanceof Error
          ? restoreFailure.message
          : 'The backup could not be restored. Current data was preserved.',
      )
      setIsDataBusy(false)
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

      <section className="settings-card backup-settings-card" aria-labelledby="backup-settings-title">
        <div className="settings-section-heading">
          <h3 id="backup-settings-title">Data &amp; Backup</h3>
          <p>
            Data stays on this device unless you download a backup. Backup files
            contain private client and business information and may include documents
            and images.
          </p>
        </div>

        <div className="backup-actions">
          <button
            className="primary-button"
            type="button"
            disabled={isDataBusy}
            onClick={() => void createBackup()}
          >
            {isDataBusy ? 'Working…' : 'Create Backup'}
          </button>

          <label className={`secondary-button backup-file-button${isDataBusy ? ' disabled' : ''}`}>
            Choose Backup File
            <input
              type="file"
              accept="application/json,.json"
              disabled={isDataBusy}
              onChange={(event) =>
                void selectRestoreFile(event.target.files?.[0])
              }
            />
          </label>

          {pendingRestore !== null && (
            <button
              className="danger-button"
              type="button"
              disabled={isDataBusy}
              onClick={() => void restoreBackup()}
            >
              Restore Backup
            </button>
          )}
        </div>

        <p className="last-backup-note">
          Last successful backup:{' '}
          {settings?.lastBackupAt === undefined
            ? 'No backup recorded'
            : formatBackupDate(settings.lastBackupAt)}
        </p>
        {pendingRestore !== null && (
          <p className="selected-backup-name">
            Selected file: <strong>{pendingRestore.fileName}</strong>
          </p>
        )}
        {backupMessage !== null && (
          <p className="backup-success" role="status">{backupMessage}</p>
        )}
        {backupError !== null && (
          <p className="error-message backup-error" role="alert">{backupError}</p>
        )}
      </section>
    </section>
  )
}

export default SettingsScreen
