import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Users,
    Bell,
    MapPin,
    Activity,
    Building2,
    UserPlus,
    BadgeCheck,
    Construction,
    Calendar,
    Clock,
    Sparkles,
    ChevronRight,
    User,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ComingSoon from '../components/shared/ComingSoon';
import MemberHomeTabs from '../components/club/MemberHomeTabs';
import type { RoleType } from '../types';
import {
    useWeeklyFamilySchedule,
    getWeekBounds,
    DAY_LABELS,
    eventTypeStyle,
    formatTime,
    formatRange,
    type Organisation,
    type ScheduleItem,
} from '../hooks/useWeeklyFamilySchedule';

const emptyStateActions = [
    {
        id: 'create-organisation',
        title: 'Créer une organisation',
        description: 'Déclarez votre association ou votre club pour activer toutes les fonctionnalités IKIVIO.',
        ctaLabel: 'Créer mon espace',
        to: '/accounts?intent=create-organisation',
        icon: Building2,
        accent: 'bg-indigo-50 text-indigo-600',
    },
    {
        id: 'join-organisation',
        title: 'Rejoindre une organisation',
        description: "Recevez un lien d'invitation ou envoyez une demande d'accès à votre club existant.",
        ctaLabel: 'Rejoindre un club',
        to: '/accounts?intent=join-organisation',
        icon: UserPlus,
        accent: 'bg-emerald-50 text-emerald-600',
    },
    {
        id: 'coach-independant',
        title: 'Créer mon profil coach',
        description: 'Créez un studio indépendant pour vendre vos créneaux privés et gérer vos clients.',
        ctaLabel: 'Lancer mon studio',
        to: '/coach/profile?mode=independant',
        icon: BadgeCheck,
        accent: 'bg-pink-50 text-pink-600',
    },
    {
        id: 'discover-clubs',
        title: 'Découvrir des clubs proches',
        description: 'Parcourez les clubs et associations partenaires pour trouver de nouvelles salles.',
        ctaLabel: 'Explorer les clubs',
        to: '/discover',
        icon: MapPin,
        accent: 'bg-sky-50 text-sky-600',
    },
    {
        id: 'browse-coaches',
        title: 'Trouver un coach indépendant',
        description: 'Accédez aux profils coachs pour organiser des cours privés ou des ateliers.',
        ctaLabel: 'Voir les coachs',
        to: '/coach/independants/demo',
        icon: Activity,
        accent: 'bg-amber-50 text-amber-600',
    },
    {
        id: 'setup-notifications',
        title: 'Configurer mes notifications',
        description: 'Choisissez comment vous souhaitez être prévenu des nouvelles demandes, inscriptions et paiements.',
        ctaLabel: 'Ajuster les alertes',
        to: '/club/notifications',
        icon: Bell,
        accent: 'bg-slate-50 text-slate-700',
    },
];

const getRoleDashboardPath = (roleType: RoleType, orgId: string) => {
    if (roleType === 'club_owner' || roleType === 'club_manager' || roleType === 'treasurer') {
        return `/dashboard/${orgId}/overview`;
    }
    return `/club/members`;
};

const HomePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { organisations, scheduleItems, familyMembers, loading } = useWeeklyFamilySchedule(user?.firstName);

    const handleOrgSelect = (org: Organisation) => {
        localStorage.setItem('selectedOrganisation', JSON.stringify({ id: org.id, name: org.name, type: org.type }));
        window.dispatchEvent(new Event('organisation:updated'));
        navigate(getRoleDashboardPath(org.roleType, org.id));
    };

    const todayStr = useMemo(() => new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }), []);
    const greeting = useMemo(() => {
        const h = new Date().getHours();
        if (h < 12) return 'Bonjour';
        if (h < 18) return 'Bon après-midi';
        return 'Bonsoir';
    }, []);

    const todayStart = useMemo(() => {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return t;
    }, []);
    const todayEnd = useMemo(() => {
        const t = new Date();
        t.setHours(23, 59, 59, 999);
        return t;
    }, []);

    const todayItems = useMemo(() => {
        return scheduleItems.filter((e) => {
            const st = new Date(e.start_time);
            return st >= todayStart && st <= todayEnd;
        });
    }, [scheduleItems, todayStart, todayEnd]);

    const upcomingItems = useMemo(() => {
        const now = Date.now();
        return scheduleItems.filter((e) => new Date(e.start_time).getTime() >= now);
    }, [scheduleItems]);

    const nextActivity = upcomingItems[0];
    const nextSecondary = upcomingItems.slice(1, 3);

    const activitiesThisWeek = scheduleItems.length;
    const familyCount = 1 + familyMembers.length;
    const orgCount = organisations.length;
    const disciplineCount = useMemo(() => {
        const s = new Set(scheduleItems.map((e) => e.event_type || e.title).filter(Boolean));
        return s.size;
    }, [scheduleItems]);

    const weekByDay = useMemo(() => {
        const { monday } = getWeekBounds();
        const buckets: ScheduleItem[][] = [[], [], [], [], [], [], []];
        for (const ev of scheduleItems) {
            const st = new Date(ev.start_time);
            const diff = Math.floor((st.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
            const idx = Math.min(6, Math.max(0, diff));
            if (idx >= 0 && idx <= 6) buckets[idx].push(ev);
        }
        buckets.forEach((b) => b.sort((a, c) => new Date(a.start_time).getTime() - new Date(c.start_time).getTime()));
        return buckets;
    }, [scheduleItems]);

    const subtitleFamily = useMemo(() => {
        const n = todayItems.length;
        if (n === 0) return 'Aucune activité prévue aujourd’hui pour votre famille.';
        return `${n} activité${n > 1 ? 's' : ''} aujourd’hui pour la famille.`;
    }, [todayItems.length]);

    return (
        <div className="space-y-8 text-slate-900 dark:text-slate-100 w-full min-w-0">
            <MemberHomeTabs active="home" />

            <section>
                <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase mb-1">
                    {todayStr}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                    {greeting}, {user?.firstName || 'vous'}{' '}
                    <span aria-hidden>👋</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">{subtitleFamily}</p>
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Activités / sem.', value: String(activitiesThisWeek), icon: Calendar, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
                    { label: 'Membres famille', value: String(familyCount), icon: Users, color: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400' },
                    { label: 'Associations', value: String(orgCount), icon: Building2, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
                    {
                        label: 'Disciplines',
                        value: disciplineCount > 0 ? String(disciplineCount) : '—',
                        icon: Sparkles,
                        color: 'bg-pink-50 text-pink-600 dark:bg-pink-500/10 dark:text-pink-400',
                    },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-4 flex items-center gap-3"
                    >
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                            <s.icon className="w-5 h-5" />
                                        </div>
                        <div>
                            <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{s.value}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
                        </div>
                    </div>
                ))}
                    </section>

            {loading ? (
                <div className="flex justify-center py-16">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                </div>
            ) : organisations.length === 0 ? (
                <>
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Par où commencer ?</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Vous n&apos;êtes encore membre d&apos;aucune organisation. Choisissez une action pour démarrer.
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {emptyStateActions.map((action) => {
                                const Icon = action.icon;
                                return (
                                    <Link
                                        key={action.id}
                                        to={action.to}
                                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow p-6 group block"
                                    >
                                        <div className={`w-10 h-10 rounded-xl ${action.accent} flex items-center justify-center mb-4`}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{action.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{action.description}</p>
                                        <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400 group-hover:underline">
                                            {action.ctaLabel} →
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                <ComingSoon
                    icon={Construction}
                        title="Planning familial"
                        description="Une fois inscrit dans un club, votre planning consolidé sera affiché ici."
                    />
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Colonne principale */}
                        <div className="lg:col-span-2 space-y-6">
                            {nextActivity ? (
                                <section>
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Prochaine activité</p>
                                    <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-6 shadow-lg shadow-blue-500/20">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className="text-xs font-semibold uppercase opacity-90">À venir</span>
                                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">
                                                {new Date(nextActivity.start_time).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-bold mb-4">{nextActivity.title}</h3>
                                        <div className="space-y-2 text-sm opacity-95">
                                            <p className="flex items-center gap-2">
                                                <Clock className="w-4 h-4 shrink-0" />
                                                {formatRange(new Date(nextActivity.start_time), new Date(nextActivity.end_time))}
                                            </p>
                                            {nextActivity.location && (
                                                <p className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 shrink-0" />
                                                    {nextActivity.location}
                                                </p>
                                            )}
                                            <p className="flex items-center gap-2">
                                                <User className="w-4 h-4 shrink-0" />
                                                {nextActivity.created_by
                                                    ? `${nextActivity.created_by.firstname} ${nextActivity.created_by.lastname}`
                                                    : '—'}
                                            </p>
                                        </div>
                                        <div className="mt-4 flex items-center gap-2">
                                            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                                                {nextActivity.participantLabel.slice(0, 2)}
                                            </div>
                                            <span className="text-sm">{nextActivity.participantLabel}</span>
                                        </div>
                                    </div>
                                </section>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
                                    Aucun créneau prévu cette semaine dans vos associations.
                                </div>
                            )}

                            {nextSecondary.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {nextSecondary.map((ev) => (
                                        <div
                                            key={ev.id + ev.participantLabel}
                                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
                                        >
                                            <p className="text-xs text-slate-500 capitalize">
                                                {new Date(ev.start_time).toLocaleDateString('fr-FR', { weekday: 'long' })}{' '}
                                                {formatTime(new Date(ev.start_time))}
                                            </p>
                                            <p className="font-semibold text-slate-900 dark:text-white mt-1">{ev.title}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <section>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Aujourd&apos;hui</h3>
                                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                                    {todayItems.length === 0 ? (
                                        <p className="p-6 text-sm text-slate-500 text-center">Rien de prévu aujourd&apos;hui.</p>
                                    ) : (
                                        todayItems.map((ev) => (
                                            <div key={ev.id + ev.participantLabel} className="flex flex-wrap items-center gap-2 sm:gap-4 p-4">
                                                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-28 shrink-0">
                                                    {formatRange(new Date(ev.start_time), new Date(ev.end_time))}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{ev.title}</p>
                                                    <p className="text-xs text-slate-500 truncate">
                                                        {ev.organisationName}
                                                        {ev.location ? ` · ${ev.location}` : ''}
                                                    </p>
                                                </div>
                                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0">
                                                    {ev.participantLabel.slice(0, 2)}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Colonne droite : famille + associations */}
                        <aside className="space-y-8">
                            <section>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Famille</h3>
                                    <Link to="/club/famille" className="text-xs font-semibold text-blue-600 hover:underline">
                                        Tout afficher
                                    </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center shadow-sm">
                                        <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                            {user?.firstName?.charAt(0) || 'V'}
                                        </div>
                                        <p className="font-semibold text-slate-900 dark:text-white mt-2 text-sm">Vous</p>
                                        <p className="text-xs text-slate-500">—</p>
                                    </div>
                                    {familyMembers.map((c) => {
                                        const age =
                                            c.birthdate
                                                ? Math.floor(
                                                      (Date.now() - new Date(c.birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
                                                  )
                                                : null;
                                        return (
                                            <div
                                                key={c.id}
                                                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-center shadow-sm"
                                            >
                                                <div className="w-14 h-14 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-sm">
                                                    {c.firstname.charAt(0)}
                                                </div>
                                                <p className="font-semibold text-slate-900 dark:text-white mt-2 text-sm truncate">{c.firstname}</p>
                                                <p className="text-xs text-slate-500">{age != null ? `${age} ans` : '—'}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>

                            <section>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Mes associations</h3>
                                    <span className="text-xs text-slate-500">{organisations.length} club{organisations.length > 1 ? 's' : ''}</span>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {organisations.map((org, i) => {
                                        const colors = ['bg-violet-500', 'bg-emerald-500', 'bg-pink-500', 'bg-amber-500'];
                                        const c = colors[i % colors.length];
                                        return (
                                            <button
                                                key={org.id}
                                                type="button"
                                                onClick={() => handleOrgSelect(org)}
                                                className="flex items-center gap-3 w-full text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 hover:shadow-md transition-all group"
                                            >
                                                <div className={`w-10 h-10 rounded-lg ${c} flex items-center justify-center shrink-0`}>
                                                    <Building2 className="w-5 h-5 text-white" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-semibold text-slate-900 dark:text-white truncate">{org.name}</p>
                                                    <p className="text-xs text-slate-500">{org.roleName}</p>
                                                </div>
                                                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 shrink-0" />
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                        </aside>
                    </div>

                    {/* Planning semaine */}
                    <section className="pt-4">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Planning de la semaine</h3>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 sm:grid sm:grid-cols-7 sm:overflow-visible sm:gap-2">
                            {DAY_LABELS.map((label, dayIdx) => {
                                const dayEvents = weekByDay[dayIdx] || [];
                                return (
                                    <div key={label} className="min-w-[140px] sm:min-w-0 flex flex-col flex-1">
                                        <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">{label}</p>
                                        <div className="space-y-2 flex-1 min-h-[120px]">
                                            {dayEvents.length === 0 ? (
                                                <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-3 text-center text-slate-400 text-sm flex items-center justify-center min-h-[80px]">
                                                    —
                                                </div>
                                            ) : (
                                                dayEvents.map((ev) => {
                                                    const st = new Date(ev.start_time);
                                                    const et = new Date(ev.end_time);
                                                    const sty = eventTypeStyle(ev.event_type);
                                                    return (
                                                        <div
                                                            key={ev.id + ev.participantLabel + dayIdx}
                                                            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-sm text-left"
                                                        >
                                                            <div className="flex justify-between items-start gap-1 mb-1">
                                                                <div className={`w-7 h-7 rounded-lg ${sty.icon} flex items-center justify-center shrink-0`}>
                                                                    <Calendar className="w-3.5 h-3.5 text-slate-700" />
                                                                </div>
                                                                <span className="text-[10px] text-slate-500">{formatTime(st)}</span>
                                                            </div>
                                                            <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight line-clamp-2">{ev.title}</p>
                                                            <div className="mt-1 space-y-0.5 text-[10px] text-slate-500">
                                                                <p className="flex items-center gap-0.5">
                                                                    <Clock className="w-3 h-3 shrink-0" />
                                                                    {formatRange(st, et)}
                                                                </p>
                                                                {ev.location && (
                                                                    <p className="flex items-center gap-0.5 truncate">
                                                                        <MapPin className="w-3 h-3 shrink-0" />
                                                                        <span className="truncate">{ev.location}</span>
                                                                    </p>
                                                                )}
                                                                <p className="flex items-center gap-0.5 truncate">
                                                                    <User className="w-3 h-3 shrink-0" />
                                                                    <span className="truncate">{ev.participantLabel}</span>
                                                                </p>
                                                            </div>
                                                            <div className="mt-1 w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-600">
                                                                {ev.participantLabel.slice(0, 2)}
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                </>
            )}
        </div>
    );
};

export default HomePage;
