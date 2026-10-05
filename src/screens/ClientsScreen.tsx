import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import AttachmentSection from '../components/attachments/AttachmentSection'
import { formatBookingDateRange } from '../components/agenda/agendaDates'
import ScheduleQuickDetailSheet from '../components/calendar/ScheduleQuickDetailSheet'
import { getTodayDateString } from '../components/calendar/calendarDates'
import {
  classifyClientBookings,
  formatCompactPetNames,
  matchesClientSearch,
} from '../components/clients/clientDirectory'
import ClientForm from '../components/clients/ClientForm'
import PetDetail from '../components/clients/PetDetail'
import PetForm from '../components/clients/PetForm'
import { appServices, type NewEntity } from '../services'
import type { Area, Booking, Client, Pet, Service } from '../Types'
import UrgencyIndicator from '../components/urgency/UrgencyIndicator'
import { resolveColorHex } from '../utils/areaColors'
import { getTentativeBookingUrgency, urgencyClassName } from '../utils/urgency'

type ClientFormMode = 'create' | 'edit' | null

function PetThumbnail({ pet }: { pet: Pet }) {
  const [hasError, setHasError] = useState(false)
  if (pet.photoUrl === undefined || hasError) return null

  return (
    <img
      className="client-pet-thumbnail"
      src={pet.photoUrl}
      alt={`${pet.name}`}
      onError={() => setHasError(true)}
    />
  )
}

function BookingSummaryCard({
  areas,
  booking,
  pets,
  services,
  today,
  onOpen,
}: {
  areas: Map<string, Area>
  booking: Booking
  pets: Map<string, Pet>
  services: Map<string, Service>
  today: string
  onOpen: (bookingId: string) => void
}) {
  const area = areas.get(booking.areaId)
  const petNames = booking.petIds
    .map((id) => pets.get(id)?.name ?? 'Unknown pet')
    .join(' • ')
  const serviceNames = booking.serviceIds
    .map((id) => services.get(id)?.name ?? 'Unknown service')
    .join(' • ')
  const style = {
    '--client-area-color': resolveColorHex(area?.color ?? '#a89b96'),
  } as CSSProperties
  const tentativeUrgency = getTentativeBookingUrgency(booking, today)
  const tentativeClass = tentativeUrgency.level > 0
    ? urgencyClassName(tentativeUrgency)
    : ''

  return (
    <article className={`client-booking-card${booking.status === 'Cancelled' ? ' cancelled' : ''}${tentativeClass ? ` ${tentativeClass}` : ''}`} style={style}>
      <button type="button" onClick={() => onOpen(booking.id)}>
        <span className="client-booking-heading">
          <strong>{formatBookingDateRange(booking.startDate, booking.endDate)}</strong>
          <span className={`status-badge status-${booking.status.toLowerCase()}`}>{booking.status}</span>
        </span>
        <span className="client-booking-area"><i aria-hidden="true" />{area?.name ?? 'Unknown area'}</span>
        {serviceNames !== '' && <span>{serviceNames}</span>}
        {petNames !== '' && <span className="client-booking-pets">{petNames}</span>}
        {tentativeUrgency.level > 0 && (
          <UrgencyIndicator
            level={tentativeUrgency.level}
            animate={tentativeUrgency.animate}
            compact
            label={tentativeUrgency.label}
          />
        )}
      </button>
    </article>
  )
}

