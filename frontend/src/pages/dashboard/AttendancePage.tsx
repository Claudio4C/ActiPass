import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Calendar, Users, Clock, CheckCircle, XCircle, Search, BarChart3, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';
import type { Event } from '../../types';

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
  const { organisationId } = useParams<{ organisationId: string }>();
  const [events, setEvents] = useState<EventWithAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (organisationId) loadData();
  }, [organisationId]);

  const loadData = async () => {
    if (!organisationId) return;
    try {
      setLoading(true);
      setError(null);

      const [eventsData, summaries] = await Promise.all([
        api.get<Event[]>(
          `/organisations/${organisationId}/events`,
          { status: 'published' },
          { useCache: true, cacheTTL: 30000 }
        ),
        api.get<AttendanceSummary[]>(
          `/organisations/${organisationId}/attendance/summaries`,
          undefined,
          { useCache: true, cacheTTL: 30000 }
        ),
      ]);

      const summaryMap = new Map(summaries.map((s) => [s.event_id, s]));
      setEvents(eventsData.map((event) => ({ ...event, summary: summaryMap.get(event.id) })));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(
    (event) =>
      event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const formatTime = (dateString: string) =>
    new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Chargement...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gestion des présences</h1>
            <p className="text-gray-600 mt-1">Gérez les présences de vos événements</p>
          </div>
          <Link
            to={`/dashboard/${organisationId}/attendance/stats`}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Statistiques
          </Link>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Recherche */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher un événement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Liste */}
        {filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun événement</h3>
            <p className="mt-2 text-sm text-gray-500">
              {searchQuery
                ? 'Aucun événement ne correspond à votre recherche.'
                : 'Aucun événement publié pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <Link
                key={event.id}
                to={`/dashboard/${organisationId}/attendance/${event.id}`}
                className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-200 border border-gray-100 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 flex-1">
                      {event.title}
                    </h3>
                    {event.summary?.validated && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 ml-2 flex-shrink-0">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Validé
                      </span>
                    )}
                  </div>

                  {event.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-4">{event.description}</p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4 pb-4 border-b border-gray-100">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1.5 text-indigo-500" />
                      <span className="font-medium">{formatDate(event.start_time)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                      <span className="font-medium">{formatTime(event.start_time)}</span>
                    </div>
                  </div>

                  {event.summary ? (
                    <div className="space-y-3">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Présences enregistrées
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-green-50 rounded-lg p-3 border border-green-100 text-center">
                          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-green-700">{event.summary.present}</div>
                          <div className="text-xs text-green-600 font-medium">Présents</div>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-100 text-center">
                          <XCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-red-700">{event.summary.absent}</div>
                          <div className="text-xs text-red-600 font-medium">Absents</div>
                        </div>
                        <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-100 text-center">
                          <Clock className="w-5 h-5 text-yellow-600 mx-auto mb-1" />
                          <div className="text-2xl font-bold text-yellow-700">{event.summary.late}</div>
                          <div className="text-xs text-yellow-600 font-medium">Retards</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm pt-2 border-t border-gray-100">
                        <span className="text-gray-500">Total enregistrés</span>
                        <span className="font-bold text-gray-900">{event.summary.total}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-3 text-sm text-gray-400">
                      <Users className="w-8 h-8 mx-auto mb-1 text-gray-300" />
                      Aucune présence enregistrée
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default AttendancePage;
