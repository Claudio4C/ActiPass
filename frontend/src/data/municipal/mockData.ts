/** Données de démo — portail municipal (en attendant l'API P6). */

export const MUNICIPALITY = {
  id: 'muni-demo',
  name: 'Ville de Saint-Rivière',
  department: 'Haute-Garonne (31)',
}

export interface MunicipalAssociation {
  id: string
  name: string
  sport: string
  members: number
  status: 'active' | 'pending' | 'suspended'
  conventionUntil: string
  facilitiesUsed: string[]
}

export interface MunicipalRoom {
  id: string
  facilityId: string
  name: string
  areaSqm: number
  capacity: number
  occupancyRate: number
  weeklyHours: number
  monthlyRevenue: number
}

export interface MunicipalFacility {
  id: string
  name: string
  address: string
  rooms: MunicipalRoom[]
  occupancyRate: number
  monthlyRevenue: number
}

export interface TimeSlotAssignment {
  id: string
  roomId: string
  clubName: string
  sport: string
  day: Weekday
  start: string
  end: string
  recurring: boolean
}

export const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const
export type Weekday = (typeof WEEKDAYS)[number]

export const SCHEDULE_HOUR_START = 8
export const SCHEDULE_HOUR_END = 22

export const slotAssignments: TimeSlotAssignment[] = [
  // Dojo — Judo puis Karaté le mardi
  { id: 's1', roomId: 'r1', clubName: 'Judo Club Saint-Rivière', sport: 'Judo', day: 'Mardi', start: '18:00', end: '21:00', recurring: true },
  { id: 's1b', roomId: 'r1', clubName: 'Karaté Club Saint-Rivière', sport: 'Karaté', day: 'Mardi', start: '16:00', end: '18:00', recurring: true },
  { id: 's2', roomId: 'r1', clubName: 'Judo Club Saint-Rivière', sport: 'Judo', day: 'Jeudi', start: '19:00', end: '21:00', recurring: true },
  { id: 's2b', roomId: 'r1', clubName: 'Karaté Club Saint-Rivière', sport: 'Karaté', day: 'Jeudi', start: '17:00', end: '19:00', recurring: true },
  { id: 's2c', roomId: 'r1', clubName: 'Karaté Club Saint-Rivière', sport: 'Karaté', day: 'Samedi', start: '10:00', end: '12:00', recurring: true },
  // Court principal — Basket
  { id: 's3', roomId: 'r2', clubName: 'Basket ASSR', sport: 'Basketball', day: 'Mercredi', start: '18:30', end: '20:30', recurring: true },
  { id: 's4', roomId: 'r2', clubName: 'Basket ASSR', sport: 'Basketball', day: 'Samedi', start: '10:00', end: '12:00', recurring: true },
  { id: 's4b', roomId: 'r2', clubName: 'Basket ASSR', sport: 'Basketball', day: 'Vendredi', start: '20:00', end: '22:00', recurring: true },
  // Salle polyvalente
  { id: 's5', roomId: 'r3', clubName: 'Gymnastique Rivière', sport: 'Gymnastique', day: 'Mercredi', start: '17:00', end: '19:00', recurring: true },
  { id: 's6', roomId: 'r3', clubName: 'Gymnastique Rivière', sport: 'Gymnastique', day: 'Vendredi', start: '18:00', end: '20:00', recurring: true },
  { id: 's6b', roomId: 'r3', clubName: 'Danse & Mouvement', sport: 'Danse', day: 'Mardi', start: '14:00', end: '17:00', recurring: true },
  // Tennis
  { id: 's7', roomId: 'r4', clubName: 'Tennis Club Municipal', sport: 'Tennis', day: 'Lundi', start: '09:00', end: '12:00', recurring: true },
  { id: 's8', roomId: 'r4', clubName: 'Tennis Club Municipal', sport: 'Tennis', day: 'Mercredi', start: '14:00', end: '18:00', recurring: true },
  { id: 's9', roomId: 'r5', clubName: 'Tennis Club Municipal', sport: 'Tennis', day: 'Mardi', start: '10:00', end: '13:00', recurring: true },
  { id: 's10', roomId: 'r5', clubName: 'Tennis Club Municipal', sport: 'Tennis', day: 'Jeudi', start: '16:00', end: '20:00', recurring: true },
]

export function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function getSlotsForRoom(roomId: string): TimeSlotAssignment[] {
  return slotAssignments.filter(s => s.roomId === roomId)
}

export function getSlotsForFacility(facilityId: string): TimeSlotAssignment[] {
  const facility = facilities.find(f => f.id === facilityId)
  if (!facility) return []
  const roomIds = new Set(facility.rooms.map(r => r.id))
  return slotAssignments.filter(s => roomIds.has(s.roomId))
}

