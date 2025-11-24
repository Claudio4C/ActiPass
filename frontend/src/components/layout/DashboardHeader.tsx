import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, LogOut, User, Settings, Moon, Sun } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../lib/api';
import type { Organisation } from '../../types';

interface DashboardHeaderProps {
    organisationId: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ organisationId }) => {
    const { user, logout } = useAuth();
    const [organisation, setOrganisation] = useState<Organisation | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(() => {
        if (typeof window === 'undefined') return false;
        return document.documentElement.classList.contains('dark');
    });

    useEffect(() => {
        loadOrganisation();
    }, [organisationId]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        if (isDarkMode) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const loadOrganisation = async () => {
        try {
            // Utiliser le cache avec un TTL de 5 minutes pour les infos d'organisation
            const org = await api.get<Organisation>(
                `/organisations/${organisationId}`,
                undefined,
                { useCache: true, cacheTTL: 300000 } // 5 minutes
            );
            setOrganisation(org);
        } catch (error) {
            console.error('Error loading organisation:', error);
        }
    };

    const initials = `${user?.firstName?.charAt(0) || ''}${user?.lastName?.charAt(0) || ''}`.toUpperCase() || 'U';

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6">
            {/* Left: Organisation name */}
            <div className="flex items-center gap-4">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {organisation?.name || 'Organisation'}
                </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
                {/* Theme toggle */}
                <button
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label={isDarkMode ? 'Activer le thème clair' : 'Activer le thème sombre'}
                >
                    {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>

                {/* Notifications */}
                <Link
                    to={`/dashboard/${organisationId}/notifications`}
                    className="relative p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>

                {/* User menu */}
                <div className="relative">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold">
                            {initials}
                        </div>
                    </button>

                    {isMenuOpen && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setIsMenuOpen(false)}
                            />
                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-gray-200 dark:border-slate-800 z-20">
                                <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-800">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {user?.firstName} {user?.lastName}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {user?.email}
                                    </p>
                                </div>
                                <div className="py-1">
                                    <Link
                                        to="/account/profile"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <User className="h-4 w-4" />
                                        Mon profil
                                    </Link>
                                    <Link
                                        to="/accounts"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        <Settings className="h-4 w-4" />
                                        Changer d'organisation
                                    </Link>
                                    <button
                                        onClick={async () => {
                                            setIsMenuOpen(false);
                                            await logout();
                                        }}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Déconnexion
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;

