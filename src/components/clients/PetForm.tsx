import { useState, type FormEvent } from 'react'
import type { Pet, PetImportantCare } from '../../Types'
import type { NewEntity } from '../../services'

const SUPPORTED_PROFILE_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const

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

function readPhotoAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result)
      else reject(new Error('The selected photo could not be read.'))
    }
    reader.onerror = () => reject(reader.error ?? new Error('The selected photo could not be read.'))
    reader.readAsDataURL(file)
  })
}

function ProfilePhotoPreview({ name, photoUrl }: { name: string; photoUrl: string }) {
  const [hasError, setHasError] = useState(false)
  if (photoUrl === '') return null

  if (hasError) {
    return <p className="pet-profile-photo-error">The current profile photo could not be displayed.</p>
  }

  return (
    <img
      className="pet-profile-photo-preview"
      src={photoUrl}
      alt={`${name.trim() || 'Pet'} profile preview`}
      onError={() => setHasError(true)}
    />
  )
}

function PetForm({ clientId, pet, isSaving, onCancel, onSubmit }: PetFormProps) {
  const [nameError, setNameError] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoInputKey, setPhotoInputKey] = useState(0)
  const [isReadingPhoto, setIsReadingPhoto] = useState(false)
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

  const selectProfilePhoto = async (file: File | undefined) => {
    if (file === undefined) return

    if (!SUPPORTED_PROFILE_PHOTO_TYPES.includes(
      file.type as (typeof SUPPORTED_PROFILE_PHOTO_TYPES)[number],
    )) {
      setPhotoError('Choose a JPEG, PNG, or WebP image. PDFs and other file types are not supported.')
      setPhotoInputKey((currentKey) => currentKey + 1)
      return
    }

    setIsReadingPhoto(true)
    setPhotoError(null)
    try {
      updateValue('photoUrl', await readPhotoAsDataUrl(file))
    } catch (readError: unknown) {
      console.error('Failed to read Pet profile photo', readError)
      setPhotoError('The selected photo could not be read. Please choose another image.')
    } finally {
      setIsReadingPhoto(false)
    }
  }

  const removeProfilePhoto = () => {
    updateValue('photoUrl', '')
    setPhotoError(null)
    setPhotoInputKey((currentKey) => currentKey + 1)
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
        <section className="full-width-field pet-profile-photo-editor" aria-labelledby="pet-profile-photo-heading">
          <div>
            <h4 id="pet-profile-photo-heading">Profile Photo</h4>
            <p>JPEG, PNG, or WebP. The photo stays with this Pet on this device.</p>
          </div>
          {values.photoUrl !== '' && (
            <ProfilePhotoPreview
              key={values.photoUrl}
              name={values.name}
              photoUrl={values.photoUrl}
            />
          )}
          <div className="pet-profile-photo-actions">
            <label className={`secondary-button pet-profile-photo-button${isReadingPhoto ? ' disabled' : ''}`}>
              {isReadingPhoto ? 'Reading photo…' : values.photoUrl === '' ? 'Choose Photo' : 'Change Photo'}
              <input
                key={photoInputKey}
                type="file"
                accept={SUPPORTED_PROFILE_PHOTO_TYPES.join(',')}
                disabled={isReadingPhoto || isSaving}
                onChange={(event) => void selectProfilePhoto(event.target.files?.[0])}
              />
            </label>
            {values.photoUrl !== '' && (
              <button className="text-button danger-text" type="button" onClick={removeProfilePhoto} disabled={isReadingPhoto || isSaving}>Remove Photo</button>
            )}
          </div>
          {photoError !== null && <p className="field-error" role="alert">{photoError}</p>}
        </section>
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
        <button className="primary-button" type="submit" disabled={isSaving || isReadingPhoto}>{isSaving ? 'Saving…' : 'Save pet'}</button>
      </div>
    </form>
  )
}

export default PetForm