export function getFacilityById(facilityId: string): MunicipalFacility | undefined {
  return facilities.find(f => f.id === facilityId)
}

export const KPI = {
  occupancyRate: { value: 72.4, trend: +4.2 },
  rentalRevenue: { value: 18420, trend: +8.1, currency: 'EUR' },
  activeAssociations: { value: 24, trend: +2 },
  weeklyBookings: { value: 156, trend: -3.5 },
}

export const occupancyByDay = [
  { day: 'Lun', rate: 68 },
  { day: 'Mar', rate: 84 },
  { day: 'Mer', rate: 71 },
  { day: 'Jeu', rate: 65 },
  { day: 'Ven', rate: 78 },
  { day: 'Sam', rate: 91 },
  { day: 'Dim', rate: 42 },
]

export const revenueByMonth = [
  { month: 'Jan', amount: 14200 },
  { month: 'Fév', amount: 15800 },
  { month: 'Mar', amount: 16100 },
  { month: 'Avr', amount: 17200 },
  { month: 'Mai', amount: 16900 },
  { month: 'Juin', amount: 18420 },
]

export const associations: MunicipalAssociation[] = [
  { id: 'a1', name: 'Judo Club Saint-Rivière', sport: 'Judo', members: 142, status: 'active', conventionUntil: '2026-12-31', facilitiesUsed: ['Gymnase Jean Jaurès — Dojo'] },
  { id: 'a2', name: 'Basket ASSR', sport: 'Basketball', members: 89, status: 'active', conventionUntil: '2026-09-30', facilitiesUsed: ['Gymnase Jean Jaurès — Court principal'] },
  { id: 'a3', name: 'Tennis Club Municipal', sport: 'Tennis', members: 210, status: 'active', conventionUntil: '2027-06-30', facilitiesUsed: ['Complexe tennis — Courts 1-4'] },
  { id: 'a4', name: 'Gymnastique Rivière', sport: 'Gymnastique', members: 56, status: 'pending', conventionUntil: '—', facilitiesUsed: ['Gymnase Jean Jaurès — Salle polyvalente'] },
  { id: 'a5', name: 'Danse & Mouvement', sport: 'Danse', members: 34, status: 'active', conventionUntil: '2026-11-15', facilitiesUsed: ['Maison des associations — Studio'] },
]

export const facilities: MunicipalFacility[] = [
  {
    id: 'f1',
    name: 'Gymnase Jean Jaurès',
    address: '12 rue Jean Jaurès, 31000 Saint-Rivière',
    occupancyRate: 78,
    monthlyRevenue: 11240,
    rooms: [
      { id: 'r1', facilityId: 'f1', name: 'Dojo', areaSqm: 120, capacity: 20, occupancyRate: 92, weeklyHours: 18, monthlyRevenue: 4200 },
      { id: 'r2', facilityId: 'f1', name: 'Court principal', areaSqm: 400, capacity: 50, occupancyRate: 74, weeklyHours: 32, monthlyRevenue: 5100 },
      { id: 'r3', facilityId: 'f1', name: 'Salle polyvalente', areaSqm: 200, capacity: 35, occupancyRate: 61, weeklyHours: 24, monthlyRevenue: 1940 },
    ],
  },
  {
    id: 'f2',
    name: 'Complexe tennis municipal',
    address: 'Parc des sports, 31000 Saint-Rivière',
    occupancyRate: 65,
    monthlyRevenue: 5180,
    rooms: [
      { id: 'r4', facilityId: 'f2', name: 'Court 1', areaSqm: 260, capacity: 4, occupancyRate: 70, weeklyHours: 28, monthlyRevenue: 1295 },
      { id: 'r5', facilityId: 'f2', name: 'Court 2', areaSqm: 260, capacity: 4, occupancyRate: 68, weeklyHours: 26, monthlyRevenue: 1200 },
    ],
  },
]


export function getRoomById(roomId: string): MunicipalRoom | undefined {
  for (const f of facilities) {
    const room = f.rooms.find(r => r.id === roomId)
    if (room) { return room }
  }
  return undefined
}

export function getFacilityByRoomId(roomId: string): MunicipalFacility | undefined {
  return facilities.find(f => f.rooms.some(r => r.id === roomId))
}

export function getFacilityTotalCapacity(facilityId: string): number {
  const facility = facilities.find(f => f.id === facilityId)
  return facility?.rooms.reduce((sum, r) => sum + r.capacity, 0) ?? 0
}
