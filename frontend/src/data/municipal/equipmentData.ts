import type { EquipmentItem, EquipmentHistoryEntry } from '../../types/municipal'

export const EQUIPMENT_CATEGORIES = [
  'Sport',
  'Sécurité',
  'Mobilier',
  'Électronique',
  'Entretien',
] as const

export const initialEquipment: EquipmentItem[] = [
  { id: 'eq1', facilityId: 'f1', roomId: 'r1', name: 'Tatamis', category: 'Sport', quantity: 20, condition: 'good' },
  { id: 'eq2', facilityId: 'f1', roomId: 'r1', name: 'Tapis de sol amortissant', category: 'Sport', quantity: 4, condition: 'worn', notes: 'À remplacer fin 2026' },
  { id: 'eq3', facilityId: 'f1', roomId: 'r2', name: 'Paniers de basket', category: 'Sport', quantity: 6, condition: 'good' },
  { id: 'eq4', facilityId: 'f1', roomId: 'r2', name: 'Ballons multisports', category: 'Sport', quantity: 24, condition: 'good' },
  { id: 'eq5', facilityId: 'f1', roomId: 'r2', name: 'Projecteurs LED', category: 'Électronique', quantity: 8, condition: 'repair', notes: '2 projecteurs clignotants' },
  { id: 'eq6', facilityId: 'f1', roomId: 'r3', name: 'Bancs repliables', category: 'Mobilier', quantity: 30, condition: 'good' },
  { id: 'eq7', facilityId: 'f1', roomId: 'r3', name: 'Matelas de gymnastique', category: 'Sport', quantity: 12, condition: 'worn' },
  { id: 'eq8', facilityId: 'f1', name: 'Extincteurs', category: 'Sécurité', quantity: 6, condition: 'good' },
  { id: 'eq9', facilityId: 'f1', name: 'Trousse de premiers secours', category: 'Sécurité', quantity: 3, condition: 'good' },
  { id: 'eq10', facilityId: 'f2', roomId: 'r4', name: 'Filets de tennis', category: 'Sport', quantity: 2, condition: 'good' },
  { id: 'eq11', facilityId: 'f2', roomId: 'r4', name: 'Balles de tennis', category: 'Sport', quantity: 48, condition: 'good' },
  { id: 'eq12', facilityId: 'f2', roomId: 'r5', name: 'Chaises arbitre', category: 'Mobilier', quantity: 2, condition: 'good' },
  { id: 'eq13', facilityId: 'f2', name: 'Aspirateur industriel', category: 'Entretien', quantity: 1, condition: 'repair' },
]

export const initialEquipmentHistory: EquipmentHistoryEntry[] = [
  {
    id: 'h1', facilityId: 'f1', equipmentId: 'eq1', itemName: 'Tatamis',
    action: 'added', quantityChange: 4, quantityAfter: 20, author: 'Service sports', date: '2026-05-12T10:30:00',
    note: 'Réception lot annuel dojo',
  },
  {
    id: 'h2', facilityId: 'f1', equipmentId: 'eq5', itemName: 'Projecteurs LED',
    action: 'adjusted', quantityChange: -2, quantityAfter: 8, author: 'Agent technique', date: '2026-06-02T14:15:00',
    note: '2 unités envoyées en réparation',
  },
  {
    id: 'h3', facilityId: 'f1', equipmentId: 'eq4', itemName: 'Ballons multisports',
    action: 'removed', quantityChange: -6, quantityAfter: 24, author: 'Basket ASSR', date: '2026-06-08T09:00:00',
    note: 'Ballons usés retirés du stock',
  },
  {
    id: 'h4', facilityId: 'f2', equipmentId: 'eq11', itemName: 'Balles de tennis',
    action: 'added', quantityChange: 12, quantityAfter: 48, author: 'Tennis Club', date: '2026-06-01T11:00:00',
  },
]
