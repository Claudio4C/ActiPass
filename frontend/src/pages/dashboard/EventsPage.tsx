import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Calendar, Plus, Search, Edit, Trash2, Eye,
  Users, Clock, MapPin, CalendarPlus,
} from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, EventStatus, EventType } from '../../types'

// ─── meta ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; badge: string }> = {
  training: { label: 'Entraînement', badge: 'bg-accent/15 text-accent' },
  match: { label: 'Match', badge: 'bg-destructive/10 text-destructive' },
  meeting: { label: 'Réunion', badge: 'bg-primary/10 text-primary' },
  workshop: { label: 'Atelier', badge: 'bg-cat-music/10 text-cat-music' },
  other: { label: 'Autre', badge: 'bg-muted text-muted-foreground' },
}

const STATUS_META: Record<EventStatus, { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'bg-muted text-muted-foreground' },
  published: { label: 'Publié', cls: 'bg-accent/15 text-accent' },
  cancelled: { label: 'Annulé', cls: 'bg-destructive/10 text-destructive' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ─── main ────────────────────────────────────────────────────────────────────

const EventsPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const [events, setEvents]           = useState<Event[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')
  const [typeFilter, setTypeFilter]   = useState<EventType | 'all'>('all')

  useEffect(() => {
    if (organisationId) { loadEvents() }
  }, [organisationId, statusFilter, typeFilter])

  const loadEvents = async () => {
    if (!organisationId) { return }
    setLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (statusFilter !== 'all') { filters.status = statusFilter }
      if (typeFilter !== 'all') { filters.event_type = typeFilter }
      const data = await api.get<Event[]>(`/organisations/${organisationId}/events`, filters, { useCache: true, cacheTTL: 30000 })
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (eventId: string) => {
    if (!organisationId) { return }
    if (!confirm('Supprimer cet événement ?')) { return }
    try {
      await api.delete(`/organisations/${organisationId}/events/${eventId}`)
      api.clearCache(`/organisations/${organisationId}/events`)
      await loadEvents()
    } catch {
      alert('Erreur lors de la suppression')
    }
  }

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase()),
  )

  const inputCls = 'h-10 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'
  const selectCls = `${inputCls} pr-8`

  return (
    <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'coach']}>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground">Événements</h1>
            <p className="text-sm text-muted-foreground mt-1">Gérez les événements de votre organisation</p>
          </div>
          <Link
            to={`/dashboard/${organisationId}/events/create`}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" /> Créer un événement
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Rechercher un événement…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`${inputCls} w-full pl-9`}
            />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as EventStatus | 'all')} className={selectCls}>
            <option value="all">Tous les statuts</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publié</option>
            <option value="cancelled">Annulé</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as EventType | 'all')} className={selectCls}>
            <option value="all">Tous les types</option>
            <option value="training">Entraînement</option>
            <option value="match">Match</option>
            <option value="meeting">Réunion</option>
            <option value="workshop">Atelier</option>
            <option value="other">Autre</option>
          </select>
        </div>

        {/* List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-card border border-border rounded-3xl p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <CalendarPlus className="w-7 h-7 text-primary shrink-0" />
            </div>
            <h2 className="font-display font-bold text-foreground mb-1">Aucun événement</h2>
            <p className="text-sm text-muted-foreground">
              {search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Aucun résultat pour ces filtres.'
                : 'Créez votre premier événement pour commencer.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(event => {
              const type   = TYPE_META[event.event_type]
              const status = STATUS_META[event.status]
              return (
                <div key={event.id} className="bg-card border border-border rounded-2xl p-5 space-y-4 hover:border-primary/20 hover:shadow-sm transition-all">

                  {/* Type + status */}
                  <div className="flex items-start justify-between gap-2">
                    <span className={cn('text-[11px] font-bold uppercase px-2.5 py-1 rounded-full', type.badge)}>
                      {type.label}
                    </span>
                    <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full', status.cls)}>
                      {status.label}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-foreground leading-snug">{event.title}</h3>

                  {/* Details */}
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{fmtDate(event.start_time)}</span>
                      <Clock className="w-3.5 h-3.5 shrink-0 ml-1" />
                      <span>{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                    {event.capacity && (
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {event.current_registrations ?? 0} / {event.capacity} participants
                          {(event.available_spots ?? 0) > 0 && (
                            <span className="text-accent ml-1">({event.available_spots} places)</span>
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-1 pt-3 border-t border-border">
                    <Link
                      to={`/dashboard/${organisationId}/events/${event.id}`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                      title="Voir"
                    >
                      <Eye className="w-4 h-4 shrink-0" />
                    </Link>
                    <Link
                      to={`/dashboard/${organisationId}/events/${event.id}/edit`}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                      title="Modifier"
                    >
                      <Edit className="w-4 h-4 shrink-0" />
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </RoleBasedRoute>
  )
}

export default EventsPage
