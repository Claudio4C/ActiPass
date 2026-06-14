import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { api } from '../../lib/api'
import type { Event } from '../../types'

const EventPaymentSuccessPage: React.FC = () => {
  const { orgId, eventId } = useParams<{ orgId: string; eventId: string }>()
  const navigate = useNavigate()
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orgId || !eventId) { setLoading(false); return }
    api
      .get<Event>(`/organisations/${orgId}/events/${eventId}`, undefined, { useCache: false })
      .then(setEvent)
      .catch(() => {})
      .finally(() => setLoading(false))
    // Invalide le cache pour que la place confirmée apparaisse partout
    api.clearCache(`/organisations/${orgId}/events`)
  }, [orgId, eventId])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-sm w-full bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center space-y-5 shadow-xl">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-600 shrink-0" />
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Place confirmée ! 🎉</h2>
          <p className="text-sm text-muted-foreground mt-2">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" /> Vérification…
              </span>
            ) : (
              <>Votre paiement a bien été reçu{event ? ` pour ${event.title}` : ''}.</>
            )}
          </p>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => navigate(`/club/events/${eventId}`)}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-primary text-primary-foreground text-sm font-bold rounded-full active:scale-95 transition-transform"
          >
            Voir l'événement <ArrowRight className="w-4 h-4 shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => navigate(orgId ? `/club/${orgId}/events` : '/club/members')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Retour aux événements
          </button>
        </div>
      </div>
    </div>
  )
}

export default EventPaymentSuccessPage
