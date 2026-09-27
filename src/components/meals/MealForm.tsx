import { useState, type FormEvent } from 'react'
import type { Meal } from '../../Types'
import type { NewEntity } from '../../services'

type MealFormProps = {
  initialDate?: string
  isSaving: boolean
  meal?: Meal
  onCancel: () => void
  onSubmit: (meal: NewEntity<Meal>) => Promise<void>
}

type MealFormValues = {
  date: string
  name: string
  mealType: string
  prepDate: string
  prepNotes: string
  notes: string
  tags: string
  prepCompleted: boolean
}

function parseTags(value: string): string[] {
  return Array.from(new Set(
    value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
  ))
}

function MealForm({
  isSaving,
  meal,
  initialDate,
  onCancel,
  onSubmit,
}: MealFormProps) {
  const [errors, setErrors] = useState<string[]>([])
  const [values, setValues] = useState<MealFormValues>({
    date: meal?.date ?? initialDate ?? '',
    name: meal?.name ?? '',
    mealType: meal?.mealType ?? '',
    prepDate: meal?.prepDate ?? '',
    prepNotes: meal?.prepNotes ?? '',
    notes: meal?.notes ?? '',
    tags: meal?.tags.join(', ') ?? '',
    prepCompleted: meal?.prepCompleted ?? false,
  })

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const validationErrors: string[] = []

    if (values.name.trim() === '') {
      validationErrors.push('Enter a meal name.')
    }
    if (values.date === '') validationErrors.push('Enter a meal date.')

    if (validationErrors.length > 0) {
      setErrors(validationErrors)
      return
    }

    setErrors([])
    void onSubmit({
      date: values.date,
      name: values.name.trim(),
      mealType: values.mealType.trim() || undefined,
      prepDate: values.prepDate || undefined,
      prepNotes: values.prepNotes.trim() || undefined,
      notes: values.notes.trim() || undefined,
      tags: parseTags(values.tags),
      prepCompleted: values.prepCompleted,
    })
  }

  return (
    <form className="entity-form meal-form" onSubmit={handleSubmit}>
      <div className="view-heading">
        <div>
          <p className="eyebrow">Meal plan</p>
          <h2>{meal === undefined ? 'New meal' : 'Edit meal'}</h2>
        </div>
        <button className="text-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
      </div>

      {errors.length > 0 && (
        <div className="error-message validation-summary" role="alert">
          <strong>Check the meal details:</strong>
          <ul>
            {errors.map((error) => <li key={error}>{error}</li>)}
          </ul>
        </div>
      )}

      <div className="form-grid">
        <label className="full-width-field">
          Meal name <span aria-hidden="true">*</span>
          <input
            value={values.name}
            onChange={(changeEvent) => {
              setValues((current) => ({ ...current, name: changeEvent.target.value }))
              setErrors([])
            }}
          />
        </label>

        <label>
          Meal date <span aria-hidden="true">*</span>
          <input
            type="date"
            value={values.date}
            onChange={(changeEvent) => {
              setValues((current) => ({ ...current, date: changeEvent.target.value }))
              setErrors([])
            }}
          />
        </label>

        <label>
          Meal type
          <input
            value={values.mealType}
            onChange={(changeEvent) =>
              setValues((current) => ({ ...current, mealType: changeEvent.target.value }))
            }
          />
        </label>

        <label>
          Prep date
          <input
            type="date"
            value={values.prepDate}
            onChange={(changeEvent) =>
              setValues((current) => ({ ...current, prepDate: changeEvent.target.value }))
            }
          />
        </label>

        <label className="meal-prep-checkbox">
          <input
            type="checkbox"
            checked={values.prepCompleted}
            onChange={(changeEvent) =>
              setValues((current) => ({ ...current, prepCompleted: changeEvent.target.checked }))
            }
          />
          Prep completed
        </label>

        <label className="full-width-field">
          Tags
          <input
            value={values.tags}
            placeholder="Make-ahead, dogs, quick"
            onChange={(changeEvent) =>
              setValues((current) => ({ ...current, tags: changeEvent.target.value }))
            }
          />
          <span className="field-hint">Separate tags with commas.</span>
        </label>

        <label className="full-width-field">
          Prep notes
          <textarea
            rows={3}
            value={values.prepNotes}
            onChange={(changeEvent) =>
              setValues((current) => ({ ...current, prepNotes: changeEvent.target.value }))
            }
          />
        </label>

        <label className="full-width-field">
          Notes
          <textarea
            rows={3}
            value={values.notes}
            onChange={(changeEvent) =>
              setValues((current) => ({ ...current, notes: changeEvent.target.value }))
            }
          />
        </label>
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save meal'}</button>
      </div>
    </form>
  )
}

export default MealForm
