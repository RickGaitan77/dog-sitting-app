import { useState, type FormEvent } from 'react'
import type { Pet } from '../../Types'
import type { NewEntity } from '../../services'

type PetFormProps = {
  clientId: string
  pet?: Pet
  isSaving: boolean
  onCancel: () => void
  onSubmit: (pet: NewEntity<Pet>) => Promise<void>
}

type PetFormValues = {
  name: string
  species: string
  breed: string
  photoUrl: string
  feedingInstructions: string
  medication: string
  behaviorInfo: string
  careNotes: string
  specialInstructions: string
}

function optionalValue(value: string): string | undefined {
  const normalizedValue = value.trim()
  return normalizedValue === '' ? undefined : normalizedValue
}

function PetForm({ clientId, pet, isSaving, onCancel, onSubmit }: PetFormProps) {
  const [nameError, setNameError] = useState(false)
  const [values, setValues] = useState<PetFormValues>({
    name: pet?.name ?? '',
    species: pet?.species ?? '',
    breed: pet?.breed ?? '',
    photoUrl: pet?.photoUrl ?? '',
    feedingInstructions: pet?.feedingInstructions ?? '',
    medication: pet?.medication ?? '',
    behaviorInfo: pet?.behaviorInfo ?? '',
    careNotes: pet?.careNotes ?? '',
    specialInstructions: pet?.specialInstructions ?? '',
  })

  const updateValue = (field: keyof PetFormValues, value: string) => {
    setValues((currentValues) => ({ ...currentValues, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = values.name.trim()

    if (name === '') {
      setNameError(true)
      return
    }

    void onSubmit({
      clientId,
      name,
      species: optionalValue(values.species),
      breed: optionalValue(values.breed),
      photoUrl: optionalValue(values.photoUrl),
      feedingInstructions: optionalValue(values.feedingInstructions),
      medication: optionalValue(values.medication),
      behaviorInfo: optionalValue(values.behaviorInfo),
      careNotes: optionalValue(values.careNotes),
      specialInstructions: optionalValue(values.specialInstructions),
      archived: pet?.archived ?? false,
    })
  }

  return (
    <form className="entity-form nested-form" onSubmit={handleSubmit}>
      <div className="view-heading">
        <div>
          <p className="eyebrow">Pet</p>
          <h3>{pet === undefined ? 'Add pet' : 'Edit pet'}</h3>
        </div>
        <button className="text-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
      </div>

      <div className="form-grid">
        <label>
          Name <span aria-hidden="true">*</span>
          <input
            autoFocus
            required
            aria-invalid={nameError}
            value={values.name}
            onChange={(event) => {
              updateValue('name', event.target.value)
              setNameError(false)
            }}
          />
          {nameError && <span className="field-error">Name is required.</span>}
        </label>
        <label>
          Species
          <input value={values.species} onChange={(event) => updateValue('species', event.target.value)} />
        </label>
        <label>
          Breed
          <input value={values.breed} onChange={(event) => updateValue('breed', event.target.value)} />
        </label>
        <label>
          Photo reference
          <input value={values.photoUrl} onChange={(event) => updateValue('photoUrl', event.target.value)} placeholder="URL or local reference" />
        </label>
        <label className="full-width-field">
          Feeding instructions
          <textarea rows={3} value={values.feedingInstructions} onChange={(event) => updateValue('feedingInstructions', event.target.value)} />
        </label>
        <label className="full-width-field">
          Medication
          <textarea rows={3} value={values.medication} onChange={(event) => updateValue('medication', event.target.value)} />
        </label>
        <label className="full-width-field">
          Behavior information
          <textarea rows={3} value={values.behaviorInfo} onChange={(event) => updateValue('behaviorInfo', event.target.value)} />
        </label>
        <label className="full-width-field">
          Care notes
          <textarea rows={3} value={values.careNotes} onChange={(event) => updateValue('careNotes', event.target.value)} />
        </label>
        <label className="full-width-field">
          Special instructions
          <textarea rows={3} value={values.specialInstructions} onChange={(event) => updateValue('specialInstructions', event.target.value)} />
        </label>
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save pet'}</button>
      </div>
    </form>
  )
}

export default PetForm
