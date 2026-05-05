import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Users, Clock, CheckCircle, XCircle, Search, BarChart3, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'
import type { Event } from '../../types'

interface AttendanceSummary {
  event_id: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  validated: boolean;
}

interface EventWithAttendance extends Event {
  summary?: AttendanceSummary;
}

const AttendancePage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const [events, setEvents] = useState<EventWithAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (organisationId) { loadData() }
  }, [organisationId])

  const loadData = async () => {
    if (!organisationId) { return }
    try {
      setLoading(true)
      setError(null)
      const [eventsData, summaries] = await Promise.all([
        api.get<Event[]>(
          `/organisations/${organisationId}/events`,
          { status: 'published' },
          { useCache: true, cacheTTL: 30000 },
        ),
        api.get<AttendanceSummary[]>(
          `/organisations/${organisationId}/attendance/summaries`,
          undefined,
          { useCache: true, cacheTTL: 30000 },
        ),
      ])
      const summaryMap = new Map(summaries.map((s) => [s.event_id, s]))
      setEvents(eventsData.map((event) => ({ ...event, summary: summaryMap.get(event.id) })))
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement')
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gestion des présences</h1>
          <p className="text-sm text-muted-foreground mt-1">Gérez les présences de vos événements</p>
        </div>
        <Link
          to={`/dashboard/${organisationId}/attendance/stats`}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-primary/25"
        >
          <BarChart3 className="w-4 h-4 shrink-0" />
          Statistiques
        </Link>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-destructive text-white">
            <AlertCircle className="w-4 h-4 shrink-0" />
          </span>
          <div className="flex-1 min-w-0 pt-1">
            <p className="text-sm font-semibold text-foreground">Erreur de chargement</p>
            <p className="text-xs text-muted-foreground mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          placeholder="Rechercher un événement..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-11 pl-9 pr-4 rounded-2xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {/* Liste */}
      {filteredEvents.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Users className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">Aucun événement</h2>
          <p className="text-sm text-muted-foreground">
            {searchQuery
              ? 'Aucun événement ne correspond à votre recherche.'
              : 'Aucun événement publié pour le moment.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Link
              key={event.id}
              to={`/dashboard/${organisationId}/attendance/${event.id}`}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 active:scale-[0.99]"
            >
              <div className="p-5 space-y-4">
                {/* Title + badge */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 flex-1">
                    {event.title}
                  </h3>
                  {event.summary?.validated && (
                    <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[hsl(160_84%_39%/0.12)] text-[hsl(160,84%,32%)]">
                      <CheckCircle className="w-3 h-3 shrink-0" />
                      Validé
                    </span>
                  )}
                </div>

                {event.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{event.description}</p>
                )}

                {/* Date & heure */}
                <div className="flex items-center gap-4 text-xs text-muted-foreground pb-4 border-b border-border">
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{formatDate(event.start_time)}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-medium text-foreground">{formatTime(event.start_time)}</span>
                  </span>
                </div>

                {/* Stats présences */}
                {event.summary ? (
                  <div className="space-y-3">
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                      Présences enregistrées
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[hsl(160_84%_39%/0.08)] border border-[hsl(160_84%_39%/0.2)] rounded-xl p-3 text-center">
                        <CheckCircle className="w-4 h-4 text-[hsl(160,84%,39%)] mx-auto mb-1" />
                        <p className="font-display text-xl font-bold text-[hsl(160,84%,32%)]">{event.summary.present}</p>
                        <p className="text-[10px] text-[hsl(160,84%,39%)] font-bold uppercase tracking-wide">Présents</p>
                      </div>
                      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-center">
                        <XCircle className="w-4 h-4 text-destructive mx-auto mb-1" />
                        <p className="font-display text-xl font-bold text-destructive">{event.summary.absent}</p>
                        <p className="text-[10px] text-destructive font-bold uppercase tracking-wide">Absents</p>
                      </div>
                      <div className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3 text-center">
                        <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                        <p className="font-display text-xl font-bold text-amber-700 dark:text-amber-400">{event.summary.late}</p>
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wide">Retards</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
                      <span className="text-muted-foreground">Total enregistrés</span>
                      <span className="font-bold text-foreground">{event.summary.total}</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-1">
                    <Users className="w-7 h-7 mx-auto text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">Aucune présence enregistrée</p>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default AttendancePage
