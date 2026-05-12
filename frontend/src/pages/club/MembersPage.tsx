import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, MapPin, User, Dumbbell, Music, Trophy, Users, Bookmark,
  Calendar, Building2, CheckCircle2, AlertCircle, Navigation, Info,
  ShieldCheck, ArrowRight, ChevronRight, Bell, X,
} from 'lucide-react'
import type { RoleType } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, EventType } from '../../types'
import { EventDetailSheet } from '../../components/EventDetailSheet'
import type { SheetEvent } from '../../components/EventDetailSheet'

// ─── constants ────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const EVENT_META: Record<EventType, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bg: string; text: string;
}> = {
  training: { label: 'Entraînement', Icon: Dumbbell,  bg: 'bg-accent/15',     text: 'text-accent' },
  match:    { label: 'Match',        Icon: Trophy,    bg: 'bg-destructive/10', text: 'text-destructive' },
  meeting:  { label: 'Réunion',      Icon: Users,     bg: 'bg-primary/10',     text: 'text-primary' },
  workshop: { label: 'Atelier',      Icon: Music,     bg: 'bg-cat-music/10',   text: 'text-cat-music' },
  other:    { label: 'Autre',        Icon: Bookmark,  bg: 'bg-muted',          text: 'text-muted-foreground' },
}

const MEMBER_COLORS = [
  'hsl(222,47%,20%)',  // parent
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]

// ─── types ────────────────────────────────────────────────────────────────────

interface FamilyChildEvent {
  id: string; title: string; start_time: string; end_time: string | null;
  location: string | null; organisation: { id: string; name: string };
  is_registered: boolean; membership_id: string;
}
interface FamilyChild {
  id: string; firstname: string; lastname: string; birthdate: string | null;
  avatar_url: string | null;
  organisations: { id: string; name: string }[]; events: FamilyChildEvent[];
}

interface DisplayEvent {
  id: string; title: string; start_time: string; end_time: string;
  location: string | null; event_type: EventType;
  created_by?: { firstname: string; lastname: string } | null;
  memberId: string; memberName: string; memberColor: string; memberAvatarUrl?: string | null;
  extraMembers?: { id: string; name: string; color: string; avatarUrl?: string | null }[];
  orgId?: string;
  isRegistered?: boolean;
  description?: string;
  registrationRequired?: boolean;
  myReservation?: { id: string; status: string } | null;
  capacity?: number;
  price?: number;
}

type OrgItem = { id: string; name: string; type: 'club' | 'association' | 'independant'; roleType: RoleType; roleName: string }

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const getWeekDays = (): Date[] => {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d })
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) { return 'Bonjour' }
  if (h >= 12 && h < 18) { return 'Bon après-midi' }
  return 'Bonsoir'
}

const getAge = (birthdate: string | null) => {
  if (!birthdate) { return null }
  return Math.floor((Date.now() - new Date(birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365))
}

type UrgencyTone = 'urgent' | 'soon'

const getUrgency = (startIso: string): { label: string; tone: UrgencyTone } | null => {
  const diff = new Date(startIso).getTime() - Date.now()
  if (diff < 0 && diff > -90 * 60 * 1000) { return { label: 'En cours', tone: 'urgent' } }
  if (diff <= 0) { return null }
  if (diff < 30 * 60 * 1000) { return { label: `Dans ${Math.ceil(diff / 60000)} min`, tone: 'urgent' } }
  if (diff < 2 * 60 * 60 * 1000) {
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return { label: `Dans ${h}h${m > 0 ? String(m).padStart(2, '0') : ''}`, tone: 'soon' }
  }
  return null
}

const URGENCY_CLS: Record<UrgencyTone, string> = {
  urgent: 'bg-destructive text-destructive-foreground animate-pulse',
  soon: 'bg-amber-500 text-white',
}

const overlaps = (a: Event, b: Event) =>
  new Date(a.start_time) < new Date(b.end_time) &&
  new Date(b.start_time) < new Date(a.end_time)

// ─── CategoryBubble ───────────────────────────────────────────────────────────

const CategoryBubble: React.FC<{ type: EventType }> = ({ type }) => {
  const meta = EVENT_META[type] ?? EVENT_META.other
  const Icon = meta.Icon
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', meta.bg, meta.text)}>
      <Icon className="w-4 h-4 shrink-0" />
    </div>
  )
}

