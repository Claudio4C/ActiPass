import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Users, Construction } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/dashboard/StatCard';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import ComingSoon from '../../components/shared/ComingSoon';
import { api } from '../../lib/api';

const OverviewPage: React.FC = () => {
    const { organisationId } = useParams<{ organisationId: string }>();
    const [memberCount, setMemberCount] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadMemberCount();
    }, [organisationId]);

    const loadMemberCount = async () => {
        if (!organisationId) return;
        try {
            setLoading(true);
            const data = await api.get<{ id: string }[]>(
                `/organisations/${organisationId}/members`,
                undefined,
                { useCache: true, cacheTTL: 60000 }
            );
            setMemberCount(data.length);
        } catch (error) {
            console.error('Error loading member count:', error);
            setMemberCount(0);
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

                <div className="space-y-6">
                    {/* KPI membres (réel) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="Adhérents"
                            value={memberCount ?? 0}
                            icon={Users}
                            linkTo={`/dashboard/${organisationId}/members`}
                        />
                    </div>

                    {/* Sections à venir */}
                    <ComingSoon
                        icon={Construction}
                        title="Statistiques avancées à venir"
                        description="Finances, taux de présence, graphiques d'évolution et activité récente seront disponibles prochainement."
                    />
                </div>
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

