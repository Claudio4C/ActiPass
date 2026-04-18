import React from 'react';
import { Link } from 'react-router-dom';
import { Download, LayoutGrid, Calendar, Users } from 'lucide-react';

export type MemberHomeTabId = 'home' | 'planning' | 'coaches';

const linkInactive =
    'inline-flex items-center gap-2 px-4 py-2 rounded-full text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition';
const linkActive =
    'inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 text-white text-sm font-semibold shadow-sm';

type MemberHomeTabsProps = {
    active: MemberHomeTabId;
};

/**
 * Onglets communs à l’espace « Mon club » : Accueil, Planning, Coachs (+ Sync iPhone).
 * Utilisé sur /home, /club/planning et /club/coaches.
 */
const MemberHomeTabs: React.FC<MemberHomeTabsProps> = ({ active }) => {
    return (
        <div className="w-full min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800">
            <nav
                className="flex flex-wrap items-center gap-2 w-full sm:w-auto min-w-0"
                aria-label="Navigation espace membre"
            >
                <Link
                    to="/home"
                    className={active === 'home' ? linkActive : linkInactive}
                    aria-current={active === 'home' ? 'page' : undefined}
                >
                    <LayoutGrid className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                    Accueil
                </Link>
                <Link
                    to="/club/planning"
                    className={active === 'planning' ? linkActive : linkInactive}
                    aria-current={active === 'planning' ? 'page' : undefined}
                >
                    <Calendar className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                    Planning
                </Link>
                <Link
                    to="/club/coaches"
                    className={active === 'coaches' ? linkActive : linkInactive}
                    aria-current={active === 'coaches' ? 'page' : undefined}
                >
                    <Users className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                    Coachs
                </Link>
            </nav>
            <button
                type="button"
                title="Synchronisation mobile à venir"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500 text-white text-sm font-semibold shadow-sm hover:bg-emerald-600 transition"
            >
                <Download className="w-4 h-4 shrink-0" aria-hidden />
                Sync iPhone
            </button>
        </div>
    );
};

export default MemberHomeTabs;
