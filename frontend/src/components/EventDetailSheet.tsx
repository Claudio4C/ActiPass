import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Clock, MapPin, Navigation, Calendar, Sparkles,
  UserCheck, UserX, Loader2, CheckCircle2, AlertCircle, Euro,
  Users, Clock3, CreditCard, Receipt,
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

interface EventPayment {
  id: string
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled'
  amount: number
  paid_at: string | null
  stripe_session_id: string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; from: string; to: string; text: string }> = {
  training: { label: 'Entraînement', from: 'from-accent',           to: 'to-accent/70',           text: 'text-white' },
  match:    { label: 'Match',        from: 'from-destructive',      to: 'to-destructive/70',      text: 'text-white' },
  meeting:  { label: 'Réunion',      from: 'from-primary',          to: 'to-primary/70',          text: 'text-white' },
  workshop: { label: 'Atelier',      from: 'from-cat-music',        to: 'to-cat-music/70',        text: 'text-white' },
  other:    { label: 'Autre',        from: 'from-muted-foreground', to: 'to-muted-foreground/70', text: 'text-white' },
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const getErrMsg = (e: unknown, fallback: string) =>
  (e as { response?: { data?: { message?: string } }; message?: string })?.response?.data?.message ??
  (e as { message?: string })?.message ??
  fallback

// ─── Component ────────────────────────────────────────────────────────────────

export const EventDetailSheet: React.FC<{
  event: SheetEvent | null
  onClose: () => void
  onRegistrationChange?: (eventId: string, reservation: { id: string; status: string } | null) => void
}> = ({ event, onClose, onRegistrationChange }) => {
  const navigate = useNavigate()
  const [fullEvent,      setFullEvent]      = useState<FullEvent | null>(null)
  const [fetchLoading,   setFetchLoading]   = useState(false)
  const [acting,         setActing]         = useState(false)
  const [regError,       setRegError]       = useState<string | null>(null)
  const [myPayment,      setMyPayment]      = useState<EventPayment | null>(null)
  const [checkingOut,    setCheckingOut]    = useState(false)
  const [loadingReceipt, setLoadingReceipt] = useState(false)

  // Local reservation state — overrides API data after actions (no reload)
  const [localReg, setLocalReg] = useState<{ registered: boolean; status: 'confirmed' | 'pending' | null } | null>(null)

  useEffect(() => {
    if (!event) { setFullEvent(null); setLocalReg(null); setMyPayment(null); return }
    setRegError(null)
    setLocalReg(null)
    setMyPayment(null)

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
    api
      .get<FullEvent>(`/organisations/${event.orgId}/events/${event.id}`, undefined, { useCache: false })
      .then(setFullEvent)
      .catch(() => {})
      .finally(() => setFetchLoading(false))

    // FIX 4 — fetch payment status for paid events
    if ((event.price ?? 0) > 0) {
      api
        .get<EventPayment | null>(
          `/organisations/${event.orgId}/events/${event.id}/my-payment`,
          undefined,
          { useCache: false },
        )
        .then(p => setMyPayment(p))
        .catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event?.id, event?.orgId])

  const goToDetail = () => {
    if (!event?.orgId) { return }
    navigate(`/club/events/${event.id}`)
    onClose()
  }

  const handleCheckout = async () => {
    if (!event?.orgId || checkingOut) { return }
    setCheckingOut(true)
    setRegError(null)
    try {
      const { checkout_url } = await api.post<{ checkout_url: string }>(
        `/organisations/${event.orgId}/events/${event.id}/checkout`,
      )
      if (checkout_url) { window.location.href = checkout_url }
    } catch (e: unknown) {
      setRegError(getErrMsg(e, 'Impossible de démarrer le paiement.'))
      setCheckingOut(false)
    }
  }

  const handleViewReceipt = async () => {
    if (!myPayment || loadingReceipt) { return }
    setLoadingReceipt(true)
    try {
      const { receipt_url } = await api.get<{ receipt_url: string | null }>(
        `/payments/${myPayment.id}/receipt-url`,
        undefined,
        { useCache: false },
      )
      if (receipt_url) { window.open(receipt_url, '_blank', 'noopener,noreferrer') }
      else { setRegError('Reçu indisponible pour le moment.') }
    } catch {
      setRegError('Impossible de récupérer le reçu.')
    } finally {
      setLoadingReceipt(false)
    }
  }

  if (!event) { return null }

  const meta    = TYPE_META[event.event_type] ?? TYPE_META.other
  const isChild = event.memberId !== 'me'
  const allMembers: SheetMember[] = [
    { id: event.memberId, name: event.memberName, color: event.memberColor, avatarUrl: event.memberAvatarUrl },
    ...(event.extraMembers ?? []),
  ]

  // Derive registration state — localReg takes priority over API data
  const apiRegistered = isChild ? (event.isRegistered ?? false) : !!fullEvent?.myReservation
  const apiStatus     = isChild ? null : (fullEvent?.myReservation?.status ?? null)
  const isRegistered  = localReg !== null ? localReg.registered  : apiRegistered
  const resvStatus    = localReg !== null ? localReg.status       : apiStatus

  const regRequired = fullEvent?.registration_required ?? false
  const isPublished = fullEvent?.status === 'published'
  const spotsLeft   = localReg?.registered
    ? (fullEvent?.available_spots != null ? fullEvent.available_spots - 1 : null)
    : fullEvent?.available_spots
  const isFull      = regRequired && !isRegistered && spotsLeft != null && spotsLeft <= 0

  // FIX 3+4 — état paiement pour events payants (non-enfant uniquement)
  const eventPrice        = fullEvent?.price ?? event.price ?? 0
  const isPaidEvent       = !isChild && eventPrice > 0
  const hasPaidPayment    = myPayment?.status === 'paid'
  const hasPendingPayment = myPayment?.status === 'pending'

  // Adjust the displayed registrations count to match local state immediately
  const displayedRegistrations = (() => {
    const base = fullEvent?.current_registrations ?? 0
    if (localReg === null) { return base }
    if (localReg.registered && localReg.status === 'confirmed') { return base + 1 }
    if (!localReg.registered && apiStatus === 'confirmed') { return Math.max(0, base - 1) }
    return base
  })()
  const canRegister = regRequired && !isRegistered && isPublished
  const canUnregister = regRequired && isRegistered

  const handleRegister = async () => {
    if (!event.orgId || acting) { return }
    setActing(true); setRegError(null)
    try {
      if (isChild) {
        await api.post(`/family/children/${event.memberId}/events/${event.id}/register`, {})
        setLocalReg({ registered: true, status: 'confirmed' })
        onRegistrationChange?.(event.id, { id: '', status: 'confirmed' })
      } else {
        const result = await api.post<{ message: string; reservation: { id: string; status: 'confirmed' | 'pending' } }>(
          `/organisations/${event.orgId}/events/${event.id}/register`, {},
        )
        setLocalReg({ registered: true, status: result.reservation.status })
        onRegistrationChange?.(event.id, result.reservation)
      }
    } catch (e: unknown) {
      setRegError(getErrMsg(e, "Erreur lors de l'inscription"))
    } finally {
      setActing(false)
    }
  }

  const handleUnregister = async () => {
    if (!event.orgId || acting) { return }
    setActing(true); setRegError(null)
    try {
      if (isChild) {
        await api.delete(`/family/children/${event.memberId}/events/${event.id}/register`)
      } else {
        await api.delete(`/organisations/${event.orgId}/events/${event.id}/register`)
      }
      setLocalReg({ registered: false, status: null })
      setMyPayment(null)
      onRegistrationChange?.(event.id, null)
    } catch (e: unknown) {
      setRegError(getErrMsg(e, 'Erreur lors de la désinscription'))
    } finally {
      setActing(false)
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

            {/* Status badge in hero */}
            {regRequired && (
              <div className="mt-3 flex flex-wrap gap-2">
                {isRegistered && resvStatus === 'pending' && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-amber-500/30 text-amber-100 px-3 py-1.5 rounded-full">
                    <Clock3 className="w-3.5 h-3.5 shrink-0" /> Liste d'attente
                  </span>
                )}
                {isRegistered && (resvStatus === 'confirmed' || isChild) && (
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

          {/* Scrollable body */}
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
                      {displayedRegistrations}
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

            {/* CTAs */}
            <div className="grid gap-3">
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

              {/* FIX 3+4 — événement payant */}
              {isPaidEvent ? (
                hasPaidPayment ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 self-start">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Place confirmée
                    </div>
                    <button
                      onClick={handleViewReceipt}
                      disabled={loadingReceipt}
                      className="h-12 inline-flex items-center justify-center gap-2 border border-border rounded-2xl text-foreground font-bold text-sm hover:bg-muted transition-colors active:scale-95 disabled:opacity-50"
                    >
                      {loadingReceipt
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : <Receipt className="w-4 h-4 shrink-0" />}
                      Voir le reçu
                    </button>
                    <button
                      onClick={handleUnregister}
                      disabled={acting}
                      className="h-12 inline-flex items-center justify-center gap-2 border border-destructive/30 bg-destructive/5 text-destructive rounded-2xl font-bold text-sm hover:bg-destructive/10 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {acting
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : <UserX className="w-4 h-4 shrink-0" />}
                      {acting ? 'Annulation…' : 'Se désinscrire (remboursé)'}
                    </button>
                  </>
                ) : hasPendingPayment ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700 self-start">
                      <Clock3 className="w-3.5 h-3.5 shrink-0" /> Paiement en attente
                    </div>
                    <p className="text-xs text-muted-foreground -mt-1">
                      Complétez votre paiement pour confirmer votre place.
                    </p>
                    <button
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="h-12 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-primary/25"
                    >
                      {checkingOut
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : <CreditCard className="w-4 h-4 shrink-0" />}
                      Compléter le paiement
                    </button>
                    <button
                      onClick={handleUnregister}
                      disabled={acting}
                      className="h-10 inline-flex items-center justify-center gap-2 text-sm font-semibold text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <UserX className="w-3.5 h-3.5 shrink-0" />}
                      {acting ? 'Annulation…' : 'Annuler la réservation'}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={goToDetail}
                    disabled={!isPublished}
                    className="h-12 inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground rounded-2xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50 shadow-lg shadow-primary/25"
                  >
                    <CreditCard className="w-4 h-4 shrink-0" />
                    Réserver — {eventPrice.toFixed(2).replace('.', ',')}€
                  </button>
                )
              ) : (
                <>
                  {canRegister && (
                    <button
                      onClick={handleRegister}
                      disabled={acting}
                      className={cn(
                        'h-12 inline-flex items-center justify-center gap-2 rounded-2xl font-bold text-sm active:scale-95 transition-transform disabled:opacity-50',
                        isFull
                          ? 'bg-amber-500/10 text-amber-700 border border-amber-500/30 hover:bg-amber-500/20'
                          : 'bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:opacity-90',
                      )}
                    >
                      {acting
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : isFull
                          ? <AlertCircle className="w-4 h-4 shrink-0" />
                          : <UserCheck className="w-4 h-4 shrink-0" />}
                      {acting
                        ? 'En cours…'
                        : isFull
                          ? "Liste d'attente"
                          : `S'inscrire${isChild ? ` — ${event.memberName}` : ''}`}
                    </button>
                  )}

                  {canUnregister && (
                    <button
                      onClick={handleUnregister}
                      disabled={acting}
                      className="h-12 inline-flex items-center justify-center gap-2 border border-destructive/30 bg-destructive/5 text-destructive rounded-2xl font-bold text-sm hover:bg-destructive/10 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {acting
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : <UserX className="w-4 h-4 shrink-0" />}
                      {acting ? 'Désinscription…' : 'Se désinscrire'}
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
