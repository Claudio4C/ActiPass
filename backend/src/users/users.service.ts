import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { User, SafeUser } from '../types/user.types';

import { UpdateUserDto } from './dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, deleted_at: null },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email, deleted_at: null },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username, deleted_at: null },
    });
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.prisma.user.update({
      where: { id },
      data: { last_login_at: new Date() },
    });
  }

  sanitizeUser(user: User): SafeUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  /**
   * Récupérer le profil d'un utilisateur
   */
  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer les organisations de l'utilisateur via les membreships
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        left_at: null,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
          },
        },
      },
    });

    return {
      user: this.sanitizeUser(user),
      organisations: memberships.map((membership) => ({
        organisation: membership.organisation,
        role: membership.role,
        joined_at: membership.joined_at,
      })),
    };
  }

  /**
   * Modifier le profil d'un utilisateur
   */
  async updateUserProfile(userId: string, updateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });

    return {
      message: 'Profil mis à jour avec succès',
      user: this.sanitizeUser(updatedUser),
    };
  }

  /**
   * Récupérer les organisations d'un utilisateur
   */
  async getUserOrganisations(userId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        left_at: null,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            created_at: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
          },
        },
      },
    });

    return memberships.map((membership) => ({
      organisation: membership.organisation,
      role: membership.role,
      joined_at: membership.joined_at,
    }));
  }

  /**
   * Récupérer les permissions d'un utilisateur (simplifié)
   */
  async getUserPermissions(userId: string) {
    // Pour l'instant, retourner les rôles de l'utilisateur
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        left_at: null,
      },
      include: {
        role: true,
        organisation: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
      },
    });

    return {
      user_id: userId,
      roles: memberships.map((membership) => ({
        role: membership.role,
        organisation: membership.organisation,
      })),
    };
  }

  /**
   * Récupérer un utilisateur spécifique (admin)
   */
  async getUser(userId: string, requesterId: string) {
    // Vérifier que le demandeur a le droit de voir cet utilisateur
    const requesterMembership = await this.prisma.membership.findFirst({
      where: {
        user_id: requesterId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'municipal_manager'] as ('club_owner' | 'municipal_manager')[],
          },
        },
      },
    });

    if (!requesterMembership) {
      throw new ForbiddenException("Vous n'avez pas le droit de voir cet utilisateur");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Récupérer les organisations de l'utilisateur
    const memberships = await this.prisma.membership.findMany({
      where: {
        user_id: userId,
        left_at: null,
      },
      include: {
        organisation: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            type: true,
            level: true,
          },
        },
      },
    });

    return {
      user: this.sanitizeUser(user),
      organisations: memberships.map((membership) => ({
        organisation: membership.organisation,
        role: membership.role,
        joined_at: membership.joined_at,
      })),
    };
  }

  /**
   * Modifier un utilisateur (admin)
   */
  async updateUser(userId: string, updateUserDto: UpdateUserDto, requesterId: string) {
    // Vérifier que le demandeur a le droit de modifier cet utilisateur
    const requesterMembership = await this.prisma.membership.findFirst({
      where: {
        user_id: requesterId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'municipal_manager'] as ('club_owner' | 'municipal_manager')[],
          },
        },
      },
    });

    if (!requesterMembership) {
      throw new ForbiddenException("Vous n'avez pas le droit de modifier cet utilisateur");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateUserDto,
    });

    return {
      message: 'Utilisateur mis à jour avec succès',
      user: this.sanitizeUser(updatedUser),
    };
  }

  /**
   * Supprimer un utilisateur (admin)
   */
  async deleteUser(userId: string, requesterId: string) {
    // Vérifier que le demandeur a le droit de supprimer cet utilisateur
    const requesterMembership = await this.prisma.membership.findFirst({
      where: {
        user_id: requesterId,
        left_at: null,
        role: {
          type: {
            in: ['club_owner', 'municipal_manager'] as ('club_owner' | 'municipal_manager')[],
          },
        },
      },
    });

    if (!requesterMembership) {
      throw new ForbiddenException("Vous n'avez pas le droit de supprimer cet utilisateur");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id: userId },
      data: { deleted_at: new Date() },
    });

    return { message: 'Utilisateur supprimé avec succès' };
  }
}
