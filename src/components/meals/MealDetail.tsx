import type { Meal } from '../../Types'
import { formatMealDate } from './mealDates'
import { getTodayDateString } from '../calendar/calendarDates'
import UrgencyIndicator from '../urgency/UrgencyIndicator'
import { getMealPrepUrgency, urgencyClassName } from '../../utils/urgency'

type MealDetailProps = {
  error: string | null
  isSaving: boolean
  meal: Meal
  onBack: () => void
  onDelete: () => void
  onEdit: () => void
  onTogglePrep: () => void
}

function MealDetail({
  error,
  isSaving,
  meal,
  onBack,
  onDelete,
  onEdit,
  onTogglePrep,
}: MealDetailProps) {
  const prepUrgency = getMealPrepUrgency(meal, getTodayDateString())
  return (
    <section className="meal-screen">
      <div className="view-heading">
        <div>
          <button className="text-button back-button" type="button" onClick={onBack}>← Meals</button>
          <p className="eyebrow">Meal plan</p>
          <h2>{meal.name}</h2>
        </div>
        <div className="button-row">
          <button className="secondary-button" type="button" onClick={onEdit}>Edit</button>
          <button className="danger-button" type="button" disabled={isSaving} onClick={onDelete}>Delete meal</button>
        </div>
      </div>

      {error !== null && <p className="error-message">{error}</p>}

      <div className={`detail-card meal-details${prepUrgency.level > 0 ? ` ${urgencyClassName(prepUrgency)}` : ''}`}>
        <div><span>Meal date</span><p>{formatMealDate(meal.date)}</p></div>
        <div><span>Meal type</span><p>{meal.mealType || 'Not provided'}</p></div>
        <div><span>Prep date</span><p>{meal.prepDate ? formatMealDate(meal.prepDate) : 'Not provided'}</p></div>
        <div>
          <span>Prep status</span>
          <p><span className={`prep-badge ${meal.prepCompleted ? 'prep-complete' : 'prep-pending'}`}>{meal.prepCompleted ? 'Complete' : 'Pending'}</span></p>
        </div>
        <div className="detail-wide"><span>Tags</span><div className="meal-tags">{meal.tags.length > 0 ? meal.tags.map((tag) => <span key={tag}>{tag}</span>) : <p>None</p>}</div></div>
        <div className="detail-wide"><span>Prep notes</span><p>{meal.prepNotes || 'Not provided'}</p></div>
        <div className="detail-wide"><span>Notes</span><p>{meal.notes || 'Not provided'}</p></div>
      </div>

      {prepUrgency.level > 0 && (
        <UrgencyIndicator
          level={prepUrgency.level}
          animate={prepUrgency.animate}
          label={prepUrgency.label}
        />
      )}

      <button className="secondary-button prep-toggle-button" type="button" disabled={isSaving} onClick={onTogglePrep}>
        {meal.prepCompleted ? 'Mark prep incomplete' : 'Mark prep complete'}
      </button>
    </section>
  )
}

export default MealDetail
