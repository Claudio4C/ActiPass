import React from 'react';
import { Outlet, useParams } from 'react-router-dom';
import DashboardSidebar from '../components/layout/DashboardSidebar';
import DashboardHeader from '../components/layout/DashboardHeader';

/**
 * Layout pour l'espace admin/owner d'un club.
 * Utilise <Outlet /> pour le routing imbriqué.
 */
const AdminDashboardLayout: React.FC = () => {
    const { organisationId } = useParams<{ organisationId: string }>();

    if (!organisationId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Organisation introuvable</h2>
                    <p className="text-gray-600 dark:text-slate-400">Veuillez selectionner une organisation.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
            <div className="flex h-screen overflow-hidden">
                <DashboardSidebar organisationId={organisationId} />

                <div className="flex-1 flex flex-col overflow-hidden">
                    <DashboardHeader organisationId={organisationId} />

                    <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardLayout;
