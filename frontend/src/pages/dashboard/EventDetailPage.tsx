import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft, Edit, Trash2, Calendar, MapPin, Users, Euro,
  Clock, X, CheckCircle2, AlertCircle, Eye, UserCheck,
} from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, Reservation } from '../../types'

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const STATUS_META = {
  draft:     { label: 'Brouillon', cls: 'bg-muted text-muted-foreground' },
  published: { label: 'Publié',    cls: 'bg-accent/15 text-accent' },
  cancelled: { label: 'Annulé',   cls: 'bg-destructive/10 text-destructive' },
}

const inputCls = 'w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'

// ─── main ────────────────────────────────────────────────────────────────────

const EventDetailPage: React.FC = () => {
  const { organisationId, eventId } = useParams<{ organisationId: string; eventId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading]         = useState(true)
  const [event, setEvent]             = useState<Event | null>(null)
  const [waitlistData, setWaitlistData] = useState<{
    event: { id: string; title: string; capacity?: number; current_registrations: number; available_spots: number | null }
    confirmed: Reservation[]
    waitlist: Reservation[]
    can_manage_capacity: boolean
  } | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason]       = useState('')
  const [refundAuto, setRefundAuto]           = useState(true)
  const [cancelling, setCancelling]           = useState(false)

  useEffect(() => {
    if (organisationId && eventId) { loadData() }
  }, [organisationId, eventId])

  const loadData = async () => {
    setLoading(true)
    try {
      const [ev, wl] = await Promise.all([
        api.get<Event>(`/organisations/${organisationId}/events/${eventId}`),
        api.get(`/organisations/${organisationId}/events/${eventId}/waitlist`).catch(() => null),
      ])
      setEvent(ev)
      setWaitlistData(wl)
    } catch {
      navigate(`/dashboard/${organisationId}/events`)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Supprimer cet événement définitivement ?')) { return }
    try {
      await api.delete(`/organisations/${organisationId}/events/${eventId}`)
      api.clearCache(`/organisations/${organisationId}/events`)
      navigate(`/dashboard/${organisationId}/events`)
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await api.post(`/organisations/${organisationId}/events/${eventId}/cancel`, {
        reason: cancelReason,
        refund_automatically: refundAuto,
        notify_participants: true,
      })
      api.clearCache(`/organisations/${organisationId}/events`)
      setShowCancelModal(false)
      await loadData()
    } catch {
      alert('Erreur lors de l\'annulation')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!event) { return null }

  const status = STATUS_META[event.status]

  return (
    <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate(`/dashboard/${organisationId}/events`)}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" />
            </button>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{event.title}</h1>
              <span className={cn('inline-block text-[11px] font-bold px-2.5 py-1 rounded-full mt-2', status.cls)}>
                {status.label}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={`/dashboard/${organisationId}/events/${eventId}/edit`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <Edit className="w-4 h-4 shrink-0" /> Modifier
            </Link>
            {event.status !== 'cancelled' && (
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 transition-colors"
              >
                <X className="w-4 h-4 shrink-0" /> Annuler
              </button>
            )}
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 shrink-0" /> Supprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Main */}
          <div className="lg:col-span-2 space-y-5">

            {/* Description */}
            {event.description && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">Description</p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>
            )}

            {/* Details */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-4">Détails</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="font-medium text-foreground">{fmtDate(event.start_time)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Horaire</p>
                    <p className="font-medium text-foreground">{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</p>
                  </div>
                </div>
                {event.location && (
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Lieu</p>
                      <p className="font-medium text-foreground">{event.location}</p>
                    </div>
                  </div>
                )}
                {event.capacity && (
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Capacité</p>
                      <p className="font-medium text-foreground">
                        {event.current_registrations ?? 0} / {event.capacity} participants
                        {(event.available_spots ?? 0) > 0 && (
                          <span className="text-accent ml-2 text-xs">({event.available_spots} disponibles)</span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
                {event.price > 0 && (
                  <div className="flex items-start gap-3">
                    <Euro className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">Prix</p>
                      <p className="font-medium text-foreground">{event.price.toFixed(2)} €</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Participants */}
            {waitlistData && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-4">
                  Participants & liste d'attente
                </p>

                {/* Confirmed */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    <p className="text-sm font-semibold text-foreground">
                      Confirmés ({waitlistData.confirmed.length})
                    </p>
                  </div>
                  {waitlistData.confirmed.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun participant confirmé</p>
                  ) : (
                    <div className="space-y-2">
                      {waitlistData.confirmed.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-accent/5 rounded-xl border border-accent/15">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {r.membership?.user.firstname} {r.membership?.user.lastname}
                            </p>
                            <p className="text-xs text-muted-foreground">{r.membership?.user.email}</p>
                          </div>
                          <span className="text-[11px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Confirmé</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Waitlist */}
                {waitlistData.waitlist.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Eye className="w-4 h-4 text-amber-600 shrink-0" />
                      <p className="text-sm font-semibold text-foreground">
                        Liste d'attente ({waitlistData.waitlist.length})
                      </p>
                    </div>
                    <div className="space-y-2">
                      {waitlistData.waitlist.map((r, i) => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-amber-500/5 rounded-xl border border-amber-500/15">
                          <div>
                            <p className="text-sm font-semibold text-foreground">
                              {r.membership?.user.firstname} {r.membership?.user.lastname}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {r.membership?.user.email} · #{i + 1}
                            </p>
                          </div>
                          {waitlistData.can_manage_capacity && (
                            <button className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
                              <UserCheck className="w-3 h-3 shrink-0" /> Confirmer
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-4">Informations</p>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {{ training: 'Entraînement', match: 'Match', meeting: 'Réunion', workshop: 'Atelier', other: 'Autre' }[event.event_type]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Visibilité</p>
                  <p className="font-semibold text-foreground mt-0.5">
                    {{ public: 'Public', members_only: 'Membres uniquement', private: 'Privé' }[event.visibility]}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Inscription requise</p>
                  <p className="font-semibold text-foreground mt-0.5">{event.registration_required ? 'Oui' : 'Non'}</p>
                </div>
                {event.created_by && (
                  <div>
                    <p className="text-xs text-muted-foreground">Créé par</p>
                    <p className="font-semibold text-foreground mt-0.5">
                      {event.created_by.firstname} {event.created_by.lastname}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-foreground">Annuler l'événement</h3>
                  <p className="text-xs text-muted-foreground">Cette action notifiera tous les participants</p>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                    Raison (optionnel)
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={e => setCancelReason(e.target.value)}
                    rows={3}
                    className={inputCls}
                    placeholder="Ex : Conditions météo défavorables…"
                  />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={refundAuto}
                    onChange={e => setRefundAuto(e.target.checked)}
                    className="w-4 h-4 rounded text-primary border-border focus:ring-primary/40"
                  />
                  <span className="text-sm text-foreground">Remboursement automatique</span>
                </label>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2.5 text-sm font-semibold rounded-full border border-border text-foreground hover:bg-muted transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2.5 text-sm font-bold rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
                >
                  {cancelling ? 'Annulation…' : 'Confirmer l\'annulation'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </RoleBasedRoute>
  )
}

export default EventDetailPage
