import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMockMembership } from '../../utils/mockRoles';
import type { Membership, RoleType } from '../../types';

interface RoleBasedRouteProps {
    children: React.ReactNode;
    allowedRoles: RoleType[];
    fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
    children,
    allowedRoles,
    fallbackPath = '/accounts'
}) => {
    const { user } = useAuth();
    const { organisationId } = useParams<{ organisationId: string }>();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthorization();
    }, [organisationId, user?.id]);

    const checkAuthorization = async () => {
        if (!user?.id || !organisationId) {
            setIsAuthorized(false);
            setLoading(false);
            return;
        }

        try {
            // TODO: Remplacer par l'endpoint réel qui récupère le membership avec rôle
            // Pour l'instant, on utilise des données mockées selon l'organisation
            // const memberships = await api.get<Membership[]>(`/users/${user.id}/memberships`);
            // const membership = memberships.find(m => m.organisationId === organisationId);

            // Mock data temporaire - rôle différent selon l'organisation
            const mockMembership = getMockMembership(organisationId);

            const userRole = mockMembership.role?.type;
            const hasAccess = allowedRoles.includes(userRole);

            setIsAuthorized(hasAccess);
        } catch (error) {
            console.error('Error checking authorization:', error);
            setIsAuthorized(false);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Vérification des permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg p-8 max-w-md text-center border border-gray-200 dark:border-slate-800">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Accès refusé</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Vous n'avez pas les permissions nécessaires pour accéder à cette page.
                    </p>
                    <button
                        onClick={() => window.location.href = fallbackPath}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    return <>{children}</>;
};

export default RoleBasedRoute;

