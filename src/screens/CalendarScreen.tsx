import { useCallback, useEffect, useMemo, useState } from 'react'
import BookingForm from '../components/bookings/BookingForm'
import MonthCalendar from '../components/calendar/MonthCalendar'
import {
  getCurrentMonth,
  moveMonth,
} from '../components/calendar/calendarDates'
import {
  appServices,
  BOOKING_STATUSES,
  type NewEntity,
} from '../services'
import type {
  Area,
  Booking,
  BookingStatus,
  Client,
  Pet,
  Service,
} from '../Types'

type CalendarScreenProps = {
  bookingCreationRequested: boolean
  onBookingCreationHandled: () => void
}

type BookingView =
  | { name: 'month' }
  | { name: 'manage' }
  | { name: 'create'; returnTo: BookingReturnView }
  | { name: 'detail'; bookingId: string; returnTo: BookingReturnView }
  | { name: 'edit'; bookingId: string; returnTo: BookingReturnView }

type BookingReturnView = 'month' | 'manage'

function getReturnView(name: BookingReturnView): BookingView {
  return name === 'month' ? { name: 'month' } : { name: 'manage' }
}

function CalendarScreen({
  bookingCreationRequested,
  onBookingCreationHandled,
}: CalendarScreenProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [view, setView] = useState<BookingView>({ name: 'month' })
  const [displayedMonth, setDisplayedMonth] = useState(getCurrentMonth)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clientById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )
  const petById = useMemo(
    () => new Map(pets.map((pet) => [pet.id, pet])),
    [pets],
  )
  const areaById = useMemo(
    () => new Map(areas.map((area) => [area.id, area])),
    [areas],
  )
  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  )

  const loadBookings = useCallback(async () => {
    const storedBookings = await appServices.bookings.getAll()
    setBookings(
      storedBookings.sort(
        (left, right) =>
          left.startDate.localeCompare(right.startDate) ||
          left.endDate.localeCompare(right.endDate),
      ),
    )
  }, [])

  useEffect(() => {
    let isCurrent = true

    void Promise.all([
      appServices.bookings.getAll(),
      appServices.repositories.clients.getAll(),
      appServices.repositories.pets.getAll(),
      appServices.repositories.areas.getAll(),
      appServices.repositories.services.getAll(),
    ])
      .then(([
        storedBookings,
        storedClients,
        storedPets,
        storedAreas,
        storedServices,
      ]) => {
        if (!isCurrent) return

        setBookings(
          storedBookings.sort((left, right) =>
            left.startDate.localeCompare(right.startDate),
          ),
        )
        setClients(storedClients)
        setPets(storedPets)
        setAreas(storedAreas)
        setServices(storedServices)
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          console.error('Failed to load bookings', loadError)
          setError('Bookings could not be loaded. Please try again.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const effectiveView: BookingView = bookingCreationRequested
    ? { name: 'create', returnTo: 'month' }
    : view

  const selectedBooking =
    effectiveView.name === 'detail' || effectiveView.name === 'edit'
      ? bookings.find((booking) => booking.id === effectiveView.bookingId)
      : undefined

  const closeBookingForm = () => {
    setError(null)
    if (effectiveView.name === 'create' || effectiveView.name === 'edit') {
      setView(getReturnView(effectiveView.returnTo))
    }
    if (bookingCreationRequested) onBookingCreationHandled()
  }

  const saveBooking = async (input: NewEntity<Booking>) => {
    setIsSaving(true)
    setError(null)

    try {
      const savedBooking =
        effectiveView.name === 'edit' && selectedBooking !== undefined
          ? await appServices.bookings.update(selectedBooking.id, input)
          : await appServices.bookings.create(input)

      await loadBookings()
      const returnTo =
        effectiveView.name === 'create' || effectiveView.name === 'edit'
          ? effectiveView.returnTo
          : 'month'
      setView({ name: 'detail', bookingId: savedBooking.id, returnTo })
      if (bookingCreationRequested) onBookingCreationHandled()
    } catch (saveError: unknown) {
      console.error('Failed to save booking', saveError)
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The booking could not be saved. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const changeStatus = async (
    booking: Booking,
    status: BookingStatus,
  ) => {
    setIsSaving(true)
    setError(null)

    try {
      await appServices.bookings.update(booking.id, { status })
      await loadBookings()
    } catch (statusError: unknown) {
      console.error('Failed to update booking status', statusError)
      setError('The booking status could not be updated. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const cancelBooking = async (booking: Booking) => {
    if (!window.confirm('Cancel this booking? The booking will be kept in history.')) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await appServices.bookings.cancel(booking.id)
      await loadBookings()
    } catch (cancelError: unknown) {
      console.error('Failed to cancel booking', cancelError)
      setError('The booking could not be cancelled. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p className="status-message">Loading bookings…</p>
  }

  if (effectiveView.name === 'create' || effectiveView.name === 'edit') {
    return (
      <section className="booking-screen">
        {error !== null && <p className="error-message">{error}</p>}
        <BookingForm
          key={selectedBooking?.id ?? 'new-booking'}
          booking={selectedBooking}
          clients={clients}
          pets={pets}
          areas={areas}
          services={services}
          isSaving={isSaving}
          onCancel={closeBookingForm}
          onSubmit={saveBooking}
        />
      </section>
    )
  }

  if (effectiveView.name === 'detail' && selectedBooking !== undefined) {
    const client = clientById.get(selectedBooking.clientId)
    const area = areaById.get(selectedBooking.areaId)
    const bookingPets = selectedBooking.petIds.map((id) => petById.get(id))
    const bookingServices = selectedBooking.serviceIds.map((id) => serviceById.get(id))
    const backLabel =
      effectiveView.returnTo === 'month' ? 'Calendar' : 'All bookings'

    return (
      <section className="booking-screen">
        <div className="view-heading">
          <div>
            <button className="text-button back-button" type="button" onClick={() => setView(getReturnView(effectiveView.returnTo))}>← {backLabel}</button>
            <p className="eyebrow">Booking</p>
            <h2>{client?.name ?? 'Unknown client'}</h2>
          </div>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => setView({ name: 'edit', bookingId: selectedBooking.id, returnTo: effectiveView.returnTo })}>Edit</button>
            <button className="danger-button" type="button" disabled={isSaving || selectedBooking.status === 'Cancelled'} onClick={() => void cancelBooking(selectedBooking)}>Cancel booking</button>
          </div>
        </div>

        {error !== null && <p className="error-message">{error}</p>}

        <div className="detail-card booking-details">
          <div><span>Client</span><p>{client?.name ?? 'Unknown client'}{client?.archived ? ' (archived)' : ''}</p></div>
          <div><span>Pets</span><p>{bookingPets.map((pet) => pet?.name ?? 'Unknown pet').join(', ')}</p></div>
          <div><span>Dates</span><p>{selectedBooking.startDate} to {selectedBooking.endDate}</p></div>
          <div><span>Area</span><p>{area?.name ?? 'Unknown area'}</p></div>
          <div><span>Services</span><p>{bookingServices.map((service) => service?.name ?? 'Unknown service').join(', ')}</p></div>
          <label className="status-editor">
            Status
            <select
              value={selectedBooking.status}
              disabled={isSaving}
              onChange={(event) => void changeStatus(selectedBooking, event.target.value as BookingStatus)}
            >
              {BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </label>
          <div className="detail-wide"><span>Notes</span><p>{selectedBooking.notes || 'Not provided'}</p></div>
        </div>
      </section>
    )
  }

  if (effectiveView.name === 'month') {
    return (
      <section className="calendar-screen">
        <div className="calendar-actions">
          <button
            className="secondary-button"
            type="button"
            onClick={() => setView({ name: 'manage' })}
          >
            Manage bookings
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => setView({ name: 'create', returnTo: 'month' })}
          >
            Add booking
          </button>
        </div>

        {error !== null && <p className="error-message">{error}</p>}

        <MonthCalendar
          month={displayedMonth}
          bookings={bookings}
          clients={clients}
          pets={pets}
          areas={areas}
          services={services}
          onPreviousMonth={() =>
            setDisplayedMonth((current) => moveMonth(current, -1))
          }
          onNextMonth={() =>
            setDisplayedMonth((current) => moveMonth(current, 1))
          }
          onToday={() => setDisplayedMonth(getCurrentMonth())}
          onOpenBooking={(bookingId) =>
            setView({ name: 'detail', bookingId, returnTo: 'month' })
          }
        />
      </section>
    )
  }

  return (
    <section className="booking-screen">
      <div className="view-heading">
        <div>
          <p className="eyebrow">Temporary management view</p>
          <h2>Bookings</h2>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={() => setView({ name: 'month' })}>Calendar</button>
          <button className="primary-button" type="button" onClick={() => setView({ name: 'create', returnTo: 'manage' })}>Add booking</button>
        </div>
      </div>

      {error !== null && <p className="error-message">{error}</p>}

      {bookings.length === 0 && (
        <div className="empty-state">
          <h3>No bookings</h3>
          <p>Create a booking to test scheduling relationships.</p>
          <button className="primary-button" type="button" onClick={() => setView({ name: 'create', returnTo: 'manage' })}>Add booking</button>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="booking-list">
          {bookings.map((booking) => {
            const client = clientById.get(booking.clientId)
            const bookingPets = booking.petIds.map((id) => petById.get(id)?.name ?? 'Unknown pet')
            const bookingServices = booking.serviceIds.map((id) => serviceById.get(id)?.name ?? 'Unknown service')

            return (
              <article className="booking-card" key={booking.id}>
                <button className="booking-card-main" type="button" onClick={() => setView({ name: 'detail', bookingId: booking.id, returnTo: 'manage' })}>
                  <span className="booking-card-heading-row">
                    <strong>{client?.name ?? 'Unknown client'}</strong>
                    <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
                  </span>
                  <span>{booking.startDate} to {booking.endDate}</span>
                  <span>{bookingPets.join(', ')}</span>
                  <span>{bookingServices.join(', ')}</span>
                </button>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default CalendarScreen
