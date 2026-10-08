import { useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import type { Area, Booking, BookingStatus, Client, Pet, Service } from '../../Types'
import { BOOKING_STATUSES, type AreaInput, type NewEntity, type WeeklyRecurrenceInput } from '../../services'
import { resolveColorHex } from '../../utils/areaColors'
import AreaForm from '../areas/AreaForm'
import BookingClientPicker from './BookingClientPicker'
import BookingDateRangePicker from './BookingDateRangePicker'

type BookingFormProps = {
  booking?: Booking
  bookings: Booking[]
  clients: Client[]
  pets: Pet[]
  areas: Area[]
  services: Service[]
  initialDate?: string
  isSaving: boolean
  onCancel: () => void
  onCreateArea: (input: AreaInput) => Promise<Area>
  onSubmit: (booking: NewEntity<Booking>, recurrence?: WeeklyRecurrenceInput) => Promise<void>
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
  recurrenceMode: 'one-time' | 'weekly'
  recurrenceWeekdays: number[]
  recurrenceEndDate: string
}

const WEEKDAYS = [
  { value: 0, label: 'Sunday' }, { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' }, { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' }, { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
] as const

function toggleSelection(values: string[], id: string): string[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
}

function formatDateOnly(date: string): string {
  if (date === '') return 'Choose dates'
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC', year: 'numeric' })
    .format(new Date(Date.UTC(year, month - 1, day)))
}

function BookingPetThumbnail({ pet }: { pet: Pet }) {
  const [hasError, setHasError] = useState(false)
  if (pet.photoUrl === undefined || hasError) return null
  return <img src={pet.photoUrl} alt="" onError={() => setHasError(true)} />
}

function BookingForm({ booking, bookings, clients, pets, areas, services, initialDate, isSaving, onCancel, onCreateArea, onSubmit }: BookingFormProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [isClientPickerOpen, setIsClientPickerOpen] = useState(false)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false)
  const [isAreaFormOpen, setIsAreaFormOpen] = useState(false)
  const [isAreaSaving, setIsAreaSaving] = useState(false)
  const [areaCreationError, setAreaCreationError] = useState<string | null>(null)
  const [values, setValues] = useState<BookingFormValues>({
    clientId: booking?.clientId ?? '', petIds: booking?.petIds ?? [],
    startDate: booking?.startDate ?? initialDate ?? '', endDate: booking?.endDate ?? initialDate ?? '',
    areaId: booking?.areaId ?? '', serviceIds: booking?.serviceIds ?? [],
    status: booking?.status ?? 'Tentative', notes: booking?.notes ?? '',
    recurrenceMode: 'one-time', recurrenceWeekdays: [], recurrenceEndDate: '',
  })

  const selectedClient = clients.find((client) => client.id === values.clientId)
  const areaById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas])
  const selectedClientPets = useMemo(() => pets
    .filter((pet) => pet.clientId === values.clientId && (!pet.archived || booking?.petIds.includes(pet.id)))
    .sort((left, right) => Number(left.archived) - Number(right.archived) || left.name.localeCompare(right.name)), [booking?.petIds, pets, values.clientId])
  const activeSelectedClientPets = useMemo(() => selectedClientPets.filter((pet) => !pet.archived), [selectedClientPets])
  const areaOptions = useMemo(() => areas
    .filter((area) => !area.archived || area.id === booking?.areaId)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)), [areas, booking?.areaId])
  const serviceOptions = useMemo(() => services
    .filter((service) => !service.archived || booking?.serviceIds.includes(service.id))
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name)), [booking?.serviceIds, services])
  const previousServices = useMemo(() => {
    if (booking !== undefined || values.clientId === '') return []
    const latestBooking = bookings
      .filter((item) => item.clientId === values.clientId && item.status !== 'Cancelled')
      .sort((left, right) => right.startDate.localeCompare(left.startDate) || right.endDate.localeCompare(left.endDate))[0]
    if (latestBooking === undefined) return []
    return serviceOptions.filter((service) => !service.archived && latestBooking.serviceIds.includes(service.id))
  }, [booking, bookings, serviceOptions, values.clientId])
  const statusOptions: BookingStatus[] = booking === undefined ? ['Tentative', 'Confirmed'] : [...BOOKING_STATUSES]

  const chooseClient = (clientId: string) => {
    if (clientId === values.clientId) { setIsClientPickerOpen(false); return }
    const client = clients.find((item) => item.id === clientId)
    const activePets = pets.filter((pet) => pet.clientId === clientId && !pet.archived)
    const clientArea = client?.areaId === undefined ? undefined : areaById.get(client.areaId)
    setValues((current) => ({
      ...current, clientId,
      petIds: booking === undefined && activePets.length === 1 ? [activePets[0].id] : [],
      areaId: clientArea !== undefined && !clientArea.archived ? clientArea.id : '',
    }))
    setErrors([])
    setIsClientPickerOpen(false)
  }

  const validate = (): string[] => {
    const validationErrors: string[] = []
    if (values.clientId === '') validationErrors.push('Select a Client.')
    if (values.petIds.length === 0) validationErrors.push('Select at least one Pet.')
    if (values.startDate === '' || values.endDate === '') validationErrors.push('Choose a complete date range.')
    if (values.startDate !== '' && values.endDate !== '' && values.endDate < values.startDate) validationErrors.push('End date cannot be before start date.')
    if (values.areaId === '') validationErrors.push('Select an Area.')
    if (values.serviceIds.length === 0) validationErrors.push('Select at least one Service.')
    if (!BOOKING_STATUSES.includes(values.status)) validationErrors.push('Select a valid status.')
    if (booking === undefined && values.recurrenceMode === 'weekly' && values.recurrenceWeekdays.length === 0) validationErrors.push('Select at least one recurrence weekday.')
    if (booking === undefined && values.recurrenceMode === 'weekly' && values.recurrenceEndDate === '') validationErrors.push('Enter a recurrence end date.')
    if (booking === undefined && values.recurrenceMode === 'weekly' && values.recurrenceEndDate !== '' && values.startDate !== '' && values.recurrenceEndDate < values.startDate) validationErrors.push('Recurrence end date cannot be before start date.')
    return validationErrors
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors = validate()
    if (validationErrors.length > 0) { setErrors(validationErrors); return }
    setErrors([])
    const input: NewEntity<Booking> = {
      clientId: values.clientId, petIds: values.petIds,
      startDate: values.startDate, endDate: values.endDate,
      areaId: values.areaId, serviceIds: values.serviceIds,
      status: values.status, notes: values.notes.trim() || undefined,
    }
    const recurrence: WeeklyRecurrenceInput | undefined = booking === undefined && values.recurrenceMode === 'weekly'
      ? { frequency: 'weekly', weekdays: values.recurrenceWeekdays, endDate: values.recurrenceEndDate }
      : undefined
    void onSubmit(input, recurrence)
  }

  const createArea = async (input: AreaInput) => {
    setIsAreaSaving(true); setAreaCreationError(null)
    try {
      const area = await onCreateArea(input)
      setValues((current) => ({ ...current, areaId: area.id }))
      setIsAreaFormOpen(false)
    } catch (creationError: unknown) {
      console.error('Failed to create Area from Booking form', creationError)
      setAreaCreationError(creationError instanceof Error ? creationError.message : 'The Area could not be saved. Please try again.')
    } finally { setIsAreaSaving(false) }
  }

  return (
    <>
      <form className="entity-form booking-form booking-entry-form" onSubmit={handleSubmit}>
        <header className="booking-entry-heading">
          <div><p className="eyebrow">Booking</p><h2>{booking === undefined ? 'New booking' : 'Edit booking'}</h2></div>
          <button className="text-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        </header>
        {errors.length > 0 && <div className="error-message validation-summary" role="alert"><strong>Check the booking details:</strong><ul>{errors.map((error) => <li key={error}>{error}</li>)}</ul></div>}

        <div className="booking-entry-sections">
          <section className="booking-entry-section" aria-labelledby="booking-client-heading">
            <div className="booking-entry-section-heading"><span>1</span><h3 id="booking-client-heading">Client</h3><em>Required</em></div>
            {selectedClient === undefined ? <button className="booking-picker-trigger" type="button" onClick={() => setIsClientPickerOpen(true)}>Choose Client</button> : (
              <div className="booking-selected-client" style={{ '--booking-area-color': resolveColorHex(selectedClient.areaId === undefined ? '#a89b96' : areaById.get(selectedClient.areaId)?.color ?? '#a89b96') } as CSSProperties}>
                <div><span><i aria-hidden="true" /><strong>{selectedClient.name}</strong>{selectedClient.archived && <small>Archived</small>}</span><p>{selectedClient.areaId === undefined ? 'No Area' : areaById.get(selectedClient.areaId)?.name ?? 'Unknown Area'}</p><small>{selectedClientPets.map((pet) => pet.name).join(' • ') || 'No active Pets'}</small></div>
                <button className="text-button" type="button" onClick={() => setIsClientPickerOpen(true)}>Change</button>
              </div>
            )}
          </section>

          <section className="booking-entry-section" aria-labelledby="booking-pets-heading">
            <div className="booking-entry-section-heading"><span>2</span><h3 id="booking-pets-heading">Pets</h3><em>Required</em></div>
            {values.clientId === '' && <p className="booking-entry-empty">Choose a Client first.</p>}
            {values.clientId !== '' && selectedClientPets.length === 0 && <p className="booking-entry-empty">This Client has no active Pets.</p>}
            {selectedClientPets.length > 0 && <div className="booking-pet-choices">{selectedClientPets.map((pet) => {
              const selected = values.petIds.includes(pet.id)
              return <label className={`${selected ? 'selected ' : ''}${pet.archived ? 'archived' : ''}`.trim()} key={pet.id}><input type="checkbox" checked={selected} onChange={() => { setValues((current) => ({ ...current, petIds: toggleSelection(current.petIds, pet.id) })); setErrors([]) }} /><BookingPetThumbnail key={pet.photoUrl ?? 'no-photo'} pet={pet} /><span><strong>{pet.name}</strong><small>{[pet.species, pet.breed].filter(Boolean).join(' · ') || 'Details not provided'}{pet.archived ? ' · Archived' : ''}</small></span></label>
            })}</div>}
            {booking === undefined && activeSelectedClientPets.length === 1 && <p className="booking-entry-hint">The only active Pet was selected automatically. You can deselect it if needed.</p>}
          </section>

          <section className="booking-entry-section" aria-labelledby="booking-dates-heading">
            <div className="booking-entry-section-heading"><span>3</span><h3 id="booking-dates-heading">Dates</h3><em>Required</em></div>
            <button className="booking-date-trigger" type="button" onClick={() => setIsDatePickerOpen(true)}><span><small>Start</small><strong>{formatDateOnly(values.startDate)}</strong></span><b aria-hidden="true">→</b><span><small>End</small><strong>{formatDateOnly(values.endDate)}</strong></span></button>
          </section>

          <section className="booking-entry-section" aria-labelledby="booking-area-heading">
            <div className="booking-entry-section-heading"><span>4</span><h3 id="booking-area-heading">Area</h3><em>Required</em></div>
            <div className="booking-area-choices">{areaOptions.map((area) => <label className={`${values.areaId === area.id ? 'selected ' : ''}${area.archived ? 'archived' : ''}`.trim()} key={area.id}><input type="radio" name="booking-area" checked={values.areaId === area.id} onChange={() => { setValues((current) => ({ ...current, areaId: area.id })); setErrors([]) }} /><i style={{ backgroundColor: resolveColorHex(area.color) }} aria-hidden="true" /><span>{area.name}{area.archived ? ' (archived)' : ''}</span></label>)}</div>
            <button className="text-button booking-add-area-button" type="button" onClick={() => { setAreaCreationError(null); setIsAreaFormOpen(true) }}>+ Add New Area</button>
          </section>

          <section className="booking-entry-section" aria-labelledby="booking-services-heading">
            <div className="booking-entry-section-heading"><span>5</span><h3 id="booking-services-heading">Services</h3><em>Required</em></div>
            <div className="booking-service-chips">{serviceOptions.map((service) => <label className={`${values.serviceIds.includes(service.id) ? 'selected ' : ''}${service.archived ? 'archived' : ''}`.trim()} key={service.id}><input type="checkbox" checked={values.serviceIds.includes(service.id)} onChange={() => { setValues((current) => ({ ...current, serviceIds: toggleSelection(current.serviceIds, service.id) })); setErrors([]) }} />{service.name}{service.archived ? ' (archived)' : ''}</label>)}</div>
            {previousServices.length > 0 && <div className="booking-previous-services"><span><small>Previous Services</small><strong>{previousServices.map((service) => service.name).join(' • ')}</strong></span><button className="secondary-button" type="button" onClick={() => setValues((current) => ({ ...current, serviceIds: previousServices.map((service) => service.id) }))}>Use These</button></div>}
          </section>

          <section className="booking-entry-section" aria-labelledby="booking-status-heading">
            <div className="booking-entry-section-heading"><span>6</span><h3 id="booking-status-heading">Status</h3><em>Required</em></div>
            <div className="booking-status-choices">{statusOptions.map((status) => <label className={values.status === status ? 'selected' : undefined} key={status}><input type="radio" name="booking-status" checked={values.status === status} onChange={() => setValues((current) => ({ ...current, status }))} />{status}</label>)}</div>
          </section>

          <section className="booking-entry-section" aria-labelledby="booking-notes-heading">
            <div className="booking-entry-section-heading"><span>7</span><h3 id="booking-notes-heading">Notes</h3><em>Optional</em></div>
            <textarea id="booking-notes" rows={4} value={values.notes} onChange={(event) => setValues((current) => ({ ...current, notes: event.target.value }))} placeholder="Add care or scheduling notes…" />
          </section>

          {booking === undefined && <fieldset className="booking-entry-section booking-recurrence-section"><legend>Recurrence</legend><div className="booking-status-choices"><label className={values.recurrenceMode === 'one-time' ? 'selected' : undefined}><input type="radio" name="recurrence-mode" checked={values.recurrenceMode === 'one-time'} onChange={() => setValues((current) => ({ ...current, recurrenceMode: 'one-time' }))} />One-time</label><label className={values.recurrenceMode === 'weekly' ? 'selected' : undefined}><input type="radio" name="recurrence-mode" checked={values.recurrenceMode === 'weekly'} onChange={() => setValues((current) => ({ ...current, recurrenceMode: 'weekly' }))} />Weekly</label></div>{values.recurrenceMode === 'weekly' && <div className="recurrence-options"><fieldset className="weekday-choices"><legend>Repeat on *</legend><p className="field-hint recurrence-weekday-hint">Choose the day(s) each repeated booking should start. Each occurrence keeps the same duration as the original booking.</p>{WEEKDAYS.map((weekday) => <label key={weekday.value}><input type="checkbox" checked={values.recurrenceWeekdays.includes(weekday.value)} onChange={() => { setValues((current) => ({ ...current, recurrenceWeekdays: current.recurrenceWeekdays.includes(weekday.value) ? current.recurrenceWeekdays.filter((value) => value !== weekday.value) : [...current.recurrenceWeekdays, weekday.value] })); setErrors([]) }} />{weekday.label}</label>)}</fieldset><label className="recurrence-end-field">Recurrence end date *<input type="date" value={values.recurrenceEndDate} onChange={(event) => { setValues((current) => ({ ...current, recurrenceEndDate: event.target.value })); setErrors([]) }} /></label></div>}</fieldset>}
          {booking?.recurrenceSeriesId !== undefined && <p className="recurrence-edit-note">This is one recurring occurrence. Changes apply only to this Booking.</p>}
        </div>

        <footer className="booking-entry-actions"><button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button><button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save Booking'}</button></footer>
      </form>

      {isClientPickerOpen && <BookingClientPicker clients={clients} pets={pets} areas={areas} currentClientId={values.clientId || booking?.clientId} onCancel={() => setIsClientPickerOpen(false)} onSelect={chooseClient} />}
      {isDatePickerOpen && <BookingDateRangePicker startDate={values.startDate} endDate={values.endDate} onCancel={() => setIsDatePickerOpen(false)} onConfirm={(startDate, endDate) => { setValues((current) => ({ ...current, startDate, endDate })); setErrors([]); setIsDatePickerOpen(false) }} />}
      {isAreaFormOpen && <div className="booking-picker-backdrop" role="dialog" aria-modal="true" aria-label="Add New Area"><section className="booking-picker-sheet booking-area-form-sheet"><AreaForm isSaving={isAreaSaving} onCancel={() => { setAreaCreationError(null); setIsAreaFormOpen(false) }} onSubmit={createArea} />{areaCreationError !== null && <p className="error-message" role="alert">{areaCreationError}</p>}</section></div>}
    </>
  )
}

export default BookingForm
