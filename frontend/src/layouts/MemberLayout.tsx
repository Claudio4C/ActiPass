import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
    Users, Calendar, Baby, Bell, CreditCard, Sparkles,
    FileText, User, Menu, X, ArrowLeftRight,
} from 'lucide-react';
import AppHeader from './AppHeader';
import { useCurrentOrganisation } from '../hooks/useCurrentOrganisation';

interface NavItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    badge?: number;
}

const memberNav: NavItem[] = [
    { icon: Users,      label: 'Espace membre',          path: '/club/members' },
    { icon: Calendar,   label: 'Planning',                path: '/club/planning' },
    { icon: Calendar,   label: 'Evenements',              path: '/club/events' },
    { icon: Baby,       label: 'Ma famille',              path: '/club/famille' },
    { icon: Bell,       label: 'Notifications',           path: '/club/notifications' },
    { icon: CreditCard, label: 'Abonnements & paiements', path: '/account/subscriptions' },
    { icon: Sparkles,   label: 'Fidelite',                path: '/club/loyalty' },
    { icon: FileText,   label: 'Documents',               path: '/club/documents' },
    { icon: User,       label: 'Mon profil',              path: '/account/profile' },
    { icon: ArrowLeftRight, label: 'Changer de compte',   path: '/accounts' },
];

const MemberLayout: React.FC = () => {
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { organisation } = useCurrentOrganisation();

    const isActive = (path: string) =>
        location.pathname === path || location.pathname.startsWith(path + '/');

    const sidebar = (
        <aside
            className={`
                fixed lg:static inset-y-0 left-0 z-40
                w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
                transform transition-transform duration-300 ease-in-out
                ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                flex flex-col
            `}
        >
            {/* Sidebar header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-200 dark:border-slate-800">
                <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {organisation?.name || 'Mon club'}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Espace membre</div>
                </div>
            </div>

            {/* Nav items */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
                {memberNav.map(item => {
                    const Icon = item.icon;
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsMobileOpen(false)}
                            className={`
                                flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                                ${active
                                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}
                            `}
                        >
                            <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                            <span>{item.label}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <span className="ml-auto px-1.5 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors">
            <AppHeader
                badge="Espace membre"
                badgeClass="bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300"
                logoClass="bg-blue-600"
                extra={
                    organisation?.name ? (
                        <span className="hidden sm:inline text-sm font-medium text-gray-500 dark:text-slate-400">
                            {organisation.name}
                        </span>
                    ) : null
                }
            />

            <div className="flex flex-1" style={{ minHeight: 'calc(100vh - 3.5rem)' }}>
                {/* Mobile toggle */}
                <button
                    onClick={() => setIsMobileOpen(!isMobileOpen)}
                    className="lg:hidden fixed bottom-4 left-4 z-50 p-3 rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700 transition"
                    aria-label="Toggle menu"
                >
                    {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>

                {/* Mobile overlay */}
                {isMobileOpen && (
                    <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setIsMobileOpen(false)} />
                )}

                {sidebar}

                <main className="flex-1 overflow-y-auto">
                    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default MemberLayout;
