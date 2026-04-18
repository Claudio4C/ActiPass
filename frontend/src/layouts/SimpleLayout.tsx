import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

/**
 * Layout minimal pour les pages standalone (home, accounts).
 * Affiche le header commun + le contenu de la page.
 */
const SimpleLayout: React.FC = () => {
    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
            <AppHeader
                badge="Ikivio"
                badgeClass="bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300"
                logoClass="bg-indigo-600"
            />
            <main>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default SimpleLayout;
