export type AttachmentOwnerType =
  | 'Client'
  | 'Pet'

export type Attachment = {
  id: string
  ownerType: AttachmentOwnerType
  ownerId: string
  fileName: string
  mimeType: string
  fileSize: number
  createdAt: string
  notes?: string
}