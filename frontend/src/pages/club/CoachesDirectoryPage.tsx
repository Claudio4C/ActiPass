import React, { useEffect, useState } from 'react';
import { Mail, Phone } from 'lucide-react';
import { api } from '../../lib/api';
import MemberHomeTabs from '../../components/club/MemberHomeTabs';
import { useAuth } from '../../contexts/AuthContext';
import { useWeeklyFamilySchedule } from '../../hooks/useWeeklyFamilySchedule';
import { useDashboardSignals } from '../../hooks/useDashboardSignals';
import type { RoleType } from '../../types';

type OrgRow = {
    organisation: { id: string; name: string; type: 'club' | 'association' | null };
    role: { name: string; type: RoleType };
};

type MemberApi = {
    id: string;
    email: string;
    firstname: string;
    lastname: string;
    phone: string | null;
    role: { id: string; name: string; type: RoleType; level: number };
};

type AggregatedCoach = {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string | null;
    roleLabels: string[];
    organisationNames: string[];
};

function mergeCoach(map: Map<string, AggregatedCoach>, m: MemberApi, orgName: string) {
    const existing = map.get(m.id);
    const label = m.role.name?.trim() || 'Coach';
    if (!existing) {
        map.set(m.id, {
            id: m.id,
            firstname: m.firstname,
            lastname: m.lastname,
            email: m.email,
            phone: m.phone,
            roleLabels: [label],
            organisationNames: [orgName],
        });
        return;
    }
    if (!existing.roleLabels.includes(label)) existing.roleLabels.push(label);
    if (!existing.organisationNames.includes(orgName)) existing.organisationNames.push(orgName);
    if (!existing.phone && m.phone) existing.phone = m.phone;
}

function badgeFor(c: AggregatedCoach) {
    const primary = c.roleLabels[0] || 'Coach';
    const cleaned = primary.replace(/^coach\s*/i, '').trim();
    return cleaned || primary;
}

function describeCoach(c: AggregatedCoach) {
    const orgs = c.organisationNames.join(', ');
    const roles = c.roleLabels.length > 1 ? c.roleLabels.join(' · ') : c.roleLabels[0] || '';
    if (c.organisationNames.length <= 1) {
        return roles
            ? `${roles}. Retrouvez ses coordonnées ci-dessous.`
            : `Intervenant au sein de votre association.`;
    }
    return `Intervenant dans : ${orgs}.${roles ? ` ${roles}.` : ''}`;
}

const CoachesDirectoryPage: React.FC = () => {
    const { user } = useAuth();
    const { scheduleItems, familyMembers } = useWeeklyFamilySchedule(user?.firstName);
    const { notifications, notificationBadgeCount } = useDashboardSignals(scheduleItems, familyMembers);
    const [coaches, setCoaches] = useState<AggregatedCoach[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const orgs = await api.get<OrgRow[]>('/organisations/my', {}, { useCache: true, cacheTTL: 60000 });
                const map = new Map<string, AggregatedCoach>();

                await Promise.all(
                    (orgs || []).map(async (row) => {
                        const orgId = row.organisation.id;
                        const orgName = row.organisation.name;
                        try {
                            const members = await api.get<MemberApi[]>(
                                `/organisations/${orgId}/members`,
                                {},
                                { useCache: false }
                            );
                            for (const m of members || []) {
                                if (m.role?.type === 'coach') {
                                    mergeCoach(map, m, orgName);
                                }
                            }
                        } catch {
                            /* org inaccessible : ignoré */
                        }
                    })
                );

                const list = Array.from(map.values()).sort((a, b) => {
                    const ln = a.lastname.localeCompare(b.lastname, 'fr');
                    if (ln !== 0) return ln;
                    return a.firstname.localeCompare(b.firstname, 'fr');
                });
                setCoaches(list);
            } catch {
                setCoaches([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="space-y-8 text-slate-900 dark:text-slate-100 w-full min-w-0">
            <MemberHomeTabs
                active="coaches"
                notifications={notifications}
                notificationBadgeCount={notificationBadgeCount}
            />

            <header>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Nos coachs</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
                    Retrouvez les coordonnées de tous les professeurs et intervenants
                </p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-600 border-t-transparent" />
                </div>
            ) : coaches.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 px-6 py-12 text-center">
                    <p className="text-slate-600 dark:text-slate-300 font-medium">Aucun coach pour l’instant</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                        Les membres avec le rôle « coach » dans vos associations apparaîtront ici.
                    </p>
                </div>
            ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {coaches.map((c) => {
                        const name = `${c.firstname} ${c.lastname}`.trim();
                        const initials = `${c.firstname?.[0] || ''}${c.lastname?.[0] || ''}`.toUpperCase();
                        return (
                            <li
                                key={c.id}
                                className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-4 sm:p-5 flex gap-4"
                            >
                                <div
                                    className="shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-lg font-bold shadow-inner"
                                    aria-hidden
                                >
                                    {initials}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-slate-900 dark:text-white text-lg leading-tight">{name}</p>
                                    <span className="inline-block mt-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2.5 py-0.5 rounded-full">
                                        {badgeFor(c)}
                                    </span>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                                        {describeCoach(c)}
                                    </p>
                                    <div className="mt-3 flex flex-col gap-1.5 text-sm">
                                        <a
                                            href={`mailto:${encodeURIComponent(c.email)}`}
                                            className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                        >
                                            <Mail className="w-4 h-4 shrink-0 text-slate-400" />
                                            <span className="truncate">{c.email}</span>
                                        </a>
                                        {c.phone && (
                                            <a
                                                href={`tel:${c.phone.replace(/\s/g, '')}`}
                                                className="inline-flex items-center gap-2 text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition"
                                            >
                                                <Phone className="w-4 h-4 shrink-0 text-slate-400" />
                                                <span>{c.phone}</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};

export default CoachesDirectoryPage;
