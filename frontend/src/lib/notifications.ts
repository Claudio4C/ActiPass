import {
  Bell,
  Calendar,
  CheckCircle2,
  CreditCard,
  RefreshCw,
  Sparkles,
  UserCheck,
  UserX,
  XCircle,
  type LucideIcon,
} from 'lucide-react'

export interface AppNotification {
  id: string
  user_id: string
  organisation_id: string | null
  type: string
  title: string
  body: string
  link: string | null
  read: boolean
  read_at: string | null
  created_at: string
}

export const notificationIconByType: Record<string, LucideIcon> = {
  event_reminder: Calendar,
  payment_received: CreditCard,
  document_validated: CheckCircle2,
  document_rejected: XCircle,
  waitlist_promoted: Sparkles,
  membership_approved: UserCheck,
  membership_rejected: UserX,
  renewal_invitation: RefreshCw,
  system: Bell,
}

export const notificationIconClassByType: Record<string, string> = {
  event_reminder: 'bg-primary/10 text-primary',
  payment_received: 'bg-emerald-500/10 text-emerald-700',
  document_validated: 'bg-emerald-500/10 text-emerald-700',
  document_rejected: 'bg-destructive/10 text-destructive',
  waitlist_promoted: 'bg-primary/10 text-primary',
  membership_approved: 'bg-emerald-500/10 text-emerald-700',
  membership_rejected: 'bg-destructive/10 text-destructive',
  renewal_invitation: 'bg-amber-500/10 text-amber-700',
  system: 'bg-muted text-muted-foreground',
}

export const getNotificationIcon = (type: string): LucideIcon =>
  notificationIconByType[type] || Bell

export const getNotificationIconClass = (type: string): string =>
  notificationIconClassByType[type] || 'bg-muted text-muted-foreground'

export const fmtRelativeDate = (iso: string): string => {
  const diffMs = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) { return 'à l’instant' }
  const min = Math.floor(sec / 60)
  if (min < 60) { return `il y a ${min} min` }
  const hr = Math.floor(min / 60)
  if (hr < 24) { return `il y a ${hr} h` }
  const day = Math.floor(hr / 24)
  if (day < 7) { return `il y a ${day} j` }
  return new Date(iso).toLocaleDateString('fr-FR')
}
