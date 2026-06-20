import type {
  RequiredAction, PilotKpi, AssociationProfile, FacilityMaintenance,
  SmartRecommendation, TerritoryPoint,
} from '../../types/municipal'
import { facilities, MUNICIPALITY } from './mockData'

export const requiredActions: RequiredAction[] = [
  {
    id: 'act-1',
    priority: 'critical',
    title: 'Assurance du Judo Club expirée dans 12 jours',
    description: 'Renouvellement obligatoire avant toute reprise des créneaux au Dojo.',
    href: '/municipalite/dashboard/associations/a1',
    entityType: 'association',
    entityId: 'a1',
    dueLabel: 'J-12',
  },
  {
    id: 'act-2',
    priority: 'warning',
    title: 'Convention de mise à disposition à renouveler',
    description: 'Basket ASSR — échéance le 30 septembre 2026. Signature électronique en attente.',
    href: '/municipalite/dashboard/associations/a2',
    entityType: 'convention',
    entityId: 'a2',
    dueLabel: '45 j',
  },
  {
    id: 'act-3',
    priority: 'warning',
    title: 'Gymnase Jean Jaurès : maintenance préventive recommandée',
    description: 'Contrôle chauffage et éclairage salle polyvalente planifié par le service technique.',
    href: '/municipalite/dashboard/patrimoine/f1',
    entityType: 'facility',
    entityId: 'f1',
  },
  {
    id: 'act-4',
    priority: 'opportunity',
    title: 'Créneau libre récurrent le mardi 14h–17h',
    description: 'Salle polyvalente — possibilité d\'accueillir une nouvelle association ou location ponctuelle.',
    href: '/municipalite/dashboard/infrastructures/r3',
    entityType: 'room',
    entityId: 'r3',
  },
  {
    id: 'act-5',
    priority: 'opportunity',
    title: 'Opportunité de revenus estimée : +2 300 €/an',
    description: 'Ouverture du créneau vacance du Dojo (38 % libre) à la location associative.',
    href: '/municipalite/dashboard/statistiques',
  },
]

export const pilotKpis: PilotKpi[] = [
  { id: 'k1', label: "Taux d'occupation", value: '72,4 %', trend: 4.2, href: '/municipalite/dashboard/statistiques', accent: 'bg-[hsl(280,70%,60%/0.12)] text-[hsl(280,70%,50%)]' },
  { id: 'k2', label: 'Revenus générés', value: '18 420 €', sublabel: 'ce mois', trend: 8.1, href: '/municipalite/dashboard/statistiques', accent: 'bg-[hsl(160_84%_39%/0.12)] text-[hsl(160,84%,32%)]' },
  { id: 'k3', label: 'Documents à régulariser', value: '7', href: '/municipalite/dashboard/associations', accent: 'bg-amber-500/10 text-amber-700' },
  { id: 'k4', label: 'Interventions équipements', value: '3', href: '/municipalite/dashboard/patrimoine', accent: 'bg-destructive/10 text-destructive' },
  { id: 'k5', label: 'Associations conformes', value: '21/24', sublabel: '87 %', href: '/municipalite/dashboard/associations', accent: 'bg-primary/10 text-primary' },
  { id: 'k6', label: 'Heures inutilisées', value: '142 h', sublabel: 'ce mois', href: '/municipalite/dashboard/statistiques' },
  { id: 'k7', label: 'Économies potentielles', value: '4 800 €', trend: 12, href: '/municipalite/dashboard/rapports' },
  { id: 'k8', label: "Valeur d'usage", value: '94 %', sublabel: 'patrimoine actif', href: '/municipalite/dashboard/patrimoine' },
]

export const associationProfiles: AssociationProfile[] = [
  {
    id: 'a1', name: 'Judo Club Saint-Rivière', sport: 'Judo', members: 142, status: 'active',
    conventionUntil: '2026-12-31', facilitiesUsed: ['Gymnase Jean Jaurès — Dojo'],
    complianceScore: 94,
    complianceChecks: [
      { label: 'Documents à jour', ok: true },
      { label: 'Assurance valide', ok: false },
      { label: 'Convention signée', ok: true },
    ],
    insuranceExpiry: '2026-06-27',
    documents: [
      { id: 'd1', name: 'Attestation RC', type: 'insurance', status: 'expiring', expiresAt: '2026-06-27' },
      { id: 'd2', name: 'Convention MàD 2025', type: 'convention', status: 'valid', expiresAt: '2026-12-31' },
      { id: 'd3', name: 'Statuts associatifs', type: 'statutes', status: 'valid' },
    ],
    leaders: [
      { id: 'l1', name: 'Marc Dubois', role: 'Président', email: 'm.dubois@judo-sr.fr' },
      { id: 'l2', name: 'Sophie Martin', role: 'Trésorière' },
    ],
    subsidies: [
      { id: 's1', year: 2025, amount: 8500, label: 'Fonctionnement' },
      { id: 's2', year: 2024, amount: 7200, label: 'Fonctionnement' },
    ],
    incidents: [{ id: 'i1', date: '2026-03-12', description: 'Tatami glissant signalé', status: 'resolved' }],
  },
  {
    id: 'a2', name: 'Basket ASSR', sport: 'Basketball', members: 89, status: 'active',
    conventionUntil: '2026-09-30', facilitiesUsed: ['Gymnase Jean Jaurès — Court principal'],
    complianceScore: 78,
    complianceChecks: [
      { label: 'Documents à jour', ok: true },
      { label: 'Assurance valide', ok: true },
      { label: 'Convention signée', ok: false },
    ],
    insuranceExpiry: '2027-01-15',
    documents: [
      { id: 'd4', name: 'RC Pro', type: 'insurance', status: 'valid', expiresAt: '2027-01-15' },
      { id: 'd5', name: 'Convention MàD', type: 'convention', status: 'expiring', expiresAt: '2026-09-30' },
    ],
    leaders: [{ id: 'l3', name: 'Karim Benali', role: 'Président' }],
    subsidies: [{ id: 's3', year: 2025, amount: 12000, label: 'Équipement' }],
    incidents: [],
  },
  {
    id: 'a3', name: 'Tennis Club Municipal', sport: 'Tennis', members: 210, status: 'active',
    conventionUntil: '2027-06-30', facilitiesUsed: ['Complexe tennis — Courts 1-4'],
    complianceScore: 98,
    complianceChecks: [
      { label: 'Documents à jour', ok: true },
      { label: 'Assurance valide', ok: true },
      { label: 'Convention signée', ok: true },
    ],
    insuranceExpiry: '2027-03-01',
    documents: [{ id: 'd6', name: 'Pack conformité 2026', type: 'safety', status: 'valid' }],
    leaders: [{ id: 'l4', name: 'Claire Rousseau', role: 'Directrice' }],
    subsidies: [{ id: 's4', year: 2025, amount: 15000, label: 'Investissement courts' }],
    incidents: [],
  },
]

