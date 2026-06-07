import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'
import type {
  CreateRequiredDocumentDto,
  UpdateRequiredDocumentDto,
} from './dto/required-document.dto'

// ─── Presets ──────────────────────────────────────────────────────────────────

interface PresetDoc {
  name: string
  description: string
  category: CreateRequiredDocumentDto['category']
  required: boolean
  expiresAfterMonths?: number
}

const DEFAULT_PRESETS: PresetDoc[] = [
  {
    name: 'Certificat médical',
    description: 'Non contre-indication à la pratique (moins d\'un an)',
    category: 'medical',
    required: true,
    expiresAfterMonths: 12,
  },
  {
    name: 'Photo d\'identité',
    description: 'Photo récente format JPG/PNG',
    category: 'identity',
    required: true,
  },
  {
    name: 'Pièce d\'identité',
    description: 'CNI ou passeport en cours de validité',
    category: 'identity',
    required: true,
  },
  {
    name: 'Attestation d\'assurance',
    description: 'Responsabilité civile',
    category: 'administrative',
    required: false,
    expiresAfterMonths: 12,
  },
  {
    name: 'Formulaire fédéral (B3)',
    description: 'Formulaire fédéral ou CERFA',
    category: 'administrative',
    required: false,
  },
]

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class RequiredDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  // ── Role assertions ────────────────────────────────────────────────────────

  /** Authenticated member OR admin — just needs to belong to the org. */
  private async assertIsMember(orgId: string, userId: string): Promise<void> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        status: { in: ['active', 'pending', 'suspended'] },
        deleted_at: null,
      },
    })
    if (!membership) {
      throw new ForbiddenException('Vous n\'êtes pas membre de cette organisation.')
    }
  }

  /** club_owner or club_manager only. */
  private async assertIsAdmin(orgId: string, userId: string): Promise<void> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        deleted_at: null,
      },
      include: { role: true },
    })
    if (!membership || !['club_owner', 'club_manager'].includes(membership.role.type)) {
      throw new ForbiddenException('Accès réservé aux gestionnaires du club.')
    }
  }

  /** club_owner only. */
  private async assertIsOwner(orgId: string, userId: string): Promise<void> {
    const membership = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        deleted_at: null,
      },
      include: { role: true },
    })
    if (!membership || membership.role.type !== 'club_owner') {
      throw new ForbiddenException('Accès réservé au propriétaire du club.')
    }
  }

  /** Resolve a RequiredDocument that belongs to the given org — throws 404 otherwise. */
  private async findOrFail(id: string, orgId: string) {
    const doc = await this.prisma.requiredDocument.findFirst({
      where: { id, organisation_id: orgId },
    })
    if (!doc) {
      throw new NotFoundException('Document requis introuvable.')
    }
    return doc
  }

  // ── CRUD ───────────────────────────────────────────────────────────────────

  async findAll(orgId: string, userId: string) {
    await this.assertIsMember(orgId, userId)
    return this.prisma.requiredDocument.findMany({
      where: { organisation_id: orgId },
      orderBy: { created_at: 'asc' },
    })
  }

  async create(orgId: string, dto: CreateRequiredDocumentDto, userId: string) {
    await this.assertIsAdmin(orgId, userId)
    return this.prisma.requiredDocument.create({
      data: {
        organisation_id:      orgId,
        name:                 dto.name,
        description:          dto.description,
        required:             dto.required ?? true,
        category:             dto.category ?? 'other',
        expires_after_months: dto.expiresAfterMonths,
      },
    })
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateRequiredDocumentDto,
    userId: string,
  ) {
    await this.assertIsAdmin(orgId, userId)
    await this.findOrFail(id, orgId)
    return this.prisma.requiredDocument.update({
      where: { id },
      data: {
        ...(dto.name !== undefined              && { name: dto.name }),
        ...(dto.description !== undefined      && { description: dto.description }),
        ...(dto.required !== undefined         && { required: dto.required }),
        ...(dto.category !== undefined         && { category: dto.category }),
        ...(dto.expiresAfterMonths !== undefined && { expires_after_months: dto.expiresAfterMonths }),
      },
    })
  }

  async remove(orgId: string, id: string, userId: string): Promise<void> {
    await this.assertIsAdmin(orgId, userId)
    await this.findOrFail(id, orgId)

    // Collect storage keys before cascade-delete wipes the MemberDocument rows
    const memberDocs = await this.prisma.memberDocument.findMany({
      where: { required_document_id: id },
      select: { storage_key: true },
    })

    await this.prisma.requiredDocument.delete({ where: { id } })

    // Fire-and-forget S3 cleanup — DB delete already committed, don't block the response
    for (const { storage_key } of memberDocs) {
      this.storage.deleteFile(storage_key).catch(() => {})
    }
  }

  /** Idempotent — seeds the 5 default presets only when the list is empty. */
  async seedDefaults(orgId: string, userId: string): Promise<{ created: number }> {
    await this.assertIsOwner(orgId, userId)

    const existing = await this.prisma.requiredDocument.count({
      where: { organisation_id: orgId },
    })
    if (existing > 0) {
      return { created: 0 }
    }

    await this.prisma.requiredDocument.createMany({
      data: DEFAULT_PRESETS.map((p) => ({
        organisation_id:      orgId,
        name:                 p.name,
        description:          p.description,
        required:             p.required,
        category:             p.category ?? 'other',
        expires_after_months: p.expiresAfterMonths,
      })),
    })

    return { created: DEFAULT_PRESETS.length }
  }
}
