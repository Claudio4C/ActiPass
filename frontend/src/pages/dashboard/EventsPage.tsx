import React, { useState, useEffect, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Calendar, Plus, Search, Edit, Trash2, Eye,
  Users, Clock, MapPin, CalendarPlus, RefreshCw,
  ChevronDown, ChevronUp, AlertTriangle, X,
} from 'lucide-react'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Event, EventStatus, EventType } from '../../types'

// ─── Delete modal ─────────────────────────────────────────────────────────────

type DeleteModalState = {
  eventId: string
  title: string
  isParent: boolean
  childCount: number
}

const DeleteEventModal: React.FC<{
  state: DeleteModalState
  onConfirm: (eventId: string, deleteSeries: boolean) => void
  onClose: () => void
  loading: boolean
}> = ({ state, onConfirm, onClose, loading }) => {
  const [mode, setMode] = useState<'single' | 'series'>('single')
  const { eventId, title, isParent, childCount } = state
  const totalCount = childCount + 1

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-2xl pointer-events-auto">

          {/* Header */}
          <div className="flex items-start justify-between gap-3 p-6 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-destructive/10 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-destructive shrink-0" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold text-foreground">
                  {isParent ? 'Supprimer la série' : 'Supprimer l\'événement'}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">Cette action est irréversible</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors shrink-0"
            >
              <X className="w-4 h-4 shrink-0" />
            </button>
          </div>

          {/* Event name pill */}
          <div className="px-6 pb-4">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-muted">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold text-foreground truncate">{title}</span>
              {isParent && (
                <span className="ml-auto text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full shrink-0">
                  Récurrent
                </span>
              )}
            </div>
          </div>

          {/* Options (recurring only) */}
          {isParent && childCount > 0 && (
            <div className="px-6 pb-4 space-y-2.5">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                Que souhaitez-vous supprimer ?
              </p>

              {/* Option: single */}
              <button
                type="button"
                onClick={() => setMode('single')}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99]',
                  mode === 'single'
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:border-primary/30',
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    mode === 'single' ? 'border-primary bg-primary' : 'border-muted-foreground/40',
                  )}
                >
                  {mode === 'single' && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">Uniquement cet événement parent</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Les {childCount} occurrence{childCount > 1 ? 's' : ''} seront conservées
                  </p>
                </div>
              </button>

              {/* Option: series */}
              <button
                type="button"
                onClick={() => setMode('series')}
                className={cn(
                  'w-full flex items-start gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.99]',
                  mode === 'series'
                    ? 'border-destructive bg-destructive/5'
                    : 'border-border bg-card hover:border-destructive/30',
                )}
              >
                <span
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                    mode === 'series' ? 'border-destructive bg-destructive' : 'border-muted-foreground/40',
                  )}
                >
                  {mode === 'series' && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Toute la série ({totalCount} événements)
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    L'événement parent + toutes les occurrences seront supprimés
                  </p>
                </div>
              </button>

              {/* Warning when series selected */}
              {mode === 'series' && (
                <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-2xl border border-destructive/20 bg-destructive/5">
                  <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <p className="text-xs text-destructive font-medium">
                    {totalCount} événements et toutes leurs inscriptions seront définitivement supprimés.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Simple warning for non-recurring */}
          {!isParent && (
            <div className="px-6 pb-4">
              <div className="flex items-start gap-2.5 px-3 py-2.5 rounded-2xl border border-amber-500/20 bg-amber-500/5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 font-medium">
                  L'événement et toutes ses inscriptions seront définitivement supprimés.
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-3 p-6 pt-2 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-11 rounded-2xl border border-border text-foreground text-sm font-semibold hover:bg-muted transition-colors active:scale-95"
            >
              Annuler
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => onConfirm(eventId, isParent && mode === 'series')}
              className={cn(
                'flex-[1.5] h-11 rounded-2xl text-sm font-bold active:scale-95 transition-transform disabled:opacity-50',
                mode === 'series' && isParent
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-destructive/90 text-white',
              )}
            >
              {loading ? 'Suppression…' : mode === 'series' ? `Supprimer les ${totalCount} événements` : 'Supprimer'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── meta ────────────────────────────────────────────────────────────────────

const TYPE_META: Record<EventType, { label: string; badge: string }> = {
  training: { label: 'Entraînement', badge: 'bg-accent/15 text-accent' },
  match: { label: 'Match',        badge: 'bg-destructive/10 text-destructive' },
  meeting: { label: 'Réunion',      badge: 'bg-primary/10 text-primary' },
  workshop: { label: 'Atelier',      badge: 'bg-cat-music/10 text-cat-music' },
  other: { label: 'Autre',        badge: 'bg-muted text-muted-foreground' },
}

const STATUS_META: Record<EventStatus, { label: string; cls: string }> = {
  draft: { label: 'Brouillon', cls: 'bg-muted text-muted-foreground' },
  published: { label: 'Publié',    cls: 'bg-accent/15 text-accent' },
  cancelled: { label: 'Annulé',    cls: 'bg-destructive/10 text-destructive' },
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

const fmtDayShort = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

// ─── grouping ─────────────────────────────────────────────────────────────────

type EventGroup = {
  key: string
  representative: Event  // parent (is_recurring=true) or first in group
  occurrences: Event[]   // all events in group sorted by start_time
  isRecurring: boolean
}

function buildGroups(events: Event[]): EventGroup[] {
  const map = new Map<string, Event[]>()

  for (const e of events) {
    const key = e.parent_event_id ?? e.id
    const arr = map.get(key) ?? []
    arr.push(e)
    map.set(key, arr)
  }

  const groups: EventGroup[] = []

  for (const [key, evs] of map) {
    const sorted = [...evs].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    )
    const parent = sorted.find(e => e.is_recurring && !e.parent_event_id)
    const representative = parent ?? sorted[0]
    const isRecurring = sorted.length > 1 || !!parent

    groups.push({ key, representative, occurrences: sorted, isRecurring })
  }

  return groups.sort(
    (a, b) => new Date(a.representative.start_time).getTime() - new Date(b.representative.start_time).getTime(),
  )
}

// ─── main ────────────────────────────────────────────────────────────────────

const EventsPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const [events,       setEvents]       = useState<Event[]>([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState<EventStatus | 'all'>('all')
  const [typeFilter,   setTypeFilter]   = useState<EventType | 'all'>('all')
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set())
  const [deleteModal,  setDeleteModal]  = useState<DeleteModalState | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    if (organisationId) { void loadEvents() }
  }, [organisationId, statusFilter, typeFilter])

  const loadEvents = async () => {
    if (!organisationId) { return }
    setLoading(true)
    try {
      const filters: Record<string, string> = {}
      if (statusFilter !== 'all') { filters.status = statusFilter }
      if (typeFilter !== 'all')   { filters.event_type = typeFilter }
      const data = await api.get<Event[]>(
        `/organisations/${organisationId}/events`,
        filters,
        { useCache: false },
      )
      setEvents(Array.isArray(data) ? data : [])
    } catch {
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = (eventId: string, title: string, isParent: boolean, childCount: number) => {
    setDeleteModal({ eventId, title, isParent, childCount })
  }

  const confirmDelete = async (eventId: string, deleteSeries: boolean) => {
    if (!organisationId) { return }
    setDeleteLoading(true)
    try {
      const url = deleteSeries
        ? `/organisations/${organisationId}/events/${eventId}?delete_series=true`
        : `/organisations/${organisationId}/events/${eventId}`
      await api.delete(url)
      api.clearCache(`/organisations/${organisationId}/events`)
      setDeleteModal(null)
      await loadEvents()
    } catch {
      setDeleteLoading(false)
    }
    setDeleteLoading(false)
  }

  const toggleExpand = (key: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  // Search applies to the representative title/description
  const allGroups = useMemo(() => buildGroups(events), [events])

  const filteredGroups = useMemo(() => {
    if (!search) { return allGroups }
    const q = search.toLowerCase()
    return allGroups.filter(g =>
      g.representative.title.toLowerCase().includes(q) ||
      g.representative.description?.toLowerCase().includes(q) ||
      g.occurrences.some(e => e.title.toLowerCase().includes(q)),
    )
  }, [allGroups, search])

  const inputCls  = 'h-10 rounded-xl border border-border bg-card px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'
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
        ) : filteredGroups.length === 0 ? (
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
            {filteredGroups.map(({ key, representative: ev, occurrences, isRecurring }) => {
              const type        = TYPE_META[ev.event_type]
              const statusMeta  = STATUS_META[ev.status]
              const isExpanded  = expanded.has(key)
              const children    = occurrences.filter(e => !e.is_recurring)
              const childCount  = children.length

              return (
                <div key={key} className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/20 hover:shadow-sm transition-all">

                  {/* Main card */}
                  <div className="p-5 space-y-4">

                    {/* Badges row */}
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={cn('text-[11px] font-bold uppercase px-2.5 py-1 rounded-full', type.badge)}>
                          {type.label}
                        </span>
                        {isRecurring && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase px-2.5 py-1 rounded-full bg-primary/8 text-primary">
                            <RefreshCw className="w-2.5 h-2.5 shrink-0" />
                            {childCount > 0 ? `${childCount} séances` : 'Récurrent'}
                          </span>
                        )}
                      </div>
                      <span className={cn('text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0', statusMeta.cls)}>
                        {statusMeta.label}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="font-display font-bold text-foreground leading-snug">{ev.title}</h3>

                    {/* Details */}
                    <div className="space-y-1.5 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{isRecurring && childCount > 0 ? `Déb. ${fmtDate(ev.start_time)}` : fmtDate(ev.start_time)}</span>
                        <Clock className="w-3.5 h-3.5 shrink-0 ml-1" />
                        <span>{fmtTime(ev.start_time)} – {fmtTime(ev.end_time)}</span>
                      </div>
                      {ev.location && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{ev.location}</span>
                        </div>
                      )}
                      {ev.capacity && (
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {ev.current_registrations ?? 0} / {ev.capacity} participants
                            {(ev.available_spots ?? 0) > 0 && (
                              <span className="text-accent ml-1">({ev.available_spots} places)</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1 pt-3 border-t border-border">
                      <Link
                        to={`/dashboard/${organisationId}/events/${ev.id}`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4 shrink-0" />
                      </Link>
                      <Link
                        to={`/dashboard/${organisationId}/events/${ev.id}/edit`}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4 shrink-0" />
                      </Link>
                      <button
                        onClick={() => handleDelete(ev.id, ev.title, !!ev.is_recurring, childCount)}
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Recurring: expandable occurrences list */}
                  {isRecurring && children.length > 0 && (
                    <div className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => toggleExpand(key)}
                        className="w-full flex items-center justify-between px-5 py-3 text-xs font-bold text-muted-foreground hover:bg-muted/50 transition-colors"
                      >
                        <span>
                          {isExpanded
                            ? 'Masquer les occurrences'
                            : `Voir les ${children.length} occurrence${children.length > 1 ? 's' : ''}`}
                        </span>
                        {isExpanded
                          ? <ChevronUp className="w-3.5 h-3.5 shrink-0" />
                          : <ChevronDown className="w-3.5 h-3.5 shrink-0" />}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-0.5 max-h-64 overflow-y-auto">
                          {children.map(occ => {
                            const occStatus = STATUS_META[occ.status]
                            return (
                              <div key={occ.id} className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted/60 transition-colors">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-foreground capitalize">
                                    {fmtDayShort(occ.start_time)}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {fmtTime(occ.start_time)} – {fmtTime(occ.end_time)}
                                    {occ.capacity && (
                                      <span className="ml-2">· {occ.current_registrations ?? 0}/{occ.capacity}</span>
                                    )}
                                  </p>
                                </div>
                                <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0', occStatus.cls)}>
                                  {occStatus.label}
                                </span>
                                <div className="flex items-center gap-0.5 shrink-0">
                                  <Link
                                    to={`/dashboard/${organisationId}/events/${occ.id}`}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                                    title="Voir"
                                  >
                                    <Eye className="w-3.5 h-3.5 shrink-0" />
                                  </Link>
                                  <Link
                                    to={`/dashboard/${organisationId}/events/${occ.id}/edit`}
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit className="w-3.5 h-3.5 shrink-0" />
                                  </Link>
                                </div>
                              </div>
                            )
                          })}
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

      {/* Delete confirmation modal */}
      {deleteModal && (
        <DeleteEventModal
          state={deleteModal}
          onConfirm={confirmDelete}
          onClose={() => setDeleteModal(null)}
          loading={deleteLoading}
        />
      )}
    </RoleBasedRoute>
  )
}

export default EventsPage
