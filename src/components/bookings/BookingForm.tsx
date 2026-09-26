import { useMemo, useState, type FormEvent } from 'react'
import type {
  Area,
  Booking,
  BookingStatus,
  Client,
  Pet,
  Service,
} from '../../Types'
import {
  BOOKING_STATUSES,
  type NewEntity,
} from '../../services'

type BookingFormProps = {
  booking?: Booking
  clients: Client[]
  pets: Pet[]
  areas: Area[]
  services: Service[]
  isSaving: boolean
  onCancel: () => void
  onSubmit: (booking: NewEntity<Booking>) => Promise<void>
}

type BookingFormValues = {
  clientId: string
  petIds: string[]
  startDate: string
  endDate: string
  areaId: string
  serviceIds: string[]
  status: BookingStatus
  notes: string
}

function toggleSelection(values: string[], id: string): string[] {
  return values.includes(id)
    ? values.filter((value) => value !== id)
    : [...values, id]
}

function BookingForm({
  booking,
  clients,
  pets,
  areas,
  services,
  isSaving,
  onCancel,
  onSubmit,
}: BookingFormProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [values, setValues] = useState<BookingFormValues>({
    clientId: booking?.clientId ?? '',
    petIds: booking?.petIds ?? [],
    startDate: booking?.startDate ?? '',
    endDate: booking?.endDate ?? '',
    areaId: booking?.areaId ?? '',
    serviceIds: booking?.serviceIds ?? [],
    status: booking?.status ?? 'Tentative',
    notes: booking?.notes ?? '',
  })

  const clientOptions = useMemo(
    () =>
      clients.filter(
        (client) =>
          !client.archived || client.id === booking?.clientId,
      ),
    [booking?.clientId, clients],
  )

  const petOptions = useMemo(
    () =>
      pets.filter(
        (pet) =>
          pet.clientId === values.clientId &&
          (!pet.archived || booking?.petIds.includes(pet.id)),
      ),
    [booking?.petIds, pets, values.clientId],
  )

  const areaOptions = useMemo(
    () =>
      areas.filter(
        (area) => !area.archived || area.id === booking?.areaId,
      ),
    [areas, booking?.areaId],
  )

  const serviceOptions = useMemo(
    () =>
      services.filter(
        (service) =>
          !service.archived || booking?.serviceIds.includes(service.id),
      ),
    [booking?.serviceIds, services],
  )

  const validate = (): string[] => {
    const validationErrors: string[] = []

    if (values.clientId === '') validationErrors.push('Select a client.')
    if (values.petIds.length === 0) validationErrors.push('Select at least one pet.')
    if (values.startDate === '') validationErrors.push('Enter a start date.')
    if (values.endDate === '') validationErrors.push('Enter an end date.')
    if (
      values.startDate !== '' &&
      values.endDate !== '' &&
      values.endDate < values.startDate
    ) {
      validationErrors.push('End date cannot be before start date.')
    }
    if (values.areaId === '') validationErrors.push('Select an area.')
    if (values.serviceIds.length === 0) {
      validationErrors.push('Select at least one service.')
    }
    if (!BOOKING_STATUSES.includes(values.status)) {
      validationErrors.push('Select a valid status.')
    }

    return validationErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validate()

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    void onSubmit({
      clientId: values.clientId,
      petIds: values.petIds,
      startDate: values.startDate,
      endDate: values.endDate,
      areaId: values.areaId,
      serviceIds: values.serviceIds,
      status: values.status,
      notes: values.notes.trim() || undefined,
    })
  }

  return (
    <form className="entity-form booking-form" onSubmit={handleSubmit}>
      <div className="view-heading">
        <div>
          <p className="eyebrow">Booking</p>
          <h2>{booking === undefined ? 'New booking' : 'Edit booking'}</h2>
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
          <strong>Check the booking details:</strong>
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="form-grid">
        <label>
          Client <span aria-hidden="true">*</span>
          <select
            value={values.clientId}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                clientId: event.target.value,
                petIds: [],
              }))
              setErrors([])
            }}
          >
            <option value="">Select a client</option>
            {clientOptions.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}{client.archived ? ' (archived)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Area <span aria-hidden="true">*</span>
          <select
            value={values.areaId}
            onChange={(event) => {
              setValues((current) => ({ ...current, areaId: event.target.value }))
              setErrors([])
            }}
          >
            <option value="">Select an area</option>
            {areaOptions.map((area) => (
              <option key={area.id} value={area.id}>
                {area.name}{area.archived ? ' (archived)' : ''}
              </option>
            ))}
          </select>
        </label>

        <label>
          Start date <span aria-hidden="true">*</span>
          <input
            type="date"
            value={values.startDate}
            onChange={(event) => {
              setValues((current) => ({ ...current, startDate: event.target.value }))
              setErrors([])
            }}
          />
        </label>

        <label>
          End date <span aria-hidden="true">*</span>
          <input
            type="date"
            value={values.endDate}
            onChange={(event) => {
              setValues((current) => ({ ...current, endDate: event.target.value }))
              setErrors([])
            }}
          />
        </label>

        <label>
          Status <span aria-hidden="true">*</span>
          <select
            value={values.status}
            onChange={(event) => {
              setValues((current) => ({
                ...current,
                status: event.target.value as BookingStatus,
              }))
              setErrors([])
            }}
          >
            {BOOKING_STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>

        <fieldset className="choice-group full-width-field">
          <legend>Pets *</legend>
          {values.clientId === '' && <p>Select a client to choose pets.</p>}
          {values.clientId !== '' && petOptions.length === 0 && (
            <p>This client has no active pets.</p>
          )}
          {petOptions.map((pet) => (
            <label key={pet.id}>
              <input
                type="checkbox"
                checked={values.petIds.includes(pet.id)}
                onChange={() => {
                  setValues((current) => ({
                    ...current,
                    petIds: toggleSelection(current.petIds, pet.id),
                  }))
                  setErrors([])
                }}
              />
              {pet.name}{pet.archived ? ' (archived)' : ''}
            </label>
          ))}
        </fieldset>

        <fieldset className="choice-group full-width-field">
          <legend>Services *</legend>
          {serviceOptions.map((service) => (
            <label key={service.id}>
              <input
                type="checkbox"
                checked={values.serviceIds.includes(service.id)}
                onChange={() => {
                  setValues((current) => ({
                    ...current,
                    serviceIds: toggleSelection(current.serviceIds, service.id),
                  }))
                  setErrors([])
                }}
              />
              {service.name}{service.archived ? ' (archived)' : ''}
            </label>
          ))}
        </fieldset>

        <label className="full-width-field">
          Notes
          <textarea
            rows={4}
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save booking'}</button>
      </div>
    </form>
  )
}

export default BookingForm
