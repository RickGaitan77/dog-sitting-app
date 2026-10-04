import { useEffect, useState } from 'react'
import { appServices } from '../../services'
import type { Attachment } from '../../Types'

type StorageAttachmentsViewProps = { onBack: () => void }
type StorageEstimate = { usage?: number; quota?: number }

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined) return 'Unavailable in this browser'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`
}

function StorageAttachmentsView({ onBack }: StorageAttachmentsViewProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [estimate, setEstimate] = useState<StorageEstimate>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    void Promise.all([
      appServices.repositories.attachments.getAll(),
      navigator.storage?.estimate?.() ?? Promise.resolve({}),
    ])
      .then(([storedAttachments, storageEstimate]) => {
        if (!current) return
        setAttachments(storedAttachments)
        setEstimate(storageEstimate)
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load storage information', loadError)
        if (current) setError('Storage information could not be loaded. No local data was changed.')
      })
      .finally(() => { if (current) setIsLoading(false) })
    return () => { current = false }
  }, [])

  const images = attachments.filter((attachment) => attachment.mimeType.startsWith('image/')).length
  const pdfs = attachments.filter((attachment) => attachment.mimeType === 'application/pdf').length
  const otherDocuments = attachments.length - images - pdfs
  const attachmentBytes = attachments.reduce((total, attachment) => total + attachment.fileSize, 0)

  return (
    <section className="settings-subview storage-view">
      <div className="view-heading"><div><button className="text-button back-button" type="button" onClick={onBack}>← Settings</button><p className="eyebrow">Data</p><h2>Storage / Attachments</h2></div></div>
      <p className="settings-view-intro">Data and files stay in this browser on this device. Attachments are managed from their owning Client or Pet record.</p>
      {error !== null && <p className="error-message" role="alert">{error}</p>}
      {isLoading ? <p className="status-message">Reading local storage…</p> : (
        <>
          <section className="settings-card storage-summary-card" aria-label="Attachment storage summary">
            <div className="storage-stat-grid">
              <div><span>Attachments</span><strong>{attachments.length}</strong></div>
              <div><span>Images</span><strong>{images}</strong></div>
              <div><span>PDFs</span><strong>{pdfs}</strong></div>
              <div><span>Other documents</span><strong>{otherDocuments}</strong></div>
              <div><span>Attachment file size</span><strong>{formatBytes(attachmentBytes)}</strong></div>
              <div><span>Approximate origin usage</span><strong>{formatBytes(estimate.usage)}</strong></div>
            </div>
            {estimate.quota !== undefined && <p className="storage-quota-note">Browser-reported storage allowance: approximately {formatBytes(estimate.quota)}.</p>}
          </section>
          {attachments.length === 0 && <p className="compact-settings-empty">No attachments are stored.</p>}
          <p className="storage-safety-note"><strong>No cleanup actions are performed here.</strong> Creating this summary does not open, change, or delete any file.</p>
        </>
      )}
    </section>
  )
}

export default StorageAttachmentsView
