import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, Users, Euro,
  CheckCircle2, Clock3, XCircle, AlertCircle, CalendarPlus,
  RefreshCw, ChevronDown, ChevronUp, UserMinus,
} from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, EventType } from '../../types'

// ─── types ───────────────────────────────────────────────────────────────────

interface EventWithReg extends Event {
  myReservation?: { id: string; status: 'confirmed' | 'pending' | 'cancelled' } | null
  current_registrations?: number
  available_spots?: number | null
}

type EventGroup = {
  key: string
  representative: EventWithReg
  occurrences: EventWithReg[]   // sorted upcoming (includes representative)
  isRecurring: boolean
}

// ─── meta ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; badge: string }> = {
  training: { label: 'Entraînement', badge: 'bg-accent/15 text-accent' },
  match: { label: 'Match',        badge: 'bg-destructive/10 text-destructive' },
  meeting: { label: 'Réunion',      badge: 'bg-primary/10 text-primary' },
  workshop: { label: 'Atelier',      badge: 'bg-cat-music/10 text-cat-music' },
  other: { label: 'Autre',        badge: 'bg-muted text-muted-foreground' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtDayShort = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const getErrMsg = (e: unknown, fb: string) =>
  (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? fb

function buildGroups(events: EventWithReg[]): EventGroup[] {
  const now = Date.now()
  const map = new Map<string, EventWithReg[]>()

  for (const e of events) {
    const key = e.parent_event_id ?? e.id
    const arr = map.get(key) ?? []
    arr.push(e)
    map.set(key, arr)
  }

  const groups: EventGroup[] = []

  for (const [key, evs] of map) {
    const upcoming = evs
      .filter(e => new Date(e.start_time).getTime() >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

    if (upcoming.length === 0) { continue }

    const isRecurring = evs.length > 1 || evs.some(e => e.is_recurring)
    groups.push({ key, representative: upcoming[0], occurrences: upcoming, isRecurring })
  }

  return groups.sort(
    (a, b) => new Date(a.representative.start_time).getTime() - new Date(b.representative.start_time).getTime(),
  )
}

// ─── small occurrence row ─────────────────────────────────────────────────────

const OccurrenceRow: React.FC<{
  ev: EventWithReg
  orgId: string
  acting: boolean
  onRegister: (id: string) => void
  onUnregister: (id: string) => void
}> = ({ ev, orgId: _orgId, acting, onRegister, onUnregister }) => {
  const myRsv = ev.myReservation
  const active = myRsv && myRsv.status !== 'cancelled'
  const isFull = !!(ev.capacity && (ev.available_spots ?? 1) <= 0)

  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/60 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-foreground capitalize">
          {fmtDayShort(ev.start_time)}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {fmtTime(ev.start_time)}{ev.end_time ? ` – ${fmtTime(ev.end_time)}` : ''}
          {ev.capacity && (
            <span className="ml-2 text-[11px]">
              · {ev.current_registrations ?? 0}/{ev.capacity}
            </span>
          )}
        </p>
      </div>

      {active ? (
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'text-[11px] font-bold px-2 py-1 rounded-full',
              myRsv?.status === 'pending' ? 'bg-amber-500/10 text-amber-600' : 'bg-accent/10 text-accent',
            )}
          >
            {myRsv?.status === 'pending' ? 'Attente' : 'Inscrit'}
          </span>
          <button
            type="button"
            disabled={acting}
            onClick={e => { e.stopPropagation(); onUnregister(ev.id) }}
            className="w-7 h-7 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors disabled:opacity-40"
          >
            <UserMinus className="w-3 h-3 shrink-0" />
          </button>
        </div>
      ) : ev.registration_required ? (
        <button
          type="button"
          disabled={acting}
          onClick={e => { e.stopPropagation(); onRegister(ev.id) }}
          className={cn(
            'text-[11px] font-bold px-3 py-1.5 rounded-full transition-colors disabled:opacity-40',
            isFull
              ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
              : 'bg-primary/10 text-primary hover:bg-primary/20',
          )}
        >
          {isFull ? 'Attente' : 'S\'inscrire'}
        </button>
      ) : null}
    </div>
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

const ClubEventsPage: React.FC = () => {
  const navigate = useNavigate()
  const [events,   setEvents]   = useState<EventWithReg[]>([])
  const [loading,  setLoading]  = useState(true)
  const [acting,   setActing]   = useState<string | null>(null)
  const [error,    setError]    = useState<string | null>(null)
  const [orgId,    setOrgId]    = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  // Load org from localStorage
  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem('selectedOrganisation')
        if (raw) { const org = JSON.parse(raw); if (org?.id) {setOrgId(org.id)} }
      } catch { /* noop */ }
    }
    load()
    window.addEventListener('storage', load)
    window.addEventListener('organisation:updated', load)
    return () => {
      window.removeEventListener('storage', load)
      window.removeEventListener('organisation:updated', load)
    }
  }, [])

  useEffect(() => { if (orgId) { void loadEvents() } else { setLoading(false) } }, [orgId])

  const loadEvents = async () => {
    if (!orgId) { return }
    setLoading(true); setError(null)
    try {
      const data = await api.get<EventWithReg[]>(
        `/organisations/${orgId}/events`,
        { status: 'published' },
        { useCache: false },
      )
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      setError('Erreur lors du chargement des événements')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const patchEvent = useCallback((eventId: string, patch: Partial<EventWithReg>) => {
    setEvents(prev => prev.map(e => e.id === eventId ? { ...e, ...patch } : e))
  }, [])

  const handleRegister = useCallback(async (eventId: string) => {
    if (!orgId || acting) { return }
    const ev = events.find(e => e.id === eventId)
    if (!ev?.registration_required) { return }
    setActing(eventId); setError(null)
    try {
      const result = await api.post<{
        message: string
        reservation: { id: string; status: 'confirmed' | 'pending' }
      }>(`/organisations/${orgId}/events/${eventId}/register`)
      const confirmed = result.reservation.status === 'confirmed'
      patchEvent(eventId, {
        myReservation: result.reservation,
        current_registrations: confirmed
          ? (ev.current_registrations ?? 0) + 1
          : ev.current_registrations,
        available_spots: confirmed && ev.capacity
          ? Math.max(0, (ev.available_spots ?? 0) - 1)
          : ev.available_spots,
      })
    } catch (err) {
      setError(getErrMsg(err, "Erreur lors de l'inscription"))
    } finally {
      setActing(null)
    }
  }, [orgId, acting, events, patchEvent])

  const handleUnregister = useCallback(async (eventId: string) => {
    if (!orgId || acting) { return }
    const ev = events.find(e => e.id === eventId)
    if (!ev) { return }
    setActing(eventId); setError(null)
    try {
      await api.delete(`/organisations/${orgId}/events/${eventId}/register`)
      const wasConfirmed = ev.myReservation?.status === 'confirmed'
      patchEvent(eventId, {
        myReservation: null,
        current_registrations: wasConfirmed
          ? Math.max(0, (ev.current_registrations ?? 0) - 1)
          : ev.current_registrations,
        available_spots: wasConfirmed && ev.capacity
          ? (ev.available_spots ?? 0) + 1
          : ev.available_spots,
      })
    } catch (err) {
      setError(getErrMsg(err, 'Erreur lors de la désinscription'))
    } finally {
      setActing(null)
    }
  }, [orgId, acting, events, patchEvent])

  const groups = useMemo(() => buildGroups(events), [events])

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  const getRegStatus = (ev: EventWithReg) => {
    if (!ev.myReservation || ev.myReservation.status === 'cancelled') { return null }
    const s = ev.myReservation.status
    if (s === 'confirmed') { return { label: 'Inscrit', icon: CheckCircle2, cls: 'text-accent bg-accent/10' } }
    if (s === 'pending')   { return { label: 'En attente', icon: Clock3, cls: 'text-amber-600 bg-amber-500/10' } }
    return null
  }

  const availabilityText = (ev: EventWithReg): string | null => {
    if (!ev.registration_required) { return 'Accès libre' }
    if (ev.capacity) {
      const spots = ev.available_spots ?? (ev.capacity - (ev.current_registrations ?? 0))
      if (spots <= 0) { return 'Complet' }
      return `${spots} place${spots > 1 ? 's' : ''} restante${spots > 1 ? 's' : ''}`
    }
    return null
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Événements à venir</h1>
        <p className="text-sm text-muted-foreground mt-1">Compétitions, stages et temps forts du club</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-destructive hover:opacity-70 shrink-0">
            <XCircle className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <CalendarPlus className="w-7 h-7 text-primary shrink-0" />
          </div>
          <h2 className="font-display font-bold text-foreground mb-1">Aucun événement disponible</h2>
          <p className="text-sm text-muted-foreground">Les prochains événements apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map(({ key, representative: ev, occurrences, isRecurring }) => {
            const type   = TYPE_META[ev.event_type]
            const avail  = availabilityText(ev)
            const status = getRegStatus(ev)
            const StatusIcon = status?.icon
            const isFull = !!(ev.capacity && (ev.available_spots ?? 1) <= 0)
            const canReg = ev.registration_required && !ev.myReservation && ev.status === 'published'
            const canUnreg = !!(ev.myReservation && ev.myReservation.status !== 'cancelled')
            const isExpanded = expanded.has(key)
            const otherOccurrences = occurrences.slice(1)

            return (
              <div
                key={key}
                className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 hover:shadow-sm transition-all"
              >
                {/* Main card — clickable to detail */}
                <div
                  onClick={() => navigate(`/club/events/${ev.id}`)}
                  className="p-5 space-y-3 cursor-pointer active:scale-[0.99] transition-transform"
                >
                  {/* Top row: type badge + price + full + recurring + availability */}
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('text-[11px] font-bold uppercase px-2.5 py-1 rounded-full', type.badge)}>
                        {type.label}
                      </span>
                      {ev.price > 0 && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-700">
                          <Euro className="w-2.5 h-2.5 shrink-0" />
                          {ev.price.toFixed(2)} €
                        </span>
                      )}
                      {isFull && (
                        <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                          Complet
                        </span>
                      )}
                      {isRecurring && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/8 text-primary">
                          <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                          Récurrent
                        </span>
                      )}
                    </div>
                    {avail && !isFull && (
                      <span className="text-xs font-semibold shrink-0 text-muted-foreground">
                        {avail}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-foreground text-lg leading-snug">{ev.title}</h3>

                  {/* Details */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      {isRecurring ? `Prochaine : ${fmtDate(ev.start_time)}` : fmtDate(ev.start_time)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      {fmtTime(ev.start_time)}{ev.end_time ? ` – ${fmtTime(ev.end_time)}` : ''}
                    </span>
                    {ev.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {ev.location}
                      </span>
                    )}
                    {ev.capacity && (
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        {ev.current_registrations ?? 0}/{ev.capacity}
                      </span>
                    )}
                    {ev.price > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Euro className="w-3.5 h-3.5 shrink-0" />
                        {ev.price.toFixed(2)} €
                      </span>
                    )}
                  </div>

                  {/* Registration status badge */}
                  {status && StatusIcon && (
                    <div className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full', status.cls)}>
                      <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                      {status.label}
                    </div>
                  )}
                </div>

                {/* CTAs */}
                {ev.registration_required && (canReg || canUnreg) && (
                  <div className="px-5 pb-4 flex gap-2">
                    {canReg && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); void handleRegister(ev.id) }}
                        disabled={acting === ev.id}
                        className={cn(
                          'flex-1 text-sm font-bold py-2.5 rounded-full active:scale-95 transition-transform disabled:opacity-50',
                          isFull
                            ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30'
                            : 'bg-primary text-primary-foreground',
                        )}
                      >
                        {acting === ev.id
                          ? 'En cours…'
                          : isFull
                            ? "Liste d'attente"
                            : "S'inscrire"}
                      </button>
                    )}
                    {canUnreg && (
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); void handleUnregister(ev.id) }}
                        disabled={acting === ev.id}
                        className="flex-1 text-sm font-semibold py-2.5 rounded-full border border-destructive/20 bg-destructive/5 text-destructive active:scale-95 transition-transform disabled:opacity-50"
                      >
                        {acting === ev.id ? 'En cours…' : 'Se désinscrire'}
                      </button>
                    )}
                  </div>
                )}

                {/* Recurring: expandable other occurrences */}
                {isRecurring && otherOccurrences.length > 0 && (
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => toggleExpand(key)}
                      className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <span>
                        {isExpanded
                          ? 'Masquer les autres dates'
                          : `${otherOccurrences.length} autre${otherOccurrences.length > 1 ? 's' : ''} séance${otherOccurrences.length > 1 ? 's' : ''}`}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                        : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                    </button>

                    {isExpanded && (
                      <div className="px-2 pb-2 space-y-0.5">
                        {otherOccurrences.slice(0, 8).map(occ => (
                          <OccurrenceRow
                            key={occ.id}
                            ev={occ}
                            orgId={orgId ?? ''}
                            acting={acting === occ.id}
                            onRegister={handleRegister}
                            onUnregister={handleUnregister}
                          />
                        ))}
                        {otherOccurrences.length > 8 && (
                          <p
                            onClick={() => navigate(`/club/events/${ev.id}`)}
                            className="text-center text-xs text-muted-foreground py-2 cursor-pointer hover:text-foreground transition-colors"
                          >
                            + {otherOccurrences.length - 8} autres séances →
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ClubEventsPage
