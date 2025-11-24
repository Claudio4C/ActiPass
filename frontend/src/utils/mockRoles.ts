import type { RoleType, Membership } from '../types'

/**
 * Simule le rôle d'un utilisateur pour une organisation donnée
 * TODO: Remplacer par un appel API réel
 */
export const getMockMembership = (organisationId: string): Membership => {
  // Mock data temporaire - tous les clubs ont le rôle club_owner par défaut
  // TODO: Remplacer par l'API réelle
  return {
    id: `mock-membership-${organisationId}`,
    organisationId,
    role: {
      id: `mock-role-${organisationId}`,
      name: 'Propriétaire',
      type: 'club_owner',
      level: 100,
    },
    joined_at: new Date().toISOString(),
  }
}

/**
 * Récupère le rôle d'un utilisateur pour une organisation
 */
export const getMockRole = (organisationId: string): RoleType => {
  return getMockMembership(organisationId).role.type
}
