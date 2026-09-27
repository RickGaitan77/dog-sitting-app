import { useCallback, useEffect, useMemo, useState } from 'react'
import { getTodayDateString } from '../calendar/calendarDates'
import ServiceForm from './ServiceForm'
import {
  appServices,
  ServiceValidationError,
  type ServiceInput,
} from '../../services'
import type { Service } from '../../Types'

type ServicesManagerProps = {
  onBack: () => void
}

type EditorState =
  | { name: 'closed' }
  | { name: 'create' }
  | { name: 'edit'; service: Service }

function messageForError(error: unknown, fallback: string): string {
  return error instanceof ServiceValidationError ? error.message : fallback
}

function ServicesManager({ onBack }: ServicesManagerProps) {
  const [services, setServices] = useState<Service[]>([])
  const [editor, setEditor] = useState<EditorState>({ name: 'closed' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const activeServices = useMemo(
    () => services.filter((service) => !service.archived),
    [services],
  )
  const archivedServices = useMemo(
    () => services.filter((service) => service.archived),
    [services],
  )

  const loadServices = useCallback(async () => {
    setServices(await appServices.services.getAll())
  }, [])

  useEffect(() => {
    let isCurrent = true
    void appServices.services.getAll()
      .then((storedServices) => {
        if (isCurrent) setServices(storedServices)
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load Services', loadError)
        if (isCurrent) {
          setError('Services could not be loaded. Please try again.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const saveService = async (input: ServiceInput) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const saved = editor.name === 'edit'
        ? await appServices.services.update(editor.service.id, input)
        : await appServices.services.create(input)
      await loadServices()
      setEditor({ name: 'closed' })
      setSuccess(`${saved.name} was saved.`)
    } catch (saveError: unknown) {
      console.error('Failed to save Service', saveError)
      setError(messageForError(
        saveError,
        'The Service could not be saved. Please try again.',
      ))
    } finally {
      setIsSaving(false)
    }
  }

  const moveService = async (serviceId: string, offset: -1 | 1) => {
    const currentIndex = activeServices.findIndex(
      (service) => service.id === serviceId,
    )
    const targetIndex = currentIndex + offset
    if (
      currentIndex < 0 ||
      targetIndex < 0 ||
      targetIndex >= activeServices.length
    ) return
    const reordered = [...activeServices]
    const [movedService] = reordered.splice(currentIndex, 1)
    reordered.splice(targetIndex, 0, movedService)
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      setServices(await appServices.services.reorder(
        reordered.map((service) => service.id),
      ))
      setSuccess('Service order was saved.')
    } catch (reorderError: unknown) {
      console.error('Failed to reorder Services', reorderError)
      setError(messageForError(
        reorderError,
        'The Service order could not be saved. Please try again.',
      ))
    } finally {
      setIsSaving(false)
    }
  }

  const archiveService = async (service: Service) => {
    setError(null)
    setSuccess(null)
    try {
      const today = getTodayDateString()
      const bookings = await appServices.repositories.bookings.getAll()
      const activeBookingCount = bookings.filter(
        (booking) =>
          booking.serviceIds.includes(service.id) &&
          booking.status !== 'Cancelled' &&
          booking.endDate >= today,
      ).length
      const warning = activeBookingCount > 0
        ? ` It is currently used by ${activeBookingCount} active or future booking(s), including recurring instances.`
        : ''
      const confirmed = window.confirm(
        `Archive ${service.name}?${warning} Existing bookings will retain this Service and remain readable.`,
      )
      if (!confirmed) return

      setIsSaving(true)
      await appServices.services.archive(service.id)
      await loadServices()
      setEditor({ name: 'closed' })
      setSuccess(`${service.name} was archived.`)
    } catch (archiveError: unknown) {
      console.error('Failed to archive Service', archiveError)
      setError(messageForError(
        archiveError,
        'The Service could not be archived. Please try again.',
      ))
    } finally {
      setIsSaving(false)
    }
  }

  const restoreService = async (service: Service) => {
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      const restored = await appServices.services.restore(service.id)
      await loadServices()
      setSuccess(`${restored.name} was restored.`)
    } catch (restoreError: unknown) {
      console.error('Failed to restore Service', restoreError)
      setError(messageForError(
        restoreError,
        'The Service could not be restored. Please try again.',
      ))
    } finally {
      setIsSaving(false)
    }
  }

  if (editor.name !== 'closed') {
    return (
      <section className="services-manager">
        <ServiceForm
          service={editor.name === 'edit' ? editor.service : undefined}
          isSaving={isSaving}
          onCancel={() => {
            setEditor({ name: 'closed' })
            setError(null)
          }}
          onSubmit={saveService}
        />
        {error !== null && <p className="error-message" role="alert">{error}</p>}
      </section>
    )
  }

  return (
    <section className="services-manager">
      <div className="view-heading services-manager-heading">
        <div>
          <button className="text-button back-button" type="button" onClick={onBack}>← Settings</button>
          <p className="eyebrow">Scheduling</p>
          <h2>Services</h2>
        </div>
        <button className="primary-button" type="button" onClick={() => setEditor({ name: 'create' })}>Add Service</button>
      </div>

      {error !== null && <p className="error-message" role="alert">{error}</p>}
      {success !== null && <p className="success-message" role="status">{success}</p>}
      {isLoading && <p className="status-message">Loading Services…</p>}

      {!isLoading && activeServices.length === 0 && (
        <div className="empty-state">
          <h3>No active Services</h3>
          <p>Create or restore a Service to use it for new Bookings.</p>
        </div>
      )}

      {!isLoading && activeServices.length > 0 && (
        <div className="service-manager-list" aria-label="Active Services">
          {activeServices.map((service, index) => (
            <article className="service-manager-row" key={service.id}>
              <strong>{service.name}</strong>
              <span className="service-reorder-controls" aria-label={`Reorder ${service.name}`}>
                <button type="button" className="area-order-button" disabled={isSaving || index === 0} onClick={() => void moveService(service.id, -1)} aria-label={`Move ${service.name} up`}>↑</button>
                <button type="button" className="area-order-button" disabled={isSaving || index === activeServices.length - 1} onClick={() => void moveService(service.id, 1)} aria-label={`Move ${service.name} down`}>↓</button>
              </span>
              <button className="text-button" type="button" onClick={() => setEditor({ name: 'edit', service })}>Edit</button>
              <button className="text-button danger-text" type="button" disabled={isSaving} onClick={() => void archiveService(service)}>Archive</button>
            </article>
          ))}
        </div>
      )}

      <section className="archived-services" aria-labelledby="archived-services-title">
        <div className="settings-section-heading">
          <h3 id="archived-services-title">Archived Services</h3>
          <p>Archived Services stay attached to existing Bookings.</p>
        </div>
        {archivedServices.length === 0 ? (
          <p className="muted-note">No archived Services.</p>
        ) : (
          <div className="service-manager-list">
            {archivedServices.map((service) => (
              <article className="service-manager-row archived" key={service.id}>
                <strong>{service.name}</strong>
                <button className="secondary-button" type="button" disabled={isSaving} onClick={() => void restoreService(service)}>Restore</button>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default ServicesManager
