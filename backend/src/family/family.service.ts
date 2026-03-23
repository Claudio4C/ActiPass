import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChildDto, UpdateChildDto, EnrollChildDto } from './dto';

@Injectable()
export class FamilyService {
  constructor(private readonly prisma: PrismaService) {}

  async createChild(parentId: string, dto: CreateChildDto) {
    const username = `child_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const email = `${username}@family.internal`;

    const child = await this.prisma.user.create({
      data: {
        firstname: dto.firstname,
        lastname: dto.lastname,
        birthdate: new Date(dto.birthdate + 'T00:00:00.000Z'),
        gender: dto.gender,
        phone: dto.phone ?? null,
        email,
        username,
        is_minor: true,
        is_email_verified: true,
        status: 'active',
      },
    });

    await this.prisma.familyLink.create({
      data: {
        parent_id: parentId,
        child_id: child.id,
        relationship: 'parent',
        is_primary_contact: true,
      },
    });

    return this.formatChild(child, 'parent', true);
  }

  async getChildren(parentId: string) {
    const links = await this.prisma.familyLink.findMany({
      where: { parent_id: parentId },
      include: {
        child: {
          include: {
            memberships: {
              where: { left_at: null, deleted_at: null },
              include: {
                organisation: { select: { id: true, name: true, type: true } },
                role: { select: { name: true, type: true } },
              },
            },
          },
        },
      },
    });

    return links.map((link) => this.formatChild(link.child, link.relationship, link.is_primary_contact));
  }

  async updateChild(parentId: string, childId: string, dto: UpdateChildDto) {
    await this.assertParentOwnsChild(parentId, childId);

    const child = await this.prisma.user.update({
      where: { id: childId },
      data: {
        ...(dto.firstname && { firstname: dto.firstname }),
        ...(dto.lastname && { lastname: dto.lastname }),
        ...(dto.birthdate && { birthdate: new Date(dto.birthdate + 'T00:00:00.000Z') }),
        ...(dto.gender && { gender: dto.gender }),
        phone: dto.phone ?? undefined,
      },
    });

    return this.formatChild(child, 'parent', true);
  }

  async removeChild(parentId: string, childId: string) {
    await this.assertParentOwnsChild(parentId, childId);

    await this.prisma.familyLink.delete({
      where: { parent_id_child_id: { parent_id: parentId, child_id: childId } },
    });

    return { message: 'Lien familial supprimé' };
  }

  async enrollChild(parentId: string, childId: string, dto: EnrollChildDto) {
    await this.assertParentOwnsChild(parentId, childId);

    const organisation = await this.prisma.organisation.findUnique({
      where: { id: dto.organisation_id },
    });
    if (!organisation) {
      throw new NotFoundException('Organisation introuvable');
    }

    const existingMembership = await this.prisma.membership.findFirst({
      where: { user_id: childId, organisation_id: dto.organisation_id, left_at: null },
    });
    if (existingMembership) {
      throw new ConflictException("L'enfant est déjà inscrit dans cette organisation");
    }

    const memberRole = await this.prisma.role.findFirst({
      where: { type: 'member' },
    });
    if (!memberRole) {
      throw new BadRequestException('Rôle membre introuvable');
    }

    const membership = await this.prisma.membership.create({
      data: {
        user_id: childId,
        organisation_id: dto.organisation_id,
        role_id: memberRole.id,
        status: 'pending',
      },
      include: {
        organisation: { select: { id: true, name: true, type: true } },
        role: { select: { name: true, type: true } },
      },
    });

    return {
      message: 'Enfant inscrit avec succès',
      membership: {
        id: membership.id,
        organisation: membership.organisation,
        role: membership.role,
        status: membership.status,
        joined_at: membership.joined_at,
      },
    };
  }

  async getFamilyDashboard(parentId: string) {
    const links = await this.prisma.familyLink.findMany({
      where: { parent_id: parentId },
      include: {
        child: {
          include: {
            memberships: {
              where: { left_at: null, deleted_at: null, status: 'active' },
              include: {
                organisation: { select: { id: true, name: true } },
              },
            },
            attendances: {
              where: {
                event: { start_time: { gte: new Date() } },
              },
              include: {
                event: {
                  select: {
                    id: true,
                    title: true,
                    start_time: true,
                    end_time: true,
                    location: true,
                    organisation: { select: { id: true, name: true } },
                  },
                },
              },
              orderBy: { event: { start_time: 'asc' } },
              take: 5,
            },
          },
        },
      },
    });

    return {
      children: links.map((link) => ({
        id: link.child.id,
        firstname: link.child.firstname,
        lastname: link.child.lastname,
        birthdate: link.child.birthdate,
        relationship: link.relationship,
        organisations: link.child.memberships.map((m) => m.organisation),
        upcoming_events: link.child.attendances.map((a) => a.event),
      })),
    };
  }

  private async assertParentOwnsChild(parentId: string, childId: string) {
    const link = await this.prisma.familyLink.findUnique({
      where: { parent_id_child_id: { parent_id: parentId, child_id: childId } },
    });
    if (!link) {
      throw new ForbiddenException("Cet enfant n'est pas rattaché à votre compte");
    }
    return link;
  }

  private formatChild(child: any, relationship: string, is_primary_contact: boolean) {
    return {
      id: child.id,
      firstname: child.firstname,
      lastname: child.lastname,
      birthdate: child.birthdate,
      gender: child.gender,
      phone: child.phone,
      relationship,
      is_primary_contact,
      memberships: child.memberships ?? [],
    };
  }
}
