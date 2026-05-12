import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, MapPin, User, Dumbbell, Music, Trophy, Users, Bookmark, ChevronLeft, ChevronRight, CalendarPlus, Building2, Bell, X } from 'lucide-react'
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, EventType } from '../../types'
import { EventDetailSheet } from '../../components/EventDetailSheet'
import type { SheetEvent } from '../../components/EventDetailSheet'

// ─── constants ────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const EVENT_META: Record<EventType, { Icon: React.ComponentType<{ className?: string }>; bg: string; text: string }> = {
  training: { Icon: Dumbbell,  bg: 'bg-accent/15',     text: 'text-accent' },
  match: { Icon: Trophy,    bg: 'bg-destructive/10', text: 'text-destructive' },
  meeting: { Icon: Users,     bg: 'bg-primary/10',     text: 'text-primary' },
  workshop: { Icon: Music,     bg: 'bg-cat-music/10',   text: 'text-cat-music' },
  other: { Icon: Bookmark,  bg: 'bg-muted',          text: 'text-muted-foreground' },
}

const MEMBER_COLORS = [
  'hsl(222,47%,20%)',   // parent (ardoise)
  'hsl(217,91%,60%)',   // enfant 1 (bleu)
  'hsl(280,70%,60%)',   // enfant 2 (violet)
  'hsl(25,95%,53%)',    // enfant 3 (orange)
  'hsl(160,84%,39%)',   // enfant 4 (vert)
  'hsl(340,75%,55%)',   // enfant 5 (rose)
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

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const getWeekStart = (ref: Date): Date => {
  const d = new Date(ref)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  d.setHours(0, 0, 0, 0)
  return d
}

const getWeekDays = (ref: Date): Date[] => {
  const monday = getWeekStart(ref)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
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

// ─── WeekCard ─────────────────────────────────────────────────────────────────

const WeekCard: React.FC<{ event: DisplayEvent; isToday: boolean; showMember: boolean; onClick: () => void }> = ({
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
            m.avatarUrl ? (
              <img
                key={m.id}
                src={m.avatarUrl}
                alt={m.name}
                title={m.name}
                className="w-5 h-5 rounded-full object-cover shrink-0 ring-1 ring-card"
              />
            ) : (
              <div
                key={m.id}
                title={m.name}
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold shrink-0 ring-1 ring-card"
                style={{ backgroundColor: m.color }}
              >
                {m.name.charAt(0)}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  )
}

// ─── FamilyMemberCard ──────────────────────────────────────────────────────────

const FamilyMemberCard: React.FC<{
  id: string; name: string; subtitle: string; color: string; eventsPerWeek: number;
  avatarUrl?: string | null; active: boolean; onClick: () => void;
}> = ({ name, subtitle, color, eventsPerWeek, avatarUrl, active, onClick }) => (
  <button
    onClick={onClick}
    className={cn(
      'flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] min-w-[110px]',
      active ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/40',
    )}
  >
    {avatarUrl ? (
      <img
        src={avatarUrl}
        alt={name}
        className={cn('w-12 h-12 rounded-full object-cover ring-2 transition-all', active ? 'ring-primary' : 'ring-card')}
      />
    ) : (
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center font-display font-bold text-base text-white ring-2 transition-all',
          active ? 'ring-primary' : 'ring-card',
        )}
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </div>
    )}
    <div className="text-center">
      <p className={cn('text-sm font-bold', active ? 'text-primary' : 'text-foreground')}>{name}</p>
      <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      {eventsPerWeek > 0 && (
        <p className="text-[11px] font-semibold text-muted-foreground mt-0.5">
          {eventsPerWeek} cours/sem
        </p>
      )}
    </div>
  </button>
)

// ─── main ─────────────────────────────────────────────────────────────────────

const PlanningPage: React.FC = () => {
  const { organisation } = useCurrentOrganisation()
  const { user } = useAuth()
  const navigate = useNavigate()
  const orgId = organisation?.id

  const [myEvents,       setMyEvents]       = useState<Event[]>([])
  const [children,       setChildren]       = useState<FamilyChild[]>([])
  const [loading,        setLoading]        = useState(true)
  const [weekRef,        setWeekRef]        = useState(new Date())
  const [activeId,       setActiveId]       = useState<string>('all')
  const [selectedEvent,    setSelectedEvent]    = useState<SheetEvent | null>(null)
  const [notifPerm,        setNotifPerm]        = useState<NotificationPermission | null>(() =>
    'Notification' in window ? Notification.permission : null,
  )
  const [notifDismissed,   setNotifDismissed]   = useState(false)
  const [urgentDismissed,  setUrgentDismissed]  = useState(false)
  const [, setTick] = useState(0)

  const weekDays = useMemo(() => getWeekDays(weekRef), [weekRef])
  const today    = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const todayIdx = weekDays.findIndex((d) => isSameDay(d, today))

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [evtsData, famData] = await Promise.all([
        orgId
          ? api.get<Event[]>(`/organisations/${orgId}/events`, { status: 'published' }, { useCache: true, cacheTTL: 60000 })
          : Promise.resolve([] as Event[]),
        api.get<{ children: FamilyChild[] }>('/family/dashboard').catch(() => ({ children: [] })),
      ])
      setMyEvents(Array.isArray(evtsData) ? evtsData : [])
      setChildren(famData.children ?? [])
    } catch {
      setMyEvents([])
    } finally {
      setLoading(false)
    }
  }, [orgId])

  useEffect(() => { load() }, [load])

  const firstName = (user as any)?.firstname ?? user?.firstName ?? 'Vous'

  // ── Build display events ─────────────────────────────────────────────────

  const allDisplayEvents = useMemo((): DisplayEvent[] => {
    const mine: DisplayEvent[] = myEvents.map((e) => ({
      id: e.id, title: e.title,
      start_time: e.start_time, end_time: e.end_time,
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
    const mineById = new Map(mine.map((e) => [e.id, e]))
    const result: DisplayEvent[] = [...mine]

    children.forEach((child, idx) => {
      const color = MEMBER_COLORS[idx + 1] ?? MEMBER_COLORS[1]
      child.events.filter((e) => e.is_registered).forEach((e) => {
        const existing = mineById.get(e.id)
        if (existing) {
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
    if (activeId === 'all') { return allDisplayEvents }
    return allDisplayEvents.filter((e) =>
      e.memberId === activeId || e.extraMembers?.some((m) => m.id === activeId),
    )
  }, [allDisplayEvents, activeId])

  const eventsByDay = useMemo(() =>
    weekDays.map((day) =>
      filteredEvents
        .filter((e) => isSameDay(new Date(e.start_time), day))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    ),
  [filteredEvents, weekDays])

  const weekCount = eventsByDay.reduce((acc, evts) => acc + evts.length, 0)

  const eventsPerWeekByMember = useMemo(() => {
    const counts: Record<string, number> = {}
    allDisplayEvents.forEach((e) => {
      const start = new Date(e.start_time)
      if (start >= weekDays[0] && start <= weekDays[6]) {
        counts[e.memberId] = (counts[e.memberId] ?? 0) + 1
        e.extraMembers?.forEach((m) => { counts[m.id] = (counts[m.id] ?? 0) + 1 })
      }
    })
    return counts
  }, [allDisplayEvents, weekDays])

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
          // Fenêtre déjà passée mais événement pas encore commencé → notif immédiate
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

  const showMemberBadge = activeId === 'all'

  const fmtMonthYear = (d: Date) =>
    d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  // Vrai quand aucun enfant n'est inscrit dans un club ET pas d'événements personnels
  const hasNoClubs = !loading &&
    children.every((c) => c.organisations.length === 0) &&
    myEvents.length === 0

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Planning hebdomadaire</h1>
        <p className="text-muted-foreground mt-1">
          Filtrez par membre pour voir leurs activités
        </p>
      </div>

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
          <button
            onClick={() => setNotifDismissed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Empty state global — aucun club */}
      {hasNoClubs && (
        <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarPlus className="w-7 h-7 text-primary shrink-0" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg text-foreground">Aucune activité prévue</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Inscrivez vos enfants dans un club pour voir leur planning ici.
            </p>
          </div>
          <button
            onClick={() => navigate('/clubs')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25"
          >
            <Building2 className="w-4 h-4 shrink-0" />
            Découvrir des clubs
          </button>
        </div>
      )}

      {/* Family filter widget */}
      {!hasNoClubs && (children.length > 0) && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Famille</p>
            <button
              onClick={() => setActiveId('all')}
              className={cn(
                'text-xs font-semibold transition-colors',
                activeId === 'all' ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              Tous affichés
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
            {/* Vous */}
            <FamilyMemberCard
              id="me"
              name={firstName}
              subtitle="Adulte"
              color={MEMBER_COLORS[0]}
              avatarUrl={localStorage.getItem('user_avatar_url')}
              eventsPerWeek={eventsPerWeekByMember['me'] ?? 0}
              active={activeId === 'me'}
              onClick={() => setActiveId(activeId === 'me' ? 'all' : 'me')}
            />
            {/* Enfants */}
            {children.map((child, idx) => {
              const age = getAge(child.birthdate)
              return (
                <FamilyMemberCard
                  key={child.id}
                  id={child.id}
                  name={child.firstname}
                  subtitle={age !== null ? `${age} ans` : 'Enfant'}
                  color={MEMBER_COLORS[idx + 1] ?? MEMBER_COLORS[1]}
                  avatarUrl={child.avatar_url}
                  eventsPerWeek={eventsPerWeekByMember[child.id] ?? 0}
                  active={activeId === child.id}
                  onClick={() => setActiveId(activeId === child.id ? 'all' : child.id)}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Navigateur semaine + grille — masqués si aucun club */}
      {!hasNoClubs && (
        <>
          <div className="flex items-center justify-between">
            <button
              onClick={() => setWeekRef((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n })}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 shrink-0" />
            </button>
            <span className="font-display font-bold text-foreground capitalize">{fmtMonthYear(weekRef)}</span>
            <button
              onClick={() => setWeekRef((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n })}
              className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95"
            >
              <ChevronRight className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Weekly grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto pb-2">
              <div className="grid grid-cols-7 gap-3 min-w-[700px]">
                {weekDays.map((day, i) => {
                  const dayEvts = eventsByDay[i]
                  const isToday = i === todayIdx
                  return (
                    <div key={i}>
                      <div className="text-center mb-3">
                        <p className={cn('text-[11px] font-bold uppercase tracking-wider', isToday ? 'text-primary' : 'text-muted-foreground')}>
                          {DAYS_SHORT[i]}
                        </p>
                        <p className={cn('text-sm font-bold mt-0.5', isToday ? 'text-primary' : 'text-foreground')}>
                          {day.getDate()}
                        </p>
                      </div>
                      {dayEvts.length === 0 ? (
                        <p className="text-center text-xl text-muted-foreground/40 font-light select-none pt-1">—</p>
                      ) : (
                        <div className="space-y-3">
                          {dayEvts.map((ev) => (
                            <WeekCard key={ev.id} event={ev} isToday={isToday} showMember={showMemberBadge && children.length > 0} onClick={() => setSelectedEvent(ev)} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Empty state "aucun cours cette semaine" */}
          {!loading && weekCount === 0 && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-xl bg-muted flex items-center justify-center">
                <Clock className="w-6 h-6 text-muted-foreground shrink-0" />
              </div>
              <p className="font-display font-bold text-foreground">Aucun cours cette semaine</p>
              <p className="text-sm text-muted-foreground">
                {orgId ? 'Les prochains créneaux apparaîtront ici dès leur publication.' : 'Sélectionnez une organisation depuis l\'accueil.'}
              </p>
            </div>
          )}
        </>
      )}

      <EventDetailSheet event={selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  )
}

export default PlanningPage
