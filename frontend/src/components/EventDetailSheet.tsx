import React, { useState, useEffect } from 'react'
import {
  X, Clock, MapPin, Navigation, Calendar, Sparkles,
  UserCheck, UserX, Loader2, CheckCircle2, AlertCircle, Euro,
  Users,
} from 'lucide-react'
import { cn } from '../lib/utils'
import { api } from '../lib/api'
import type { EventType, EventStatus } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SheetMember {
  id: string
  name: string
  color: string
  avatarUrl?: string | null
}

export interface SheetEvent {
  id: string
  title: string
  start_time: string
  end_time: string
  location: string | null
  event_type: EventType
  created_by?: { firstname: string; lastname: string } | null
  memberId: string
  memberName: string
  memberColor: string
  memberAvatarUrl?: string | null
  extraMembers?: SheetMember[]
  orgId?: string
  isRegistered?: boolean
  description?: string
  registrationRequired?: boolean
  myReservation?: { id: string; status: string } | null
  capacity?: number
  currentRegistrations?: number
  availableSpots?: number | null
  price?: number
}

interface FullEvent {
  id: string
  description?: string
  registration_required: boolean
  capacity?: number
  current_registrations?: number
  available_spots?: number | null
  price: number
  status: EventStatus
  myReservation?: { id: string; status: string } | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; from: string; to: string; text: string }> = {
  training: { label: 'Entraînement', from: 'from-accent', to: 'to-accent/70', text: 'text-white' },
  match: { label: 'Match', from: 'from-destructive', to: 'to-destructive/70', text: 'text-white' },
  meeting: { label: 'Réunion', from: 'from-primary', to: 'to-primary/70', text: 'text-white' },
  workshop: { label: 'Atelier', from: 'from-cat-music', to: 'to-cat-music/70', text: 'text-white' },
  other: { label: 'Autre', from: 'from-muted-foreground', to: 'to-muted-foreground/70', text: 'text-white' },
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ─── Component ────────────────────────────────────────────────────────────────

export const EventDetailSheet: React.FC<{
  event: SheetEvent | null
  onClose: () => void
}> = ({ event, onClose }) => {
  const [fullEvent,       setFullEvent]       = useState<FullEvent | null>(null)
  const [fetchLoading,    setFetchLoading]    = useState(false)
  const [registering,     setRegistering]     = useState(false)
  const [regError,        setRegError]        = useState<string | null>(null)
  const [localRegistered, setLocalRegistered] = useState<boolean | null>(null)

  useEffect(() => {
    if (!event) { setFullEvent(null); setLocalRegistered(null); return }
    setRegError(null)
    setLocalRegistered(null)

    if (event.registrationRequired !== undefined) {
      setFullEvent({
        id: event.id,
        description: event.description,
        registration_required: event.registrationRequired,
        capacity: event.capacity,
        current_registrations: event.currentRegistrations,
        available_spots: event.availableSpots,
        price: event.price ?? 0,
        status: 'published',
        myReservation: event.myReservation,
      })
    }

    if (!event.orgId) { return }
    setFetchLoading(true)
    api.get<FullEvent>(`/organisations/${event.orgId}/events/${event.id}`, undefined, { useCache: false })
      .then(setFullEvent)
      .catch(() => {})
      .finally(() => setFetchLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?.orgId])

  if (!event) { return null }

  const meta = TYPE_META[event.event_type] ?? TYPE_META.other
  const isChild = event.memberId !== 'me'
  const allMembers: SheetMember[] = [
    { id: event.memberId, name: event.memberName, color: event.memberColor, avatarUrl: event.memberAvatarUrl },
    ...(event.extraMembers ?? []),
  ]

  const baseRegistered = isChild ? (event.isRegistered ?? false) : !!fullEvent?.myReservation
  const effectiveReg   = localRegistered !== null ? localRegistered : baseRegistered
  const reservationSt  = isChild ? null : fullEvent?.myReservation?.status
  const regRequired    = fullEvent?.registration_required ?? false
  const isPublished    = fullEvent?.status === 'published'
  const spotsLeft      = fullEvent?.available_spots
  const canRegister    = regRequired && !effectiveReg && isPublished && (spotsLeft === null || spotsLeft === undefined || spotsLeft > 0)
  const canUnregister  = regRequired && effectiveReg
  const isFull         = regRequired && !effectiveReg && spotsLeft === 0

  const handleRegister = async () => {
    if (!event.orgId || registering) { return }
    setRegistering(true); setRegError(null)
    try {
      if (isChild) {
        await api.post(`/family/children/${event.memberId}/events/${event.id}/register`, {})
      } else {
        await api.post(`/organisations/${event.orgId}/events/${event.id}/register`, {})
      }
      setLocalRegistered(true)
    } catch (e: unknown) {
      setRegError((e as { message?: string })?.message ?? "Erreur lors de l'inscription")
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    if (!event.orgId || registering) { return }
    setRegistering(true); setRegError(null)
    try {
      if (isChild) {
        await api.delete(`/family/children/${event.memberId}/events/${event.id}/register`)
      } else {
        await api.delete(`/organisations/${event.orgId}/events/${event.id}/register`)
      }
      setLocalRegistered(false)
    } catch (e: unknown) {
      setRegError((e as { message?: string })?.message ?? 'Erreur lors de la désinscription')
    } finally {
      setRegistering(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />

      {/* Mobile: bottom sheet | Desktop: modal centrée */}
      <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center sm:p-6 pointer-events-none">
        <div className="w-full sm:max-w-md bg-card sm:rounded-3xl rounded-t-3xl shadow-2xl border-t sm:border border-border max-h-[90vh] flex flex-col pointer-events-auto">

          {/* Handle (mobile only) */}
          <div className="flex justify-center pt-3 pb-1 shrink-0 sm:hidden">
            <div className="w-10 h-1.5 bg-border rounded-full" />
          </div>

          {/* Hero gradient */}
          <div className={cn('relative overflow-hidden mx-4 mt-4 rounded-2xl p-5 shrink-0 bg-gradient-to-br', meta.from, meta.to)}>
            <div className="absolute -right-6 -top-6 w-28 h-28 bg-white/10 rounded-full blur-2xl" />
            <div className="relative flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold bg-white/20 text-white px-2.5 py-1 rounded-full inline-block mb-2">
                  {meta.label}
                </span>
                <h2 className={cn('font-display text-xl font-bold leading-tight', meta.text)}>{event.title}</h2>
                <div className={cn('flex items-center gap-1.5 mt-2 text-sm opacity-90', meta.text)}>
                  <Calendar className="w-3.5 h-3.5 shrink-0" />
                  <span className="capitalize">{fmtDate(event.start_time)}</span>
                </div>
                <div className={cn('flex items-center gap-1.5 mt-1 text-sm opacity-90', meta.text)}>
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
                </div>
                {event.location && (
                  <div className={cn('flex items-center gap-1.5 mt-1 text-sm opacity-90', meta.text)}>
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors shrink-0"
              >
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Badge statut dans le hero */}
            {regRequired && (
              <div className="mt-3">
                {effectiveReg && reservationSt === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500/30 text-amber-100 px-3 py-1.5 rounded-full">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Liste d'attente
                  </span>
                )}
                {effectiveReg && (reservationSt === 'confirmed' || isChild) && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500/30 text-emerald-100 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Inscrit{isChild ? ` — ${event.memberName}` : ''}
                  </span>
                )}
                {isFull && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 text-white/80 px-3 py-1.5 rounded-full">
                    <Users className="w-3.5 h-3.5 shrink-0" /> Complet
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Corps scrollable */}
          <div className="overflow-y-auto flex-1 px-4 pb-4 pt-4 space-y-4">

            {fetchLoading && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            )}

            {!fetchLoading && fullEvent?.description && (
              <div className="bg-muted rounded-2xl p-4">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1.5">Description</p>
                <p className="text-sm text-foreground leading-relaxed">{fullEvent.description}</p>
              </div>
            )}

            {!fetchLoading && fullEvent && (fullEvent.capacity || fullEvent.price > 0) && (
              <div className="grid grid-cols-2 gap-3">
                {fullEvent.capacity && (
                  <div className="bg-muted rounded-2xl p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Places</p>
                    <p className="font-display text-lg font-bold text-foreground">
                      {fullEvent.current_registrations ?? 0}
                      <span className="text-muted-foreground font-normal text-sm">/{fullEvent.capacity}</span>
                    </p>
                  </div>
                )}
                {fullEvent.price > 0 && (
                  <div className="bg-muted rounded-2xl p-3 text-center">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Tarif</p>
                    <p className="font-display text-lg font-bold text-foreground flex items-center justify-center gap-1">
                      {fullEvent.price} <Euro className="w-4 h-4 shrink-0" />
                    </p>
                  </div>
                )}
              </div>
            )}

            {allMembers.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">Participants</p>
                <div className="flex flex-wrap gap-2">
                  {allMembers.map((m) => (
                    <div key={m.id} className="flex items-center gap-2 bg-muted rounded-xl px-3 py-2">
                      {m.avatarUrl ? (
                        <img src={m.avatarUrl} alt={m.name} className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-sm font-semibold text-foreground">{m.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coach — TODO: brancher quand feature coach disponible */}
            <div className="rounded-2xl border border-dashed border-border p-4 opacity-50">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Coach de séance</p>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 shrink-0" /> Bientôt disponible
              </p>
            </div>

            {regError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-sm text-destructive">{regError}</p>
              </div>
            )}

            <div className={cn('grid gap-3', event.location && (canRegister || canUnregister) ? 'grid-cols-2' : 'grid-cols-1')}>
              {event.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-12 inline-flex items-center justify-center gap-2 border border-border rounded-2xl text-foreground font-bold text-sm hover:border-primary/40 transition-colors active:scale-95"
                >
                  <Navigation className="w-4 h-4 shrink-0" />
                  Itinéraire
                </a>
              )}

              {canRegister && (
                <button
                  onClick={handleRegister}
                  disabled={registering}
                  className="h-12 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl font-bold text-sm hover:opacity-90 active:scale-95 transition-transform shadow-lg shadow-primary/25 disabled:opacity-50"
                >
                  {registering
                    ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    : <UserCheck className="w-4 h-4 shrink-0" />}
                  {registering ? 'Inscription…' : `S'inscrire${isChild ? ` — ${event.memberName}` : ''}`}
                </button>
              )}

              {canUnregister && (
                <button
                  onClick={handleUnregister}
                  disabled={registering}
                  className="h-12 inline-flex items-center justify-center gap-2 border border-destructive/30 bg-destructive/5 text-destructive rounded-2xl font-bold text-sm hover:bg-destructive/10 active:scale-95 transition-transform disabled:opacity-50"
                >
                  {registering
                    ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    : <UserX className="w-4 h-4 shrink-0" />}
                  {registering ? 'Désinscription…' : 'Se désinscrire'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
