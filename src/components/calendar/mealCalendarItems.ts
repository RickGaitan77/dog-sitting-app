import type { Meal } from '../../Types'

export type MealCalendarItem = {
  date: string
  kind: 'meal' | 'prep'
  meal: Meal
}

export function buildMealCalendarItems(
  meals: Meal[],
  showMealOverlay: boolean,
): MealCalendarItem[] {
  if (!showMealOverlay) return []

  return meals
    .flatMap((meal): MealCalendarItem[] => {
      const items: MealCalendarItem[] = [
        { date: meal.date, kind: 'meal', meal },
      ]

      if (meal.prepDate !== undefined && meal.prepDate !== meal.date) {
        items.push({ date: meal.prepDate, kind: 'prep', meal })
      }

      return items
    })
    .sort(
      (left, right) =>
        left.date.localeCompare(right.date) ||
        left.kind.localeCompare(right.kind) ||
        left.meal.name.localeCompare(right.meal.name),
    )
}
