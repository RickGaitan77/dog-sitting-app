import { useCallback, useEffect, useMemo, useState } from 'react'
import ClientForm from '../components/clients/ClientForm'
import PetForm from '../components/clients/PetForm'
import { appServices, type NewEntity } from '../services'
import type { Area, Client, Pet } from '../Types'

type ClientFormMode = 'create' | 'edit' | null

function valueOrFallback(value: string | undefined): string {
  return value === undefined || value === '' ? 'Not provided' : value
}

function ClientsScreen() {
  const [clients, setClients] = useState<Client[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [pets, setPets] = useState<Pet[]>([])
  const [clientFormMode, setClientFormMode] = useState<ClientFormMode>(null)
  const [petBeingEdited, setPetBeingEdited] = useState<Pet | 'new' | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const areaById = useMemo(
    () => new Map(areas.map((area) => [area.id, area])),
    [areas],
  )

  const loadClients = useCallback(async () => {
    setClients(await appServices.repositories.clients.getActive())
  }, [])

  const loadPets = useCallback(async (clientId: string) => {
    setPets(await appServices.repositories.pets.getByClientId(clientId))
  }, [])

  useEffect(() => {
    let isCurrent = true

    void Promise.all([
      appServices.repositories.clients.getActive(),
      appServices.repositories.areas.getActive(),
    ])
      .then(([activeClients, activeAreas]) => {
        if (isCurrent) {
          setClients(activeClients)
          setAreas(activeAreas)
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          console.error('Failed to load clients', loadError)
          setError('Clients could not be loaded. Please try again.')
        }
      })
      .finally(() => {
        if (isCurrent) {
          setIsLoading(false)
        }
      })

    return () => {
      isCurrent = false
    }
  }, [])

  useEffect(() => {
    if (selectedClient === null) {
      return
    }

    let isCurrent = true

    void appServices.repositories.pets
      .getByClientId(selectedClient.id)
      .then((activePets) => {
        if (isCurrent) {
          setPets(activePets)
        }
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          console.error('Failed to load pets', loadError)
          setError('Pets could not be loaded. Please try again.')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [selectedClient])

  const saveClient = async (input: NewEntity<Client>) => {
    setIsSaving(true)
    setError(null)

    try {
      const savedClient =
        clientFormMode === 'edit' && selectedClient !== null
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
    if (!window.confirm(`Archive ${client.name}?`)) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await appServices.clients.update(client.id, { archived: true })
      await loadClients()
      setSelectedClient(null)
      setPets([])
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
    if (selectedClient === null) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (petBeingEdited !== null && petBeingEdited !== 'new') {
        await appServices.pets.update(petBeingEdited.id, input)
      } else {
        await appServices.pets.create(input)
      }

      await loadPets(selectedClient.id)
      setPetBeingEdited(null)
    } catch (saveError: unknown) {
      console.error('Failed to save pet', saveError)
      setError('The pet could not be saved. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const archivePet = async (pet: Pet) => {
    if (selectedClient === null || !window.confirm(`Archive ${pet.name}?`)) {
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await appServices.pets.update(pet.id, { archived: true })
      await loadPets(selectedClient.id)
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
    const selectedArea = selectedClient.areaId
      ? areaById.get(selectedClient.areaId)
      : undefined

    return (
      <section className="clients-screen">
        <div className="view-heading">
          <div>
            <button
              className="text-button back-button"
              type="button"
              onClick={() => {
                setSelectedClient(null)
                setPets([])
                setPetBeingEdited(null)
              }}
            >
              ← All clients
            </button>
            <h2>{selectedClient.name}</h2>
          </div>
          <div className="button-row">
            <button className="secondary-button" type="button" onClick={() => setClientFormMode('edit')}>Edit</button>
            <button className="danger-button" type="button" onClick={() => void archiveClient(selectedClient)} disabled={isSaving}>Archive</button>
          </div>
        </div>

        {error !== null && <p className="error-message">{error}</p>}

        <div className="detail-card client-details">
          <div><span>Phone</span><p>{valueOrFallback(selectedClient.phone)}</p></div>
          <div><span>Email</span><p>{valueOrFallback(selectedClient.email)}</p></div>
          <div>
            <span>Area</span>
            <p className="area-value">
              {selectedArea !== undefined && <i className="area-dot" style={{ backgroundColor: selectedArea.color }} />}
              {selectedArea?.name ?? 'Not selected'}
            </p>
          </div>
          <div><span>Address</span><p>{valueOrFallback(selectedClient.address)}</p></div>
          <div><span>Emergency contact</span><p>{valueOrFallback(selectedClient.emergencyContact)}</p></div>
          <div><span>Veterinarian information</span><p>{valueOrFallback(selectedClient.veterinarianInfo)}</p></div>
          <div className="detail-wide"><span>Notes</span><p>{valueOrFallback(selectedClient.notes)}</p></div>
        </div>

        <div className="section-heading">
          <div><p className="eyebrow">Care profiles</p><h3>Pets</h3></div>
          {petBeingEdited === null && <button className="primary-button" type="button" onClick={() => setPetBeingEdited('new')}>Add pet</button>}
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

        {petBeingEdited === null && pets.length === 0 && (
          <div className="empty-state compact-empty-state">
            <h3>No active pets</h3>
            <p>Add a pet to keep care information with this client.</p>
          </div>
        )}

        {petBeingEdited === null && pets.length > 0 && (
          <div className="pet-list">
            {pets.map((pet) => (
              <article className="pet-card" key={pet.id}>
                <div className="pet-card-heading">
                  <div>
                    <h3>{pet.name}</h3>
                    <p>{[pet.species, pet.breed].filter(Boolean).join(' · ') || 'Species and breed not provided'}</p>
                  </div>
                  <div className="button-row">
                    <button className="text-button" type="button" onClick={() => setPetBeingEdited(pet)}>Edit</button>
                    <button className="text-button danger-text" type="button" onClick={() => void archivePet(pet)} disabled={isSaving}>Archive</button>
                  </div>
                </div>
                <dl className="pet-details">
                  <div><dt>Photo reference</dt><dd>{valueOrFallback(pet.photoUrl)}</dd></div>
                  <div><dt>Feeding</dt><dd>{valueOrFallback(pet.feedingInstructions)}</dd></div>
                  <div><dt>Medication</dt><dd>{valueOrFallback(pet.medication)}</dd></div>
                  <div><dt>Behavior</dt><dd>{valueOrFallback(pet.behaviorInfo)}</dd></div>
                  <div><dt>Care notes</dt><dd>{valueOrFallback(pet.careNotes)}</dd></div>
                  <div><dt>Special instructions</dt><dd>{valueOrFallback(pet.specialInstructions)}</dd></div>
                </dl>
              </article>
            ))}
          </div>
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

      {!isLoading && clients.length === 0 && (
        <div className="empty-state">
          <h3>No active clients</h3>
          <p>Add your first client to begin building the care directory.</p>
          <button className="primary-button" type="button" onClick={() => setClientFormMode('create')}>Add client</button>
        </div>
      )}

      {!isLoading && clients.length > 0 && (
        <div className="client-list">
          {clients.map((client) => {
            const area = client.areaId ? areaById.get(client.areaId) : undefined
            return (
              <article className="client-card" key={client.id}>
                <button
                  className="client-card-main"
                  type="button"
                  onClick={() => { setError(null); setPets([]); setSelectedClient(client) }}
                >
                  <span className="client-card-name">{client.name}</span>
                  <span className="client-card-meta">
                    {area !== undefined && <i className="area-dot" style={{ backgroundColor: area.color }} />}
                    {area?.name ?? 'No area'}{client.phone ? ` · ${client.phone}` : ''}
                  </span>
                </button>
                <div className="client-card-actions">
                  <button className="text-button" type="button" onClick={() => { setError(null); setPets([]); setSelectedClient(client); setClientFormMode('edit') }}>Edit</button>
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
