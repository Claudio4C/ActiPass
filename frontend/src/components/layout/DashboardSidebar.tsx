import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Calendar,
    ClipboardCheck,
    Euro,
    FileText,
    Settings,
    Menu,
    X,
    MessageSquare,
    UserCog,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrganisationMembership } from '../../hooks/useOrganisationMembership';
import type { RoleType } from '../../types';

interface MenuItem {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    path: string;
    badge?: number | null;
    roles: RoleType[];
}

interface DashboardSidebarProps {
    organisationId: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ organisationId }) => {
    const { user } = useAuth();
    const location = useLocation();
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const { roleType, roleName, loading } = useOrganisationMembership(organisationId);

    const currentRole: RoleType = roleType ?? 'member';

    const getMenuItems = (): MenuItem[] => {
        const allItems: MenuItem[] = [
            { icon: LayoutDashboard, label: "Vue d'ensemble", path: `/dashboard/${organisationId}/overview`, roles: ['club_owner', 'club_manager', 'treasurer'] },
            { icon: Users, label: "Membres", path: `/dashboard/${organisationId}/members`, roles: ['club_owner', 'club_manager'] },
            { icon: Calendar, label: "Événements", path: `/dashboard/${organisationId}/events`, roles: ['club_owner', 'club_manager'] },
            { icon: ClipboardCheck, label: "Présences", path: `/dashboard/${organisationId}/attendance`, roles: ['club_owner', 'club_manager', 'coach'] },
            { icon: Euro, label: "Finances", path: `/dashboard/${organisationId}/payments`, roles: ['club_owner', 'club_manager', 'treasurer'] },
            { icon: FileText, label: "Documents", path: `/dashboard/${organisationId}/documents`, roles: ['club_owner', 'club_manager'] },
            { icon: MessageSquare, label: "Communication", path: `/dashboard/${organisationId}/communication`, roles: ['club_owner', 'club_manager'] },
            { icon: UserCog, label: "Équipe", path: `/dashboard/${organisationId}/settings/team`, roles: ['club_owner', 'club_manager'] },
            { icon: Settings, label: "Paramètres", path: `/dashboard/${organisationId}/settings`, roles: ['club_owner', 'club_manager'] },
        ];

        return allItems.filter(item => item.roles.includes(currentRole));
    };

    const menuItems = getMenuItems();
    const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

    if (loading) {
        return (
            <div className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800 flex items-center justify-center">
                <div className="text-sm text-gray-500">Chargement...</div>
            </div>
        );
    }

    return (
        <>
            {/* Mobile menu button */}
            <button
                onClick={() => setIsMobileOpen(!isMobileOpen)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm"
                aria-label="Toggle menu"
            >
                {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>

            {/* Sidebar */}
            <aside
                className={`
                    fixed lg:static inset-y-0 left-0 z-40
                    w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-800
                    transform transition-transform duration-300 ease-in-out
                    ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    flex flex-col
                `}
            >
                {/* Logo */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 dark:border-slate-800">
                    <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                            <div className="w-3 h-3 bg-indigo-600 rounded-full" />
                        </div>
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-900 dark:text-white">Ikivio</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">Dashboard</div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setIsMobileOpen(false)}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-lg
                                    transition-colors
                                    ${active
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 font-medium'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                    }
                                `}
                            >
                                <Icon className="h-5 w-5" />
                                <span className="flex-1">{item.label}</span>
                                {item.badge !== undefined && item.badge !== null && item.badge > 0 && (
                                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-500 text-white">
                                        {item.badge}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User info */}
                <div className="px-4 py-4 border-t border-gray-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                            {user?.firstName?.charAt(0) || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user?.firstName} {user?.lastName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {roleName || 'Membre'}
                            </div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Overlay for mobile */}
            {isMobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}
        </>
    );
};

export default DashboardSidebar;
