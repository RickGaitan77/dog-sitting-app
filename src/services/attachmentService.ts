import type {
  Attachment,
  AttachmentOwnerType,
} from '../Types'
import type { AppRepositories } from '../repositories'
import {
  createEntityId,
  type IdFactory,
} from './entityService'

export const SUPPORTED_ATTACHMENT_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const

export type CreateAttachmentInput = {
  ownerType: AttachmentOwnerType
  ownerId: string
  file: File
  notes?: string
}

export class AttachmentValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AttachmentValidationError'
  }
}

export class AttachmentFileNotFoundError extends Error {
  constructor(attachmentId: string) {
    super(`Stored file data for attachment "${attachmentId}" was not found.`)
    this.name = 'AttachmentFileNotFoundError'
  }
}

export class AttachmentService {
  private readonly repositories: AppRepositories
  private readonly idFactory: IdFactory

  constructor(
    repositories: AppRepositories,
    idFactory: IdFactory = createEntityId,
  ) {
    this.repositories = repositories
    this.idFactory = idFactory
  }

  getByOwner(
    ownerType: AttachmentOwnerType,
    ownerId: string,
  ): Promise<Attachment[]> {
    return this.repositories.attachments.getByOwner(ownerType, ownerId)
  }

  async getFile(attachmentId: string): Promise<Blob> {
    const storedBlob = await this.repositories.attachments.getBlob(attachmentId)

    if (storedBlob === undefined) {
      throw new AttachmentFileNotFoundError(attachmentId)
    }

    return storedBlob.data
  }

  async create(input: CreateAttachmentInput): Promise<Attachment> {
    await this.validateOwner(input.ownerType, input.ownerId)

    if (!SUPPORTED_ATTACHMENT_TYPES.includes(
      input.file.type as (typeof SUPPORTED_ATTACHMENT_TYPES)[number],
    )) {
      throw new AttachmentValidationError(
        'Choose a JPEG, PNG, WebP, or PDF file.',
      )
    }

    const attachment: Attachment = {
      id: this.idFactory(),
      ownerType: input.ownerType,
      ownerId: input.ownerId,
      fileName: input.file.name,
      mimeType: input.file.type,
      fileSize: input.file.size,
      createdAt: new Date().toISOString(),
      notes: input.notes?.trim() || undefined,
    }

    return this.repositories.attachments.addWithBlob(
      attachment,
      input.file,
    )
  }

  delete(attachmentId: string): Promise<void> {
    return this.repositories.attachments.deleteWithBlob(attachmentId)
  }

  private async validateOwner(
    ownerType: AttachmentOwnerType,
    ownerId: string,
  ): Promise<void> {
    if (ownerId === '') {
      throw new AttachmentValidationError('An attachment owner is required.')
    }

    const owner = ownerType === 'Client'
      ? await this.repositories.clients.getById(ownerId)
      : ownerType === 'Pet'
        ? await this.repositories.pets.getById(ownerId)
        : undefined

    if (owner === undefined) {
      throw new AttachmentValidationError(
        'The attachment owner could not be found.',
      )
    }
  }
}
