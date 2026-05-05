import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, MapPin, Users, Euro,
  CheckCircle2, Clock3, XCircle, AlertCircle, CalendarPlus,
} from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, EventType } from '../../types'

// ─── types ───────────────────────────────────────────────────────────────────

interface EventWithRegistration extends Event {
  myReservation?: { id: string; status: 'confirmed' | 'pending' | 'cancelled' }
}

// ─── meta ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; badge: string }> = {
  training: { label: 'Entraînement', badge: 'bg-accent/15 text-accent' },
  match: { label: 'Match', badge: 'bg-destructive/10 text-destructive' },
  meeting: { label: 'Réunion', badge: 'bg-primary/10 text-primary' },
  workshop: { label: 'Atelier', badge: 'bg-cat-music/10 text-cat-music' },
  other: { label: 'Autre', badge: 'bg-muted text-muted-foreground' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ─── main ────────────────────────────────────────────────────────────────────

const ClubOrgEventsPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [events, setEvents]           = useState<EventWithRegistration[]>([])
  const [loading, setLoading]         = useState(true)
  const [registering, setRegistering] = useState<string | null>(null)
  const [error, setError]             = useState<string | null>(null)

  useEffect(() => {
    if (orgId) {
      loadEvents()
    } else {
      setLoading(false)
    }
  }, [orgId])

  const loadEvents = async () => {
    if (!orgId) { return }
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<EventWithRegistration[]>(
        `/organisations/${orgId}/events`,
        { status: 'published' },
        { useCache: true, cacheTTL: 30000 },
      )
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      setError('Erreur lors du chargement des événements')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: string) => {
    if (!orgId) { return }
    const ev = events.find(e => e.id === eventId)
    if (!ev?.registration_required) { return }
    try {
      setRegistering(eventId)
      setError(null)
      const result = await api.post<{
        message: string
        reservation: { id: string; status: 'confirmed' | 'pending' }
      }>(`/organisations/${orgId}/events/${eventId}/register`)
      setEvents(prev =>
        prev.map(e =>
          e.id === eventId
            ? {
                ...e,
                myReservation: result.reservation,
                current_registrations:
                  result.reservation.status === 'confirmed'
                    ? (e.current_registrations ?? 0) + 1
                    : (e.current_registrations ?? 0),
              }
            : e,
        ),
      )
      await loadEvents()
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })?.response?.data
          ?.message ?? "Erreur lors de l'inscription"
      setError(msg)
    } finally {
      setRegistering(null)
    }
  }

  const getRegStatus = (ev: EventWithRegistration) => {
    if (!ev.myReservation) { return null }
    const s = ev.myReservation.status
    if (s === 'confirmed') {
      return { label: 'Inscrit', icon: CheckCircle2, cls: 'text-accent bg-accent/10' }
    }
    if (s === 'pending') {
      return { label: 'En attente', icon: Clock3, cls: 'text-amber-600 bg-amber-500/10' }
    }
    return { label: 'Annulé', icon: XCircle, cls: 'text-muted-foreground bg-muted' }
  }

  const canRegister = (ev: EventWithRegistration) =>
    ev.registration_required &&
    !ev.myReservation &&
    ev.status === 'published' &&
    !(ev.capacity && (ev.available_spots ?? 1) <= 0)

  const availabilityText = (ev: EventWithRegistration): string | null => {
    if (!ev.registration_required) { return 'Accès libre' }
    if (ev.visibility === 'members_only') { return 'Membres uniquement' }
    if (ev.visibility === 'private') { return 'Sur invitation' }
    if (ev.capacity) {
      const spots = ev.available_spots ?? ev.capacity - (ev.current_registrations ?? 0)
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

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive flex-1">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-destructive hover:opacity-70 shrink-0"
          >
            <XCircle className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <CalendarPlus className="w-7 h-7 text-primary shrink-0" />
          </div>
          <h2 className="font-display font-bold text-foreground mb-1">Aucun événement disponible</h2>
          <p className="text-sm text-muted-foreground">Les prochains événements apparaîtront ici.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map(ev => {
            const type   = TYPE_META[ev.event_type]
            const avail  = availabilityText(ev)
            const status = getRegStatus(ev)
            const StatusIcon = status?.icon

            return (
              <div
                key={ev.id}
                onClick={() => navigate(`/club/events/${ev.id}`)}
                className="bg-card border border-border rounded-2xl p-5 space-y-4 cursor-pointer hover:border-primary/20 hover:shadow-sm transition-all active:scale-[0.99]"
              >
                {/* Type badge + availability */}
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('text-[11px] font-bold uppercase px-2.5 py-1 rounded-full', type.badge)}>
                    {type.label}
                  </span>
                  {avail && (
                    <span className="text-xs text-muted-foreground shrink-0">{avail}</span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-display font-bold text-foreground text-lg leading-snug">
                  {ev.title}
                </h3>

                {/* Details inline */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    {fmtDate(ev.start_time)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {fmtTime(ev.start_time)}
                    {ev.end_time && ` – ${fmtTime(ev.end_time)}`}
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

                {/* Registration status */}
                {status && StatusIcon && (
                  <div className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full', status.cls)}>
                    <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                    {status.label}
                  </div>
                )}

                {/* CTA */}
                {canRegister(ev) ? (
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      void handleRegister(ev.id)
                    }}
                    disabled={registering === ev.id}
                    className="w-full bg-primary text-primary-foreground text-sm font-bold py-2.5 rounded-full active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {registering === ev.id ? 'Inscription…' : "S'inscrire"}
                  </button>
                ) : (
                  ev.registration_required && !ev.myReservation && (
                    <p className="text-center text-xs text-muted-foreground pt-1">
                      {(ev.available_spots ?? 1) <= 0 ? 'Complet' : 'Inscription non disponible'}
                    </p>
                  )
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ClubOrgEventsPage
