import { useState } from 'react'
import {
  appServices,
  parseBackupFile,
  type BackupDocument,
} from '../../services'
import type { AppSettings } from '../../Types'
import { getBackupUrgency, urgencyClassName } from '../../utils/urgency'
import UrgencyIndicator from '../urgency/UrgencyIndicator'

type BackupRestoreViewProps = {
  settings: AppSettings
  onBack: () => void
  onSettingsChange: (settings: AppSettings) => void
}

type PendingRestore = {
  document: BackupDocument
  fileName: string
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function BackupRestoreView({ settings, onBack, onSettingsChange }: BackupRestoreViewProps) {
  const [isBusy, setIsBusy] = useState(false)
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(null)
  const [restoreStep, setRestoreStep] = useState<'summary' | 'confirm'>('summary')
  const [fileInputKey, setFileInputKey] = useState(0)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const backupUrgency = getBackupUrgency(settings.lastBackupAt)

  const clearPendingRestore = () => {
    setPendingRestore(null)
    setRestoreStep('summary')
    setFileInputKey((current) => current + 1)
  }

  const createBackup = async () => {
    setIsBusy(true)
    setSuccess(null)
    setError(null)
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
      onSettingsChange(updatedSettings)
      setSuccess(`Backup created successfully: ${backup.fileName}`)
    } catch (backupError: unknown) {
      console.error('Failed to create backup', backupError)
      setError('The backup file could not be created. Existing app data is unchanged. Please try again.')
    } finally {
      setIsBusy(false)
    }
  }

  const selectRestoreFile = async (file: File | undefined) => {
    clearPendingRestore()
    setSuccess(null)
    setError(null)
    if (file === undefined) return
    setIsBusy(true)
    try {
      const document = await parseBackupFile(file)
      setPendingRestore({ document, fileName: file.name })
      setRestoreStep('summary')
      setSuccess('Backup validated. Review the summary before continuing.')
    } catch (validationError: unknown) {
      console.error('Failed to validate backup', validationError)
      setError('This file could not be validated as a supported Dog Sitting App backup. Current app data is unchanged. Choose another backup file and try again.')
    } finally {
      setIsBusy(false)
    }
  }

  const restoreBackup = async () => {
    if (pendingRestore === null || restoreStep !== 'confirm') return
    setIsBusy(true)
    setSuccess(null)
    setError(null)
    try {
      await appServices.backups.restore(pendingRestore.document)
      setSuccess('Restore completed successfully. Reloading restored data…')
      window.setTimeout(() => window.location.reload(), 900)
    } catch (restoreError: unknown) {
      console.error('Failed to restore backup', restoreError)
      setError('The backup could not be restored. The restore transaction was cancelled and current app data remains unchanged. Please verify the file and try again.')
      setIsBusy(false)
    }
  }

  return (
    <section className="settings-subview backup-restore-view">
      <div className="view-heading"><div><button className="text-button back-button" type="button" onClick={onBack}>← Settings</button><p className="eyebrow">Data safety</p><h2>Backup &amp; Restore</h2></div></div>

      <section className={`settings-card backup-status-card ${urgencyClassName(backupUrgency)}`} aria-labelledby="backup-status-title">
        <div className="settings-section-heading"><h3 id="backup-status-title">Backup Status</h3><p>Backups are user-controlled local files. This app does not upload or synchronize them.</p></div>
        <dl className="backup-status-details"><div><dt>Last Backup</dt><dd>{settings.lastBackupAt === undefined ? 'No backup recorded' : formatDateTime(settings.lastBackupAt)}</dd></div></dl>
        {backupUrgency.level > 0 && <UrgencyIndicator level={backupUrgency.level} animate={backupUrgency.animate} icon={backupUrgency.level >= 3 ? '!' : '•'} label={backupUrgency.label} />}
        <button className="primary-button backup-create-button" type="button" disabled={isBusy} onClick={() => void createBackup()}>{isBusy ? 'Working…' : 'Create Backup'}</button>
        <div className="backup-includes"><strong>Backup includes</strong><span>Clients · Pets · Bookings · Meals · Attachments · Settings</span></div>
      </section>

      <section className="settings-card restore-card" aria-labelledby="restore-title">
        <div className="settings-section-heading"><h3 id="restore-title">Restore Backup</h3><p>Choosing a file validates it only. Current data is not changed until after summary review and explicit confirmation.</p></div>
        <label className={`secondary-button backup-file-button${isBusy ? ' disabled' : ''}`}>
          Choose Backup
          <input key={fileInputKey} type="file" accept="application/json,.json" disabled={isBusy} onChange={(event) => void selectRestoreFile(event.target.files?.[0])} />
        </label>

        {success !== null && <p className="backup-success" role="status">{success}</p>}
        {error !== null && <p className="error-message backup-error" role="alert">{error}</p>}

        {pendingRestore !== null && restoreStep === 'summary' && (
          <section className="restore-summary" aria-labelledby="restore-summary-title">
            <div className="settings-section-heading"><h4 id="restore-summary-title">Validated Backup Summary</h4><p>{pendingRestore.fileName}</p></div>
            <dl className="restore-summary-grid">
              <div><dt>Created</dt><dd>{formatDateTime(pendingRestore.document.manifest.createdAt)}</dd></div>
              <div><dt>Backup format</dt><dd>Version {pendingRestore.document.manifest.backupFormatVersion}</dd></div>
              <div><dt>Clients</dt><dd>{pendingRestore.document.manifest.recordCounts.clients}</dd></div>
              <div><dt>Pets</dt><dd>{pendingRestore.document.manifest.recordCounts.pets}</dd></div>
              <div><dt>Bookings</dt><dd>{pendingRestore.document.manifest.recordCounts.bookings}</dd></div>
              <div><dt>Meals</dt><dd>{pendingRestore.document.manifest.recordCounts.meals}</dd></div>
              <div><dt>Attachments</dt><dd>{pendingRestore.document.manifest.recordCounts.attachments}</dd></div>
            </dl>
            <div className="restore-step-actions"><button className="danger-button" type="button" onClick={() => setRestoreStep('confirm')}>Continue to Confirmation</button><button className="text-button" type="button" onClick={clearPendingRestore}>Cancel Restore</button></div>
          </section>
        )}

        {pendingRestore !== null && restoreStep === 'confirm' && (
          <section className="restore-confirmation" role="alert" aria-labelledby="restore-confirmation-title">
            <span className="restore-warning-icon" aria-hidden="true">!</span>
            <div><h4 id="restore-confirmation-title">Replace current application data?</h4><p>Current application data will be replaced by the selected backup, including records, attachments, archive states, and Settings.</p></div>
            <div className="restore-step-actions"><button className="danger-button" type="button" disabled={isBusy} onClick={() => void restoreBackup()}>{isBusy ? 'Restoring…' : 'Replace Current Data'}</button><button className="secondary-button" type="button" disabled={isBusy} onClick={clearPendingRestore}>Cancel Restore</button></div>
          </section>
        )}
      </section>
    </section>
  )
}

export default BackupRestoreView
