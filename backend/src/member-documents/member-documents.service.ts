import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'
import { addMonths } from 'date-fns'

import { PrismaService } from '../prisma/prisma.service'
import { StorageService } from '../storage/storage.service'
import { isAllowedMime, MAX_FILE_SIZE_BYTES } from '../storage/storage.constants'
import type { ReviewDocumentDto } from './dto/member-document.dto'

// ─── Role helpers ─────────────────────────────────────────────────────────────

@Injectable()
export class MemberDocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  private async assertIsAdmin(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: { organisation_id: orgId, user_id: userId, deleted_at: null },
      include: { role: true },
    })
    if (!m || !['club_owner', 'club_manager'].includes(m.role.type)) {
      throw new ForbiddenException('Accès réservé aux gestionnaires du club.')
    }
  }

  private async assertIsMember(orgId: string, userId: string): Promise<void> {
    const m = await this.prisma.membership.findFirst({
      where: {
        organisation_id: orgId,
        user_id: userId,
        status: { notIn: ['resigned', 'banned', 'expired'] },
        deleted_at: null,
      },
    })
    if (!m) throw new ForbiddenException('Vous n\'êtes pas membre de cette organisation.')
  }

  private async findDocOrFail(docId: string, orgId: string) {
    const doc = await this.prisma.memberDocument.findFirst({
      where: { id: docId, organisation_id: orgId },
    })
    if (!doc) throw new NotFoundException('Document introuvable.')
    return doc
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  async upload(
    orgId: string,
    userId: string,
    requiredDocumentId: string,
    file: Express.Multer.File,
  ) {
    await this.assertIsMember(orgId, userId)

    if (!isAllowedMime(file.mimetype)) {
      throw new BadRequestException('Type de fichier non autorisé (PDF, JPG, PNG, WEBP uniquement).')
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (5 Mo maximum).')
    }

    const requiredDoc = await this.prisma.requiredDocument.findFirst({
      where: { id: requiredDocumentId, organisation_id: orgId },
    })
    if (!requiredDoc) throw new NotFoundException('Type de document introuvable.')

    // Block duplicate pending/approved-non-expired submissions
    const now = new Date()
    const existing = await this.prisma.memberDocument.findFirst({
      where: {
        user_id:              userId,
        organisation_id:      orgId,
        required_document_id: requiredDocumentId,
        OR: [
          { status: 'pending' },
          { status: 'approved', expires_at: null },
          { status: 'approved', expires_at: { gt: now } },
        ],
      },
    })
    if (existing) {
      throw new ConflictException(
        'Un document est déjà en cours de validation ou validé pour ce type.',
      )
    }

    const key = this.storage.generateKey(orgId, userId, file.originalname)
    await this.storage.uploadFile(file.buffer, key, file.mimetype)

    const expiresAt = requiredDoc.expires_after_months
      ? addMonths(new Date(), requiredDoc.expires_after_months)
      : null

    return this.prisma.memberDocument.create({
      data: {
        organisation_id:      orgId,
        user_id:              userId,
        required_document_id: requiredDocumentId,
        storage_key:          key,
        original_name:        file.originalname,
        mime_type:            file.mimetype,
        size_bytes:           file.size,
        expires_at:           expiresAt,
      },
    })
  }

  // ── Member: list own documents ─────────────────────────────────────────────

  async findMine(orgId: string, userId: string) {
    await this.assertIsMember(orgId, userId)

    return this.prisma.memberDocument.findMany({
      where: { organisation_id: orgId, user_id: userId },
      include: {
        required_document: {
          select: { id: true, name: true, category: true, expires_after_months: true },
        },
      },
      orderBy: { required_document: { name: 'asc' } },
    })
  }

  // ── Admin: list all documents ──────────────────────────────────────────────

  async findAll(orgId: string, userId: string, status?: string) {
    await this.assertIsAdmin(orgId, userId)

    return this.prisma.memberDocument.findMany({
      where: {
        organisation_id: orgId,
        ...(status ? { status: status as 'pending' | 'approved' | 'rejected' } : {}),
      },
      select: {
        id:           true,
        original_name: true,
        mime_type:    true,
        size_bytes:   true,
        status:       true,
        uploaded_at:  true,
        expires_at:   true,
        rejection_reason: true,
        // storage_key intentionally omitted for security
        user: {
          select: { id: true, firstname: true, lastname: true, email: true, avatar_url: true },
        },
        required_document: {
          select: { id: true, name: true, category: true },
        },
      },
      orderBy: { uploaded_at: 'desc' },
    })
  }

  // ── Signed URL ─────────────────────────────────────────────────────────────

  async getSignedUrl(orgId: string, docId: string, userId: string) {
    const doc = await this.findDocOrFail(docId, orgId)

    const isOwner = doc.user_id === userId
    if (!isOwner) await this.assertIsAdmin(orgId, userId)

    const url = await this.storage.getSignedUrl(doc.storage_key)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
    return { url, expiresAt }
  }

  // ── Review (approve / reject) ──────────────────────────────────────────────

  async review(orgId: string, docId: string, dto: ReviewDocumentDto, userId: string) {
    await this.assertIsAdmin(orgId, userId)
    const doc = await this.findDocOrFail(docId, orgId)

    if (doc.status !== 'pending') {
      throw new BadRequestException('Ce document a déjà été traité.')
    }

    // BUG 1 — Enforce rejection reason server-side
    if (dto.action === 'reject' && !dto.rejectionReason?.trim()) {
      throw new BadRequestException('Un motif de refus est obligatoire.')
    }

    let expiresAt = doc.expires_at
    if (dto.action === 'approve' && !expiresAt) {
      const requiredDoc = await this.prisma.requiredDocument.findUnique({
        where: { id: doc.required_document_id },
        select: { expires_after_months: true },
      })
      if (requiredDoc?.expires_after_months) {
        expiresAt = addMonths(new Date(), requiredDoc.expires_after_months)
      }
    }

    return this.prisma.memberDocument.update({
      where: { id: docId },
      data: {
        status:           dto.action === 'approve' ? 'approved' : 'rejected',
        rejection_reason: dto.action === 'reject' ? dto.rejectionReason : null,
        reviewed_by_id:   userId,
        reviewed_at:      new Date(),
        ...(dto.action === 'approve' && expiresAt ? { expires_at: expiresAt } : {}),
      },
    })
  }

  // ── Compliance ─────────────────────────────────────────────────────────────

  async getCompliance(orgId: string, userId: string) {
    await this.assertIsAdmin(orgId, userId)

    const [requiredDocs, activeMembers] = await Promise.all([
      this.prisma.requiredDocument.findMany({
        where: { organisation_id: orgId },
        orderBy: { name: 'asc' },
      }),
      this.prisma.membership.findMany({
        where: {
          organisation_id: orgId,
          status: 'active',
          deleted_at: null,
          role: { type: { in: ['member', 'coach'] } },
        },
        include: { user: { select: { id: true, firstname: true, lastname: true, avatar_url: true } } },
      }),
    ])

    const now = new Date()

    const rows = await Promise.all(
      activeMembers.map(async (m) => {
        const docs = await this.prisma.memberDocument.findMany({
          where: { organisation_id: orgId, user_id: m.user_id },
          orderBy: { uploaded_at: 'desc' },
        })

        const missing: string[] = []
        const expired: string[] = []
        const pending: string[] = []
        const rejected: string[] = []
        const approved: string[] = []

        for (const reqDoc of requiredDocs) {
          const memberDoc = docs.find((d) => d.required_document_id === reqDoc.id)

          if (!memberDoc) {
            if (reqDoc.required) { missing.push(reqDoc.name) }
          } else if (memberDoc.status === 'approved') {
            if (memberDoc.expires_at && memberDoc.expires_at < now) {
              if (reqDoc.required) { expired.push(reqDoc.name) }
            } else {
              approved.push(reqDoc.name)
            }
          } else if (memberDoc.status === 'pending') {
            pending.push(reqDoc.name)
          } else if (memberDoc.status === 'rejected') {
            if (reqDoc.required) { rejected.push(reqDoc.name) }
          } else {
            if (reqDoc.required) { missing.push(reqDoc.name) }
          }
        }

        // ok = only required docs matter; optional pending/rejected don't block conformity
        const ok = missing.length === 0 && expired.length === 0 && rejected.length === 0

        return {
          userId:      m.user_id,
          displayName: `${m.user.firstname} ${m.user.lastname}`,
          avatarUrl:   m.user.avatar_url ?? null,
          ok,
          approved,
          missing,
          expired,
          pending,
          rejected,
        }
      }),
    )

    return rows
  }
}
