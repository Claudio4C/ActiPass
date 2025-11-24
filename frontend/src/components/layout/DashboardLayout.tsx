import React from 'react';
import { useParams } from 'react-router-dom';
import DashboardSidebar from './DashboardSidebar';
import DashboardHeader from './DashboardHeader';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    const { organisationId } = useParams<{ organisationId: string }>();

    if (!organisationId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Organisation introuvable</h2>
                    <p className="text-gray-600">Veuillez sélectionner une organisation.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
            <div className="flex h-screen overflow-hidden">
                {/* Sidebar */}
                <DashboardSidebar organisationId={organisationId} />

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Header */}
                    <DashboardHeader organisationId={organisationId} />

                    {/* Page Content */}
                    <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DashboardLayout;

