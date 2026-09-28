import { useMemo, useState, type CSSProperties } from 'react'
import type { Area, Client, Pet } from '../../Types'
import { resolveColorHex } from '../../utils/areaColors'

type BookingClientPickerProps = {
  areas: Area[]
  clients: Client[]
  currentClientId?: string
  onCancel: () => void
  onSelect: (clientId: string) => void
  pets: Pet[]
}

function normalizeBookingSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

function BookingClientPicker({ areas, clients, currentClientId, onCancel, onSelect, pets }: BookingClientPickerProps) {
  const [query, setQuery] = useState('')
  const areaById = useMemo(() => new Map(areas.map((area) => [area.id, area])), [areas])
  const normalizedQuery = normalizeBookingSearch(query)
  const options = useMemo(() => clients
    .filter((client) => !client.archived || client.id === currentClientId)
    .filter((client) => {
      if (normalizedQuery === '') return true
      const areaName = client.areaId === undefined ? '' : areaById.get(client.areaId)?.name ?? ''
      const petNames = pets.filter((pet) => pet.clientId === client.id && !pet.archived).map((pet) => pet.name)
      return [client.name, areaName, ...petNames]
        .some((value) => normalizeBookingSearch(value).includes(normalizedQuery))
    })
    .sort((left, right) => left.name.localeCompare(right.name)), [areaById, clients, currentClientId, normalizedQuery, pets])

  return (
    <div className="booking-picker-backdrop" role="dialog" aria-modal="true" aria-labelledby="booking-client-picker-title">
      <section className="booking-picker-sheet booking-client-picker">
        <div className="booking-picker-heading">
          <div><p className="eyebrow">Booking client</p><h3 id="booking-client-picker-title">Choose a Client</h3></div>
          <button className="text-button" type="button" onClick={onCancel}>Cancel</button>
        </div>
        <label className="booking-client-search">
          <span className="sr-only">Search Clients</span>
          <input autoFocus type="search" value={query} placeholder="Search name, Area, or Pet…" onChange={(event) => setQuery(event.target.value)} />
        </label>
        <div className="booking-client-options">
          {options.map((client) => {
            const area = client.areaId === undefined ? undefined : areaById.get(client.areaId)
            const clientPets = pets.filter((pet) => pet.clientId === client.id && !pet.archived).sort((left, right) => left.name.localeCompare(right.name))
            const style = { '--booking-area-color': resolveColorHex(area?.color ?? '#a89b96') } as CSSProperties
            return (
              <button className={client.id === currentClientId ? 'selected' : undefined} style={style} type="button" onClick={() => onSelect(client.id)} key={client.id}>
                <span className="booking-client-option-heading"><i aria-hidden="true" /><strong>{client.name}</strong>{client.archived && <small>Archived</small>}</span>
                <span>{area?.name ?? 'No Area'}</span>
                <small>{clientPets.map((pet) => pet.name).join(' • ') || 'No active Pets'}</small>
              </button>
            )
          })}
          {options.length === 0 && <p className="client-section-empty">No Clients match this search.</p>}
        </div>
      </section>
    </div>
  )
}

export default BookingClientPicker
