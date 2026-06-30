import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Calendar, Clock, MapPin, Users, Euro,
  CheckCircle2, Clock3, XCircle, AlertCircle, UserPlus, UserMinus, Plane,
  CreditCard, Receipt, Loader2,
} from 'lucide-react'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { cn } from '../../lib/utils'
import type { Event, EventType } from '../../types'

// ─── types ───────────────────────────────────────────────────────────────────

interface EventWithRegistration extends Event {
  myReservation?: { id: string; status: 'confirmed' | 'pending' | 'cancelled'; waitlist_position?: number | null; is_payment_pending?: boolean }
  current_registrations?: number
  available_spots?: number | null
}

interface EventPayment {
  id: string
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'cancelled'
  amount: number
  paid_at: string | null
  stripe_session_id: string | null
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
  new Date(iso).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ─── main ────────────────────────────────────────────────────────────────────

const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [orgId, setOrgId]       = useState<string | null>(null)
  const [event, setEvent]       = useState<EventWithRegistration | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [registering, setRegistering]     = useState(false)
  const [unregistering, setUnregistering] = useState(false)
  const [myPayment, setMyPayment]   = useState<EventPayment | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const [loadingReceipt, setLoadingReceipt] = useState(false)

  // Org from localStorage
  useEffect(() => {
    const load = () => {
      try {
        const raw = window.localStorage.getItem('selectedOrganisation')
        if (raw) {
          const org = JSON.parse(raw)
          if (org?.id) { setOrgId(org.id) }
        }
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

  useEffect(() => {
    if (eventId && orgId) { void loadEvent() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, eventId])

  const loadEvent = async () => {
    if (!eventId || !orgId) { setLoading(false); return }
    setLoading(true)
    setError(null)
    try {
      const data = await api.get<EventWithRegistration>(
        `/organisations/${orgId}/events/${eventId}`,
      )
      setEvent(data)
      // Charge le paiement uniquement pour les événements payants
      if (data.price > 0) {
        const payment = await api
          .get<EventPayment | null>(
            `/organisations/${orgId}/events/${eventId}/my-payment`,
            undefined,
            { useCache: false },
          )
          .catch(() => null)
        setMyPayment(payment)
      } else {
        setMyPayment(null)
      }
    } catch {
      setError('Impossible de charger cet événement.')
    } finally {
      setLoading(false)
    }
  }

  const handleCheckout = async () => {
    if (!eventId || !orgId || checkingOut) { return }
    setCheckingOut(true)
    setError(null)
    try {
      const { checkout_url } = await api.post<{ checkout_url: string }>(
        `/organisations/${orgId}/events/${eventId}/checkout`,
      )
      if (checkout_url) { window.location.href = checkout_url }
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ?? 'Impossible de démarrer le paiement.'
      setError(msg)
      setCheckingOut(false)
    }
  }

  const handleViewReceipt = async () => {
    if (!myPayment || loadingReceipt) { return }
    setLoadingReceipt(true)
    setError(null)
    try {
      const { receipt_url } = await api.get<{ receipt_url: string | null }>(
        `/payments/${myPayment.id}/receipt-url`,
        undefined,
        { useCache: false },
      )
      if (receipt_url) {
        window.open(receipt_url, '_blank', 'noopener,noreferrer')
      } else {
        setError('Reçu indisponible pour le moment.')
      }
    } catch {
      setError('Impossible de récupérer le reçu.')
    } finally {
      setLoadingReceipt(false)
    }
  }

  const handleRegister = async () => {
    if (!eventId || !event || !orgId || !event.registration_required) { return }
    setRegistering(true)
    setError(null)
    try {
      const result = await api.post<{
        message: string
        reservation: { id: string; status: 'confirmed' | 'pending' }
      }>(`/organisations/${orgId}/events/${eventId}/register`)
      const confirmed = result.reservation.status === 'confirmed'
      setEvent(prev => {
        if (!prev) { return prev }
        return {
          ...prev,
          myReservation: result.reservation,
          current_registrations: confirmed
            ? (prev.current_registrations ?? 0) + 1
            : prev.current_registrations,
          available_spots: prev.capacity
            ? confirmed
              ? Math.max(0, (prev.available_spots ?? prev.capacity) - 1)
              : prev.available_spots
            : null,
        }
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ?? "Erreur lors de l'inscription"
      setError(msg)
    } finally {
      setRegistering(false)
    }
  }

  const handleUnregister = async () => {
    if (!eventId || !event || !orgId) { return }
    setUnregistering(true)
    setError(null)
    try {
      await api.delete(`/organisations/${orgId}/events/${eventId}/register`)
      setMyPayment(null)
      setEvent(prev => {
        if (!prev) { return prev }
        const wasConfirmed = prev.myReservation?.status === 'confirmed'
        return {
          ...prev,
          myReservation: undefined,
          current_registrations: wasConfirmed
            ? Math.max(0, (prev.current_registrations ?? 0) - 1)
            : prev.current_registrations,
          available_spots: wasConfirmed && prev.capacity
            ? (prev.available_spots ?? 0) + 1
            : prev.available_spots,
        }
      })
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } }; message?: string })
          ?.response?.data?.message ?? 'Erreur lors de la désinscription'
      setError(msg)
    } finally {
      setUnregistering(false)
    }
  }

  const getRegStatus = (ev: EventWithRegistration) => {
    if (!ev.myReservation) { return null }
    const s = ev.myReservation.status
    if (s === 'confirmed') { return { label: 'Inscrit', icon: CheckCircle2, cls: 'text-accent bg-accent/10' } }
    // pending avec paiement Stripe en cours → la section paiement gère l'affichage
    if (s === 'pending' && ev.myReservation.is_payment_pending) { return null }
    if (s === 'pending') { return { label: 'En attente', icon: Clock3, cls: 'text-amber-600 bg-amber-500/10' } }
    return { label: 'Annulé', icon: XCircle, cls: 'text-muted-foreground bg-muted' }
  }

  const isFull = (ev: EventWithRegistration) =>
    !!(ev.capacity && (ev.available_spots ?? 1) <= 0)

  const canRegister = (ev: EventWithRegistration) =>
    ev.registration_required &&
    !ev.myReservation &&
    ev.status === 'published'

  // Back URL — toujours vers /club/:orgId/events
  const backUrl = orgId ? `/club/${orgId}/events` : '/club/members'

  const regStatus  = event ? getRegStatus(event) : null
  const StatusIcon = regStatus?.icon
  const typeMeta   = event ? TYPE_META[event.event_type] : null

  // P3-4b — état de paiement (événements payants)
  const isPaid             = !!event && event.price > 0
  const hasPaidReservation = myPayment?.status === 'paid'
  const hasPendingPayment  = myPayment?.status === 'pending'

  return (
    <div className="space-y-6">

      {/* Back */}
      <button
        type="button"
        onClick={() => navigate(backUrl)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4 shrink-0" />
        Retour aux événements
      </button>

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

      {/* Loading */}
      {(loading || !event) ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main card */}
          <article className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden">
            {event.cover_url && (
              <img
                src={event.cover_url}
                alt={event.title}
                className="w-full h-56 object-cover"
              />
            )}
            <div className="p-6 space-y-5">
              {/* Type badges */}
              <div className="flex flex-wrap items-center gap-2">
                {typeMeta && (
                  <span className={cn('text-[11px] font-bold uppercase px-2.5 py-1 rounded-full', typeMeta.badge)}>
                    {typeMeta.label}
                  </span>
                )}
                <span className="text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  Événement du club
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display text-2xl font-bold text-foreground leading-snug">
                {event.title}
              </h1>

              {/* Description */}
              {event.description && (
                <div>
                  <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-2">
                    Description
                  </p>
                  <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                    {event.description}
                  </p>
                </div>
              )}
            </div>
          </article>

          {/* Sidebar */}
          <aside className="space-y-4">

            {/* Info card */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <p className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                Informations
              </p>

              <div className="space-y-3 text-sm">
                {event.start_time && (
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date</p>
                      <p className="font-semibold text-foreground">{fmtDate(event.start_time)}</p>
                    </div>
                  </div>
                )}
                {event.start_time && event.end_time && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Horaire</p>
                      <p className="font-semibold text-foreground">
                        {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
                      </p>
                    </div>
                  </div>
                )}
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lieu</p>
                      <p className="font-semibold text-foreground">{event.location}</p>
                    </div>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Capacité</p>
                      <p className="font-semibold text-foreground">
                        {event.current_registrations ?? 0} / {event.capacity} participants
                        {(event.available_spots ?? 0) > 0 && (
                          <span className="text-accent text-xs ml-1">
                            ({event.available_spots} disponibles)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {event.price > 0 && (
                  <div className="flex items-start gap-3">
                    <Euro className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tarif</p>
                      <p className="font-semibold text-foreground">{event.price.toFixed(2)} €</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Registration status */}
              {regStatus && StatusIcon && (
                <div>
                  <div className={cn('inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full', regStatus.cls)}>
                    <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                    {regStatus.label}
                  </div>
                  {event.myReservation?.status === 'pending' && event.myReservation.waitlist_position && !event.myReservation.is_payment_pending && (
                    <p className="text-[10px] text-amber-700 font-semibold mt-1.5 ml-1">
                      Position #{event.myReservation.waitlist_position} dans la file d'attente
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Register / Unregister CTA */}
            {event.registration_required && isPaid ? (
              /* ── Événement payant (P3-4b) ── */
              <div className="space-y-2">
                {hasPaidReservation ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> Place confirmée
                    </div>
                    <button
                      type="button"
                      onClick={handleViewReceipt}
                      disabled={loadingReceipt}
                      className="w-full inline-flex items-center justify-center gap-2 bg-card border border-border text-foreground text-sm font-semibold py-2.5 rounded-full hover:bg-muted transition-colors active:scale-95 disabled:opacity-50"
                    >
                      {loadingReceipt
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : <Receipt className="w-4 h-4 shrink-0" />}
                      Voir le reçu
                    </button>
                    <button
                      type="button"
                      onClick={handleUnregister}
                      disabled={unregistering}
                      className="w-full inline-flex items-center justify-center gap-2 bg-destructive/10 text-destructive text-sm font-semibold py-2.5 rounded-full active:scale-95 transition-transform disabled:opacity-50 border border-destructive/20"
                    >
                      {unregistering
                        ? <><div className="w-4 h-4 rounded-full border-2 border-destructive border-t-transparent animate-spin" /> Annulation…</>
                        : <><UserMinus className="w-4 h-4 shrink-0" /> Se désinscrire (remboursé)</>}
                    </button>
                  </>
                ) : hasPendingPayment ? (
                  <>
                    <div className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-500/10 text-amber-700">
                      <Clock3 className="w-3.5 h-3.5 shrink-0" /> Paiement en attente
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Complétez votre paiement pour confirmer votre place.
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={checkingOut}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-3 rounded-full active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {checkingOut
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : <CreditCard className="w-4 h-4 shrink-0" />}
                      Reprendre le paiement
                    </button>
                    <button
                      type="button"
                      onClick={handleUnregister}
                      disabled={unregistering}
                      className="w-full inline-flex items-center justify-center gap-2 text-sm font-semibold text-destructive/70 hover:text-destructive py-2 transition-colors disabled:opacity-50"
                    >
                      {unregistering
                        ? <><div className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin" /> Annulation…</>
                        : <><UserMinus className="w-4 h-4 shrink-0" /> Annuler la réservation</>}
                    </button>
                  </>
                ) : (
                  <>
                    <p className="font-display text-2xl font-bold text-foreground">
                      {event.price.toFixed(2).replace('.', ',')} €
                    </p>
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={checkingOut || !canRegister(event)}
                      className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-bold py-3 rounded-full active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {checkingOut
                        ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        : <CreditCard className="w-4 h-4 shrink-0" />}
                      Réserver — {event.price.toFixed(2).replace('.', ',')}€
                    </button>
                    {!canRegister(event) && (
                      <p className="text-xs text-muted-foreground text-center">
                        Inscription non disponible.
                      </p>
                    )}
                  </>
                )}
              </div>
            ) : event.registration_required ? (
              <div className="space-y-2">
                {canRegister(event) && (
                  <button
                    type="button"
                    onClick={handleRegister}
                    disabled={registering}
                    className={cn(
                      'w-full inline-flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-full active:scale-95 transition-transform disabled:opacity-50',
                      isFull(event)
                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/30'
                        : 'bg-primary text-primary-foreground',
                    )}
                  >
                    {registering ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Inscription…</>
                    ) : isFull(event) ? (
                      <><Clock3 className="w-4 h-4 shrink-0" /> Rejoindre la liste d'attente</>
                    ) : (
                      <><UserPlus className="w-4 h-4 shrink-0" /> Je m'inscris</>
                    )}
                  </button>
                )}

                {(event.myReservation?.status === 'confirmed' || event.myReservation?.status === 'pending') && (
                  <button
                    type="button"
                    onClick={handleUnregister}
                    disabled={unregistering}
                    className="w-full inline-flex items-center justify-center gap-2 bg-destructive/10 text-destructive text-sm font-semibold py-2.5 rounded-full active:scale-95 transition-transform disabled:opacity-50 border border-destructive/20"
                  >
                    {unregistering ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-destructive border-t-transparent animate-spin" /> Annulation…</>
                    ) : (
                      <><UserMinus className="w-4 h-4 shrink-0" /> Me désinscrire</>
                    )}
                  </button>
                )}

                {!canRegister(event) && !event.myReservation && (
                  <p className="text-xs text-muted-foreground text-center">Inscription non disponible.</p>
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center">
                Cet événement ne nécessite pas d'inscription.
              </p>
            )}

            {/* Trip actions */}
            <div className="space-y-2">
              <Link
                to={`/club/events/${eventId}/create-trip`}
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground text-sm font-bold py-2.5 rounded-full active:scale-95 transition-transform shadow-lg shadow-primary/30"
              >
                <Plane className="w-4 h-4 shrink-0" /> Créer un voyage
              </Link>
              <Link
                to={`/club/events/${eventId}/trip`}
                className="w-full inline-flex items-center justify-center gap-2 bg-card border border-border text-foreground text-sm font-semibold py-2.5 rounded-full hover:bg-muted transition-colors"
              >
                <Users className="w-4 h-4 shrink-0" /> Voir le voyage organisé
              </Link>
            </div>

            <p className="text-[11px] text-muted-foreground text-center">
              Connecté en tant que {user?.email ?? 'membre'}
            </p>
          </aside>
        </div>
      )}
    </div>
  )
}

export default EventDetailPage
