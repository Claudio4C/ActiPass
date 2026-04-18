import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import type { RoleType } from '../types';

export type Organisation = {
    id: string;
    name: string;
    roleType: RoleType;
    roleName: string;
    type: 'club' | 'association' | 'independant';
};

export type ApiEvent = {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    location: string | null;
    event_type?: string;
    organisation?: { id: string; name: string };
    created_by?: { id: string; firstname: string; lastname: string } | null;
};

export type ScheduleItem = ApiEvent & {
    organisationId: string;
    organisationName: string;
    participantLabel: string;
    participantAvatar?: string;
};

export type FamilyChild = {
    id: string;
    firstname: string;
    lastname: string;
    birthdate: string | null;
    memberships?: { organisation: { id: string; name: string } }[];
};

/** Lundi 00:00 → dimanche 23:59:59 (locale) */
export function getWeekBounds(ref = new Date()) {
    const d = new Date(ref);
    const day = d.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(d);
    monday.setDate(d.getDate() + mondayOffset);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    return { monday, sunday };
}

export const DAY_LABELS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'] as const;

export function eventTypeStyle(t?: string): { bg: string; icon: string } {
    const m: Record<string, { bg: string; icon: string }> = {
        training: { bg: 'bg-emerald-100 text-emerald-700', icon: 'bg-emerald-200' },
        match: { bg: 'bg-green-100 text-green-700', icon: 'bg-green-200' },
        meeting: { bg: 'bg-slate-100 text-slate-700', icon: 'bg-slate-200' },
        workshop: { bg: 'bg-violet-100 text-violet-700', icon: 'bg-violet-200' },
        other: { bg: 'bg-amber-100 text-amber-700', icon: 'bg-amber-200' },
    };
    return m[t || ''] || { bg: 'bg-indigo-100 text-indigo-700', icon: 'bg-indigo-200' };
}

export function formatTime(d: Date) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatRange(start: Date, end: Date) {
    return `${formatTime(start)} – ${formatTime(end)}`;
}

/** Libellé participant pour le parent (aligné avec l’agrégation API) */
export function parentParticipantLabel(firstName?: string | null) {
    return firstName?.trim() || 'Vous';
}

export function useWeeklyFamilySchedule(userFirstName?: string | null) {
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
    const [familyMembers, setFamilyMembers] = useState<FamilyChild[]>([]);
    const [loading, setLoading] = useState(true);

    const loadWeekSchedule = useCallback(
        async (orgs: Organisation[]) => {
            const { monday, sunday } = getWeekBounds();
            const startIso = monday.toISOString();
            const label = parentParticipantLabel(userFirstName);

            const tasks = orgs.map(async (org) => {
                try {
                    const raw = await api.get<ApiEvent[]>(
                        `/organisations/${org.id}/events`,
                        {
                            status: 'published',
                            start_date: startIso,
                        },
                        { useCache: false }
                    );
                    return (raw || [])
                        .map((ev) => {
                            const st = new Date(ev.start_time);
                            if (st > sunday || st < monday) return null;
                            return {
                                ...ev,
                                organisationId: org.id,
                                organisationName: org.name,
                                participantLabel: label,
                            } as ScheduleItem;
                        })
                        .filter(Boolean) as ScheduleItem[];
                } catch {
                    return [];
                }
            });

            const chunks = await Promise.all(tasks);
            let merged = chunks.flat();

            try {
                const dash = await api
                    .get<{
                        children: Array<{
                            id: string;
                            firstname: string;
                            lastname: string;
                            birthdate: string | null;
                            events: Array<
                                ApiEvent & {
                                    organisation?: { id: string; name: string };
                                    is_registered?: boolean;
                                }
                            >;
                        }>;
                    }>('/family/dashboard', {}, { useCache: false })
                    .catch(() => ({ children: [] }));

                for (const child of dash.children || []) {
                    for (const ev of child.events || []) {
                        if (ev.is_registered === false) continue;
                        const st = new Date(ev.start_time);
                        if (st > sunday || st < monday) continue;
                        merged.push({
                            ...ev,
                            organisationId: ev.organisation?.id || '',
                            organisationName: ev.organisation?.name || '',
                            participantLabel: child.firstname,
                        });
                    }
                }
            } catch {
                /* ignore */
            }

            merged.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
            const seen = new Set<string>();
            merged = merged.filter((e) => {
                const k = `${e.id}-${e.participantLabel}`;
                if (seen.has(k)) return false;
                seen.add(k);
                return true;
            });
            setScheduleItems(merged);
        },
        [userFirstName]
    );

    useEffect(() => {
        const load = async () => {
            try {
                const data = await api.get<
                    Array<{
                        organisation: { id: string; name: string; type: 'club' | 'association' | null };
                        role: { name: string; type: RoleType };
                    }>
                >('/organisations/my', {}, { useCache: true, cacheTTL: 60000 });

                const orgs: Organisation[] = data.map((item) => ({
                    id: item.organisation.id,
                    name: item.organisation.name,
                    type: item.organisation.type || 'club',
                    roleType: item.role.type,
                    roleName: item.role.name,
                }));
                setOrganisations(orgs);

                try {
                    const kids = await api.get<FamilyChild[]>('/family/children', {}, { useCache: false });
                    setFamilyMembers(kids || []);
                } catch {
                    setFamilyMembers([]);
                }

                await loadWeekSchedule(orgs);
            } catch (err) {
                console.error('Error loading weekly schedule:', err);
                setOrganisations([]);
                setScheduleItems([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [loadWeekSchedule]);

    return { organisations, scheduleItems, familyMembers, loading };
}
