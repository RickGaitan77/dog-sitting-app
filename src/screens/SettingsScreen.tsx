import { useEffect, useState } from 'react'
import {
  appServices,
  BACKUP_FORMAT_VERSION,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
  type BrowserNotificationPermission,
} from '../services'
import type { AppSettings } from '../Types'
import AreasManager from '../components/areas/AreasManager'
import ArchivedRecordsView from '../components/settings/ArchivedRecordsView'
import BackupRestoreView from '../components/settings/BackupRestoreView'
import StorageAttachmentsView from '../components/settings/StorageAttachmentsView'
import ServicesManager from '../components/services/ServicesManager'
import UrgencyIndicator from '../components/urgency/UrgencyIndicator'
import { APP_DISPLAY_NAME } from '../config/appMetadata'
import { announceReduceMotionChange } from '../utils/motionPreference'
import { getBackupUrgency } from '../utils/urgency'

type ReminderSettingKey =
  | 'weeklyOverviewEnabled'
  | 'bookingStartReminderEnabled'
  | 'bookingEndReminderEnabled'
  | 'medicationReminderEnabled'
  | 'mealPlanningReminderEnabled'

type ToggleSettingKey = ReminderSettingKey | 'showMealOverlay' | 'reduceMotion'
export type SettingsView =
  | 'settings'
  | 'areas'
  | 'services'
  | 'notifications'
  | 'backup'
  | 'storage'
  | 'archived'

type SettingsScreenProps = {
  view: SettingsView
  onViewChange: (view: SettingsView) => void
}

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