function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [clientFormMode, setClientFormMode] = useState<ClientFormMode>(null)
  const [petBeingEdited, setPetBeingEdited] = useState<Pet | 'new' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const today = getTodayDateString()

  const areaById = useMemo(
    () => new Map(areas.map((area) => [area.id, area])),
    [areas],
  )
  const petById = useMemo(
    () => new Map(pets.map((pet) => [pet.id, pet])),
    [pets],
  )
  const serviceById = useMemo(
    () => new Map(services.map((service) => [service.id, service])),
    [services],
  )
  const activePetsByClient = useMemo(() => {
    const groupedPets = new Map<string, Pet[]>()
    pets.filter((pet) => !pet.archived).forEach((pet) => {
      const clientPets = groupedPets.get(pet.clientId)
      if (clientPets === undefined) groupedPets.set(pet.clientId, [pet])
      else clientPets.push(pet)
    })
    groupedPets.forEach((clientPets) => clientPets.sort((left, right) => left.name.localeCompare(right.name)))
    return groupedPets
  }, [pets])
  const bookingsByClient = useMemo(() => {
    const groupedBookings = new Map<string, Booking[]>()
    bookings.forEach((booking) => {
      const clientBookings = groupedBookings.get(booking.clientId)
      if (clientBookings === undefined) groupedBookings.set(booking.clientId, [booking])
      else clientBookings.push(booking)
    })
    return groupedBookings
  }, [bookings])
  const visibleClients = useMemo(
    () => clients.filter((client) => matchesClientSearch(
      client,
      client.areaId === undefined ? undefined : areaById.get(client.areaId),
      activePetsByClient.get(client.id) ?? [],
      searchQuery,
    )),
    [activePetsByClient, areaById, clients, searchQuery],
  )
  const selectedBooking = selectedBookingId === null
    ? undefined
    : bookings.find((booking) => booking.id === selectedBookingId)

  const loadClients = useCallback(async () => {
    setClients(await appServices.repositories.clients.getActive())
  }, [])

  const loadPets = useCallback(async () => {
    setPets(await appServices.repositories.pets.getAll())
  }, [])

  useEffect(() => {
    let isCurrent = true

    void Promise.all([
      appServices.repositories.clients.getActive(),
      appServices.areas.getAll(),
      appServices.repositories.pets.getAll(),
      appServices.bookings.getAll(),
      appServices.services.getAll(),
    ])
      .then(([storedClients, storedAreas, storedPets, storedBookings, storedServices]) => {
        if (!isCurrent) return
        setClients(storedClients)
        setAreas(storedAreas)
        setPets(storedPets)
        setBookings(storedBookings)
        setServices(storedServices)
      })
      .catch((loadError: unknown) => {
        if (!isCurrent) return
        console.error('Failed to load client directory', loadError)
        setError('Clients could not be loaded. Please try again.')
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const saveClient = async (input: NewEntity<Client>) => {
    setIsSaving(true)
    setError(null)

    try {
      const savedClient = clientFormMode === 'edit' && selectedClient !== null
        ? await appServices.clients.update(selectedClient.id, input)
        : await appServices.clients.create(input)
      await loadClients()
      setSelectedClient(savedClient)
      setClientFormMode(null)
    } catch (saveError: unknown) {
      console.error('Failed to save client', saveError)
      setError('The client could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const archiveClient = async (client: Client) => {
    if (!window.confirm(`Archive ${client.name}?`)) return

    setIsSaving(true)
    setError(null)

    try {
      await appServices.clients.update(client.id, { archived: true })
      await loadClients()
      setSelectedClient(null)
      setSelectedPet(null)
      setClientFormMode(null)
      setPetBeingEdited(null)
    } catch (archiveError: unknown) {
      console.error('Failed to archive client', archiveError)
      setError('The client could not be archived. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const savePet = async (input: NewEntity<Pet>) => {
    if (selectedClient === null) return

    setIsSaving(true)
    setError(null)

    try {
      const savedPet = petBeingEdited !== null && petBeingEdited !== 'new'
        ? await appServices.pets.update(petBeingEdited.id, input)
        : await appServices.pets.create(input)
      await loadPets()
      setSelectedPet(petBeingEdited === 'new' ? null : savedPet)
      setPetBeingEdited(null)
    } catch (saveError: unknown) {
      console.error('Failed to save pet', saveError)
      setError('The pet could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const archivePet = async (pet: Pet) => {
    if (selectedClient === null || !window.confirm(`Archive ${pet.name}?`)) return

    setIsSaving(true)
    setError(null)

    try {
      await appServices.pets.update(pet.id, { archived: true })
      await loadPets()
      setSelectedPet(null)
      setPetBeingEdited(null)
    } catch (archiveError: unknown) {
      console.error('Failed to archive pet', archiveError)
      setError('The pet could not be archived. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (clientFormMode !== null) {
    return (
      <section className="clients-screen">
        {error !== null && <p className="error-message">{error}</p>}
        <ClientForm
          key={clientFormMode === 'edit' ? selectedClient?.id : 'new'}
          areas={areas}
          client={clientFormMode === 'edit' && selectedClient !== null ? selectedClient : undefined}
          isSaving={isSaving}
          onCancel={() => setClientFormMode(null)}
          onSubmit={saveClient}
        />
      </section>
    )
  }

  if (selectedClient !== null) {
    const selectedArea = selectedClient.areaId === undefined
      ? undefined
      : areaById.get(selectedClient.areaId)
    const clientPets = activePetsByClient.get(selectedClient.id) ?? []
    const { upcoming, history } = classifyClientBookings(
      bookingsByClient.get(selectedClient.id) ?? [],
      selectedClient.id,
      today,
    )
    const contactFields = [
      ['Phone', selectedClient.phone],
      ['Email', selectedClient.email],
      ['Address', selectedClient.address],
      ['Emergency contact', selectedClient.emergencyContact],
      ['Veterinarian information', selectedClient.veterinarianInfo],
    ].filter((field): field is [string, string] => field[1] !== undefined && field[1] !== '')

    return (
      <section className="clients-screen client-detail-screen">
        <button className="text-button back-button" type="button" onClick={() => {
          setSelectedClient(null)
          setSelectedPet(null)
          setPetBeingEdited(null)
        }}>← All clients</button>

        <header className="client-identity-card" style={{ '--client-area-color': resolveColorHex(selectedArea?.color ?? '#a89b96') } as CSSProperties}>
          <div>
            <p className="eyebrow">Client</p>
            <h2>{selectedClient.name}</h2>
            <p className="client-identity-area"><i aria-hidden="true" />{selectedArea?.name ?? 'No area selected'}</p>
          </div>
          <span className="client-status">{selectedClient.archived ? 'Archived' : 'Active'}</span>
        </header>

        {error !== null && <p className="error-message">{error}</p>}

        <section className="client-detail-section" aria-labelledby="client-contact-heading">
          <h3 id="client-contact-heading">Contact</h3>
          {contactFields.length === 0 ? (
            <p className="client-section-empty">No contact information provided.</p>
          ) : (
            <dl className="client-contact-grid">
              {contactFields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
          )}
        </section>

        <section className="client-detail-section" aria-labelledby="client-pets-heading">
          <div className="client-section-heading">
            <h3 id="client-pets-heading">Pets</h3>
            {petBeingEdited === null && <button className="primary-button" type="button" onClick={() => { setSelectedPet(null); setPetBeingEdited('new') }}>Add pet</button>}
          </div>

          {petBeingEdited !== null && (
            <PetForm
              key={petBeingEdited === 'new' ? 'new' : petBeingEdited.id}
              clientId={selectedClient.id}
              pet={petBeingEdited === 'new' ? undefined : petBeingEdited}
              isSaving={isSaving}
              onCancel={() => setPetBeingEdited(null)}
              onSubmit={savePet}
            />
          )}

          {petBeingEdited === null && clientPets.length === 0 && <p className="client-section-empty">No pets added.</p>}

          {petBeingEdited === null && clientPets.length > 0 && (
            <div className="client-pet-list">
              {clientPets.map((pet) => (
                <article className="client-pet-row" key={pet.id}>
                  <button type="button" onClick={() => setSelectedPet(pet)}>
                    <PetThumbnail key={`${pet.id}:${pet.photoUrl ?? ''}`} pet={pet} />
                    <span><strong>{pet.name}</strong><small>{[pet.species, pet.breed].filter(Boolean).join(' · ') || 'Details not provided'}</small></span>
                  </button>
                  <button className="text-button" type="button" onClick={() => { setSelectedPet(null); setPetBeingEdited(pet) }}>Edit</button>
                </article>
              ))}
            </div>
          )}

          {petBeingEdited === null && selectedPet !== null && (
            <PetDetail
              key={`${selectedPet.id}:${selectedPet.photoUrl ?? ''}`}
              client={selectedClient}
              pet={selectedPet}
              isSaving={isSaving}
              onClose={() => setSelectedPet(null)}
              onEdit={setPetBeingEdited}
              onArchive={(pet) => void archivePet(pet)}
            />
          )}
        </section>

        <section className="client-detail-section" aria-labelledby="client-upcoming-heading">
          <h3 id="client-upcoming-heading">Upcoming Bookings</h3>
          {upcoming.length === 0 ? <p className="client-section-empty">No upcoming bookings.</p> : (
            <div className="client-booking-list">
              {upcoming.map((booking) => <BookingSummaryCard key={booking.id} booking={booking} areas={areaById} pets={petById} services={serviceById} today={today} onOpen={setSelectedBookingId} />)}
            </div>
          )}
        </section>

        <section className="client-detail-section" aria-labelledby="client-notes-heading">
          <h3 id="client-notes-heading">Notes</h3>
          <p className={selectedClient.notes ? 'client-notes' : 'client-section-empty'}>{selectedClient.notes || 'No notes added.'}</p>
        </section>

        <section className="client-detail-section client-documents-section" aria-label="Client documents">
          <AttachmentSection ownerType="Client" ownerId={selectedClient.id} ownerName={selectedClient.name} heading="Documents" emptyTitle="No documents added" />
        </section>

        <section className="client-detail-section" aria-labelledby="client-history-heading">
          <h3 id="client-history-heading">Booking History</h3>
          {history.length === 0 ? <p className="client-section-empty">No previous bookings.</p> : (
            <div className="client-booking-list">
              {history.map((booking) => <BookingSummaryCard key={booking.id} booking={booking} areas={areaById} pets={petById} services={serviceById} today={today} onOpen={setSelectedBookingId} />)}
            </div>
          )}
        </section>

        <section className="client-record-actions" aria-label="Client record actions">
          <button className="secondary-button" type="button" onClick={() => setClientFormMode('edit')}>Edit client</button>
          <button className="danger-button" type="button" onClick={() => void archiveClient(selectedClient)} disabled={isSaving}>Archive client</button>
        </section>

        {selectedBooking !== undefined && (
          <ScheduleQuickDetailSheet
            areas={areas}
            booking={selectedBooking}
            clients={[selectedClient]}
            pets={pets}
            services={services}
            onClose={() => setSelectedBookingId(null)}
          />
        )}
      </section>
    )
  }

  return (
    <section className="clients-screen">
      <div className="view-heading">
        <div><p className="eyebrow">Directory</p><h2>Clients</h2></div>
        <button className="primary-button" type="button" onClick={() => { setError(null); setClientFormMode('create') }}>Add client</button>
      </div>

      {error !== null && <p className="error-message">{error}</p>}
      {isLoading && <p className="status-message">Loading clients…</p>}

      {!isLoading && clients.length > 0 && (
        <div className="client-search-row">
          <label><span className="sr-only">Search clients</span><input type="search" value={searchQuery} placeholder="Search clients, pets, areas…" onChange={(event) => setSearchQuery(event.target.value)} /></label>
          {searchQuery !== '' && <button className="text-button" type="button" onClick={() => setSearchQuery('')}>Clear</button>}
        </div>
      )}

      {!isLoading && clients.length === 0 && (
        <div className="empty-state compact-empty-state">
          <h3>No clients yet</h3>
          <p>Add your first client to begin building the care directory.</p>
          <button className="primary-button" type="button" onClick={() => setClientFormMode('create')}>Add client</button>
        </div>
      )}

      {!isLoading && clients.length > 0 && visibleClients.length === 0 && (
        <div className="empty-state compact-empty-state">
          <h3>No clients match your search</h3>
          <p>Try another name, contact detail, Area, or Pet.</p>
          <button className="secondary-button" type="button" onClick={() => setSearchQuery('')}>Clear search</button>
        </div>
      )}

      {!isLoading && visibleClients.length > 0 && (
        <div className="client-list">
          {visibleClients.map((client) => {
            const area = client.areaId === undefined ? undefined : areaById.get(client.areaId)
            const clientPets = activePetsByClient.get(client.id) ?? []
            const nextBooking = classifyClientBookings(
              bookingsByClient.get(client.id) ?? [],
              client.id,
              today,
            ).upcoming[0]
            const nextServices = nextBooking?.serviceIds
              .map((id) => serviceById.get(id)?.name ?? 'Unknown service')
              .join(' • ')
            const photos = clientPets.filter((pet) => pet.photoUrl !== undefined).slice(0, 3)
            const style = { '--client-area-color': resolveColorHex(area?.color ?? '#a89b96') } as CSSProperties

            return (
              <article className="client-card client-directory-card" style={style} key={client.id}>
                <button className="client-card-main" type="button" onClick={() => { setError(null); setSelectedClient(client) }}>
                  <span className="client-card-topline">
                    <span className="client-card-name">{client.name}</span>
                    <span className="client-card-area"><i aria-hidden="true" />{area?.name ?? 'No area'}</span>
                  </span>
                  {photos.length > 0 && (
                    <span className="client-pet-thumbnails" aria-label="Pet photos">
                      {photos.map((pet) => <PetThumbnail key={`${pet.id}:${pet.photoUrl ?? ''}`} pet={pet} />)}
                    </span>
                  )}
                  <span className="client-card-pets">{clientPets.length > 0 ? formatCompactPetNames(clientPets) : 'No pets added'}</span>
                  {nextBooking === undefined ? (
                    <span className="client-card-next quiet">No upcoming booking</span>
                  ) : (
                    <span className="client-card-next"><strong>Next: {formatBookingDateRange(nextBooking.startDate, nextBooking.endDate)}</strong>{nextServices && <small>{nextServices}</small>}</span>
                  )}
                </button>
                <div className="client-card-actions">
                  <button className="text-button" type="button" onClick={() => { setSelectedClient(client); setClientFormMode('edit') }}>Edit</button>
                  <button className="text-button danger-text" type="button" onClick={() => void archiveClient(client)} disabled={isSaving}>Archive</button>
                </div>
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}

export default ClientsScreen
