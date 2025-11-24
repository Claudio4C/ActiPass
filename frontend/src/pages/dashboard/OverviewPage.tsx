import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Euro, CheckCircle, Calendar, Plus, UserPlus, Settings } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import AlertsList from '../../components/dashboard/AlertsList';
import QuickActions from '../../components/dashboard/QuickActions';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { getMockRole } from '../../utils/mockRoles';
import type { RoleType } from '../../types';

interface DashboardStats {
    activeMembers: number;
    monthlyRevenue: string;
    attendanceRate: number;
    sessionsThisWeek: number;
    membersVariation: number;
    revenueVariation: number;
    attendanceVariation: number;
}

const OverviewPage: React.FC = () => {
    const { organisationId } = useParams<{ organisationId: string }>();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<RoleType | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, [organisationId]);

    const loadDashboardData = async () => {
        if (!organisationId) return;

        try {
            setLoading(true);
            // TODO: Remplacer par les vrais endpoints API
            // Pour l'instant, on utilise des données mockées
            const mockStats: DashboardStats = {
                activeMembers: 156,
                monthlyRevenue: '12 450€',
                attendanceRate: 87,
                sessionsThisWeek: 42,
                membersVariation: 12,
                revenueVariation: 8,
                attendanceVariation: -2
            };

            setStats(mockStats);

            // Charger le rôle de l'utilisateur selon l'organisation
            // TODO: Récupérer depuis l'API
            const role = getMockRole(organisationId);
            setUserRole(role);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !stats) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    // Données mockées pour les graphiques
    const membershipEvolution = [
        { name: 'Jan', value: 120 },
        { name: 'Fév', value: 132 },
        { name: 'Mar', value: 141 },
        { name: 'Avr', value: 148 },
        { name: 'Mai', value: 152 },
        { name: 'Juin', value: 156 }
    ];

    const sessionFillRate = [
        { name: 'Plein', value: 75 },
        { name: 'Disponible', value: 20 },
        { name: 'Annulé', value: 5 }
    ];

    const activities = [
        { type: 'booking' as const, user: 'Marie D.', action: 'a réservé Yoga lundi 18h', time: 'Il y a 5 min' },
        { type: 'payment' as const, user: 'Jean M.', action: 'a payé 50€', time: 'Il y a 12 min' },
        { type: 'document' as const, user: 'Sophie D.', action: 'a uploadé un certificat', time: 'Il y a 1h' },
        { type: 'member' as const, user: 'Pierre L.', action: 'a rejoint le club', time: 'Il y a 2h' }
    ];

    const alerts = [
        { type: 'critical' as const, message: '3 certificats médicaux expirés', link: `/dashboard/${organisationId}/documents` },
        { type: 'warning' as const, message: '5 impayés > 30 jours', link: `/dashboard/${organisationId}/payments/invoices` },
        { type: 'info' as const, message: '2 séances sans coach', link: `/dashboard/${organisationId}/events` }
    ];

    const quickActions = [
        { label: "Créer séance", icon: Plus, link: `/dashboard/${organisationId}/events/create` },
        { label: "Ajouter membre", icon: UserPlus, link: `/dashboard/${organisationId}/members/add` },
        { label: "Voir planning", icon: Calendar, link: `/dashboard/${organisationId}/events/calendar` },
        { label: "Paramètres", icon: Settings, link: `/dashboard/${organisationId}/settings` }
    ];

    // Rendu selon le rôle
    const renderOwnerAdminDashboard = () => (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Adhérents Actifs"
                    value={stats.activeMembers}
                    variation={stats.membersVariation}
                    trend="up"
                    icon={Users}
                    linkTo={`/dashboard/${organisationId}/members`}
                />
                <StatCard
                    title="CA du Mois"
                    value={stats.monthlyRevenue}
                    variation={stats.revenueVariation}
                    trend="up"
                    icon={Euro}
                />
                <StatCard
                    title="Taux Présence"
                    value={`${stats.attendanceRate}%`}
                    variation={stats.attendanceVariation}
                    trend="down"
                    icon={CheckCircle}
                />
                <StatCard
                    title="Séances cette semaine"
                    value={stats.sessionsThisWeek}
                    icon={Calendar}
                />
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard
                    title="Évolution adhésions (12 mois)"
                    type="line"
                    data={membershipEvolution}
                    dataKey="value"
                    nameKey="name"
                />
                <ChartCard
                    title="Taux remplissage séances"
                    type="donut"
                    data={sessionFillRate}
                    dataKey="value"
                    nameKey="name"
                />
            </div>

            {/* Alertes et Activité */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AlertsList alerts={alerts} />
                </div>
                <div>
                    <ActivityFeed activities={activities} />
                </div>
            </div>

            {/* Actions Rapides */}
            <QuickActions actions={quickActions} />
        </div>
    );

    const renderTreasurerDashboard = () => {
        const financialStats = {
            monthlyRevenue: stats.monthlyRevenue,
            unpaidAmount: '1 230€',
            transactions: 247,
            recoveryRate: 94
        };

        const revenueEvolution = [
            { name: 'Jan', value: 10500 },
            { name: 'Fév', value: 11200 },
            { name: 'Mar', value: 11800 },
            { name: 'Avr', value: 12100 },
            { name: 'Mai', value: 12300 },
            { name: 'Juin', value: 12450 }
        ];

        const revenueBreakdown = [
            { name: 'Abonnements', value: 60 },
            { name: 'Événements', value: 30 },
            { name: 'Cours privés', value: 10 }
        ];

        return (
            <div className="space-y-6">
                {/* KPIs Financiers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="CA du Mois"
                        value={financialStats.monthlyRevenue}
                        variation={stats.revenueVariation}
                        trend="up"
                        icon={Euro}
                    />
                    <StatCard
                        title="Impayés"
                        value={financialStats.unpaidAmount}
                        icon={Euro}
                        badge={5}
                    />
                    <StatCard
                        title="Transactions"
                        value={financialStats.transactions}
                        period="ce mois"
                        icon={Euro}
                    />
                    <StatCard
                        title="Taux Recouvrement"
                        value={`${financialStats.recoveryRate}%`}
                        icon={CheckCircle}
                    />
                </div>

                {/* Graphiques */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ChartCard
                        title="Évolution revenus (12 mois)"
                        type="area"
                        data={revenueEvolution}
                        dataKey="value"
                        nameKey="name"
                    />
                    <ChartCard
                        title="Répartition revenus"
                        type="pie"
                        data={revenueBreakdown}
                        dataKey="value"
                        nameKey="name"
                    />
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Vue d'ensemble
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Tableau de bord de votre organisation
                    </p>
                </div>

                {userRole === 'treasurer' ? renderTreasurerDashboard() : renderOwnerAdminDashboard()}
            </div>
        </DashboardLayout>
    );
};

// Wrapper avec protection par rôle
const ProtectedOverviewPage: React.FC = () => {
    return (
        <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'treasurer']}>
            <OverviewPage />
        </RoleBasedRoute>
    );
};

export default ProtectedOverviewPage;

