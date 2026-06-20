/** Modèles métier — portail municipal (cible API P6). */

export type ActionPriority = 'critical' | 'warning' | 'opportunity'

export type DocumentStatus = 'valid' | 'expiring' | 'missing' | 'expired'

export type IncidentStatus = 'open' | 'in_progress' | 'resolved'

export type MaintenanceStatus = 'ok' | 'watch' | 'urgent'

export interface RequiredAction {
  id: string
  priority: ActionPriority
  title: string
  description: string
  href?: string
  entityType?: 'association' | 'facility' | 'room' | 'convention'
  entityId?: string
  dueLabel?: string
}

export interface PilotKpi {
  id: string
  label: string
  value: string
  sublabel?: string
  trend?: number
  href: string
  accent?: string
}

export interface AssociationDocument {
  id: string
  name: string
  type: 'insurance' | 'convention' | 'statutes' | 'safety' | 'other'
  status: DocumentStatus
  expiresAt?: string
}

export interface AssociationLeader {
  id: string
  name: string
  role: string
  email?: string
}

export interface AssociationSubsidy {
  id: string
  year: number
  amount: number
  label: string
}

export interface AssociationIncident {
  id: string
  date: string
  description: string
  status: IncidentStatus
}

export interface AssociationProfile {
  id: string
  name: string
  sport: string
  members: number
  status: 'active' | 'pending' | 'suspended'
  conventionUntil: string
  facilitiesUsed: string[]
  complianceScore: number
  complianceChecks: { label: string; ok: boolean }[]
  documents: AssociationDocument[]
  leaders: AssociationLeader[]
  subsidies: AssociationSubsidy[]
  incidents: AssociationIncident[]
  insuranceExpiry: string
}

export interface MaintenanceIntervention {
  id: string
  date: string
  label: string
  cost: number
  status: 'planned' | 'done'
}

export interface MaintenanceTicket {
  id: string
  date: string
  title: string
  reportedBy: string
  status: IncidentStatus
  hasPhoto?: boolean
}

export interface FacilityMaintenance {
  facilityId: string
  healthScore: number
  status: MaintenanceStatus
  risks: string[]
  budgetEngaged: number
  budgetForecast: number
  interventions: MaintenanceIntervention[]
  tickets: MaintenanceTicket[]
}

export interface SmartRecommendation {
  id: string
  type: 'underuse' | 'overload' | 'revenue' | 'inactive' | 'maintenance'
  title: string
  description: string
  impact?: string
  href?: string
}

export interface TerritoryPoint {
  id: string
  name: string
  type: 'facility' | 'association'
  lat: number
  lng: number
  occupancyRate: number
  weeklyVisitors?: number
}

export type EquipmentCondition = 'good' | 'worn' | 'repair' | 'out_of_service'

export type EquipmentHistoryAction = 'added' | 'removed' | 'adjusted'

export interface EquipmentItem {
  id: string
  facilityId: string
  roomId?: string
  name: string
  category: string
  quantity: number
  condition: EquipmentCondition
  notes?: string
}

export interface EquipmentHistoryEntry {
  id: string
  facilityId: string
  equipmentId: string
  itemName: string
  action: EquipmentHistoryAction
  quantityChange: number
  quantityAfter: number
  author: string
  date: string
  note?: string
}
