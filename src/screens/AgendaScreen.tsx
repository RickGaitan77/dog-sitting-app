import { useCallback, useEffect, useMemo, useState } from 'react'
import AgendaList from '../components/agenda/AgendaList'
import BookingForm from '../components/bookings/BookingForm'
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

type AgendaView =
  | { name: 'list' }
  | { name: 'detail'; bookingId: string }
  | { name: 'edit'; bookingId: string }

function AgendaScreen() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [view, setView] = useState<AgendaView>({ name: 'list' })
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
    setBookings(storedBookings)
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

        setBookings(storedBookings)
        setClients(storedClients)
        setPets(storedPets)
        setAreas(storedAreas)
        setServices(storedServices)
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          console.error('Failed to load agenda', loadError)
          setError('The agenda could not be loaded. Please try again.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const selectedBooking =
    view.name === 'detail' || view.name === 'edit'
      ? bookings.find((booking) => booking.id === view.bookingId)
      : undefined

  const saveBooking = async (input: NewEntity<Booking>) => {
    if (view.name !== 'edit' || selectedBooking === undefined) return

    setIsSaving(true)
    setError(null)

    try {
      const savedBooking = await appServices.bookings.update(
        selectedBooking.id,
        input,
      )
      await loadBookings()
      setView({ name: 'detail', bookingId: savedBooking.id })
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
    return <p className="status-message">Loading agenda…</p>
  }

  if (view.name === 'edit' && selectedBooking !== undefined) {
    return (
      <section className="booking-screen">
        {error !== null && <p className="error-message">{error}</p>}
        <BookingForm
          key={selectedBooking.id}
          booking={selectedBooking}
          clients={clients}
          pets={pets}
          areas={areas}
          services={services}
          isSaving={isSaving}
          onCancel={() => {
            setError(null)
            setView({ name: 'detail', bookingId: selectedBooking.id })
          }}
          onSubmit={saveBooking}
        />
      </section>
    )
  }

  if (view.name === 'detail' && selectedBooking !== undefined) {
    const client = clientById.get(selectedBooking.clientId)
    const area = areaById.get(selectedBooking.areaId)
    const bookingPets = selectedBooking.petIds.map((id) => petById.get(id))
    const bookingServices = selectedBooking.serviceIds.map((id) => serviceById.get(id))

    return (
      <section className="booking-screen">
        <div className="view-heading">
          <div>
            <button
              className="text-button back-button"
              type="button"
              onClick={() => {
                setError(null)
                setView({ name: 'list' })
              }}
            >
              ← Agenda
            </button>
            <p className="eyebrow">Booking</p>
            <h2>{client?.name ?? 'Unknown client'}</h2>
          </div>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => setView({ name: 'edit', bookingId: selectedBooking.id })}>Edit</button>
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

  return (
    <section className="agenda-screen">
      <div className="agenda-heading">
        <div>
          <p className="eyebrow">Next 30 days</p>
          <h2>Agenda</h2>
        </div>
        <p>Upcoming work, grouped by start date.</p>
      </div>

      {error !== null && <p className="error-message">{error}</p>}

      <AgendaList
        bookings={bookings}
        clients={clients}
        pets={pets}
        areas={areas}
        services={services}
        onOpenBooking={(bookingId) =>
          setView({ name: 'detail', bookingId })
        }
      />
    </section>
  )
}

export default AgendaScreen
