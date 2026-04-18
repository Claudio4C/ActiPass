import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, User, Music2, Drama, Activity, Sparkles, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import MemberHomeTabs from '../../components/club/MemberHomeTabs';
import {
    useWeeklyFamilySchedule,
    getWeekBounds,
    DAY_LABELS,
    eventTypeStyle,
    formatTime,
    formatRange,
    parentParticipantLabel,
    type ScheduleItem,
} from '../../hooks/useWeeklyFamilySchedule';

type MemberFilter = 'all' | 'me' | string;

function ageFromBirthdate(birthdate: string | null): number | null {
    if (!birthdate) return null;
    return Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function countForLabel(items: ScheduleItem[], label: string) {
    return items.filter((e) => e.participantLabel === label).length;
}

function matchesMemberFilter(
    item: ScheduleItem,
    filter: MemberFilter,
    parentLabel: string,
    children: { id: string; firstname: string }[]
): boolean {
    if (filter === 'all') return true;
    if (filter === 'me') return item.participantLabel === parentLabel;
    const child = children.find((c) => c.id === filter);
    if (!child) return false;
    return item.participantLabel === child.firstname;
}

function EventGlyph({ eventType }: { eventType?: string }) {
    const t = eventType || '';
    if (t === 'workshop' || t === 'meeting') return <Music2 className="w-3.5 h-3.5 text-slate-700" strokeWidth={2} />;
    if (t === 'match') return <Activity className="w-3.5 h-3.5 text-slate-700" strokeWidth={2} />;
    if (t === 'other') return <Drama className="w-3.5 h-3.5 text-slate-700" strokeWidth={2} />;
    if (t === 'training') return <Activity className="w-3.5 h-3.5 text-slate-700" strokeWidth={2} />;
    return <Sparkles className="w-3.5 h-3.5 text-slate-700" strokeWidth={2} />;
}

const PlanningPage: React.FC = () => {
    const { user } = useAuth();
    const { scheduleItems, familyMembers, loading } = useWeeklyFamilySchedule(user?.firstName);
    const [memberFilter, setMemberFilter] = useState<MemberFilter>('all');

    const parentLabel = useMemo(() => parentParticipantLabel(user?.firstName), [user?.firstName]);

    const filteredItems = useMemo(
        () => scheduleItems.filter((e) => matchesMemberFilter(e, memberFilter, parentLabel, familyMembers)),
        [scheduleItems, memberFilter, parentLabel, familyMembers]
    );

    const weekByDay = useMemo(() => {
        const { monday } = getWeekBounds();
        const buckets: ScheduleItem[][] = [[], [], [], [], [], [], []];
        for (const ev of filteredItems) {
            const st = new Date(ev.start_time);
            const diff = Math.floor((st.getTime() - monday.getTime()) / (24 * 60 * 60 * 1000));
            const idx = Math.min(6, Math.max(0, diff));
            buckets[idx].push(ev);
        }
        buckets.forEach((b) => b.sort((a, c) => new Date(a.start_time).getTime() - new Date(c.start_time).getTime()));
        return buckets;
    }, [filteredItems]);

    const totalWeek = scheduleItems.length;
    const parentCount = countForLabel(scheduleItems, parentLabel);

    return (
        <div className="space-y-8 text-slate-900 dark:text-slate-100 w-full min-w-0">
            <MemberHomeTabs active="planning" />

            <header>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Planning hebdomadaire
                </h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
                    Filtrez par membre de la famille pour voir leurs activités
                </p>
            </header>

            <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3 mb-4">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">Famille</h2>
                    <button
                        type="button"
                        onClick={() => setMemberFilter('all')}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                        Tous affichés
                    </button>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
                    <button
                        type="button"
                        onClick={() => setMemberFilter('all')}
                        className={`shrink-0 w-[120px] rounded-xl border p-3 text-center transition-all ${
                            memberFilter === 'all'
                                ? 'border-blue-500 ring-2 ring-blue-500/25 bg-slate-50 dark:bg-slate-800/80'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                    >
                        <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-100">
                            <Users className="w-5 h-5" strokeWidth={2} />
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white mt-2 text-sm">Tous</p>
                        <p className="text-xs text-slate-500 truncate">{totalWeek} cours/sem</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setMemberFilter('me')}
                        className={`shrink-0 w-[120px] rounded-xl border p-3 text-center transition-all ${
                            memberFilter === 'me'
                                ? 'border-blue-500 ring-2 ring-blue-500/25 bg-slate-50 dark:bg-slate-800/80'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                    >
                        <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-bold">
                            {user?.firstName?.charAt(0) || 'V'}
                        </div>
                        <p className="font-bold text-slate-900 dark:text-white mt-2 text-sm">Vous</p>
                        <p className="text-xs text-slate-500">Adulte</p>
                        <p className="text-[11px] text-slate-500 mt-1 truncate">{parentCount} cours/sem</p>
                    </button>

                    {familyMembers.map((c) => {
                        const age = ageFromBirthdate(c.birthdate);
                        const cnt = countForLabel(scheduleItems, c.firstname);
                        const selected = memberFilter === c.id;
                        return (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => setMemberFilter(c.id)}
                                className={`shrink-0 w-[120px] rounded-xl border p-3 text-center transition-all ${
                                    selected
                                        ? 'border-blue-500 ring-2 ring-blue-500/25 bg-slate-50 dark:bg-slate-800/80'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300'
                                }`}
                            >
                                <div className="w-12 h-12 mx-auto rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-100 font-bold text-sm">
                                    {c.firstname.charAt(0)}
                                </div>
                                <p className="font-bold text-slate-900 dark:text-white mt-2 text-sm truncate">{c.firstname}</p>
                                <p className="text-xs text-slate-500">{age != null ? `${age} ans` : '—'}</p>
                                <p className="text-[11px] text-slate-500 mt-1 truncate">{cnt} cours/sem</p>
                            </button>
                        );
                    })}
                </div>
                <p className="text-xs text-slate-400 mt-3">
                    <Link to="/club/famille" className="text-blue-600 hover:underline font-medium">
                        Gérer la famille
                    </Link>
                </p>
            </section>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent" />
                </div>
            ) : (
                <section className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 p-4 sm:p-6">
                    <div className="flex gap-2 overflow-x-auto pb-2 sm:grid sm:grid-cols-7 sm:overflow-visible sm:gap-3">
                        {DAY_LABELS.map((label, dayIdx) => {
                            const dayEvents = weekByDay[dayIdx] || [];
                            return (
                                <div key={label} className="min-w-[148px] sm:min-w-0 flex flex-col flex-1">
                                    <p className="text-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 tracking-wide">
                                        {label}
                                    </p>
                                    <div className="space-y-2 flex-1 min-h-[140px]">
                                        {dayEvents.length === 0 ? (
                                            <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/40 p-3 flex items-center justify-center min-h-[80px] text-slate-400 text-sm">
                                                —
                                            </div>
                                        ) : (
                                            dayEvents.map((ev) => {
                                                const st = new Date(ev.start_time);
                                                const et = new Date(ev.end_time);
                                                const sty = eventTypeStyle(ev.event_type);
                                                const coach = ev.created_by
                                                    ? `${ev.created_by.firstname} ${ev.created_by.lastname}`
                                                    : '—';
                                                return (
                                                    <div
                                                        key={ev.id + ev.participantLabel + dayIdx}
                                                        className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 shadow-sm text-left"
                                                    >
                                                        <div className="flex justify-between items-start gap-1 mb-1.5">
                                                            <div
                                                                className={`w-8 h-8 rounded-full ${sty.icon} flex items-center justify-center shrink-0`}
                                                            >
                                                                <EventGlyph eventType={ev.event_type} />
                                                            </div>
                                                            <span className="text-xs font-semibold text-slate-400 tabular-nums">
                                                                {formatTime(st)}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                                                            {ev.title}
                                                        </p>
                                                        <div className="mt-2 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                                                            <p className="flex items-center gap-1">
                                                                <Clock className="w-3 h-3 shrink-0" />
                                                                <span>{formatRange(st, et)}</span>
                                                            </p>
                                                            {ev.location && (
                                                                <p className="flex items-center gap-1">
                                                                    <MapPin className="w-3 h-3 shrink-0" />
                                                                    <span className="truncate">{ev.location}</span>
                                                                </p>
                                                            )}
                                                            <p className="flex items-center gap-1">
                                                                <User className="w-3 h-3 shrink-0" />
                                                                <span className="truncate">{coach}</span>
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 w-7 h-7 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-600 dark:to-slate-700 flex items-center justify-center text-[9px] font-bold text-slate-700 dark:text-slate-100">
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
            )}

            {!loading && scheduleItems.length === 0 && (
                <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-8">
                    Aucun créneau dans vos associations pour cette semaine.{' '}
                    <Link to="/accounts" className="text-blue-600 font-medium hover:underline">
                        Rejoindre un club
                    </Link>
                </p>
            )}
        </div>
    );
};

export default PlanningPage;
