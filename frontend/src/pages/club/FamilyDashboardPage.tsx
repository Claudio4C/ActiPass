import React, { useEffect, useState } from 'react';
import { Baby, Calendar, MapPin } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { api } from '../../lib/api';

interface UpcomingEvent {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string | null;
    organisation: { id: string; name: string };
}

interface ChildSummary {
    id: string;
    firstname: string;
    lastname: string;
    birthdate: string | null;
    relationship: string;
    organisations: { id: string; name: string }[];
    upcoming_events: UpcomingEvent[];
}

const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const FamilyDashboardPage: React.FC = () => {
    const [children, setChildren] = useState<ChildSummary[]>([]);
    const [selected, setSelected] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ children: ChildSummary[] }>('/family/dashboard')
            .then(data => {
                setChildren(data.children);
                if (data.children.length > 0) setSelected(data.children[0].id);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const current = selected ? children.find(c => c.id === selected) : null;

    // Aggregate all upcoming events, sorted by date
    const allEvents: (UpcomingEvent & { childName: string })[] = children
        .flatMap(c => c.upcoming_events.map(e => ({ ...e, childName: c.firstname })))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    const displayedEvents = current
        ? current.upcoming_events.map(e => ({ ...e, childName: current.firstname }))
        : allEvents;

    return (
        <Layout title="Planning famille" subtitle="Événements à venir pour vos enfants" mode="club">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Calendar className="h-7 w-7 text-indigo-500" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Planning famille</h1>
                        <p className="text-sm text-slate-500">Événements à venir pour vos enfants</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-400">Chargement…</div>
                ) : children.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Baby className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Aucun enfant enregistré.</p>
                    </div>
                ) : (
                    <>
                        {/* Child filter tabs */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setSelected(null)}
                                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                    selected === null
                                        ? 'bg-indigo-500 text-white'
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                }`}
                            >
                                Tous
                            </button>
                            {children.map(c => (
                                <button
                                    key={c.id}
                                    onClick={() => setSelected(c.id)}
                                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                                        selected === c.id
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                                    }`}
                                >
                                    {c.firstname}
                                </button>
                            ))}
                        </div>

                        {/* Child summary cards */}
                        {current && (
                            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-2">
                                <p className="font-semibold text-slate-800 dark:text-white text-lg">
                                    {current.firstname} {current.lastname}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {current.organisations.length === 0 ? (
                                        <span className="text-xs text-slate-400">Non inscrit dans un club</span>
                                    ) : current.organisations.map(o => (
                                        <span key={o.id} className="text-xs rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1">
                                            {o.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Events timeline */}
                        {displayedEvents.length === 0 ? (
                            <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-400 text-sm">
                                Aucun événement à venir
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {displayedEvents.map(event => (
                                    <div key={`${event.id}-${event.childName}`} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm flex gap-4">
                                        <div className="flex-shrink-0 w-12 text-center">
                                            <p className="text-xs text-slate-400 uppercase tracking-wide">
                                                {new Date(event.start_time).toLocaleDateString('fr-FR', { month: 'short' })}
                                            </p>
                                            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                                {new Date(event.start_time).getDate()}
                                            </p>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-slate-800 dark:text-white truncate">{event.title}</p>
                                            <p className="text-sm text-slate-500">
                                                {formatDate(event.start_time)} · {formatTime(event.start_time)}–{formatTime(event.end_time)}
                                            </p>
                                            <div className="flex flex-wrap gap-3 mt-1">
                                                {event.location && (
                                                    <span className="flex items-center gap-1 text-xs text-slate-400">
                                                        <MapPin className="h-3 w-3" />{event.location}
                                                    </span>
                                                )}
                                                <span className="text-xs text-pink-500 font-medium">{event.childName}</span>
                                                <span className="text-xs text-slate-400">{event.organisation.name}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default FamilyDashboardPage;
