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
  archived: boolean
}