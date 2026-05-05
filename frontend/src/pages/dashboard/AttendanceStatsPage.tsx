import React, { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { BarChart3, TrendingUp, Users, Calendar, Filter, ArrowLeft, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api'

interface AttendanceStats {
  global_rate: number;
  total_attendances: number;
  present_count: number;
  top_events: Array<{
    event_id: string;
    title: string;
    count: number;
    date: string | null;
  }>;
  top_members: Array<{
    user_id: string;
    name: string;
    count: number;
  }>;
  monthly_no_show_rate: Array<{
    month: string;
    rate: number;
    total: number;
    absent: number;
  }>;
}

interface Filters {
  startDate: string;
  endDate: string;
}

const AttendanceStatsPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>({ startDate: '', endDate: '' })
  const [pendingFilters, setPendingFilters] = useState<Filters>({ startDate: '', endDate: '' })

  const loadStats = useCallback(async (activeFilters: Filters) => {
    if (!organisationId) { return }
    try {
      setLoading(true)
      setError(null)
      const params: Record<string, string> = {}
      if (activeFilters.startDate) { params.startDate = activeFilters.startDate }
      if (activeFilters.endDate) { params.endDate = activeFilters.endDate }
      const data = await api.get<AttendanceStats>(
        `/organisations/${organisationId}/attendance/stats`,
        params,
        { useCache: true, cacheTTL: 60000 },
      )
      setStats(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques')
      setStats(null)
    } finally {
      setLoading(false)
    }
  }, [organisationId])

  useEffect(() => {
    if (organisationId) { loadStats({ startDate: '', endDate: '' }) }
  }, [organisationId, loadStats])

  const handleApplyFilters = () => {
    setFilters(pendingFilters)
    loadStats(pendingFilters)
  }

  const handleResetFilters = () => {
    const empty = { startDate: '', endDate: '' }
    setPendingFilters(empty)
    setFilters(empty)
    loadStats(empty)
  }

  const hasActiveFilters = filters.startDate || filters.endDate

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-')
    return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('fr-FR', {
      month: 'long', year: 'numeric',
    })
  }

  const rateColor = (rate: number) =>
    rate >= 40 ? 'text-destructive' : rate >= 20 ? 'text-amber-600' : 'text-[hsl(160,84%,39%)]'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to={`/dashboard/${organisationId}/attendance`}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Statistiques de présence</h1>
          <p className="text-sm text-muted-foreground mt-1">Analysez l'assiduité de vos adhérents</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-semibold text-foreground">Filtrer par période</span>
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="ml-auto text-xs text-primary hover:underline font-semibold"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Date de début
            </label>
            <input
              type="date"
              value={pendingFilters.startDate}
              onChange={(e) => setPendingFilters((p) => ({ ...p, startDate: e.target.value }))}
              className="h-10 px-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Date de fin
            </label>
            <input
              type="date"
              value={pendingFilters.endDate}
              onChange={(e) => setPendingFilters((p) => ({ ...p, endDate: e.target.value }))}
              className="h-10 px-3 rounded-xl bg-muted border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="h-10 px-5 bg-primary text-primary-foreground text-sm font-semibold rounded-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            Appliquer
          </button>
        </div>
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

      {/* Chargement */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : !stats ? null : (
        <>
          {/* Taux global — Hero card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/30">
            <div className="absolute -right-8 -top-8 w-40 h-40 bg-primary-foreground/10 rounded-full blur-2xl" />
            <div className="absolute -left-4 bottom-0 w-24 h-24 bg-primary-foreground/5 rounded-full blur-xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider font-bold text-primary-foreground/70 mb-1">
                  Taux de présence global
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-5xl font-bold">{stats.global_rate.toFixed(1)}%</span>
                </div>
                <p className="text-sm text-primary-foreground/70 mt-1">
                  {stats.present_count} présences sur {stats.total_attendances} enregistrées
                </p>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/15 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 shrink-0" />
              </div>
            </div>
          </div>

          {/* Top 10 séances */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Top 10 séances les plus fréquentées</h2>
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary shrink-0" />
              </div>
            </div>
            {stats.top_events.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-2">
                {stats.top_events.map((event, index) => (
                  <div
                    key={event.event_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center font-display font-bold text-sm text-primary">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{event.title}</p>
                      {event.date && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(event.date).toLocaleDateString('fr-FR')}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-display text-lg font-bold text-primary">{event.count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 10 adhérents */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Top 10 adhérents les plus assidus</h2>
              <div className="w-8 h-8 rounded-xl bg-[hsl(160_84%_39%/0.12)] flex items-center justify-center">
                <Users className="w-4 h-4 text-[hsl(160,84%,39%)] shrink-0" />
              </div>
            </div>
            {stats.top_members.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-2">
                {stats.top_members.map((member, index) => (
                  <div
                    key={member.user_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="shrink-0 w-8 h-8 rounded-xl bg-[hsl(160_84%_39%/0.12)] flex items-center justify-center font-display font-bold text-sm text-[hsl(160,84%,32%)]">
                      {index + 1}
                    </div>
                    <p className="flex-1 text-sm font-semibold text-foreground">{member.name}</p>
                    <span className="shrink-0 text-sm font-bold text-[hsl(160,84%,39%)]">
                      {member.count} séances
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* No-show par mois */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-foreground">Taux de no-show par mois</h2>
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-destructive shrink-0" />
              </div>
            </div>
            {stats.monthly_no_show_rate.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune donnée disponible</p>
            ) : (
              <div className="space-y-3">
                {stats.monthly_no_show_rate.map((month) => (
                  <div key={month.month} className="p-3 rounded-xl bg-muted/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">{formatMonth(month.month)}</p>
                      <span className={`font-display text-lg font-bold ${rateColor(month.rate)}`}>
                        {month.rate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-border rounded-full h-1.5">
                      <div
                        className="bg-destructive h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(month.rate, 100)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {month.absent} absent{month.absent !== 1 ? 's' : ''} sur {month.total}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default AttendanceStatsPage
