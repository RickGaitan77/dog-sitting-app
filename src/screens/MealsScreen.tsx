import { useCallback, useEffect, useState } from 'react'
import MealDetail from '../components/meals/MealDetail'
import MealForm from '../components/meals/MealForm'
import MealList from '../components/meals/MealList'
import WeeklyMealPlanner from '../components/meals/WeeklyMealPlanner'
import {
  getMealWeekStart,
  moveMealWeek,
} from '../components/meals/mealWeekDates'
import { getTodayDateString } from '../components/calendar/calendarDates'
import { appServices, type NewEntity } from '../services'
import type {
  Area,
  Booking,
  Client,
  GeneralEvent,
  Meal,
  Service,
} from '../Types'

type MealsScreenProps = {
  mealCreationRequested: boolean
  mealOpenRequested: string | null
  onMealCreationHandled: () => void
}

type MealReturnView = 'planner' | 'list'

type MealView =
  | { name: 'planner' }
  | { name: 'list' }
  | { name: 'create'; initialDate?: string; returnTo: MealReturnView }
  | { name: 'detail'; mealId: string; returnTo: MealReturnView }
  | { name: 'edit'; mealId: string; returnTo: MealReturnView }

function returnView(name: MealReturnView): MealView {
  return { name }
}

function MealsScreen({
  mealCreationRequested,
  mealOpenRequested,
  onMealCreationHandled,
}: MealsScreenProps) {
  const today = getTodayDateString()
  const [meals, setMeals] = useState<Meal[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [events, setEvents] = useState<GeneralEvent[]>([])
  const [areas, setAreas] = useState<Area[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [displayedWeekStart, setDisplayedWeekStart] = useState(
    () => getMealWeekStart(today),
  )
  const [view, setView] = useState<MealView>(() =>
    mealOpenRequested === null
      ? { name: 'planner' }
      : { name: 'detail', mealId: mealOpenRequested, returnTo: 'planner' },
  )
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadMeals = useCallback(async () => {
    const storedMeals = await appServices.meals.getAll()
    setMeals(
      storedMeals.sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          left.name.localeCompare(right.name),
      ),
    )
  }, [])

  useEffect(() => {
    let isCurrent = true

    void Promise.all([
      appServices.meals.getAll(),
      appServices.repositories.bookings.getAll(),
      appServices.repositories.clients.getAll(),
      appServices.repositories.generalEvents.getAll(),
      appServices.areas.getAll(),
      appServices.services.getAll(),
    ])
      .then(([
        storedMeals,
        storedBookings,
        storedClients,
        storedEvents,
        storedAreas,
        storedServices,
      ]) => {
        if (!isCurrent) return
        setMeals(
          storedMeals.sort(
            (left, right) =>
              left.date.localeCompare(right.date) ||
              left.name.localeCompare(right.name),
          ),
        )
        setBookings(storedBookings)
        setClients(storedClients)
        setEvents(storedEvents)
        setAreas(storedAreas)
        setServices(storedServices)
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          console.error('Failed to load weekly meal planner', loadError)
          setError('The weekly meal planner could not be loaded. Please try again.')
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [])

  const effectiveView: MealView = mealCreationRequested
    ? { name: 'create', returnTo: 'planner' }
    : view
  const selectedMeal =
    effectiveView.name === 'detail' || effectiveView.name === 'edit'
      ? meals.find((meal) => meal.id === effectiveView.mealId)
      : undefined

  const closeMealForm = () => {
    setError(null)
    if (effectiveView.name === 'edit' && selectedMeal !== undefined) {
      setView({
        name: 'detail',
        mealId: selectedMeal.id,
        returnTo: effectiveView.returnTo,
      })
    } else if (effectiveView.name === 'create') {
      setView(returnView(effectiveView.returnTo))
    }
    if (mealCreationRequested) onMealCreationHandled()
  }

  const saveMeal = async (input: NewEntity<Meal>) => {
    setIsSaving(true)
    setError(null)

    try {
      const savedMeal =
        effectiveView.name === 'edit' && selectedMeal !== undefined
          ? await appServices.meals.update(selectedMeal.id, input)
          : await appServices.meals.create(input)
      const returnTo =
        effectiveView.name === 'create' || effectiveView.name === 'edit'
          ? effectiveView.returnTo
          : 'planner'

      await loadMeals()
      setView({ name: 'detail', mealId: savedMeal.id, returnTo })
      if (mealCreationRequested) onMealCreationHandled()
    } catch (saveError: unknown) {
      console.error('Failed to save meal', saveError)
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'The meal could not be saved. Please try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const togglePrep = async (meal: Meal) => {
    setIsSaving(true)
    setError(null)

    try {
      await appServices.meals.update(meal.id, {
        prepCompleted: !meal.prepCompleted,
      })
      await loadMeals()
    } catch (toggleError: unknown) {
      console.error('Failed to update meal prep status', toggleError)
      setError('The prep status could not be updated. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteMeal = async (meal: Meal, returnTo: MealReturnView) => {
    if (!window.confirm('Delete this meal? This cannot be undone.')) return

    setIsSaving(true)
    setError(null)

    try {
      await appServices.meals.delete(meal.id)
      await loadMeals()
      setView(returnView(returnTo))
    } catch (deleteError: unknown) {
      console.error('Failed to delete meal', deleteError)
      setError('The meal could not be deleted. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p className="status-message">Loading weekly meal planner…</p>
  }

  if (effectiveView.name === 'create' || effectiveView.name === 'edit') {
    return (
      <section className="meal-screen">
        {error !== null && <p className="error-message">{error}</p>}
        <MealForm
          key={selectedMeal?.id ?? `new-meal-${effectiveView.name === 'create' ? effectiveView.initialDate ?? 'open' : 'edit'}`}
          meal={selectedMeal}
          initialDate={effectiveView.name === 'create' ? effectiveView.initialDate : undefined}
          isSaving={isSaving}
          onCancel={closeMealForm}
          onSubmit={saveMeal}
        />
      </section>
    )
  }

  if (effectiveView.name === 'detail' && selectedMeal !== undefined) {
    return (
      <MealDetail
        meal={selectedMeal}
        error={error}
        isSaving={isSaving}
        onBack={() => {
          setError(null)
          setView(returnView(effectiveView.returnTo))
        }}
        onEdit={() => setView({
          name: 'edit',
          mealId: selectedMeal.id,
          returnTo: effectiveView.returnTo,
        })}
        onDelete={() => void deleteMeal(selectedMeal, effectiveView.returnTo)}
        onTogglePrep={() => void togglePrep(selectedMeal)}
      />
    )
  }

  const activeView: MealReturnView =
    effectiveView.name === 'list' ? 'list' : 'planner'

  return (
    <section className="meal-screen">
      <div className="view-heading meal-heading">
        <div>
          <p className="eyebrow">Local meal plan</p>
          <h2>Meals</h2>
        </div>
        <div className="button-row meal-view-actions">
          <button
            className={activeView === 'planner' ? 'secondary-button active' : 'text-button'}
            type="button"
            onClick={() => setView({ name: 'planner' })}
          >
            Week
          </button>
          <button
            className={activeView === 'list' ? 'secondary-button active' : 'text-button'}
            type="button"
            onClick={() => setView({ name: 'list' })}
          >
            All Meals
          </button>
          <button
            className="primary-button"
            type="button"
            onClick={() => setView({ name: 'create', returnTo: activeView })}
          >
            Add Meal
          </button>
        </div>
      </div>

      {error !== null && <p className="error-message">{error}</p>}

      {activeView === 'planner' ? (
        <WeeklyMealPlanner
          areas={areas}
          bookings={bookings}
          clients={clients}
          events={events}
          meals={meals}
          services={services}
          today={today}
          weekStart={displayedWeekStart}
          onAddMeal={(date) => setView({
            name: 'create',
            initialDate: date,
            returnTo: 'planner',
          })}
          onCurrentWeek={() => setDisplayedWeekStart(getMealWeekStart(today))}
          onNextWeek={() => setDisplayedWeekStart((current) => moveMealWeek(current, 1))}
          onOpenMeal={(mealId) => setView({
            name: 'detail',
            mealId,
            returnTo: 'planner',
          })}
          onPreviousWeek={() => setDisplayedWeekStart((current) => moveMealWeek(current, -1))}
        />
      ) : (
        <MealList
          meals={meals}
          onAddMeal={() => setView({ name: 'create', returnTo: 'list' })}
          onOpenMeal={(mealId) => setView({
            name: 'detail',
            mealId,
            returnTo: 'list',
          })}
        />
      )}
    </section>
  )
}

export default MealsScreen
