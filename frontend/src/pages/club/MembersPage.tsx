import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Clock, MapPin, User, Dumbbell, Music, Trophy, Users,
  Bookmark, CheckCircle2, AlertCircle, Calendar, Building2,
  Navigation, Info, ShieldCheck, ArrowRight, ChevronRight,
} from 'lucide-react'
import type { RoleType } from '../../types'
import { useAuth } from '../../contexts/AuthContext'
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, EventType } from '../../types'

// ─── constants ───────────────────────────────────────────────────────────────

const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const EVENT_META: Record<EventType, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
}> = {
  training: { label: 'Entraînement', Icon: Dumbbell, bg: 'bg-accent/15',     text: 'text-accent' },
  match: { label: 'Match',        Icon: Trophy,   bg: 'bg-destructive/10', text: 'text-destructive' },
  meeting: { label: 'Réunion',      Icon: Users,    bg: 'bg-primary/10',     text: 'text-primary' },
  workshop: { label: 'Atelier',      Icon: Music,    bg: 'bg-cat-music/10',   text: 'text-cat-music' },
  other: { label: 'Autre',        Icon: Bookmark, bg: 'bg-muted',          text: 'text-muted-foreground' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate()

const getWeekDays = (): Date[] => {
  const now = new Date()
  const dow = now.getDay()
  const monday = new Date(now)
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
  monday.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

const getGreeting = () => {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) {return 'Bonjour'}
  if (h >= 12 && h < 18) {return 'Bon après-midi'}
  if (h >= 18 && h < 22) {return 'Bonsoir'}
  return 'Bonne nuit'
}

const overlaps = (a: Event, b: Event) =>
  new Date(a.start_time) < new Date(b.end_time) &&
  new Date(b.start_time) < new Date(a.end_time)

// ─── sub-components ──────────────────────────────────────────────────────────

const CategoryBubble: React.FC<{ type: EventType }> = ({ type }) => {
  const meta = EVENT_META[type]
  const Icon = meta.Icon
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', meta.bg, meta.text)}>
      <Icon className="w-4 h-4 shrink-0" />
    </div>
  )
}

/** Card dans la grille hebdomadaire (colonne) */
const WeeklyCard: React.FC<{ event: Event; isToday: boolean }> = ({ event, isToday }) => {
  const coachInitials = event.created_by
    ? `${event.created_by.firstname[0]}${event.created_by.lastname[0]}`.toUpperCase()
    : '?'

  return (
    <div
      className={cn(
        'bg-card border rounded-2xl p-3 space-y-2.5 cursor-pointer active:scale-[0.99] transition-all hover:shadow-sm',
        isToday ? 'border-primary/25' : 'border-border',
      )}
    >
      <div className="flex items-center justify-between">
        <CategoryBubble type={event.event_type} />
        <span className="text-xs font-bold text-foreground tabular-nums">
          {fmtTime(event.start_time)}
        </span>
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
      {event.created_by && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
          {coachInitials}
        </div>
      )}
    </div>
  )
}

/** Ligne dans la section "Aujourd'hui" */
const TodayRow: React.FC<{ event: Event }> = ({ event }) => (
  <div className="flex items-center gap-4 py-3 border-b border-border last:border-0">
    {/* Heure */}
    <div className="text-right shrink-0 w-12">
      <p className="text-sm font-bold text-foreground tabular-nums">{fmtTime(event.start_time)}</p>
      <p className="text-[10px] text-muted-foreground tabular-nums">{fmtTime(event.end_time)}</p>
    </div>
    {/* Category */}
    <CategoryBubble type={event.event_type} />
    {/* Info */}
    <div className="flex-1 min-w-0">
      <p className="font-semibold text-sm text-foreground truncate">{event.title}</p>
      <p className="text-xs text-muted-foreground truncate">
        {[event.location, event.created_by
          ? `${event.created_by.firstname} ${event.created_by.lastname}`
          : null]
          .filter(Boolean).join(' · ')}
      </p>
    </div>
    {/* Avatar */}
    {event.created_by && (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
        {event.created_by.firstname[0]}{event.created_by.lastname[0]}
      </div>
    )}
  </div>
)

// ─── main ────────────────────────────────────────────────────────────────────

type OrgItem = {
  id: string;
  name: string;
  type: 'club' | 'association' | 'independant';
  roleType: RoleType;
  roleName: string;
};