export const facilityMaintenance: FacilityMaintenance[] = [
  {
    facilityId: 'f1',
    healthScore: 82,
    status: 'watch',
    risks: ['Chauffage à contrôler (salle polyvalente)', 'Éclairage proche fin de vie (court principal)'],
    budgetEngaged: 12400,
    budgetForecast: 18200,
    interventions: [
      { id: 'm1', date: '2026-04-10', label: 'Contrôle chauffage', cost: 2200, status: 'planned' },
      { id: 'm2', date: '2026-01-22', label: 'Remplacement projecteurs', cost: 3800, status: 'done' },
    ],
    tickets: [
      { id: 't1', date: '2026-06-10', title: 'Porte vestiaire bloquée', reportedBy: 'Responsable Dojo', status: 'open', hasPhoto: true },
      { id: 't2', date: '2026-05-28', title: 'Fuite robinet douches', reportedBy: 'Agent d\'accueil', status: 'in_progress' },
    ],
  },
  {
    facilityId: 'f2',
    healthScore: 91,
    status: 'ok',
    risks: ['Réservation estivale à anticiper'],
    budgetEngaged: 3200,
    budgetForecast: 5500,
    interventions: [{ id: 'm3', date: '2026-03-05', label: 'Entretien surfaces', cost: 3200, status: 'done' }],
    tickets: [],
  },
]

export const smartRecommendations: SmartRecommendation[] = [
  {
    id: 'r1', type: 'underuse',
    title: 'Le Dojo est libre 38 % du temps',
    description: 'Optimisez les mardis 14h–17h ou proposez une convention complémentaire.',
    impact: '+2 300 €/an estimés',
    href: '/municipalite/dashboard/infrastructures/r1',
  },
  {
    id: 'r2', type: 'overload',
    title: 'Complexe tennis : saturation prévue en septembre',
    description: 'Le modèle prévoit 95 % d\'occupation à la rentrée. Anticiper les créneaux école.',
    href: '/municipalite/dashboard/statistiques',
  },
  {
    id: 'r3', type: 'inactive',
    title: 'Gymnastique Rivière — activité en baisse',
    description: 'Fréquentation −22 % sur 6 mois. Proposer un accompagnement ou révision de créneaux.',
    href: '/municipalite/dashboard/associations/a4',
  },
  {
    id: 'r4', type: 'revenue',
    title: 'Créneau libre récurrent identifié',
    description: 'Mardi 14h–17h, salle polyvalente — location ponctuelle recommandée.',
    impact: '+1 100 €/trimestre',
  },
]

export const territoryPoints: TerritoryPoint[] = [
  { id: 'f1', name: 'Gymnase Jean Jaurès', type: 'facility', lat: 43.604, lng: 1.444, occupancyRate: 78, weeklyVisitors: 1240 },
  { id: 'f2', name: 'Complexe tennis', type: 'facility', lat: 43.608, lng: 1.452, occupancyRate: 65, weeklyVisitors: 890 },
  { id: 'a1', name: 'Judo Club', type: 'association', lat: 43.605, lng: 1.445, occupancyRate: 92 },
  { id: 'a3', name: 'Tennis Club', type: 'association', lat: 43.608, lng: 1.451, occupancyRate: 70 },
]

export function getAssociationProfile(id: string): AssociationProfile | undefined {
  return associationProfiles.find(a => a.id === id)
}

export function getFacilityMaintenance(facilityId: string): FacilityMaintenance | undefined {
  return facilityMaintenance.find(m => m.facilityId === facilityId)
}

export function getFacilityById(facilityId: string) {
  return facilities.find(f => f.id === facilityId)
}

export { MUNICIPALITY }
