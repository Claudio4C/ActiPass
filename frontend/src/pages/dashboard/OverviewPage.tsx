import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Calendar, ClipboardCheck, Plus, UserPlus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';

interface OverviewStats {
    memberCount: number;
    eventCount: number;
    upcomingEventCount: number;
}

const OverviewPage: React.FC = () => {
    const { organisationId } = useParams<{ organisationId: string }>();
    const [stats, setStats] = useState<OverviewStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (organisationId) {
            loadStats();
        }
    }, [organisationId]);

    const loadStats = async () => {
        if (!organisationId) return;
        try {
            setLoading(true);
            const [members, events] = await Promise.all([
                api.get<unknown[]>(`/organisations/${organisationId}/members`, {}, { useCache: true, cacheTTL: 30000 }),
                api.get<Array<{ status: string; start_time: string }>>(`/organisations/${organisationId}/events`, {}, { useCache: true, cacheTTL: 30000 }),
            ]);

            const now = new Date();
            const upcomingEventCount = events.filter(e =>
                e.status !== 'cancelled' && new Date(e.start_time) > now
            ).length;

            setStats({
                memberCount: members.length,
                eventCount: events.length,
                upcomingEventCount,
            });
        } catch {
            setError('Impossible de charger les données du tableau de bord.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    if (error) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                        <button
                            onClick={loadStats}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Réessayer
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                        Vue d'ensemble
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Tableau de bord de votre organisation
                    </p>
                </div>

                {/* KPIs réels */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                                <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Membres</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats?.memberCount ?? 0}
                        </div>
                        <Link
                            to={`/dashboard/${organisationId}/members`}
                            className="mt-2 inline-block text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Voir les membres →
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Événements à venir</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats?.upcomingEventCount ?? 0}
                        </div>
                        <Link
                            to={`/dashboard/${organisationId}/events`}
                            className="mt-2 inline-block text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Voir les événements →
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                <ClipboardCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Total événements</span>
                        </div>
                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                            {stats?.eventCount ?? 0}
                        </div>
                        <Link
                            to={`/dashboard/${organisationId}/attendance`}
                            className="mt-2 inline-block text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                            Gérer les présences →
                        </Link>
                    </div>
                </div>

                {/* Actions rapides */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 p-6">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Actions rapides</h2>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            to={`/dashboard/${organisationId}/events/create`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        >
                            <Plus className="h-4 w-4" />
                            Créer une séance
                        </Link>
                        <Link
                            to={`/dashboard/${organisationId}/members`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            <UserPlus className="h-4 w-4" />
                            Gérer les membres
                        </Link>
                        <Link
                            to={`/dashboard/${organisationId}/attendance`}
                            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
                        >
                            <ClipboardCheck className="h-4 w-4" />
                            Gérer les présences
                        </Link>
                    </div>
                </div>

                {/* Fonctionnalités à venir */}
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-300 dark:border-slate-700 p-6">
                    <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                        Prochainement disponibles
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'Finances & Paiements', phase: 'Phase 2' },
                            { label: 'Documents', phase: 'Phase 1' },
                            { label: 'Communication', phase: 'Phase 4' },
                            { label: 'Statistiques avancées', phase: 'Phase 3' },
                        ].map(item => (
                            <div key={item.label} className="bg-white dark:bg-slate-900 rounded-lg p-3 text-center border border-gray-200 dark:border-slate-700">
                                <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</div>
                                <div className="text-xs text-indigo-500 mt-1">{item.phase}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

const ProtectedOverviewPage: React.FC = () => {
    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'treasurer']}>
            <OverviewPage />
        </RoleBasedRoute>
    );
};

export default ProtectedOverviewPage;
