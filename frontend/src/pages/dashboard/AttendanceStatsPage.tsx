import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BarChart3, TrendingUp, Users, Calendar, Filter, ArrowLeft, AlertCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';

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
  const { organisationId } = useParams<{ organisationId: string }>();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ startDate: '', endDate: '' });
  const [pendingFilters, setPendingFilters] = useState<Filters>({ startDate: '', endDate: '' });

  const loadStats = useCallback(async (activeFilters: Filters) => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (activeFilters.startDate) params.startDate = activeFilters.startDate;
      if (activeFilters.endDate) params.endDate = activeFilters.endDate;

      const data = await api.get<AttendanceStats>(
        `/organisations/${organisationId}/attendance/stats`,
        params,
        { useCache: true, cacheTTL: 60000 }
      );
      setStats(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement des statistiques';
      setError(message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [organisationId]);

  useEffect(() => {
    if (organisationId) loadStats({ startDate: '', endDate: '' });
  }, [organisationId, loadStats]);

  const handleApplyFilters = () => {
    setFilters(pendingFilters);
    loadStats(pendingFilters);
  };

  const handleResetFilters = () => {
    const empty = { startDate: '', endDate: '' };
    setPendingFilters(empty);
    setFilters(empty);
    loadStats(empty);
  };

  const hasActiveFilters = filters.startDate || filters.endDate;

  const formatMonth = (month: string) => {
    const [year, monthNum] = month.split('-');
    return new Date(parseInt(year), parseInt(monthNum) - 1).toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              to={`/dashboard/${organisationId}/attendance`}
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Statistiques de présence</h1>
              <p className="text-gray-600 mt-1">Analysez l'assiduité de vos adhérents</p>
            </div>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center space-x-3 mb-3">
            <Filter className="text-gray-400 w-5 h-5" />
            <span className="text-sm font-medium text-gray-700">Filtrer par période</span>
            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-indigo-600 hover:text-indigo-800 underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
          <div className="flex items-end gap-4 flex-wrap">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début</label>
              <input
                type="date"
                value={pendingFilters.startDate}
                onChange={(e) => setPendingFilters((p) => ({ ...p, startDate: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin</label>
              <input
                type="date"
                value={pendingFilters.endDate}
                onChange={(e) => setPendingFilters((p) => ({ ...p, endDate: e.target.value }))}
                className="rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <button
              onClick={handleApplyFilters}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              Appliquer
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Chargement */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="text-gray-500">Chargement...</div>
          </div>
        ) : !stats ? null : (
          <>
            {/* Taux global */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Taux de présence global</h2>
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-bold text-indigo-600">
                  {stats.global_rate.toFixed(1)}%
                </span>
                <span className="text-gray-500">
                  ({stats.present_count} / {stats.total_attendances} présences)
                </span>
              </div>
            </div>

            {/* Top 10 séances */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Top 10 séances les plus fréquentées
                </h2>
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              {stats.top_events.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
              ) : (
                <div className="space-y-3">
                  {stats.top_events.map((event, index) => (
                    <div
                      key={event.event_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{event.title}</div>
                          {event.date && (
                            <div className="text-sm text-gray-500">
                              {new Date(event.date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-lg font-semibold text-indigo-600">{event.count}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 10 adhérents */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Top 10 adhérents les plus assidus
                </h2>
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              {stats.top_members.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
              ) : (
                <div className="space-y-3">
                  {stats.top_members.map((member, index) => (
                    <div
                      key={member.user_id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                      </div>
                      <div className="text-lg font-semibold text-green-600">
                        {member.count} séances
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* No-show par mois */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Taux de no-show par mois</h2>
                <BarChart3 className="w-6 h-6 text-indigo-600" />
              </div>
              {stats.monthly_no_show_rate.length === 0 ? (
                <p className="text-gray-500 text-sm">Aucune donnée disponible</p>
              ) : (
                <div className="space-y-3">
                  {stats.monthly_no_show_rate.map((month) => (
                    <div key={month.month} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-medium text-gray-900">{formatMonth(month.month)}</div>
                        <div className="text-lg font-semibold text-red-600">
                          {month.rate.toFixed(1)}%
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(month.rate, 100)}%` }}
                        />
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {month.absent} absents sur {month.total}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AttendanceStatsPage;