const ClubMembersPage: React.FC = () => {
  const { user } = useAuth()
  const { organisation, role } = useCurrentOrganisation()
  const orgId = organisation?.id
  const isManager = role === 'manager'

  const [events,      setEvents]      = useState<Event[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [myOrgs,      setMyOrgs]      = useState<OrgItem[]>([])
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    if (!orgId) { setLoading(false); return }
    const load = async () => {
      setLoading(true)
      try {
        const [evtsData, membsData, orgsData] = await Promise.all([
          api.get<Event[]>(`/organisations/${orgId}/events`, { status: 'published' }, { useCache: true, cacheTTL: 60000 }),
          api.get<{ id: string }[]>(`/organisations/${orgId}/members`, undefined, { useCache: true, cacheTTL: 120000 }),
          api.get<{ organisation: { id: string; name: string; type: string | null }; role: { name: string; type: RoleType } }[]>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 }),
        ])
        setEvents(Array.isArray(evtsData) ? evtsData : [])
        setMemberCount(Array.isArray(membsData) ? membsData.length : 0)
        setMyOrgs(
          Array.isArray(orgsData)
            ? orgsData.map(item => ({
              id: item.organisation.id,
              name: item.organisation.name,
              type: (item.organisation.type ?? 'club') as 'club' | 'association' | 'independant',
              roleType: item.role.type,
              roleName: item.role.name,
            }))
            : [],
        )
      } catch {
        setEvents([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [orgId])

  const today    = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d }, [])
  const weekDays = useMemo(() => getWeekDays(), [])
  const todayIdx = weekDays.findIndex(d => isSameDay(d, today))

  const upcomingEvents = useMemo(() =>
    events
      .filter(e => new Date(e.start_time) >= today)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
  [events, today],
  )

  const todayEvents = useMemo(() =>
    upcomingEvents.filter(e => isSameDay(new Date(e.start_time), today)),
  [upcomingEvents, today],
  )

  const nextEvent = useMemo(() =>
    upcomingEvents.find(e => !isSameDay(new Date(e.start_time), today)) ?? upcomingEvents[0] ?? null,
  [upcomingEvents, today],
  )

  const nextTwo = useMemo(() =>
    upcomingEvents.filter(e => !isSameDay(new Date(e.start_time), today)).slice(1, 3),
  [upcomingEvents, today],
  )

  const weekEnd = useMemo(() => { const d = new Date(today); d.setDate(d.getDate() + 7); return d }, [today])
  const weekEvents = useMemo(() =>
    events.filter(e => { const d = new Date(e.start_time); return d >= today && d < weekEnd }),
  [events, today, weekEnd],
  )

  const disciplines = useMemo(() => [...new Set(events.map(e => e.event_type))], [events])
  const conflict    = todayEvents.some((a, i) => todayEvents.slice(i + 1).some(b => overlaps(a, b)))

  const eventsByDay = useMemo(() =>
    weekDays.map(day =>
      events
        .filter(e => isSameDay(new Date(e.start_time), day))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    ),
  [events, weekDays],
  )

  const todayLabel = today.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
  const dayName    = today.toLocaleDateString('fr-FR', { weekday: 'long' }).toUpperCase()

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  // ── Mes associations widget ──────────────────────────────────────────────
  const ORG_CARD_META = {
    club: { Icon: Dumbbell, bg: 'bg-cat-sport/15', text: 'text-cat-sport', label: 'Sport' },
    association: { Icon: Music, bg: 'bg-cat-music/15', text: 'text-cat-music', label: 'Musique' },
    independant: { Icon: Users, bg: 'bg-primary/15', text: 'text-primary', label: 'Coach' },
  } as const

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const AssociationsWidget = () => (
    <div className="bg-card border border-border rounded-2xl p-5 sticky top-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg font-bold text-foreground">Mes associations</h2>
        {myOrgs.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {myOrgs.length} club{myOrgs.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {myOrgs.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Aucune association.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {myOrgs.map(org => {
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
                {/* Category icon */}
                <div className={cn('rounded-xl flex items-center justify-center w-10 h-10 shrink-0', meta.bg)}>
                  <OrgIc className={cn('w-5 h-5 shrink-0', meta.text)} />
                </div>

                {/* Name + subtitle + avatar */}
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                    {org.name.split(' ')[0]?.charAt(0)}.
                  </p>
                  <div className="flex -space-x-1.5 mt-1">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-bold ring-2 ring-card shrink-0">
                      {userInitials}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-[11px] text-muted-foreground mt-1">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{isAdm ? 'Admin' : `${meta.label}`}</span>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-5">

      {/* ── Portail admin (gestionnaires uniquement) ────────────────────────── */}
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

        {/* ── Greeting + status ───────────────────────────────────────────────── */}
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            {getGreeting()}, {user?.firstName || 'Vous'} 👋
          </h1>
          <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
            ✨ {todayEvents.length === 0
              ? 'Aucune activité prévue aujourd\'hui.'
              : `${todayEvents.length} activité${todayEvents.length > 1 ? 's' : ''} aujourd'hui pour vous.`}
          </p>

          {/* Status row */}
          <div className="flex items-center justify-between mt-3">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border',
                conflict
                  ? 'text-destructive border-destructive/30 bg-destructive/5'
                  : 'text-accent border-accent/30 bg-accent/5',
              )}
            >
              {conflict
                ? <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
              {conflict ? 'Conflit détecté' : 'Aucun conflit'}
            </span>
            {weekEvents.length > 0 && (
              <span className="text-sm text-muted-foreground">
                Mode solo · {weekEvents.length} activité{weekEvents.length > 1 ? 's' : ''}/sem
              </span>
            )}
          </div>
        </div>

        {/* ── Stats row ───────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Calendar,   value: weekEvents.length, label: 'Activités/sem' },
            { icon: Users,      value: memberCount,        label: 'Membres' },
            { icon: Building2,  value: myOrgs.length,       label: 'Associations' },
            { icon: Bookmark,   value: disciplines.length, label: 'Disciplines' },
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

      {/* ── Grid : [Prochaine activité + Cours du jour] | [Mes associations] ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Colonne gauche : events */}
        <div className="lg:col-span-2 space-y-4">

          {/* Prochaine activité */}
          {nextEvent && (
            <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 rounded-3xl p-5 text-primary-foreground shadow-xl shadow-primary/30">
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-primary-foreground/70">⚡ Prochaine activité</p>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary-foreground/20 text-primary-foreground">
                    {isSameDay(new Date(nextEvent.start_time), today)
                      ? "Aujourd'hui"
                      : new Date(nextEvent.start_time).toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-bold text-primary-foreground mb-3">{nextEvent.title}</h2>
                <div className="grid grid-cols-2 gap-2 text-sm text-primary-foreground/85">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 shrink-0" />
                    {fmtTime(nextEvent.start_time)} – {fmtTime(nextEvent.end_time)}
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
                      <button className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-primary-foreground/20 text-primary-foreground active:scale-95 transition-transform">
                        <Navigation className="w-3.5 h-3.5 shrink-0" /> Itinéraire
                      </button>
                    )}
                    <Link to={`/club/events/${nextEvent.id}`} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-primary-foreground text-primary active:scale-95 transition-transform">
                      <Info className="w-3.5 h-3.5 shrink-0" /> Détails
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Deux prochains mini-cards */}
          {nextTwo.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {nextTwo.map(ev => (
                <div key={ev.id} className="bg-card border border-border rounded-2xl p-3 flex items-center gap-3 active:scale-[0.99] transition-all hover:border-primary/20">
                  <CategoryBubble type={ev.event_type} />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{ev.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(ev.start_time).toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^\w/, c => c.toUpperCase())} · {fmtTime(ev.start_time)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cours du jour */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{dayName}</p>
                <h2 className="font-display text-lg font-bold text-foreground">
                  {isSameDay(today, today) ? "Aujourd'hui" : todayLabel}
                </h2>
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
                todayEvents.map(ev => <TodayRow key={ev.id} event={ev} />)
              )}
            </div>
          </div>

        </div>

        {/* Colonne droite : Mes associations */}
        <div className="lg:col-span-1">
          <AssociationsWidget />
        </div>

      </div>

      {/* ── Mes activités — grille hebdo (full width) ───────────────────────── */}
      <section>
        <h2 className="font-display text-xl font-bold text-foreground mb-4">Mes activités</h2>
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {weekDays.map((day, i) => {
              const dayEvts = eventsByDay[i]
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
                      {dayEvts.map(ev => (
                        <WeeklyCard key={ev.id} event={ev} isToday={isToday} />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

    </div>
  )
}

export default ClubMembersPage
