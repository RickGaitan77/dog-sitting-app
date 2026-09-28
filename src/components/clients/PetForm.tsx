import { useState, type FormEvent } from 'react'
import type { Pet, PetImportantCare } from '../../Types'
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
  const [importantCare, setImportantCare] = useState<Required<PetImportantCare>>({
    feeding: pet?.importantCare?.feeding ?? false,
    medication: pet?.importantCare?.medication ?? false,
    behavior: pet?.importantCare?.behavior ?? false,
    careNotes: pet?.importantCare?.careNotes ?? false,
    specialInstructions: pet?.importantCare?.specialInstructions ?? false,
  })
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

  const updateImportantCare = (field: keyof PetImportantCare, value: boolean) => {
    setImportantCare((currentValues) => ({ ...currentValues, [field]: value }))
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
      importantCare: Object.values(importantCare).some(Boolean) ? importantCare : undefined,
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
        <div className="full-width-field pet-care-editor">
          <label htmlFor="pet-feeding-instructions">Feeding instructions</label>
          <textarea id="pet-feeding-instructions" rows={3} value={values.feedingInstructions} onChange={(event) => updateValue('feedingInstructions', event.target.value)} />
          <label className="pet-important-toggle">
            <input type="checkbox" checked={importantCare.feeding} onChange={(event) => updateImportantCare('feeding', event.target.checked)} />
            Mark Feeding as Important
          </label>
        </div>
        <div className="full-width-field pet-care-editor">
          <label htmlFor="pet-medication">Medication</label>
          <textarea id="pet-medication" rows={3} value={values.medication} onChange={(event) => updateValue('medication', event.target.value)} />
          <label className="pet-important-toggle">
            <input type="checkbox" checked={importantCare.medication} onChange={(event) => updateImportantCare('medication', event.target.checked)} />
            Mark Medication as Important
          </label>
        </div>
        <div className="full-width-field pet-care-editor">
          <label htmlFor="pet-behavior-information">Behavior information</label>
          <textarea id="pet-behavior-information" rows={3} value={values.behaviorInfo} onChange={(event) => updateValue('behaviorInfo', event.target.value)} />
          <label className="pet-important-toggle">
            <input type="checkbox" checked={importantCare.behavior} onChange={(event) => updateImportantCare('behavior', event.target.checked)} />
            Mark Behavior as Important
          </label>
        </div>
        <div className="full-width-field pet-care-editor">
          <label htmlFor="pet-care-notes">Care notes</label>
          <textarea id="pet-care-notes" rows={3} value={values.careNotes} onChange={(event) => updateValue('careNotes', event.target.value)} />
          <label className="pet-important-toggle">
            <input type="checkbox" checked={importantCare.careNotes} onChange={(event) => updateImportantCare('careNotes', event.target.checked)} />
            Mark Care Notes as Important
          </label>
        </div>
        <div className="full-width-field pet-care-editor">
          <label htmlFor="pet-special-instructions">Special instructions</label>
          <textarea id="pet-special-instructions" rows={3} value={values.specialInstructions} onChange={(event) => updateValue('specialInstructions', event.target.value)} />
          <label className="pet-important-toggle">
            <input type="checkbox" checked={importantCare.specialInstructions} onChange={(event) => updateImportantCare('specialInstructions', event.target.checked)} />
            Mark Special Instructions as Important
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button className="secondary-button" type="button" onClick={onCancel} disabled={isSaving}>Cancel</button>
        <button className="primary-button" type="submit" disabled={isSaving}>{isSaving ? 'Saving…' : 'Save pet'}</button>
      </div>
    </form>
  )
}

export default PetForm
