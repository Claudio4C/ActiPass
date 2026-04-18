import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Baby, Calendar, MapPin, CheckCircle, Clock, ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '../../lib/api';

interface EventItem {
  id: string;
  title: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  organisation: { id: string; name: string };
  is_registered: boolean;
  membership_id: string;
}

interface ChildSummary {
  id: string;
  firstname: string;
  lastname: string;
  birthdate: string | null;
  relationship: string;
  organisations: { id: string; name: string }[];
  events: EventItem[];
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const FamilyDashboardPage: React.FC = () => {
  const [children, setChildren] = useState<ChildSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      api.clearCache('/family/dashboard');
      const data = await api.get<{ children: ChildSummary[] }>('/family/dashboard');
      setChildren(data.children);
      if (data.children.length > 0 && !selected) {
        setSelected(data.children[0].id);
      }
    } catch (e) {
      setError('Impossible de charger le planning. Vérifiez votre connexion.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [selected]);

  useEffect(() => { load(); }, []);

  const handleRegister = async (child: ChildSummary, event: EventItem) => {
    setActionLoading(event.id);
    try {
      if (event.is_registered) {
        await api.delete(`/family/children/${child.id}/events/${event.id}/register`);
      } else {
        await api.post(`/family/children/${child.id}/events/${event.id}/register`);
      }
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de l\'inscription.');
    } finally {
      setActionLoading(null);
    }
  };

  const current = selected ? children.find((c) => c.id === selected) ?? null : null;

  const displayedEvents: (EventItem & { childName: string })[] = current
    ? current.events.map((e) => ({ ...e, childName: current.firstname }))
    : children
        .flatMap((c) => c.events.map((e) => ({ ...e, childName: c.firstname })))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-7 w-7 text-indigo-500" />
            <div>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Planning famille</h1>
              <p className="text-sm text-slate-500">Inscrivez vos enfants aux événements de leur club</p>
            </div>
          </div>
          <Link
            to="/club/famille"
            className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Gérer les enfants
          </Link>
        </div>

        {/* Erreur */}
        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 flex items-center gap-3 text-sm text-red-600 dark:text-red-300">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400">Chargement…</div>
        ) : children.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center space-y-3">
            <Baby className="mx-auto h-12 w-12 text-slate-300" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Aucun enfant enregistré</p>
            <Link to="/club/famille" className="inline-block text-sm text-pink-500 hover:underline">
              Ajouter un enfant →
            </Link>
          </div>
        ) : (
          <>
            {/* Onglets enfants */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelected(null)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition cursor-pointer ${
                  selected === null
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                Tous
              </button>
              {children.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium transition cursor-pointer ${
                    selected === c.id
                      ? 'bg-pink-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {c.firstname}
                </button>
              ))}
            </div>

            {/* Infos enfant sélectionné */}
            {current && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-5 py-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-600 font-bold text-sm flex-shrink-0">
                  {current.firstname.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">{current.firstname} {current.lastname}</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {current.organisations.length === 0 ? (
                      <span className="text-xs text-slate-400">Non inscrit dans un club</span>
                    ) : current.organisations.map((o) => (
                      <span key={o.id} className="text-xs rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-0.5">
                        {o.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Liste événements */}
            {displayedEvents.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 text-sm">
                {current?.organisations.length === 0
                  ? 'Inscrivez d\'abord votre enfant dans un club pour voir les événements.'
                  : 'Aucun événement à venir dans ce club.'}
              </div>
            ) : (
              <div className="space-y-3">
                {displayedEvents.map((event) => {
                  const child = children.find((c) => c.firstname === event.childName)!;
                  const isLoading = actionLoading === event.id;

                  return (
                    <div
                      key={`${event.id}-${event.childName}`}
                      className={`rounded-2xl border bg-white dark:bg-slate-800 p-4 shadow-sm flex gap-4 transition ${
                        event.is_registered
                          ? 'border-green-200 dark:border-green-800'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Date */}
                      <div className="flex-shrink-0 w-12 text-center">
                        <p className="text-xs text-slate-400 uppercase tracking-wide">
                          {new Date(event.start_time).toLocaleDateString('fr-FR', { month: 'short' })}
                        </p>
                        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {new Date(event.start_time).getDate()}
                        </p>
                      </div>

                      {/* Infos */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-white">{event.title}</p>
                            <p className="text-sm text-slate-500 mt-0.5">
                              {formatDate(event.start_time)} · {formatTime(event.start_time)}
                              {event.end_time ? ` – ${formatTime(event.end_time)}` : ''}
                            </p>
                            <div className="flex flex-wrap gap-3 mt-1">
                              {event.location && (
                                <span className="flex items-center gap-1 text-xs text-slate-400">
                                  <MapPin className="h-3 w-3" />{event.location}
                                </span>
                              )}
                              {selected === null && (
                                <span className="text-xs text-pink-500 font-medium">{event.childName}</span>
                              )}
                              <span className="text-xs text-slate-400">{event.organisation.name}</span>
                            </div>
                          </div>

                          {/* Bouton inscription */}
                          <button
                            onClick={() => handleRegister(child, event)}
                            disabled={isLoading}
                            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer disabled:opacity-50 ${
                              event.is_registered
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-200 group'
                                : 'bg-indigo-500 text-white hover:bg-indigo-600'
                            }`}
                          >
                            {isLoading ? (
                              <Clock className="h-3.5 w-3.5 animate-spin" />
                            ) : event.is_registered ? (
                              <>
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Inscrit · Annuler</span>
                              </>
                            ) : (
                              <>
                                <Calendar className="h-3.5 w-3.5" />
                                <span>S'inscrire</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default FamilyDashboardPage;