function SettingsScreen({ view, onViewChange }: SettingsScreenProps) {
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

  const updateToggleSetting = async (
    key: ToggleSettingKey,
    enabled: boolean,
  ) => {
    setIsSaving(true)
    setError(null)

    try {
      const updatedSettings = await appServices.settings.update({
        [key]: enabled,
      })
      setSettings(updatedSettings)
      if (key === 'reduceMotion') announceReduceMotionChange(enabled)
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

  if (view === 'areas') {
    return <AreasManager onBack={() => onViewChange('settings')} />
  }

  if (view === 'services') {
    return <ServicesManager onBack={() => onViewChange('settings')} />
  }

  if (view === 'archived') {
    return (
      <ArchivedRecordsView
        onBack={() => onViewChange('settings')}
        onManageAreas={() => onViewChange('areas')}
        onManageServices={() => onViewChange('services')}
      />
    )
  }

  if (view === 'backup' && settings !== null) {
    return (
      <BackupRestoreView
        settings={settings}
        onBack={() => onViewChange('settings')}
        onSettingsChange={setSettings}
      />
    )
  }

  if (view === 'storage') {
    return <StorageAttachmentsView onBack={() => onViewChange('settings')} />
  }

  if (view === 'notifications' && settings !== null) {
    return (
      <section className="settings-subview notifications-settings-view">
        <div className="view-heading">
          <div>
            <button className="text-button back-button" type="button" onClick={() => onViewChange('settings')}>← Settings</button>
            <p className="eyebrow">Scheduling</p>
            <h2>Notifications</h2>
          </div>
        </div>

        {error !== null && <p className="error-message" role="alert">{error}</p>}

        <section className="settings-card" aria-labelledby="reminder-settings-title">
          <div className="settings-section-heading">
            <h3 id="reminder-settings-title">In-app reminders</h3>
            <p>Reminders stay available in the app even without browser permission.</p>
          </div>
          <div className="settings-list">
            {REMINDER_CONTROLS.map((control) => (
              <label className="setting-toggle" key={control.key}>
                <span><strong>{control.title}</strong><small>{control.description}</small></span>
                <input
                  type="checkbox"
                  checked={settings[control.key]}
                  disabled={isSaving}
                  onChange={(event) => void updateToggleSetting(control.key, event.target.checked)}
                />
              </label>
            ))}
          </div>
        </section>

        <section className="settings-card notification-permission-card" aria-labelledby="notification-permission-title">
          <div className="settings-section-heading">
            <h3 id="notification-permission-title">Browser notifications</h3>
            <p>Native reminders are checked when the app opens or resumes. Delivery while fully closed depends on browser and device support and is not guaranteed.</p>
          </div>
          <div className="permission-row">
            <span>Permission: <strong>{permissionLabel(permission)}</strong></span>
            {permission === 'default' && (
              <button className="primary-button" type="button" disabled={isRequestingPermission} onClick={() => void enableBrowserNotifications()}>
                {isRequestingPermission ? 'Requesting…' : 'Enable browser notifications'}
              </button>
            )}
          </div>
          {permission === 'denied' && <p className="permission-note">Permission is denied. In-app reminders will continue to work.</p>}
          {permission === 'unsupported' && <p className="permission-note">This browser does not support native notifications. In-app reminders will continue to work.</p>}
        </section>
      </section>
    )
  }

  const backupUrgency = getBackupUrgency(settings?.lastBackupAt)

  return (
    <section className="settings-screen">
      <div className="view-heading settings-heading">
        <div><h2>Local Settings</h2></div>
      </div>

      {error !== null && <p className="error-message" role="alert">{error}</p>}

      {settings !== null && (
        <>
          <section className="settings-card settings-group-card" aria-labelledby="scheduling-settings-title">
            <div className="settings-section-heading"><h3 id="scheduling-settings-title">Scheduling</h3><p>Calendar setup, Services, and reminder preferences.</p></div>
            <div className="settings-list">
              <button className="settings-link-row" type="button" onClick={() => onViewChange('areas')}><span><strong>Areas &amp; Colors</strong><small>Create, reorder, recolor, archive, or restore scheduling Areas.</small></span><span aria-hidden="true">›</span></button>
              <button className="settings-link-row" type="button" onClick={() => onViewChange('services')}><span><strong>Services</strong><small>Create, reorder, rename, archive, or restore Booking Services.</small></span><span aria-hidden="true">›</span></button>
              <label className="setting-toggle"><span><strong>Calendar Display</strong><small>Show Meals on Calendar, including separate meal and prep dates.</small></span><input type="checkbox" checked={settings.showMealOverlay} disabled={isSaving} onChange={(event) => void updateToggleSetting('showMealOverlay', event.target.checked)} /></label>
              <button className="settings-link-row" type="button" onClick={() => onViewChange('notifications')}><span><strong>Notifications</strong><small>Manage in-app reminders and optional browser notification permission.</small></span><span aria-hidden="true">›</span></button>
            </div>
          </section>

          <section className="settings-card settings-group-card" aria-labelledby="data-settings-title">
            <div className="settings-section-heading"><h3 id="data-settings-title">Data</h3><p>Protect and understand the local information stored on this device.</p></div>
            <div className="settings-list">
              <button className="settings-link-row settings-link-row-prominent" type="button" onClick={() => onViewChange('backup')}>
                <span><strong>Backup &amp; Restore</strong><small>Last Backup: {settings.lastBackupAt === undefined ? 'No backup recorded' : formatBackupDate(settings.lastBackupAt)}</small>{backupUrgency.level > 0 && <UrgencyIndicator level={backupUrgency.level} animate={backupUrgency.animate} icon={backupUrgency.level >= 3 ? '!' : '•'} label={backupUrgency.label} />}</span><span aria-hidden="true">›</span>
              </button>
              <button className="settings-link-row" type="button" onClick={() => onViewChange('storage')}><span><strong>Storage / Attachments</strong><small>View local attachment counts and approximate storage use.</small></span><span aria-hidden="true">›</span></button>
            </div>
          </section>

          <section className="settings-card settings-group-card" aria-labelledby="records-settings-title">
            <div className="settings-section-heading"><h3 id="records-settings-title">Records</h3><p>Review records hidden from normal active lists.</p></div>
            <div className="settings-list"><button className="settings-link-row" type="button" onClick={() => onViewChange('archived')}><span><strong>Archived Records</strong><small>Restore archived Clients and Pets without losing history.</small></span><span aria-hidden="true">›</span></button></div>
          </section>

          <section className="settings-card settings-group-card" aria-labelledby="appearance-settings-title">
            <div className="settings-section-heading"><h3 id="appearance-settings-title">Appearance</h3><p>Choose how visual attention is presented throughout the app.</p></div>
            <div className="settings-list"><label className="setting-toggle"><span><strong>Reduce Motion</strong><small>Keep warning labels and borders visible without pulsing or decorative movement.</small></span><input type="checkbox" checked={settings.reduceMotion} disabled={isSaving} onChange={(event) => void updateToggleSetting('reduceMotion', event.target.checked)} /></label></div>
          </section>

          <section className="settings-card settings-group-card about-settings-card" aria-labelledby="about-settings-title">
            <div className="settings-section-heading"><h3 id="about-settings-title">About</h3><p>Application and local backup compatibility information.</p></div>
            <dl className="about-settings-details"><div><dt>App version</dt><dd>{APP_DISPLAY_NAME}</dd></div><div><dt>Backup format</dt><dd>Version {BACKUP_FORMAT_VERSION}</dd></div></dl>
          </section>
        </>
      )}
    </section>
  )
}

export default SettingsScreen
