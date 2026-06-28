import type { RoleType } from '../types'
import { api } from './api'

export type WorkspaceKind = 'admin' | 'member' | 'coach' | 'family'

export interface Workspace {
  id: string
  kind: WorkspaceKind
  label: string
  subtitle: string
  path: string
  orgId?: string
  roleType?: RoleType
  logoUrl?: string | null
}

export type MyOrganisationItem = {
  organisation: {
    id: string
    name: string
    type: 'club' | 'association' | null
    description?: string | null
    logo_url?: string | null
  }
  role: { id: string; name: string; type: RoleType; level: number }
  joined_at: string
  status: string
}

const ROLE_LABELS: Record<RoleType, string> = {
  club_owner: 'Propriétaire',
  club_manager: 'Gestionnaire',
  treasurer: 'Trésorier',
  coach: 'Coach',
  member: 'Membre',
}

const ADMIN_ROLES: RoleType[] = ['club_owner', 'club_manager', 'treasurer']

export const getRoleLabel = (roleType: RoleType): string => ROLE_LABELS[roleType] ?? roleType

export const getOrganisationDestination = (roleType: RoleType, orgId: string): string => {
  if (ADMIN_ROLES.includes(roleType)) {
    return `/dashboard/${orgId}/overview`
  }
  if (roleType === 'coach') {
    return '/coach/dashboard'
  }
  return `/club/${orgId}`
}

export const mapRoleTypeToStoredRole = (
  roleType: RoleType,
): 'membre' | 'coach' | 'gestionnaire' | 'propriétaire' | 'trésorier' => {
  switch (roleType) {
    case 'club_owner':
      return 'propriétaire'
    case 'club_manager':
      return 'gestionnaire'
    case 'treasurer':
      return 'trésorier'
    case 'coach':
      return 'coach'
    default:
      return 'membre'
  }
}

export const buildWorkspacesFromMemberships = (items: MyOrganisationItem[]): Workspace[] => {
  const workspaces: Workspace[] = []
  let hasCoachRole = false

  for (const item of items) {
    if (!['active', 'pending', 'suspended'].includes(item.status)) continue

    const { organisation, role } = item
    const orgType = organisation.type || 'club'
    const kind: WorkspaceKind = ADMIN_ROLES.includes(role.type)
      ? 'admin'
      : role.type === 'coach'
        ? 'coach'
        : 'member'

    if (role.type === 'coach') hasCoachRole = true

    workspaces.push({
      id: `org:${organisation.id}`,
      kind,
      label: organisation.name,
      subtitle: getRoleLabel(role.type),
      path: getOrganisationDestination(role.type, organisation.id),
      orgId: organisation.id,
      roleType: role.type,
      logoUrl: organisation.logo_url ?? null,
    })
  }

  workspaces.push({
    id: 'space:family',
    kind: 'family',
    label: 'Ma famille',
    subtitle: 'Espace parent — enfants & inscriptions',
    path: '/club/famille',
  })

  if (hasCoachRole) {
    const alreadyHasCoachEntry = workspaces.some(w => w.kind === 'coach')
    if (!alreadyHasCoachEntry) {
      workspaces.push({
        id: 'space:coach',
        kind: 'coach',
        label: 'Espace coach',
        subtitle: 'Planning, progression, messages',
        path: '/coach/dashboard',
      })
    }
  }

  return workspaces
}

export interface StoredOrganisationSelection {
  id: string
  name: string
  type: 'club' | 'association' | 'independant'
  role: ReturnType<typeof mapRoleTypeToStoredRole>
  roleType: RoleType
  roleName: string
  membershipStatus?: string
}

export const persistOrganisationSelection = (params: {
  id: string
  name: string
  type: 'club' | 'association' | 'independant'
  roleType: RoleType
  roleName: string
  membershipStatus?: string
}): void => {
  api.clearCache()
  const payload: StoredOrganisationSelection = {
    id: params.id,
    name: params.name,
    type: params.type,
    role: mapRoleTypeToStoredRole(params.roleType),
    roleType: params.roleType,
    roleName: params.roleName,
    membershipStatus: params.membershipStatus,
  }
  localStorage.setItem('selectedOrganisation', JSON.stringify(payload))
  localStorage.setItem('activeWorkspaceId', `org:${params.id}`)
  window.dispatchEvent(new Event('organisation:updated'))
}

export const persistWorkspaceSelection = (workspace: Workspace): void => {
  localStorage.setItem('activeWorkspaceId', workspace.id)
  if (workspace.orgId && workspace.roleType) {
    persistOrganisationSelection({
      id: workspace.orgId,
      name: workspace.label,
      type: 'club',
      roleType: workspace.roleType,
      roleName: workspace.subtitle,
    })
    return
  }
  api.clearCache()
  window.dispatchEvent(new Event('organisation:updated'))
}

export const detectActiveWorkspaceId = (
  pathname: string,
  workspaces: Workspace[],
): string | null => {
  if (pathname.startsWith('/club/famille')) return 'space:family'
  if (pathname.startsWith('/coach/')) {
    const coachOrg = workspaces.find(w => w.kind === 'coach' && w.orgId)
    return coachOrg?.id ?? 'space:coach'
  }

  const dashboardMatch = pathname.match(/^\/dashboard\/([^/]+)/)
  if (dashboardMatch) {
    return `org:${dashboardMatch[1]}`
  }

  const clubMatch = pathname.match(/^\/club\/([^/]+)/)
  if (clubMatch && !['members', 'planning', 'professeurs', 'notifications', 'famille', 'coaches', 'galerie', 'actualites'].includes(clubMatch[1])) {
    return `org:${clubMatch[1]}`
  }

  const stored = localStorage.getItem('activeWorkspaceId')
  if (stored && workspaces.some(w => w.id === stored)) return stored

  try {
    const org = JSON.parse(localStorage.getItem('selectedOrganisation') ?? 'null') as { id?: string } | null
    if (org?.id) return `org:${org.id}`
  } catch {
    /* ignore */
  }

  return workspaces[0]?.id ?? null
}

export const KIND_META: Record<WorkspaceKind, { section: string; accent: string }> = {
  admin: { section: 'Gestion de club', accent: 'text-primary' },
  member: { section: 'Espace membre', accent: 'text-accent' },
  coach: { section: 'Espace coach', accent: 'text-emerald-600' },
  family: { section: 'Espace parent', accent: 'text-violet-600' },
}
