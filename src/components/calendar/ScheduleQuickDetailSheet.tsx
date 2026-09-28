import type {
  Area,
  Booking,
  Client,
  GeneralEvent,
  Pet,
  Service,
} from '../../Types'
import { formatBookingDateRange } from '../agenda/agendaDates'
import CalendarBottomSheet from './CalendarBottomSheet'

type ScheduleQuickDetailSheetProps = {
  areas: Area[]
  booking?: Booking
  clients: Client[]
  event?: GeneralEvent
  pets: Pet[]
  services: Service[]
  onClose: () => void
  onEdit?: () => void
  onViewDetails?: () => void
}

function ScheduleQuickDetailSheet({
  areas,
  booking,
  clients,
  event,
  pets,
  services,
  onClose,
  onEdit,
  onViewDetails,
}: ScheduleQuickDetailSheetProps) {
  const areaId = booking?.areaId ?? event?.areaId
  const area = areaId === undefined
    ? undefined
    : areas.find((candidate) => candidate.id === areaId)

  if (booking !== undefined) {
    const client = clients.find((candidate) => candidate.id === booking.clientId)
    const petNames = booking.petIds
      .map((id) => pets.find((pet) => pet.id === id)?.name ?? 'Unknown pet')
      .join(', ')
    const serviceNames = booking.serviceIds
      .map((id) => services.find((service) => service.id === id)?.name ?? 'Unknown service')
      .join(', ')

    return (
      <CalendarBottomSheet title={client?.name ?? 'Booking'} onClose={onClose}>
        <dl className="calendar-quick-details">
          <div><dt>Dates</dt><dd>{formatBookingDateRange(booking.startDate, booking.endDate)}</dd></div>
          <div><dt>Area</dt><dd>{area?.name ?? 'Unknown area'}</dd></div>
          <div><dt>Pets</dt><dd>{petNames}</dd></div>
          <div><dt>Services</dt><dd>{serviceNames}</dd></div>
          <div><dt>Status</dt><dd>{booking.status}</dd></div>
        </dl>
        {(onViewDetails !== undefined || onEdit !== undefined) && (
          <div className="calendar-sheet-actions">
            {onViewDetails !== undefined && <button className="primary-button" type="button" onClick={onViewDetails}>View Details</button>}
            {onEdit !== undefined && <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>}
          </div>
        )}
      </CalendarBottomSheet>
    )
  }

  if (event !== undefined) {
    return (
      <CalendarBottomSheet title={event.title} onClose={onClose}>
        <dl className="calendar-quick-details">
          <div><dt>Dates</dt><dd>{formatBookingDateRange(event.startDate, event.endDate)}</dd></div>
          <div><dt>Area</dt><dd>{area?.name ?? 'No area'}</dd></div>
          <div><dt>Notes</dt><dd>{event.notes || 'Not provided'}</dd></div>
        </dl>
        {(onViewDetails !== undefined || onEdit !== undefined) && (
          <div className="calendar-sheet-actions">
            {onViewDetails !== undefined && <button className="primary-button" type="button" onClick={onViewDetails}>View Details</button>}
            {onEdit !== undefined && <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>}
          </div>
        )}
      </CalendarBottomSheet>
    )
  }

  return null
}

export default ScheduleQuickDetailSheet
