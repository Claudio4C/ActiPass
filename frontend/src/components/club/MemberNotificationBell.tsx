import React, { useEffect, useRef, useState } from 'react';
import { Bell, ChevronRight, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { DashboardNotification } from '../../hooks/useDashboardSignals';

const priorityStyle: Record<
    DashboardNotification['priority'],
    { row: string; icon: typeof AlertCircle }
> = {
    urgent: {
        row: 'border-l-4 border-l-red-500 bg-red-50/90 dark:bg-red-950/30 dark:border-red-400',
        icon: AlertCircle,
    },
    warning: {
        row: 'border-l-4 border-l-amber-500 bg-amber-50/90 dark:bg-amber-950/25 dark:border-amber-400',
        icon: AlertTriangle,
    },
    info: {
        row: 'border-l-4 border-l-blue-500 bg-blue-50/80 dark:bg-blue-950/20 dark:border-blue-400',
        icon: Info,
    },
};

type MemberNotificationBellProps = {
    notifications: DashboardNotification[];
    badgeCount: string;
};

/**
 * Centre de notifications compact (historique récent dérivé du planning + alertes).
 */
const MemberNotificationBell: React.FC<MemberNotificationBellProps> = ({ notifications, badgeCount }) => {
    const [open, setOpen] = useState(false);
    const wrapRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onDoc = (e: MouseEvent) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDoc);
        return () => document.removeEventListener('mousedown', onDoc);
    }, [open]);

    const showBadge = badgeCount !== '0';

    return (
        <div className="relative shrink-0" ref={wrapRef}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200/90 bg-white text-slate-600 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                aria-expanded={open}
                aria-haspopup="true"
                aria-label={`Notifications${showBadge ? `, ${badgeCount} alertes` : ''}`}
            >
                <Bell className="h-5 w-5" aria-hidden />
                {showBadge && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm tabular-nums">
                        {badgeCount}
                    </span>
                )}
            </button>

            {open && (
                <div
                    className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] rounded-2xl border border-slate-200/90 bg-white py-3 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:w-96"
                    role="dialog"
                    aria-label="Notifications récentes"
                >
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 pb-2 dark:border-slate-800">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                            Récent
                        </span>
                    </div>
                    <div className="max-h-[min(70vh,24rem)] space-y-2 overflow-y-auto px-2 pt-2">
                        {notifications.length === 0 ? (
                            <p className="px-2 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                Aucune alerte pour le moment.
                            </p>
                        ) : (
                            notifications.map((n) => {
                                const st = priorityStyle[n.priority];
                                const Icon = st.icon;
                                return (
                                    <div
                                        key={n.id}
                                        className={`rounded-xl px-3 py-2.5 ${st.row}`}
                                    >
                                        <div className="flex gap-2">
                                            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-700 dark:text-slate-200" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                                                    {n.title}
                                                </p>
                                                <p className="mt-0.5 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                                                    {n.subtitle}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                    <div className="border-t border-slate-100 px-3 pt-2 dark:border-slate-800">
                        <Link
                            to="/club/planning"
                            className="flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/40"
                            onClick={() => setOpen(false)}
                        >
                            Voir tout le planning
                            <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberNotificationBell;
