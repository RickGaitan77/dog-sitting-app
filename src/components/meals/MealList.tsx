import type { Meal } from '../../Types'
import { getTodayDateString } from '../calendar/calendarDates'
import { formatMealDate } from './mealDates'
import UrgencyIndicator from '../urgency/UrgencyIndicator'
import { getMealPrepUrgency, urgencyClassName } from '../../utils/urgency'

type MealListProps = {
  meals: Meal[]
  onAddMeal: () => void
  onOpenMeal: (mealId: string) => void
}

function MealCard({
  meal,
  onOpenMeal,
  today,
  animateOverdue,
}: {
  meal: Meal
  onOpenMeal: (mealId: string) => void
  today: string
  animateOverdue: boolean
}) {
  const prepUrgency = getMealPrepUrgency(meal, today)
  return (
    <article className={`meal-card${prepUrgency.level > 0 ? ` ${urgencyClassName({ ...prepUrgency, animate: animateOverdue })}` : ''}`}>
      <button className="meal-card-main" type="button" onClick={() => onOpenMeal(meal.id)}>
        <span className="meal-card-heading">
          <strong>{meal.name}</strong>
          <span className={`prep-badge ${meal.prepCompleted ? 'prep-complete' : 'prep-pending'}`}>
            {meal.prepCompleted ? 'Prep complete' : 'Prep pending'}
          </span>
        </span>
        <span className="meal-date">{formatMealDate(meal.date)}</span>
        {meal.mealType && <span className="meal-type">{meal.mealType}</span>}
        {meal.prepDate && <span className="meal-prep-date">Prep {formatMealDate(meal.prepDate)}</span>}
        {prepUrgency.level > 0 && (
          <UrgencyIndicator
            level={prepUrgency.level}
            animate={animateOverdue}
            compact
            label={prepUrgency.label}
          />
        )}
        {meal.tags.length > 0 && (
          <span className="meal-tags">
            {meal.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </span>
        )}
      </button>
    </article>
  )
}

function MealsSection({
  heading,
  meals,
  onOpenMeal,
  today,
  animatedOverdueMealId,
}: {
  heading: string
  meals: Meal[]
  onOpenMeal: (mealId: string) => void
  today: string
  animatedOverdueMealId?: string
}) {
  return (
    <section className="meal-list-section">
      <h3>{heading}</h3>
      <div className="meal-list">
        {meals.map((meal) => (
          <MealCard meal={meal} onOpenMeal={onOpenMeal} today={today} animateOverdue={meal.id === animatedOverdueMealId} key={meal.id} />
        ))}
      </div>
    </section>
  )
}

function MealList({ meals, onAddMeal, onOpenMeal }: MealListProps) {
  const today = getTodayDateString()
  const sortedMeals = [...meals].sort(
    (left, right) =>
      left.date.localeCompare(right.date) || left.name.localeCompare(right.name),
  )
  const upcomingMeals = sortedMeals.filter((meal) => meal.date >= today)
  const pastMeals = sortedMeals.filter((meal) => meal.date < today)
  const animatedOverdueMealId = sortedMeals.find(
    (meal) => getMealPrepUrgency(meal, today).level === 3,
  )?.id

  if (meals.length === 0) {
    return (
      <div className="empty-state meal-empty-state">
        <h3>No meals planned</h3>
        <p>Add a meal to start your local meal plan.</p>
        <button className="primary-button" type="button" onClick={onAddMeal}>Add meal</button>
      </div>
    )
  }

  return (
    <div className="meal-sections">
      {upcomingMeals.length > 0 ? (
        <MealsSection heading="Upcoming" meals={upcomingMeals} onOpenMeal={onOpenMeal} today={today} animatedOverdueMealId={animatedOverdueMealId} />
      ) : (
        <div className="empty-state compact-empty-state">
          <h3>No upcoming meals</h3>
          <p>Add a meal when you are ready to plan ahead.</p>
          <button className="primary-button" type="button" onClick={onAddMeal}>Add meal</button>
        </div>
      )}

      {pastMeals.length > 0 && (
        <MealsSection heading="Past meals" meals={pastMeals} onOpenMeal={onOpenMeal} today={today} animatedOverdueMealId={animatedOverdueMealId} />
      )}
    </div>
  )
}

export default MealList
