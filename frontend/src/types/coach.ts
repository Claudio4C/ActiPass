/** Modèles métier — espace coach (Phase 5 + P4-4). */

export type CoachAffiliation = 'club' | 'independent'

export type SessionStatus = 'confirmed' | 'pending' | 'cancelled'

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'unknown'

export interface CoachClub {
  id: string
  name: string
  city: string
  role: 'employee' | 'freelance'
  disciplines: string[]
  membersCount: number
  attendanceRate: number
}

export interface CoachKpi {
  id: string
  label: string
  value: string
  sublabel?: string
  href?: string
}

export interface SessionEnrollee {
  id: string
  name: string
  age?: number
  parentName?: string
  attendance: AttendanceStatus
}

export interface CoachSession {
  id: string
  clubId: string
  clubName: string
  title: string
  discipline: string
  date: string
  startTime: string
  endTime: string
  location: string
  status: SessionStatus
  capacity: number
  enrollees: SessionEnrollee[]
  followUpComment?: string
  followUpPublishedAt?: string
}

export interface ProgressField {
  id: string
  label: string
  type: 'text' | 'level' | 'time' | 'number'
  unit?: string
}

export interface MemberProgress {
  id: string
  memberId: string
  memberName: string
  clubId: string
  clubName: string
  discipline: string
  fields: ProgressField[]
  values: Record<string, string>
  lastUpdated: string
  coachNote?: string
}

export interface CoachPublicProfile {
  id: string
  firstName: string
  lastName: string
  bio: string
  specialties: string[]
  qualifications: string[]
  clubs: Array<{ id: string; name: string; city: string }>
  serviceArea: string
  isPublished: boolean
  rating: number
  reviewsCount: number
}

export interface TeamMessage {
  id: string
  sessionId: string
  sessionTitle: string
  clubName: string
  subject: string
  body: string
  sentAt: string
  recipientCount: number
  channels: Array<'in_app' | 'email'>
}
