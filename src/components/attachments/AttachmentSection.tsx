import { useCallback, useEffect, useState, type FormEvent } from 'react'
import {
  appServices,
  SUPPORTED_ATTACHMENT_TYPES,
} from '../../services'
import type {
  Attachment,
  AttachmentOwnerType,
} from '../../Types'

type AttachmentSectionProps = {
  emptyTitle?: string
  heading?: string
  ownerId: string
  ownerName: string
  ownerType: AttachmentOwnerType
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatCreatedAt(createdAt: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(createdAt))
}

function AttachmentCard({
  attachment,
  onDelete,
  onFileError,
}: {
  attachment: Attachment
  onDelete: (attachment: Attachment) => void
  onFileError: (message: string) => void
}) {
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const isImage = attachment.mimeType.startsWith('image/')
  const isPdf = attachment.mimeType === 'application/pdf'

  useEffect(() => {
    let isCurrent = true
    let objectUrl: string | null = null

    void appServices.attachments.getFile(attachment.id)
      .then((blob) => {
        if (!isCurrent) return
        objectUrl = URL.createObjectURL(blob)
        setFileUrl(objectUrl)
      })
      .catch((fileError: unknown) => {
        if (!isCurrent) return
        console.error('Failed to read attachment file', fileError)
        onFileError(
          `The stored file for ${attachment.fileName} could not be read.`,
        )
      })

    return () => {
      isCurrent = false
      if (objectUrl !== null) URL.revokeObjectURL(objectUrl)
    }
  }, [attachment.fileName, attachment.id, onFileError])

  return (
    <article className="attachment-card">
      {isImage && fileUrl !== null && (
        <button
          className="attachment-thumbnail-button"
          type="button"
          onClick={() => setIsPreviewOpen(true)}
          aria-label={`View larger preview of ${attachment.fileName}`}
        >
          <img
            className="attachment-thumbnail"
            src={fileUrl}
            alt={`Preview of ${attachment.fileName}`}
          />
        </button>
      )}

      <div className="attachment-card-body">
        <div className="attachment-card-heading">
          <strong>{attachment.fileName}</strong>
          <button
            className="text-button danger-text"
            type="button"
            onClick={() => onDelete(attachment)}
          >
            Remove
          </button>
        </div>
        <p className="attachment-meta">
          {attachment.mimeType} · {formatFileSize(attachment.fileSize)} · {formatCreatedAt(attachment.createdAt)}
        </p>
        {attachment.notes && <p className="attachment-notes">{attachment.notes}</p>}
        {fileUrl === null && <p className="attachment-loading">Loading file…</p>}
        {fileUrl !== null && (
          <div className="attachment-links">
            {isPdf && (
              <a href={fileUrl} target="_blank" rel="noreferrer">Open PDF</a>
            )}
            <a href={fileUrl} download={attachment.fileName}>Download</a>
          </div>
        )}
      </div>

      {isPreviewOpen && fileUrl !== null && (
        <div className="attachment-preview-backdrop" role="dialog" aria-modal="true" aria-label={`Preview of ${attachment.fileName}`}>
          <div className="attachment-preview-dialog">
            <div className="attachment-preview-heading">
              <strong>{attachment.fileName}</strong>
              <button className="secondary-button" type="button" onClick={() => setIsPreviewOpen(false)}>Close</button>
            </div>
            <img src={fileUrl} alt={`Large preview of ${attachment.fileName}`} />
          </div>
        </div>
      )}
    </article>
  )
}

function AttachmentSection({
  emptyTitle,
  heading = 'Attachments',
  ownerId,
  ownerName,
  ownerType,
}: AttachmentSectionProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [fileInputKey, setFileInputKey] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadAttachments = useCallback(async () => {
    const storedAttachments = await appServices.attachments.getByOwner(
      ownerType,
      ownerId,
    )
    setAttachments(storedAttachments)
  }, [ownerId, ownerType])

  const showFileError = useCallback((message: string) => {
    setError(message)
  }, [])

  useEffect(() => {
    let isCurrent = true

    void appServices.attachments.getByOwner(ownerType, ownerId)
      .then((storedAttachments) => {
        if (isCurrent) setAttachments(storedAttachments)
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return
        console.error('Failed to load attachments', loadError)
        setError('Attachments could not be loaded. Please try again.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [ownerId, ownerType])

  const saveAttachment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (selectedFile === null) {
      setError('Choose a file to attach.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await appServices.attachments.create({
        ownerType,
        ownerId,
        file: selectedFile,
        notes,
      })
      await loadAttachments()
      setSelectedFile(null)
      setNotes('')
      setFileInputKey((current) => current + 1)
      setIsAdding(false)
    } catch (saveError: unknown) {
      console.error('Failed to save attachment', saveError)
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The attachment could not be saved. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const deleteAttachment = async (attachment: Attachment) => {
    if (!window.confirm(`Remove ${attachment.fileName}?`)) return

    setIsSaving(true)
    setError(null)

    try {
      await appServices.attachments.delete(attachment.id)
      await loadAttachments()
    } catch (deleteError: unknown) {
      console.error('Failed to delete attachment', deleteError)
      setError('The attachment could not be removed. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="attachment-section" aria-label={`${ownerName} attachments`}>
      <div className="section-heading attachment-section-heading">
        <div>
          <p className="eyebrow">{ownerType} files</p>
          <h3>{heading}</h3>
        </div>
        {!isAdding && (
          <button className="secondary-button" type="button" onClick={() => {
            setError(null)
            setIsAdding(true)
          }}>Add attachment</button>
        )}
      </div>

      {error !== null && <p className="error-message" role="alert">{error}</p>}

      {isAdding && (
        <form className="attachment-form" onSubmit={(event) => void saveAttachment(event)}>
          <label>
            File
            <input
              key={fileInputKey}
              type="file"
              accept={SUPPORTED_ATTACHMENT_TYPES.join(',')}
              onChange={(changeEvent) => {
                setSelectedFile(changeEvent.target.files?.[0] ?? null)
                setError(null)
              }}
            />
          </label>
          <label>
            Notes
            <textarea rows={2} value={notes} onChange={(changeEvent) => setNotes(changeEvent.target.value)} />
          </label>
          <p className="attachment-file-help">JPEG, PNG, WebP, or PDF. Files stay in this browser.</p>
          <div className="form-actions">
            <button className="text-button" type="button" disabled={isSaving} onClick={() => {
              setSelectedFile(null)
              setNotes('')
              setError(null)
              setIsAdding(false)
            }}>Cancel</button>
            <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save attachment'}</button>
          </div>
        </form>
      )}

      {isLoading && <p className="status-message">Loading attachments…</p>}

      {!isLoading && attachments.length === 0 && !isAdding && (
        <div className="empty-state compact-empty-state attachment-empty-state">
          <h3>{emptyTitle ?? `No ${ownerType.toLowerCase()} attachments`}</h3>
          <p>Add a supported file for {ownerName}.</p>
        </div>
      )}

      {!isLoading && attachments.length > 0 && (
        <div className="attachment-list">
          {attachments.map((attachment) => (
            <AttachmentCard
              attachment={attachment}
              onDelete={(item) => void deleteAttachment(item)}
              onFileError={showFileError}
              key={attachment.id}
            />
          ))}
        </div>
      )}
    </section>
  )
}

export default AttachmentSection
