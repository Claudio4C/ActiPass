import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, Clock, Baby } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { api } from '../../lib/api';
import { Link } from 'react-router-dom';

// ── Types ─────────────────────────────────────────────────────────────────────

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

interface FamilyDashboard {
    children: ChildSummary[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(iso));
}

// ── Component ─────────────────────────────────────────────────────────────────

const FamilyDashboardPage: React.FC = () => {
    const [dashboard, setDashboard] = useState<FamilyDashboard | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeChild, setActiveChild] = useState<string>('all');

    useEffect(() => {
        void loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            setLoading(true);
            const data = await api.get<FamilyDashboard>('/family/dashboard');
            setDashboard(data);
        } catch {
            setDashboard(null);
        } finally {
            setLoading(false);
        }
    };

    const visibleChildren = dashboard?.children ?? [];

    const filteredEvents: Array<UpcomingEvent & { childName: string }> = visibleChildren
        .filter((c) => activeChild === 'all' || c.id === activeChild)
        .flatMap((c) =>
            c.upcoming_events.map((e) => ({
                ...e,
                childName: `${c.firstname} ${c.lastname}`,
            }))
        )
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    return (
        <Layout
            title="Planning famille"
            subtitle="Vue consolidée des prochains événements de tous vos enfants."
            mode="club"
        >
            {loading ? (
                <div className="text-center py-16 text-gray-400 dark:text-slate-500">Chargement...</div>
            ) : !dashboard || visibleChildren.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                    <Baby className="h-12 w-12 text-gray-300 dark:text-slate-600" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium">
                        Aucun enfant rattaché
                    </p>
                    <Link
                        to="/club/famille"
                        className="text-sm text-indigo-600 dark:text-indigo-400 underline"
                    >
                        Gérer ma famille
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Sélecteur enfant ─────────────────────────────────── */}
                    <div className="flex flex-wrap gap-2">
                        <FilterButton
                            active={activeChild === 'all'}
                            onClick={() => setActiveChild('all')}
                        >
                            <Users className="h-3.5 w-3.5" />
                            Tous
                        </FilterButton>
                        {visibleChildren.map((child) => (
                            <FilterButton
                                key={child.id}
                                active={activeChild === child.id}
                                onClick={() => setActiveChild(child.id)}
                            >
                                {child.firstname}
                            </FilterButton>
                        ))}
                    </div>

                    {/* Résumé enfants ───────────────────────────────────── */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {visibleChildren
                            .filter((c) => activeChild === 'all' || c.id === activeChild)
                            .map((child) => (
                                <div
                                    key={child.id}
                                    className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-4 flex flex-col gap-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                                            <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-xs">
                                                {child.firstname[0]}{child.lastname[0]}
                                            </span>
                                        </div>
                                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                                            {child.firstname} {child.lastname}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {child.organisations.length === 0 ? (
                                            <span className="text-xs text-gray-400 dark:text-slate-500 italic">Aucun club</span>
                                        ) : (
                                            child.organisations.map((o) => (
                                                <span
                                                    key={o.id}
                                                    className="text-xs px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300"
                                                >
                                                    {o.name}
                                                </span>
                                            ))
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 dark:text-slate-500">
                                        {child.upcoming_events.length} événement{child.upcoming_events.length !== 1 ? 's' : ''} à venir
                                    </p>
                                </div>
                            ))}
                    </div>

                    {/* Timeline événements ──────────────────────────────── */}
                    <div>
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
                            Prochains événements
                        </h3>
                        {filteredEvents.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                                Aucun événement à venir pour cette sélection
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {filteredEvents.map((event) => (
                                    <div
                                        key={`${event.id}-${event.childName}`}
                                        className="flex items-start gap-4 p-4 rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800"
                                    >
                                        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 shrink-0">
                                            <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                    {event.title}
                                                </p>
                                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 shrink-0">
                                                    {event.childName}
                                                </span>
                                            </div>
                                            <div className="flex flex-wrap gap-3 mt-1">
                                                <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDate(event.start_time)}
                                                </span>
                                                {event.location && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                                                        <MapPin className="h-3 w-3" />
                                                        {event.location}
                                                    </span>
                                                )}
                                                <span className="text-xs text-indigo-600 dark:text-indigo-400">
                                                    {event.organisation.name}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </Layout>
    );
};

const FilterButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}> = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
            active
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700'
        }`}
    >
        {children}
    </button>
);

export default FamilyDashboardPage;
