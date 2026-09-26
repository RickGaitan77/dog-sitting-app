import type { Area, GeneralEvent } from '../../Types'
import { formatBookingDateRange } from '../agenda/agendaDates'

type GeneralEventDetailProps = {
  area?: Area
  backLabel: string
  error: string | null
  event: GeneralEvent
  isSaving: boolean
  onBack: () => void
  onDelete: () => void
  onEdit: () => void
}

function GeneralEventDetail({
  area,
  backLabel,
  error,
  event,
  isSaving,
  onBack,
  onDelete,
  onEdit,
}: GeneralEventDetailProps) {
  return (
    <section className="event-screen">
      <div className="view-heading">
        <div>
          <button className="text-button back-button" type="button" onClick={onBack}>
            ← {backLabel}
          </button>
          <p className="eyebrow">General event</p>
          <h2>{event.title}</h2>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>
          <button className="danger-button" type="button" disabled={isSaving} onClick={onDelete}>Delete event</button>
        </div>
      </div>

      {error !== null && <p className="error-message">{error}</p>}

      <div className="detail-card event-details">
        <div>
          <span>Dates</span>
          <p>{formatBookingDateRange(event.startDate, event.endDate)}</p>
        </div>
        <div>
          <span>Area</span>
          <p>{area?.name ?? 'No area'}</p>
        </div>
        <div className="detail-wide">
          <span>Notes</span>
          <p>{event.notes || 'Not provided'}</p>
        </div>
      </div>
    </section>
  )
}

export default GeneralEventDetail
