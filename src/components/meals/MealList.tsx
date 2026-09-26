import type { Meal } from '../../Types'
import { getTodayDateString } from '../calendar/calendarDates'
import { formatMealDate } from './mealDates'

type MealListProps = {
  meals: Meal[]
  onAddMeal: () => void
  onOpenMeal: (mealId: string) => void
}

function MealCard({
  meal,
  onOpenMeal,
}: {
  meal: Meal
  onOpenMeal: (mealId: string) => void
}) {
  return (
    <article className="meal-card">
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
}: {
  heading: string
  meals: Meal[]
  onOpenMeal: (mealId: string) => void
}) {
  return (
    <section className="meal-list-section">
      <h3>{heading}</h3>
      <div className="meal-list">
        {meals.map((meal) => (
          <MealCard meal={meal} onOpenMeal={onOpenMeal} key={meal.id} />
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
        <MealsSection heading="Upcoming" meals={upcomingMeals} onOpenMeal={onOpenMeal} />
      ) : (
        <div className="empty-state compact-empty-state">
          <h3>No upcoming meals</h3>
          <p>Add a meal when you are ready to plan ahead.</p>
          <button className="primary-button" type="button" onClick={onAddMeal}>Add meal</button>
        </div>
      )}

      {pastMeals.length > 0 && (
        <MealsSection heading="Past meals" meals={pastMeals} onOpenMeal={onOpenMeal} />
      )}
    </div>
  )
}

export default MealList
