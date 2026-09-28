import type { Area, Booking, Client, Pet } from '../../Types'

export function normalizeClientSearch(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
}

export function matchesClientSearch(
  client: Client,
  area: Area | undefined,
  pets: Pet[],
  query: string,
): boolean {
  const normalizedQuery = normalizeClientSearch(query)
  if (normalizedQuery === '') return true

  const searchText = normalizeClientSearch([
    client.name,
    client.phone,
    client.email,
    client.address,
    area?.name,
    ...pets.map((pet) => pet.name),
  ].filter(Boolean).join(' '))

  return searchText.includes(normalizedQuery)
}

export function classifyClientBookings(
  bookings: Booking[],
  clientId: string,
  today: string,
) {
  const clientBookings = bookings.filter(
    (booking) => booking.clientId === clientId,
  )
  const upcoming = clientBookings
    .filter(
      (booking) =>
        booking.status !== 'Cancelled' && booking.endDate >= today,
    )
    .sort(
      (left, right) =>
        left.startDate.localeCompare(right.startDate) ||
        left.endDate.localeCompare(right.endDate) ||
        left.id.localeCompare(right.id),
    )
  const history = clientBookings
    .filter(
      (booking) =>
        booking.status === 'Cancelled' || booking.endDate < today,
    )
    .sort(
      (left, right) =>
        right.endDate.localeCompare(left.endDate) ||
        right.startDate.localeCompare(left.startDate) ||
        right.id.localeCompare(left.id),
    )

  return { upcoming, history }
}

export function formatCompactPetNames(pets: Pet[]): string {
  if (pets.length <= 3) return pets.map((pet) => pet.name).join(' • ')
  return `${pets.slice(0, 2).map((pet) => pet.name).join(' • ')} • +${pets.length - 2}`
}
