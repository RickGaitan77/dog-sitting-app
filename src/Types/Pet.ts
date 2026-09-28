export type PetImportantCare = {
  feeding?: boolean
  medication?: boolean
  behavior?: boolean
  careNotes?: boolean
  specialInstructions?: boolean
}

export type Pet = {
  id: string
  clientId: string
  name: string
  species?: string
  breed?: string
  photoUrl?: string
  feedingInstructions?: string
  medication?: string
  behaviorInfo?: string
  careNotes?: string
  specialInstructions?: string
  importantCare?: PetImportantCare
  archived: boolean
}
