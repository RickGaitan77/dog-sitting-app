import { useMemo, useState, type FormEvent } from 'react'
import type { Area, GeneralEvent } from '../../Types'
import type { NewEntity } from '../../services'

type GeneralEventFormProps = {
  areas: Area[]
  event?: GeneralEvent
  isSaving: boolean
  onCancel: () => void
  onSubmit: (event: NewEntity<GeneralEvent>) => Promise<void>
}

type GeneralEventFormValues = {
  title: string
  startDate: string
  endDate: string
  areaId: string
  notes: string
}

function GeneralEventForm({
  areas,
  event,
  isSaving,
  onCancel,
  onSubmit,
}: GeneralEventFormProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [values, setValues] = useState<GeneralEventFormValues>({
    title: event?.title ?? '',
    startDate: event?.startDate ?? '',
    endDate: event?.endDate ?? '',
    areaId: event?.areaId ?? '',
    notes: event?.notes ?? '',
  })
  const areaOptions = useMemo(
    () =>
      areas.filter(
        (area) => !area.archived || area.id === event?.areaId,
      ),
    [areas, event?.areaId],
  )

  const validate = (): string[] => {
    const validationErrors: string[] = []

    if (values.title.trim() === '') validationErrors.push('Enter a title.')
    if (values.startDate === '') validationErrors.push('Enter a start date.')
    if (values.endDate === '') validationErrors.push('Enter an end date.')
    if (
      values.startDate !== '' &&
      values.endDate !== '' &&
      values.endDate < values.startDate
    ) {
      validationErrors.push('End date cannot be before start date.')
    }

    return validationErrors
  }

  const handleSubmit = (formEvent: FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault()
    const validationErrors = validate()

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    void onSubmit({
      title: values.title.trim(),
      startDate: values.startDate,
      endDate: values.endDate,
      areaId: values.areaId || undefined,
      notes: values.notes.trim() || undefined,
    })
  }

  return (
    <form className="entity-form event-form" onSubmit={handleSubmit}>
      <div className="view-heading">
        <div>
          <p className="eyebrow">General event</p>
          <h2>{event === undefined ? 'New event' : 'Edit event'}</h2>
        </div>
        <button
          className="text-button"
          type="button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>

      {errors.length > 0 && (
        <div className="error-message validation-summary" role="alert">
          <strong>Check the event details:</strong>
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="form-grid">
        <label className="full-width-field">
          Title <span aria-hidden="true">*</span>
          <input
            value={values.title}
            onChange={(changeEvent) => {
              setValues((current) => ({
                ...current,
                title: changeEvent.target.value,
              }))
              setErrors([])
            }}
          />
        </label>

        <label>
          Start date <span aria-hidden="true">*</span>
          <input
            type="date"
            value={values.startDate}
            onChange={(changeEvent) => {
              setValues((current) => ({
                ...current,
                startDate: changeEvent.target.value,
              }))
              setErrors([])
            }}
          />
        </label>

        <label>
          End date <span aria-hidden="true">*</span>
          <input
            type="date"
            value={values.endDate}
            onChange={(changeEvent) => {
              setValues((current) => ({
                ...current,
                endDate: changeEvent.target.value,
              }))
              setErrors([])
            }}
          />
        </label>

        <label className="full-width-field">
          Area
          <select
            value={values.areaId}
            onChange={(changeEvent) => {
              setValues((current) => ({
                ...current,
                areaId: changeEvent.target.value,
              }))
              setErrors([])
            }}
          >
            <option value="">No area</option>
            {areaOptions.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}{area.archived ? ' (archived)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="full-width-field">
          Notes
          <textarea
            rows={4}
            value={values.notes}
            onChange={(changeEvent) =>
              setValues((current) => ({
                ...current,
                notes: changeEvent.target.value,
              }))
            }
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save event'}</button>
      </div>
    </form>
  )
}

export default GeneralEventForm
