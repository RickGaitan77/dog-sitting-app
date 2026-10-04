import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { getTodayDateString } from '../calendar/calendarDates'
import AreaForm from './AreaForm'
import {
  appServices,
  AreaValidationError,
  type AreaInput,
} from '../../services'
import type { Area } from '../../Types'
import {
  getAreaColorDisplayName,
  getReadableTextColor,
  resolveColorHex,
} from '../../utils/areaColors'

type AreasManagerProps = {
  onBack: () => void
}

type EditorState =
  | { name: 'closed' }
  | { name: 'create' }
  | { name: 'edit'; area: Area }

function messageForError(error: unknown, fallback: string): string {
  return error instanceof AreaValidationError ? error.message : fallback
}

function AreasManager({ onBack }: AreasManagerProps) {
  const [areas, setAreas] = useState<Area[]>([])
  const [editor, setEditor] = useState<EditorState>({ name: 'closed' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const activeAreas = useMemo(
    () => areas.filter((area) => !area.archived),
    [areas],
  )
  const archivedAreas = useMemo(
    () => areas.filter((area) => area.archived),
    [areas],
  )

  const loadAreas = useCallback(async () => {
    setAreas(await appServices.areas.getAll())
  }, [])

  useEffect(() => {
    let isCurrent = true
    void appServices.areas.getAll()
      .then((storedAreas) => {
        if (isCurrent) setAreas(storedAreas)
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load Areas', loadError)
        if (isCurrent) setError('Areas could not be loaded. Please try again.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const saveArea = async (input: AreaInput) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const saved = editor.name === 'edit'
        ? await appServices.areas.update(editor.area.id, input)
        : await appServices.areas.create(input)
      await loadAreas()
      setEditor({ name: 'closed' })
      setSuccess(`${saved.name} was saved.`)
    } catch (saveError: unknown) {
      console.error('Failed to save Area', saveError)
      setError(messageForError(saveError, 'The Area could not be saved. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const moveArea = async (areaId: string, offset: -1 | 1) => {
    const currentIndex = activeAreas.findIndex((area) => area.id === areaId)
    const targetIndex = currentIndex + offset
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= activeAreas.length) return
    const reordered = [...activeAreas]
    const [movedArea] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, movedArea)
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      setAreas(await appServices.areas.reorder(reordered.map((area) => area.id)))
      setSuccess('Area order was saved.')
    } catch (reorderError: unknown) {
      console.error('Failed to reorder Areas', reorderError)
      setError(messageForError(reorderError, 'The Area order could not be saved. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const archiveArea = async (area: Area) => {
    setError(null)
    setSuccess(null)
    try {
      const today = getTodayDateString()
      const [clients, bookings, events] = await Promise.all([
        appServices.repositories.clients.getAll(),
        appServices.repositories.bookings.getAll(),
        appServices.repositories.generalEvents.getAll(),
      ])
      const clientCount = clients.filter((client) => client.areaId === area.id).length
      const activeBookingCount = bookings.filter(
        (booking) =>
          booking.areaId === area.id &&
          booking.status !== 'Cancelled' &&
          booking.endDate >= today,
      ).length
      const futureEventCount = events.filter(
        (event) => event.areaId === area.id && event.endDate >= today,
      ).length
      const referenceWarning = clientCount + activeBookingCount + futureEventCount > 0
        ? ` It is currently used by ${clientCount} client(s), ${activeBookingCount} active or future booking(s), and ${futureEventCount} current or future event(s).`
        : ''
      const confirmed = window.confirm(
        `Archive ${area.name}?${referenceWarning} Existing records will remain associated with this Area and keep its name and color.`,
      )
      if (!confirmed) return

      setIsSaving(true)
      await appServices.areas.archive(area.id)
      await loadAreas()
      setEditor({ name: 'closed' })
      setSuccess(`${area.name} was archived.`)
    } catch (archiveError: unknown) {
      console.error('Failed to archive Area', archiveError)
      setError(messageForError(archiveError, 'The Area could not be archived. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  const restoreArea = async (area: Area) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const restored = await appServices.areas.restore(area.id)
      await loadAreas()
      setSuccess(`${restored.name} was restored.`)
    } catch (restoreError: unknown) {
      console.error('Failed to restore Area', restoreError)
      setError(messageForError(restoreError, 'The Area could not be restored. Please try again.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (editor.name !== 'closed') {
    return (
      <section className="areas-manager">
        <AreaForm
          area={editor.name === 'edit' ? editor.area : undefined}
          isSaving={isSaving}
          onCancel={() => {
            setEditor({ name: 'closed' })
            setError(null)
          }}
          onSubmit={saveArea}
        />
        {error !== null && <p className="error-message" role="alert">{error}</p>}
      </section>
    )
  }

  return (
    <section className="areas-manager">
      <div className="view-heading areas-manager-heading">
        <div>
          <button className="text-button back-button" type="button" onClick={onBack}>← Settings</button>
          <p className="eyebrow">Scheduling</p>
          <h2>Areas &amp; Colors</h2>
        </div>
        <button className="primary-button" type="button" onClick={() => setEditor({ name: 'create' })}>Add Area</button>
      </div>

      {error !== null && <p className="error-message" role="alert">{error}</p>}
      {success !== null && <p className="success-message" role="status">{success}</p>}
      {isLoading && <p className="status-message">Loading Areas…</p>}

      {!isLoading && activeAreas.length === 0 && (
        <div className="empty-state">
          <h3>No active Areas</h3>
          <p>Create or restore an Area to use it in scheduling forms.</p>
        </div>
      )}

      {!isLoading && activeAreas.length > 0 && (
        <div className="area-manager-list" aria-label="Active Areas">
          {activeAreas.map((area, index) => {
            const colorStyle = {
              backgroundColor: resolveColorHex(area.color),
              color: getReadableTextColor(area.color),
            } as CSSProperties
            return (
              <article className="area-manager-row" key={area.id}>
                <span className="area-manager-swatch" style={colorStyle} aria-hidden="true" />
                <span className="area-manager-identity">
                  <strong>{area.name}</strong>
                  <small>{getAreaColorDisplayName(area.color)}</small>
                </span>
                <span className="area-reorder-controls" aria-label={`Reorder ${area.name}`}>
                  <button type="button" className="area-order-button" disabled={isSaving || index === 0} onClick={() => void moveArea(area.id, -1)} aria-label={`Move ${area.name} up`}>↑</button>
                  <button type="button" className="area-order-button" disabled={isSaving || index === activeAreas.length - 1} onClick={() => void moveArea(area.id, 1)} aria-label={`Move ${area.name} down`}>↓</button>
                </span>
                <button className="text-button" type="button" onClick={() => setEditor({ name: 'edit', area })}>Edit</button>
                <button className="text-button danger-text" type="button" disabled={isSaving} onClick={() => void archiveArea(area)}>Archive</button>
              </article>
            )
          })}
        </div>
      )}

      <section className="archived-areas" aria-labelledby="archived-areas-title">
        <div className="settings-section-heading">
          <h3 id="archived-areas-title">Archived Areas</h3>
          <p>Archived Areas stay attached to existing records.</p>
        </div>
        {archivedAreas.length === 0 ? (
          <p className="muted-note">No archived Areas.</p>
        ) : (
          <div className="area-manager-list">
            {archivedAreas.map((area) => (
              <article className="area-manager-row archived" key={area.id}>
                <span className="area-manager-swatch" style={{ backgroundColor: resolveColorHex(area.color), color: getReadableTextColor(area.color) }} aria-hidden="true" />
                <span className="area-manager-identity"><strong>{area.name}</strong><small>{getAreaColorDisplayName(area.color)}</small></span>
                <button className="secondary-button" type="button" disabled={isSaving} onClick={() => void restoreArea(area)}>Restore</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default AreasManager
