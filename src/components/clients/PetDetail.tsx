import { useState } from 'react'
import type { Client, Pet, PetImportantCare } from '../../Types'
import AttachmentSection from '../attachments/AttachmentSection'
import UrgencyIndicator from '../urgency/UrgencyIndicator'
import { urgencyClassName } from '../../utils/urgency'

type PetDetailProps = {
  client: Client
  isSaving: boolean
  pet: Pet
  onArchive: (pet: Pet) => void
  onClose: () => void
  onEdit: (pet: Pet) => void
}

type CareSection = {
  emptyText: string
  importantKey: keyof PetImportantCare
  label: string
  medication?: boolean
  value?: string
}

function PetDetailPhoto({ pet }: { pet: Pet }) {
  const [hasError, setHasError] = useState(false)
  if (pet.photoUrl === undefined || hasError) return null

  return (
    <img
      className="pet-detail-photo"
      src={pet.photoUrl}
      alt={pet.name}
      onError={() => setHasError(true)}
    />
  )
}

function CareSectionCard({
  animateImportant,
  section,
  pet,
}: {
  animateImportant: boolean
  section: CareSection
  pet: Pet
}) {
  const isImportant = pet.importantCare?.[section.importantKey] === true
  const className = [
    'pet-care-section',
    section.medication ? 'pet-medication-section' : '',
    isImportant ? 'pet-care-important' : '',
    isImportant
      ? urgencyClassName({ level: 2, animate: animateImportant })
      : '',
  ].filter(Boolean).join(' ')

  return (
    <section className={className} aria-label={`${section.label}${isImportant ? ', Important' : ''}`}>
      <div className="pet-care-heading">
        <h4>{section.medication && <span aria-hidden="true">✚ </span>}{section.label}</h4>
        {isImportant && (
          <UrgencyIndicator
            level={2}
            animate={animateImportant}
            compact
            icon="★"
            label="Important"
          />
        )}
      </div>
      <p className={section.value ? undefined : 'pet-care-empty'}>{section.value || section.emptyText}</p>
    </section>
  )
}

function PetDetail({ client, isSaving, pet, onArchive, onClose, onEdit }: PetDetailProps) {
  const careSections: CareSection[] = [
    { label: 'Feeding', value: pet.feedingInstructions, emptyText: 'No feeding instructions', importantKey: 'feeding' },
    { label: 'Medication', value: pet.medication, emptyText: 'No medication', importantKey: 'medication', medication: true },
    { label: 'Behavior', value: pet.behaviorInfo, emptyText: 'No behavior notes', importantKey: 'behavior' },
    { label: 'Care Notes', value: pet.careNotes, emptyText: 'No care notes', importantKey: 'careNotes' },
    { label: 'Special Instructions', value: pet.specialInstructions, emptyText: 'No special instructions', importantKey: 'specialInstructions' },
  ]
  const visibleSections = careSections.filter(
    (section) => section.value !== undefined || pet.importantCare?.[section.importantKey] === true,
  )
  const emptySections = careSections.filter(
    (section) => section.value === undefined && pet.importantCare?.[section.importantKey] !== true,
  )
  const firstImportantKey = visibleSections.find(
    (section) => pet.importantCare?.[section.importantKey] === true,
  )?.importantKey

  return (
    <article className="pet-detail-card client-selected-pet">
      <header className="pet-detail-identity">
        <PetDetailPhoto key={pet.photoUrl ?? 'no-photo'} pet={pet} />
        <div className="pet-detail-identity-copy">
          <p className="eyebrow">Pet details</p>
          <h3>{pet.name}</h3>
          <p className="pet-detail-kind">{[pet.species, pet.breed].filter(Boolean).join(' · ') || 'Species and breed not provided'}</p>
          <p className="pet-detail-client">Client: <strong>{client.name}</strong></p>
        </div>
        <div className="pet-detail-header-actions">
          {pet.archived && <span className="client-status">Archived</span>}
          <button className="text-button" type="button" onClick={onClose}>Close</button>
        </div>
      </header>

      <div className="pet-care-grid">
        {visibleSections.map((section) => (
          <CareSectionCard
            key={section.importantKey}
            section={section}
            pet={pet}
            animateImportant={section.importantKey === firstImportantKey}
          />
        ))}
        {emptySections.length > 0 && (
          <section className="pet-care-section pet-care-empty-summary" aria-label="Other care information">
            <h4>Other care information</h4>
            <ul>
              {emptySections.map((section) => <li key={section.importantKey}>{section.emptyText}</li>)}
            </ul>
          </section>
        )}
      </div>

      <section className="pet-detail-section pet-documents-section" aria-label="Pet documents">
        <AttachmentSection
          ownerType="Pet"
          ownerId={pet.id}
          ownerName={pet.name}
          heading="Documents"
          emptyTitle="No documents added"
        />
      </section>

      <footer className="pet-detail-actions" aria-label="Pet record actions">
        <button className="secondary-button" type="button" onClick={() => onEdit(pet)}>Edit pet</button>
        <button className="danger-button" type="button" onClick={() => onArchive(pet)} disabled={isSaving}>Archive pet</button>
      </footer>
    </article>
  )
}

export default PetDetail
