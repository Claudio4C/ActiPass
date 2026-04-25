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
    Navigation,
    Phone,
    Info,
    FileWarning,
    GraduationCap,
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
import {
    useDashboardSignals,
    formatCountdown,
    relativeDayBadge,
} from '../hooks/useDashboardSignals';

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
    const { notifications, notificationBadgeCount, proactiveBanners } = useDashboardSignals(
        scheduleItems,
        familyMembers
    );

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
        if (n === 0) return 'Journée libre — aucune activité prévue pour aujourd’hui.';
        return `${n} activité${n > 1 ? 's' : ''} aujourd’hui pour la famille.`;
    }, [todayItems.length]);

    return (
        <div className="space-y-8 text-slate-900 dark:text-slate-100 w-full min-w-0">
            <MemberHomeTabs
                active="home"
                notifications={notifications}
                notificationBadgeCount={notificationBadgeCount}
            />

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

            {!loading && proactiveBanners.length > 0 && (
                <section className="space-y-3" aria-label="Assistance et alertes">
                    {proactiveBanners.map((b) => {
                        const shell =
                            b.variant === 'danger'
                                ? 'border-red-200 bg-red-50/80 dark:border-red-900/60 dark:bg-red-950/25'
                                : b.variant === 'warning'
                                  ? 'border-amber-200 bg-amber-50/80 dark:border-amber-900/50 dark:bg-amber-950/20'
                                  : b.variant === 'accent'
                                    ? 'border-blue-200 bg-blue-50/80 dark:border-blue-900/50 dark:bg-blue-950/25'
                                    : 'border-slate-200 bg-slate-50/90 dark:border-slate-700 dark:bg-slate-900/60';
                        const Icon =
                            b.variant === 'danger'
                                ? FileWarning
                                : b.variant === 'warning'
                                  ? FileWarning
                                  : b.variant === 'accent'
                                    ? Clock
                                    : Info;
                                        const isExternal = Boolean(b.action?.to.startsWith('http'));
                        return (
                            <div
                                key={b.id}
                                className={`flex flex-col gap-3 rounded-2xl border px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${shell}`}
                            >
                                <div className="flex gap-3 min-w-0">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/80 text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{b.title}</p>
                                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-0.5 leading-snug">
                                            {b.description}
                                        </p>
                                    </div>
                                </div>
                                {b.action &&
                                    (isExternal ? (
                                        <a
                                            href={b.action.to}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="shrink-0 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400 whitespace-nowrap self-start sm:self-center"
                                        >
                                            {b.action.label} →
                                        </a>
                                    ) : (
                                        <Link
                                            to={b.action.to}
                                            className="shrink-0 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400 whitespace-nowrap self-start sm:self-center"
                                        >
                                            {b.action.label} →
                                        </Link>
                                    ))}
                            </div>
                        );
                    })}
                </section>
            )}

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
                                <section className="relative">
                                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Prochaine activité
                                    </p>
                                    {(() => {
                                        const start = new Date(nextActivity.start_time);
                                        const delta = start.getTime() - Date.now();
                                        const cd = formatCountdown(delta);
                                        return (
                                            <div className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-5 sm:p-7 shadow-xl shadow-blue-600/25 ring-1 ring-white/10">
                                                <div className="flex justify-end items-start mb-5">
                                                    <span className="text-xs font-semibold bg-white/20 px-3 py-1.5 rounded-full capitalize">
                                                        {relativeDayBadge(start)}
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
                                                    <div className="min-w-0 flex-1">
                                                        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight break-words">
                                                            {nextActivity.title}
                                                        </h3>
                                                    </div>
                                                    {cd && delta > 0 && delta <= 3 * 60 * 60_000 && (
                                                        <div className="rounded-2xl bg-black/25 px-4 py-3 text-center backdrop-blur-sm shrink-0 ring-1 ring-white/15">
                                                            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                                                                Début dans
                                                            </p>
                                                            <p className="text-2xl font-bold tabular-nums leading-none mt-1">{cd}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <dl className="grid gap-3 text-sm sm:text-base">
                                                    <div className="flex gap-3">
                                                        <dt className="sr-only">Horaires</dt>
                                                        <dd className="flex min-w-0 flex-1 items-start gap-2 font-medium">
                                                            <Clock className="mt-0.5 h-5 w-5 shrink-0 opacity-95" aria-hidden />
                                                            <span>
                                                                {formatRange(start, new Date(nextActivity.end_time))}
                                                            </span>
                                                        </dd>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <dt className="sr-only">Lieu</dt>
                                                        <dd className="flex min-w-0 flex-1 items-start gap-2">
                                                            <MapPin className="mt-0.5 h-5 w-5 shrink-0 opacity-95" aria-hidden />
                                                            <span className="font-medium">
                                                                {nextActivity.location || 'Lieu communiqué par le club'}
                                                            </span>
                                                        </dd>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <dt className="sr-only">Participant</dt>
                                                        <dd className="flex items-center gap-3 flex-wrap">
                                                            <span className="flex items-center gap-2 font-medium">
                                                                <User className="h-5 w-5 shrink-0 opacity-95" aria-hidden />
                                                                {nextActivity.participantLabel}
                                                            </span>
                                                            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                                                                <span
                                                                    className="flex h-7 w-7 items-center justify-center rounded-full bg-white/25 text-[11px] font-bold"
                                                                    aria-hidden
                                                                >
                                                                    {nextActivity.participantLabel.slice(0, 2)}
                                                                </span>
                                                                Concerné
                                                            </span>
                                                        </dd>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <dt className="sr-only">Coach</dt>
                                                        <dd className="flex min-w-0 flex-1 items-start gap-2 text-white/95">
                                                            <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 opacity-90" aria-hidden />
                                                            <span>
                                                                <span className="block text-[11px] font-semibold uppercase tracking-wide text-white/65">
                                                                    Coach / intervenant
                                                                </span>
                                                                {nextActivity.created_by
                                                                    ? `${nextActivity.created_by.firstname} ${nextActivity.created_by.lastname}`
                                                                    : 'À confirmer avec le club'}
                                                            </span>
                                                        </dd>
                                                    </div>
                                                </dl>

                                                <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                                                    {nextActivity.location?.trim() ? (
                                                        <a
                                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(nextActivity.location.trim())}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-white/95 min-h-[44px]"
                                                        >
                                                            <Navigation className="h-4 w-4 shrink-0" aria-hidden />
                                                            Itinéraire
                                                        </a>
                                                    ) : (
                                                        <Link
                                                            to="/club/planning"
                                                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/90 px-4 py-3 text-sm font-semibold text-blue-800 shadow-sm min-h-[44px]"
                                                        >
                                                            <Navigation className="h-4 w-4 shrink-0" aria-hidden />
                                                            Planning
                                                        </Link>
                                                    )}
                                                    <Link
                                                        to="/club/coaches"
                                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-4 py-3 text-sm font-semibold text-white min-h-[44px] hover:bg-white/10"
                                                    >
                                                        <Phone className="h-4 w-4 shrink-0" aria-hidden />
                                                        Contacter
                                                    </Link>
                                                    <Link
                                                        to="/club/planning"
                                                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/40 bg-transparent px-4 py-3 text-sm font-semibold text-white min-h-[44px] hover:bg-white/10"
                                                    >
                                                        <Info className="h-4 w-4 shrink-0" aria-hidden />
                                                        Détails
                                                    </Link>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </section>
                            ) : (
                                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-8 text-center text-slate-500">
                                    Aucun créneau prévu cette semaine dans vos associations.
                                </div>
                            )}

                            {nextSecondary.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {nextSecondary.map((ev) => {
                                        const st = new Date(ev.start_time);
                                        const coachName = ev.created_by
                                            ? `${ev.created_by.firstname} ${ev.created_by.lastname}`
                                            : null;
                                        return (
                                            <div
                                                key={ev.id + ev.participantLabel}
                                                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-sm"
                                            >
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <p className="text-xs font-semibold text-slate-500 capitalize">
                                                        {relativeDayBadge(st)} · {formatTime(st)}
                                                    </p>
                                                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-200">
                                                        {ev.participantLabel.slice(0, 2)}
                                                    </span>
                                                </div>
                                                <p className="font-semibold text-slate-900 dark:text-white">{ev.title}</p>
                                                <div className="mt-3 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                                                    <p className="flex items-center gap-1.5">
                                                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                        {formatRange(st, new Date(ev.end_time))}
                                                    </p>
                                                    {ev.location && (
                                                        <p className="flex items-center gap-1.5 min-w-0">
                                                            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                            <span className="truncate">{ev.location}</span>
                                                        </p>
                                                    )}
                                                    {coachName && (
                                                        <p className="flex items-center gap-1.5 min-w-0">
                                                            <User className="h-3.5 w-3.5 shrink-0" aria-hidden />
                                                            <span className="truncate">{coachName}</span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
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
