import { useEffect, useMemo, useState } from 'react'
import { appServices } from '../../services'
import type { Area, Client, Pet, Service } from '../../Types'

type ArchivedRecordsViewProps = {
  onBack: () => void
  onManageAreas: () => void
  onManageServices: () => void
}

async function getArchivedRecordData() {
  const [clients, pets, areas, services] = await Promise.all([
    appServices.repositories.clients.getAll(),
    appServices.repositories.pets.getAll(),
    appServices.areas.getAll(),
    appServices.services.getAll(),
  ])

  return {
    clients: clients.sort((left, right) => left.name.localeCompare(right.name)),
    pets: pets.sort((left, right) => left.name.localeCompare(right.name)),
    areas,
    services,
  }
}

function PetThumbnail({ pet }: { pet: Pet }) {
  const [failed, setFailed] = useState(false)
  if (pet.photoUrl === undefined || failed) return <span className="archived-pet-placeholder" aria-hidden="true">🐾</span>
  return <img className="archived-pet-photo" src={pet.photoUrl} alt="" onError={() => setFailed(true)} />
}

function ArchivedRecordsView({ onBack, onManageAreas, onManageServices }: ArchivedRecordsViewProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [pets, setPets] = useState<Pet[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadRecords = async () => {
    const records = await getArchivedRecordData()
    setClients(records.clients)
    setPets(records.pets)
    setAreas(records.areas)
    setServices(records.services)
  }

  useEffect(() => {
    let current = true
    void getArchivedRecordData()
      .then((records) => {
        if (!current) return
        setClients(records.clients)
        setPets(records.pets)
        setAreas(records.areas)
        setServices(records.services)
      })
      .catch((loadError: unknown) => {
        console.error('Failed to load archived records', loadError)
        if (current) setError('Archived records could not be loaded. Existing data is unchanged. Please try again.')
      })
      .finally(() => {
        if (current) setIsLoading(false)
      })
    return () => { current = false }
  }, [])

  const clientById = useMemo(() => new Map(clients.map((client) => [client.id, client])), [clients])
  const areaById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas])
  const petsByClient = useMemo(() => {
    const grouped = new Map<string, Pet[]>()
    pets.forEach((pet) => grouped.set(pet.clientId, [...(grouped.get(pet.clientId) ?? []), pet]))
    return grouped
  }, [pets])
  const archivedClients = clients.filter((client) => client.archived)
  const archivedPets = pets.filter((pet) => pet.archived)
  const archivedAreas = areas.filter((area) => area.archived)
  const archivedServices = services.filter((service) => service.archived)

  const restoreClient = async (client: Client) => {
    if (!window.confirm(`Restore ${client.name}? The same Client record and all existing relationships will be preserved.`)) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await appServices.clients.update(client.id, { archived: false })
      await loadRecords()
      setSuccess(`${client.name} was restored. Pet archive states were not changed.`)
    } catch (restoreError: unknown) {
      console.error('Failed to restore Client', restoreError)
      setError(`${client.name} could not be restored. Existing records are unchanged. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  const restorePet = async (pet: Pet) => {
    const owner = clientById.get(pet.clientId)
    if (owner?.archived) {
      setError(`Restore ${owner.name} before restoring ${pet.name}. The Pet and Client relationship is unchanged.`)
      return
    }
    if (!window.confirm(`Restore ${pet.name}? The same Pet record and all existing relationships will be preserved.`)) return
    setIsSaving(true)
    setError(null)
    setSuccess(null)
    try {
      await appServices.pets.update(pet.id, { archived: false })
      await loadRecords()
      setSuccess(`${pet.name} was restored.`)
    } catch (restoreError: unknown) {
      console.error('Failed to restore Pet', restoreError)
      setError(`${pet.name} could not be restored. Existing records are unchanged. Please try again.`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="settings-subview archived-records-view">
      <div className="view-heading">
        <div>
          <button className="text-button back-button" type="button" onClick={onBack}>← Settings</button>
          <p className="eyebrow">Records</p>
          <h2>Archived Records</h2>
        </div>
      </div>
      <p className="settings-view-intro">Restore existing records without changing their IDs, documents, or historical relationships. Nothing can be permanently deleted here.</p>
      {error !== null && <p className="error-message" role="alert">{error}</p>}
      {success !== null && <p className="success-message" role="status">{success}</p>}
      {isLoading && <p className="status-message">Loading archived records…</p>}

      {!isLoading && (
        <>
          <section className="settings-card archived-record-section" aria-labelledby="archived-clients-heading">
            <div className="settings-section-heading"><h3 id="archived-clients-heading">Clients</h3><p>Restoring a Client does not change any Pet’s own archive state.</p></div>
            {archivedClients.length === 0 ? <p className="compact-settings-empty">No archived Clients.</p> : (
              <div className="archived-record-list">
                {archivedClients.map((client) => {
                  const clientPets = petsByClient.get(client.id) ?? []
                  const petNames = clientPets.slice(0, 3).map((pet) => pet.name).join(' • ')
                  return (
                    <article className="archived-record-row" key={client.id}>
                      <span className="archived-record-copy"><strong>{client.name}</strong><small>{areaById.get(client.areaId ?? '')?.name ?? 'No Area'} · {clientPets.length} Pet{clientPets.length === 1 ? '' : 's'}</small>{petNames !== '' && <small>{petNames}{clientPets.length > 3 ? ` +${clientPets.length - 3}` : ''}</small>}<em>Archived</em></span>
                      <button className="secondary-button" type="button" disabled={isSaving} onClick={() => void restoreClient(client)}>Restore Client</button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="settings-card archived-record-section" aria-labelledby="archived-pets-heading">
            <div className="settings-section-heading"><h3 id="archived-pets-heading">Pets</h3><p>Pets keep their Profile Photo, care details, documents, and Booking relationships.</p></div>
            {archivedPets.length === 0 ? <p className="compact-settings-empty">No archived Pets.</p> : (
              <div className="archived-record-list">
                {archivedPets.map((pet) => {
                  const owner = clientById.get(pet.clientId)
                  const ownerArchived = owner?.archived === true
                  return (
                    <article className="archived-record-row archived-pet-row" key={pet.id}>
                      <PetThumbnail pet={pet} />
                      <span className="archived-record-copy"><strong>{pet.name}</strong><small>{[pet.species, pet.breed].filter(Boolean).join(' · ') || 'Details not provided'}</small><small>Client: {owner?.name ?? 'Unknown Client'}{ownerArchived ? ' · Client archived' : ''}</small><em>Archived</em></span>
                      <button className="secondary-button" type="button" disabled={isSaving || ownerArchived || owner === undefined} title={ownerArchived ? 'Restore the owning Client first' : undefined} onClick={() => void restorePet(pet)}>Restore Pet</button>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="settings-card archived-record-section" aria-labelledby="archived-areas-heading">
            <div className="settings-section-heading"><h3 id="archived-areas-heading">Areas</h3><p>{archivedAreas.length === 0 ? 'No archived Areas.' : `${archivedAreas.length} archived Area${archivedAreas.length === 1 ? '' : 's'}: ${archivedAreas.map((area) => area.name).join(', ')}`}</p></div>
            <button className="secondary-button" type="button" onClick={onManageAreas}>Manage Areas &amp; Colors</button>
          </section>

          <section className="settings-card archived-record-section" aria-labelledby="archived-services-heading">
            <div className="settings-section-heading"><h3 id="archived-services-heading">Services</h3><p>{archivedServices.length === 0 ? 'No archived Services.' : `${archivedServices.length} archived Service${archivedServices.length === 1 ? '' : 's'}: ${archivedServices.map((service) => service.name).join(', ')}`}</p></div>
            <button className="secondary-button" type="button" onClick={onManageServices}>Manage Services</button>
          </section>
        </>
      )}
    </section>
  )
}

export default ArchivedRecordsView