// ─── MemberBadge ──────────────────────────────────────────────────────────────

const MemberBadge: React.FC<{ name: string; color: string; avatarUrl?: string | null; size: 'sm' | 'md' }> = ({ name, color, avatarUrl, size }) => {
  const cls = size === 'sm'
    ? 'w-5 h-5 text-[9px] ring-1'
    : 'w-7 h-7 text-[10px] ring-2'
  return avatarUrl ? (
    <img
      src={avatarUrl}
      alt={name}
      title={name}
      className={`${cls} rounded-full object-cover shrink-0 ring-card`}
    />
  ) : (
    <div
      title={name}
      className={`${cls} rounded-full flex items-center justify-center text-white font-bold shrink-0 ring-card`}
      style={{ backgroundColor: color }}
    >
      {name.charAt(0)}
    </div>
  )
}

// ─── WeeklyCard ───────────────────────────────────────────────────────────────

const WeeklyCard: React.FC<{ event: DisplayEvent; isToday: boolean; showMember: boolean; onClick: () => void }> = ({
  event, isToday, showMember, onClick,
}) => {
  const meta = EVENT_META[event.event_type] ?? EVENT_META.other
  const Icon = meta.Icon
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-card border rounded-2xl p-3 space-y-2 cursor-pointer active:scale-[0.99] transition-all hover:shadow-sm',
        isToday ? 'border-primary/25' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between gap-1">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', meta.bg, meta.text)}>
          <Icon className="w-4 h-4 shrink-0" />
        </div>
        {(() => {
          const urg = getUrgency(event.start_time)
          return urg
            ? <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', URGENCY_CLS[urg.tone])}>{urg.label}</span>
            : <span className="text-xs font-bold text-foreground tabular-nums">{fmtTime(event.start_time)}</span>
        })()}
      </div>
      <p className="font-display font-bold text-sm text-foreground leading-snug">{event.title}</p>
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="tabular-nums">{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {event.created_by && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.created_by.firstname} {event.created_by.lastname}</span>
          </div>
        )}
      </div>
      {showMember && (
        <div className="flex items-center gap-1 pt-0.5">
          {[{ id: event.memberId, name: event.memberName, color: event.memberColor, avatarUrl: event.memberAvatarUrl }, ...(event.extraMembers ?? [])].map((m) => (
            <MemberBadge key={m.id} name={m.name} color={m.color} avatarUrl={m.avatarUrl} size="sm" />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── TodayRow ─────────────────────────────────────────────────────────────────

const TodayRow: React.FC<{ event: DisplayEvent; showMember: boolean; onClick: () => void }> = ({ event, showMember, onClick }) => (
  <div onClick={onClick} className="flex items-center gap-4 py-3 border-b border-border last:border-0 cursor-pointer active:opacity-70 transition-opacity">
    <div className="text-right shrink-0 w-12">
      <p className="text-sm font-bold text-foreground tabular-nums">{fmtTime(event.start_time)}</p>
      <p className="text-[10px] text-muted-foreground tabular-nums">{fmtTime(event.end_time)}</p>
    </div>
    <CategoryBubble type={event.event_type} />
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-foreground truncate">{event.title}</p>
      <p className="text-xs text-muted-foreground truncate">
        {[event.location, event.created_by ? `${event.created_by.firstname} ${event.created_by.lastname}` : null].filter(Boolean).join(' · ')}
      </p>
    </div>
    {showMember && (
      <div className="flex -space-x-1 shrink-0">
        {[{ id: event.memberId, name: event.memberName, color: event.memberColor, avatarUrl: event.memberAvatarUrl }, ...(event.extraMembers ?? [])].map((m) => (
          <MemberBadge key={m.id} name={m.name} color={m.color} avatarUrl={m.avatarUrl} size="md" />
        ))}
      </div>
    )}
  </div>
)

// ─── FamilyMemberCard ─────────────────────────────────────────────────────────

const FamilyMemberCard: React.FC<{
  name: string; subtitle: string; color: string; coursesPerWeek: number;
  avatarUrl?: string | null; active: boolean; onClick: () => void;
}> = ({ name, subtitle, color, coursesPerWeek, avatarUrl, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-[0.98]',
      active ? 'border-primary bg-primary/5' : 'border-border bg-background/40 hover:border-primary/40',
    )}
  >
    {avatarUrl ? (
      <img
        src={avatarUrl}
        alt={name}
        className="w-12 h-12 rounded-full object-cover ring-2 ring-card"
      />
    ) : (
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-base text-white ring-2 ring-card"
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </div>
    )}
    <p className={cn('text-xs font-bold', active ? 'text-primary' : 'text-foreground')}>{name}</p>
    <p className="text-[10px] text-muted-foreground">{subtitle}</p>
    <p className="text-[10px] font-semibold text-muted-foreground">{coursesPerWeek} cours/sem</p>
  </button>
)

// ─── MAIN ─────────────────────────────────────────────────────────────────────

const ClubMembersPage: React.FC = () => {
  const { user } = useAuth()
  const { organisation, role } = useCurrentOrganisation()
  const orgId = organisation?.id
  const isManager = role === 'manager'

  const [myEvents,       setMyEvents]       = useState<Event[]>([])
  const [children,       setChildren]       = useState<FamilyChild[]>([])
  const [memberCount,    setMemberCount]    = useState(0)
  const [myOrgs,         setMyOrgs]         = useState<OrgItem[]>([])
  const [loading,        setLoading]        = useState(true)
  const [activeFilter,   setActiveFilter]   = useState<string>('all')
  const [selectedEvent,   setSelectedEvent]   = useState<SheetEvent | null>(null)
  const [notifPerm,       setNotifPerm]       = useState<NotificationPermission | null>(() =>
    'Notification' in window ? Notification.permission : null,
  )
  const [notifDismissed,  setNotifDismissed]  = useState(false)
  const [urgentDismissed, setUrgentDismissed] = useState(false)
  const [, setTick] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Catches individuels : un 403 sur events/members (org obsolète) ne bloque pas le reste
      const clearStaleOrg = (e: unknown) => {
        const status = (e as any)?.statusCode ?? (e as any)?.response?.status
        if (status === 403) { localStorage.removeItem('selectedOrganisation') }
        return []
      }
      const [evtsData, membsData, orgsData, famData] = await Promise.all([
        orgId
          ? api.get<Event[]>(`/organisations/${orgId}/events`, { status: 'published' }, { useCache: true, cacheTTL: 60000 }).catch(clearStaleOrg)
          : Promise.resolve([] as Event[]),
        orgId
          ? api.get<{ id: string }[]>(`/organisations/${orgId}/members`, undefined, { useCache: true, cacheTTL: 120000 }).catch(clearStaleOrg)
          : Promise.resolve([] as { id: string }[]),
        api.get<{ organisation: { id: string; name: string; type: string | null }; role: { name: string; type: RoleType } }[]>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 }).catch(() => []),
        api.get<{ children: FamilyChild[] }>('/family/dashboard').catch(() => ({ children: [] })),
      ])
      setMyEvents(Array.isArray(evtsData) ? evtsData : [])
      setMemberCount(Array.isArray(membsData) ? membsData.length : 0)
      setMyOrgs(
        Array.isArray(orgsData)
          ? orgsData.map((item) => ({
            id: item.organisation.id,
            name: item.organisation.name,
            type: (item.organisation.type ?? 'club') as 'club' | 'association' | 'independant',
            roleType: item.role.type,
            roleName: item.role.name,
          }))
          : [],
      )
      setChildren(famData.children ?? [])
    } catch {
      setMyEvents([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  // Marque l'espace membre comme visité pour la MemberChecklistCard (étape 3)
  useEffect(() => { localStorage.setItem('ikivio_visited_activity', '1') }, [])

  const today    = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const weekDays = useMemo(() => getWeekDays(), [])
  const todayIdx = weekDays.findIndex((d) => isSameDay(d, today))

  const firstName = (user as any)?.firstname ?? user?.firstName ?? 'Vous'

  // ── Build display events ─────────────────────────────────────────────────

  const allDisplayEvents = useMemo((): DisplayEvent[] => {
    const mine: DisplayEvent[] = myEvents.map((e) => ({
      id: e.id, title: e.title, start_time: e.start_time, end_time: e.end_time,
      location: e.location ?? null, event_type: e.event_type,
      created_by: e.created_by ?? null,
      memberId: 'me', memberName: firstName, memberColor: MEMBER_COLORS[0],
      memberAvatarUrl: localStorage.getItem('user_avatar_url') ?? null,
      orgId: orgId ?? undefined,
      description: e.description,
      registrationRequired: e.registration_required,
      myReservation: e.myReservation,
      capacity: e.capacity,
      price: e.price,
    }))
    // Index parent events by id for deduplication
    const mineById = new Map(mine.map((e) => [e.id, e]))
    const result: DisplayEvent[] = [...mine]

    children.forEach((child, idx) => {
      const color = MEMBER_COLORS[idx + 1] ?? MEMBER_COLORS[1]
      child.events
        .filter((e) => e.is_registered)
        .forEach((e) => {
          const existing = mineById.get(e.id)
          if (existing) {
            // Même événement : on ajoute l'enfant comme membre supplémentaire
            if (!existing.extraMembers) { existing.extraMembers = [] }
            if (!existing.extraMembers.find((m) => m.id === child.id)) {
              existing.extraMembers.push({ id: child.id, name: child.firstname, color, avatarUrl: child.avatar_url })
            }
          } else {
            const ev: DisplayEvent = {
              id: e.id, title: e.title,
              start_time: e.start_time, end_time: e.end_time ?? e.start_time,
              location: e.location, event_type: 'training' as EventType,
              memberId: child.id, memberName: child.firstname, memberColor: color, memberAvatarUrl: child.avatar_url,
            orgId: e.organisation.id, isRegistered: e.is_registered,
            }
            mineById.set(e.id, ev)
            result.push(ev)
          }
        })
    })
    return result
  }, [myEvents, children, firstName, orgId])

  const filteredEvents = useMemo(() => {
    if (activeFilter === 'all') { return allDisplayEvents }
    return allDisplayEvents.filter((e) =>
      e.memberId === activeFilter ||
      e.extraMembers?.some((m) => m.id === activeFilter),
    )
  }, [allDisplayEvents, activeFilter])

  const upcomingFiltered = useMemo(() =>
    filteredEvents.filter((e) => new Date(e.start_time) >= today)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
  [filteredEvents, today])

  const todayEvents = useMemo(() =>
    upcomingFiltered.filter((e) => isSameDay(new Date(e.start_time), today)),
  [upcomingFiltered, today])

  const nextEvent = useMemo(() =>
    upcomingFiltered.find((e) => !isSameDay(new Date(e.start_time), today)) ?? upcomingFiltered[0] ?? null,
  [upcomingFiltered, today])

  const nextTwo = useMemo(() =>
    upcomingFiltered.filter((e) => !isSameDay(new Date(e.start_time), today)).slice(1, 3),
  [upcomingFiltered, today])

  const weekEnd = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d }, [today])

  const weekEventsByDay = useMemo(() =>
    weekDays.map((day) =>
      filteredEvents
        .filter((e) => isSameDay(new Date(e.start_time), day))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    ),
  [filteredEvents, weekDays])

  const weekCount = useMemo(() =>
    filteredEvents.filter((e) => { const d = new Date(e.start_time); return d >= today && d < weekEnd }).length,
  [filteredEvents, today, weekEnd])

  const eventsPerWeekByMember = useMemo(() => {
    const counts: Record<string, number> = {}
    allDisplayEvents.forEach((e) => {
      const d = new Date(e.start_time)
      if (d >= today && d < weekEnd) {
        counts[e.memberId] = (counts[e.memberId] ?? 0) + 1
        e.extraMembers?.forEach((m) => { counts[m.id] = (counts[m.id] ?? 0) + 1 })
      }
    })
    return counts
  }, [allDisplayEvents, today, weekEnd])

  const myUpcoming = useMemo(() =>
    myEvents.filter((e) => new Date(e.start_time) >= today)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
  [myEvents, today])

  const conflict = useMemo(() =>
    myUpcoming.filter((e) => isSameDay(new Date(e.start_time), today))
      .some((a, i, arr) => arr.slice(i + 1).some((b) => overlaps(a, b))),
  [myUpcoming, today])

  const disciplines = useMemo(() => [...new Set(myEvents.map((e) => e.event_type))], [myEvents])

  const dayName   = today.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase()

  const showMemberBadge = activeFilter === 'all' && children.length > 0

  // ── Tick (rafraîchit les urgences chaque minute) ─────────────────────────

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(id)
  }, [])

  // ── Événement le plus urgent (< 2h) ──────────────────────────────────────

  const urgentEvent = useMemo(() => {
    const now = Date.now()
    return allDisplayEvents
      .filter((e) => {
        const diff = new Date(e.start_time).getTime() - now
        return diff > -5 * 60 * 1000 && diff < 2 * 60 * 60 * 1000
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] ?? null
  }, [allDisplayEvents])

  // ── Notifications ────────────────────────────────────────────────────────

  const enableNotifications = async () => {
    const result = await Notification.requestPermission()
    setNotifPerm(result)
  }

  useEffect(() => {
    if (!('Notification' in window) || Notification.permission !== 'granted') { return }
    const notified = new Set<string>(JSON.parse(localStorage.getItem('ikivio_notified_events') ?? '[]'))
    const now = Date.now()
    const timers: ReturnType<typeof setTimeout>[] = []

    allDisplayEvents.forEach((event) => {
      const startMs = new Date(event.start_time).getTime()
      const checks = [
        { key: `${event.id}:2h`,  delay: startMs - 2 * 60 * 60 * 1000, label: 'dans 2h' },
        { key: `${event.id}:30m`, delay: startMs - 30 * 60 * 1000,      label: 'dans 30 min' },
      ]
      checks.forEach(({ key, delay, label }) => {
        if (notified.has(key)) { return }
        const wait = delay - now
        if (wait <= 0 && startMs > now) {
          new Notification(event.title, {
            body: `${label}${event.location ? ` · ${event.location}` : ''}`,
            icon: '/favicon.ico',
            tag: key,
          })
          notified.add(key)
          localStorage.setItem('ikivio_notified_events', JSON.stringify([...notified]))
        } else if (wait > 0 && wait < 24 * 60 * 60 * 1000) {
          timers.push(setTimeout(() => {
            new Notification(event.title, {
              body: `${label}${event.location ? ` · ${event.location}` : ''}`,
              icon: '/favicon.ico',
              tag: key,
            })
            notified.add(key)
            localStorage.setItem('ikivio_notified_events', JSON.stringify([...notified]))
          }, wait))
        }
      })
    })

    return () => timers.forEach(clearTimeout)
  }, [allDisplayEvents])

  const ORG_CARD_META = {
    club:       { Icon: Dumbbell, bg: 'bg-cat-sport/15', text: 'text-cat-sport' },
    association:{ Icon: Music,    bg: 'bg-cat-music/15', text: 'text-cat-music' },
    independant:{ Icon: Users,    bg: 'bg-primary/15',   text: 'text-primary' },
  } as const

  const userInitials = `${(user as any)?.firstname?.[0] ?? user?.firstName?.[0] ?? ''}${(user as any)?.lastname?.[0] ?? user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U'

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5">

      {/* Portail admin */}
      {isManager && orgId && (
        <div className="rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-primary shrink-0" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Accès gestionnaire</p>
              <p className="font-display font-bold text-foreground text-sm">Tableau de bord admin</p>
            </div>
          </div>
          <Link
            to={`/dashboard/${orgId}/overview`}
            className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-bold px-3 py-2 rounded-full active:scale-95 transition-transform shrink-0"
          >
            Portail admin <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </Link>
        </div>
      )}

      {/* Bannière événement urgent */}
      {urgentEvent && !urgentDismissed && (() => {
        const urg = getUrgency(urgentEvent.start_time)
        if (!urg) { return null }
        return (
          <div className={`flex items-start gap-3 border rounded-2xl px-4 py-3 ${urg.tone === 'urgent' ? 'bg-destructive/5 border-destructive/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${urg.tone === 'urgent' ? 'bg-destructive/15 text-destructive' : 'bg-amber-500/15 text-amber-600'}`}>
              <Clock className="w-4 h-4 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${urg.tone === 'urgent' ? 'bg-destructive text-white' : 'bg-amber-500 text-white'}`}>
                  {urg.tone === 'urgent' ? 'URGENT' : 'BIENTÔT'}
                </span>
                <span className="font-bold text-sm text-foreground truncate">{urgentEvent.title} · {urg.label}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {urgentEvent.memberName}{urgentEvent.location ? ` • ${urgentEvent.location}` : ''} · Pensez à partir bientôt.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {urgentEvent.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(urgentEvent.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-xs font-bold ${urg.tone === 'urgent' ? 'text-destructive' : 'text-amber-600'}`}
                >
                  Itinéraire →
                </a>
              )}
              <button onClick={() => setUrgentDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        )
      })()}

      {/* Banner notification */}
      {notifPerm === 'default' && !notifDismissed && (
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 py-3">
          <Bell className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Rappels d'activité</p>
            <p className="text-xs text-muted-foreground">Notification 2h avant chaque séance</p>
          </div>
          <button
            onClick={enableNotifications}
            className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-full bg-primary text-primary-foreground active:scale-95 transition-transform"
          >
            Activer
          </button>
          <button onClick={() => setNotifDismissed(true)} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Greeting */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {getGreeting()}, {firstName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          ✨ {todayEvents.length === 0
            ? 'Aucune activité prévue aujourd\'hui.'
            : `${todayEvents.length} activité${todayEvents.length > 1 ? 's' : ''} aujourd'hui.`}
        </p>
        <div className="flex items-center justify-between mt-3">
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border',
            conflict ? 'text-destructive border-destructive/30 bg-destructive/5' : 'text-accent border-accent/30 bg-accent/5',
          )}>
            {conflict ? <AlertCircle className="w-3.5 h-3.5 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            {conflict ? 'Conflit détecté' : 'Aucun conflit'}
          </span>
          {weekCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {weekCount} activité{weekCount > 1 ? 's' : ''}/sem
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Calendar,  value: weekCount,        label: 'Activités/sem' },
          { icon: Users,     value: memberCount,       label: 'Membres' },
          { icon: Building2, value: myOrgs.length,     label: 'Associations' },
          { icon: Bookmark,  value: disciplines.length, label: 'Disciplines' },
        ].map(({ icon: Icon, value, label }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary shrink-0" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-foreground leading-none">{value}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Grid : [Events] | [Famille + Associations] ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-4">

          {/* Prochaine activité */}
          {nextEvent && (
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 rounded-3xl p-5 text-primary-foreground shadow-xl shadow-primary/30">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-primary-foreground/70">⚡ Prochaine activité</p>
                  <div className="flex items-center gap-2">
                    {nextEvent.extraMembers && nextEvent.extraMembers.length > 0 && (
                      <div className="flex -space-x-1">
                        {[{ id: nextEvent.memberId, name: nextEvent.memberName, color: nextEvent.memberColor, avatarUrl: nextEvent.memberAvatarUrl }, ...nextEvent.extraMembers].map((m) => (
                          <MemberBadge key={m.id} name={m.name} color={m.color} avatarUrl={m.avatarUrl} size="sm" />
                        ))}
                      </div>
                    )}
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground">
                      {isSameDay(new Date(nextEvent.start_time), today)
                        ? "Aujourd'hui"
                        : new Date(nextEvent.start_time).toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())}
                    </span>
                  </div>
                </div>
                <h2 className="font-display text-2xl font-bold text-primary-foreground mb-3">{nextEvent.title}</h2>
                <div className="grid grid-cols-2 gap-2 text-sm text-primary-foreground/85">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />{fmtTime(nextEvent.start_time)} – {fmtTime(nextEvent.end_time)}
                  </div>
                  {nextEvent.location && (
                    <div className="flex items-center gap-2"><MapPin className="w-4 h-4 shrink-0" />{nextEvent.location}</div>
                  )}
                  {nextEvent.created_by && (
                    <div className="flex items-center gap-2"><User className="w-4 h-4 shrink-0" />{nextEvent.created_by.firstname} {nextEvent.created_by.lastname}</div>
                  )}
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-primary-foreground/20">
                  {nextEvent.created_by && (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {nextEvent.created_by.firstname[0]}{nextEvent.created_by.lastname[0]}
                      </div>
                      <span className="text-sm text-primary-foreground/80">{nextEvent.created_by.firstname}</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    {nextEvent.location && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextEvent.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground active:scale-95 transition-transform"
                      >
                        <Navigation className="w-3.5 h-3.5 shrink-0" /> Itinéraire
                      </a>
                    )}
                    <button
                      onClick={() => setSelectedEvent(nextEvent)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-primary-foreground text-primary active:scale-95 transition-transform"
                    >
                      <Info className="w-3.5 h-3.5 shrink-0" /> Détails
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deux prochains mini-cards */}
          {nextTwo.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {nextTwo.map((ev) => (
                <div key={ev.id} onClick={() => setSelectedEvent(ev)} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-all hover:border-primary/20 cursor-pointer">
                  <CategoryBubble type={ev.event_type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.start_time).toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())} · {fmtTime(ev.start_time)}
                    </p>
                  </div>
                  {showMemberBadge && (
                    <div className="flex -space-x-1 shrink-0">
                      {[{ id: ev.memberId, name: ev.memberName, color: ev.memberColor, avatarUrl: ev.memberAvatarUrl }, ...(ev.extraMembers ?? [])].map((m) => (
                        <MemberBadge key={m.id} name={m.name} color={m.color} avatarUrl={m.avatarUrl} size="sm" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Cours du jour */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{dayName}</p>
                <h2 className="font-display text-lg font-bold text-foreground">Aujourd'hui</h2>
              </div>
              {todayEvents.length > 0 && (
                <span className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10">
                  {todayEvents.length} activité{todayEvents.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="px-4">
              {todayEvents.length === 0 ? (
                <p className="py-5 text-sm text-muted-foreground text-center">Pas de cours prévu aujourd'hui.</p>
              ) : (
                todayEvents.map((ev) => <TodayRow key={ev.id} event={ev} showMember={showMemberBadge} onClick={() => setSelectedEvent(ev)} />)
              )}
            </div>
          </div>

        </div>

        {/* Colonne droite */}
        <div className="lg:col-span-1 space-y-4">

          {/* Widget Famille */}
          {children.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-lg font-bold text-foreground">Famille</h2>
                <button
                  onClick={() => setActiveFilter('all')}
                  className={cn(
                    'text-xs font-semibold transition-colors',
                    activeFilter === 'all' ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  Tous affichés
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {/* Moi */}
                <FamilyMemberCard
                  name={firstName}
                  subtitle="Adulte"
                  color={MEMBER_COLORS[0]}
                  avatarUrl={localStorage.getItem('user_avatar_url')}
                  coursesPerWeek={eventsPerWeekByMember['me'] ?? 0}
                  active={activeFilter === 'me'}
                  onClick={() => setActiveFilter(activeFilter === 'me' ? 'all' : 'me')}
                />
                {/* Enfants */}
                {children.map((child, idx) => {
                  const age = getAge(child.birthdate)
                  return (
                    <FamilyMemberCard
                      key={child.id}
                      name={child.firstname}
                      subtitle={age !== null ? `${age} ans` : 'Enfant'}
                      color={MEMBER_COLORS[idx + 1] ?? MEMBER_COLORS[1]}
                      avatarUrl={child.avatar_url}
                      coursesPerWeek={eventsPerWeekByMember[child.id] ?? 0}
                      active={activeFilter === child.id}
                      onClick={() => setActiveFilter(activeFilter === child.id ? 'all' : child.id)}
                    />
                  )
                })}
              </div>
            </div>
          )}

          {/* Mes associations */}
          <div className="bg-card border border-border rounded-2xl p-5 sticky top-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-bold text-foreground">Mes associations</h2>
              {myOrgs.length > 0 && (
                <span className="text-xs text-muted-foreground">{myOrgs.length} club{myOrgs.length > 1 ? 's' : ''}</span>
              )}
            </div>
            {myOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">Aucune association.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {myOrgs.map((org) => {
                  const isAdm = org.roleType === 'club_owner' || org.roleType === 'club_manager' || org.roleType === 'treasurer'
                  const meta = ORG_CARD_META[org.type] ?? ORG_CARD_META.club
                  const OrgIc = meta.Icon
                  const dest = isAdm ? `/dashboard/${org.id}/overview` : `/club/${org.id}`
                  return (
                    <Link
                      key={org.id}
                      to={dest}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-background/40 hover:border-primary/40 hover:bg-background/80 transition-all"
                    >
                      <div className={cn('rounded-xl flex items-center justify-center w-10 h-10 shrink-0', meta.bg)}>
                        <OrgIc className={cn('w-5 h-5 shrink-0', meta.text)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {org.name.split(' ').slice(0, 2).join(' ')}
                        </p>
                        <div className="flex -space-x-1.5 mt-1">
                          <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-bold ring-2 ring-card shrink-0">
                            {userInitials}
                          </div>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {isAdm ? 'Admin' : meta.text.replace('text-', '')}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── Grille hebdo ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-bold text-foreground">
            {activeFilter === 'all'
              ? 'Planning de la famille'
              : activeFilter === 'me'
              ? `Mes activités`
              : `Activités de ${children.find((c) => c.id === activeFilter)?.firstname ?? ''}`}
          </h2>
          {(children.length > 0) && (
            <div className="flex gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'Tous', color: '' },
                { id: 'me', label: firstName, color: MEMBER_COLORS[0] },
                ...children.map((c, idx) => ({ id: c.id, label: c.firstname, color: MEMBER_COLORS[idx + 1] ?? MEMBER_COLORS[1] })),
              ].map(({ id, label, color }) => (
                <button
                  key={id}
                  onClick={() => setActiveFilter(id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-2.5 h-7 rounded-full text-xs font-semibold border transition-colors',
                    activeFilter === id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/40',
                  )}
                >
                  {color && (
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  )}
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {weekDays.map((_day, i) => {
              const dayEvts = weekEventsByDay[i]
              const isToday = i === todayIdx
              return (
                <div key={i}>
                  <div className={cn('text-center mb-3', isToday ? 'text-primary' : 'text-muted-foreground')}>
                    <p className="text-[11px] font-bold uppercase tracking-wider">{DAYS_SHORT[i]}</p>
                  </div>
                  {dayEvts.length === 0 ? (
                    <p className="text-center text-xl text-muted-foreground/40 font-light select-none">—</p>
                  ) : (
                    <div className="space-y-3">
                      {dayEvts.map((ev) => (
                        <WeeklyCard key={ev.id} event={ev} isToday={isToday} showMember={showMemberBadge} onClick={() => setSelectedEvent(ev)} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <EventDetailSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}

export default ClubMembersPage
