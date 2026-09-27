import { useCallback, useEffect, useState } from 'react'
import MealDetail from '../components/meals/MealDetail'
import MealForm from '../components/meals/MealForm'
import MealList from '../components/meals/MealList'
import { appServices, type NewEntity } from '../services'
import type { Meal } from '../Types'

type MealsScreenProps = {
  mealCreationRequested: boolean
  mealOpenRequested: string | null
  onMealCreationHandled: () => void
}

type MealView =
  | { name: 'list' }
  | { name: 'create' }
  | { name: 'detail'; mealId: string }
  | { name: 'edit'; mealId: string }

function MealsScreen({
  mealCreationRequested,
  mealOpenRequested,
  onMealCreationHandled,
}: MealsScreenProps) {
  const [meals, setMeals] = useState<Meal[]>([])
  const [view, setView] = useState<MealView>(() =>
    mealOpenRequested === null
      ? { name: 'list' }
      : { name: 'detail', mealId: mealOpenRequested },
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

    void appServices.meals.getAll()
      .then((storedMeals) => {
        if (!isCurrent) return
        setMeals(
          storedMeals.sort(
            (left, right) =>
              left.date.localeCompare(right.date) ||
              left.name.localeCompare(right.name),
          ),
        )
      })
      .catch((loadError: unknown) => {
        if (isCurrent) {
          console.error('Failed to load meals', loadError)
          setError('Meals could not be loaded. Please try again.')
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
    ? { name: 'create' }
    : view
  const selectedMeal =
    effectiveView.name === 'detail' || effectiveView.name === 'edit'
      ? meals.find((meal) => meal.id === effectiveView.mealId)
      : undefined

  const closeMealForm = () => {
    setError(null)
    if (effectiveView.name === 'edit' && selectedMeal !== undefined) {
      setView({ name: 'detail', mealId: selectedMeal.id })
    } else {
      setView({ name: 'list' })
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

      await loadMeals()
      setView({ name: 'detail', mealId: savedMeal.id })
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

  const deleteMeal = async (meal: Meal) => {
    if (!window.confirm('Delete this meal? This cannot be undone.')) return

    setIsSaving(true)
    setError(null)

    try {
      await appServices.meals.delete(meal.id)
      await loadMeals()
      setView({ name: 'list' })
    } catch (deleteError: unknown) {
      console.error('Failed to delete meal', deleteError)
      setError('The meal could not be deleted. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <p className="status-message">Loading meals…</p>
  }

  if (effectiveView.name === 'create' || effectiveView.name === 'edit') {
    return (
      <section className="meal-screen">
        {error !== null && <p className="error-message">{error}</p>}
        <MealForm
          key={selectedMeal?.id ?? 'new-meal'}
          meal={selectedMeal}
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
          setView({ name: 'list' })
        }}
        onEdit={() => setView({ name: 'edit', mealId: selectedMeal.id })}
        onDelete={() => void deleteMeal(selectedMeal)}
        onTogglePrep={() => void togglePrep(selectedMeal)}
      />
    )
  }

  return (
    <section className="meal-screen">
      <div className="view-heading meal-heading">
        <div>
          <p className="eyebrow">Local meal plan</p>
          <h2>Meals</h2>
        </div>
        <button className="primary-button" type="button" onClick={() => setView({ name: 'create' })}>Add meal</button>
      </div>

      {error !== null && <p className="error-message">{error}</p>}

      <MealList
        meals={meals}
        onAddMeal={() => setView({ name: 'create' })}
        onOpenMeal={(mealId) => setView({ name: 'detail', mealId })}
      />
    </section>
  )
}

export default MealsScreen
