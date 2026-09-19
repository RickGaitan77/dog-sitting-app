export type Meal = {
  id: string
  date: string
  name: string
  mealType?: string
  prepDate?: string
  prepNotes?: string
  notes?: string
  tags: string[]
  prepCompleted: boolean
}