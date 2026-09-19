export type BookingStatus =
  | 'Tentative'
  | 'Confirmed'
  | 'Completed'
  | 'Cancelled'

export type Booking = {
  id: string
  clientId: string
  petIds: string[]
  startDate: string
  endDate: string
  areaId: string
  serviceIds: string[]
  status: BookingStatus
  notes?: string
}