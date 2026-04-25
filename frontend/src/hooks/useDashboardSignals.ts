import { useMemo } from 'react';
import type { FamilyChild, ScheduleItem } from './useWeeklyFamilySchedule';

/** Priorité pour tri et styles (urgent = action immédiate) */
export type DashboardNotifPriority = 'urgent' | 'warning' | 'info';

export type DashboardNotification = {
    id: string;
    priority: DashboardNotifPriority;
    title: string;
    subtitle: string;
};

export type ProactiveBanner = {
    id: string;
    variant: 'danger' | 'warning' | 'accent' | 'neutral';
    title: string;
    description: string;
    action?: { label: string; to: string };
};

function dayKey(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Chevauchements temporels le même jour (famille — lieux différents, trajets, etc.) */
function findOverlappingPairs(items: ScheduleItem[]): { a: ScheduleItem; b: ScheduleItem }[] {
    const byDay = new Map<string, ScheduleItem[]>();
    for (const ev of items) {
        const k = dayKey(new Date(ev.start_time));
        const arr = byDay.get(k) ?? [];
        arr.push(ev);
        byDay.set(k, arr);
    }

    const out: { a: ScheduleItem; b: ScheduleItem }[] = [];
    const seen = new Set<string>();

    for (const dayItems of byDay.values()) {
        const sorted = [...dayItems].sort(
            (x, y) => new Date(x.start_time).getTime() - new Date(y.start_time).getTime()
        );
        for (let i = 0; i < sorted.length; i++) {
            for (let j = i + 1; j < sorted.length; j++) {
                const a = sorted[i];
                const b = sorted[j];
                const as = new Date(a.start_time).getTime();
                const ae = new Date(a.end_time).getTime();
                const bs = new Date(b.start_time).getTime();
                const be = new Date(b.end_time).getTime();
                if (as < be && bs < ae) {
                    const pairId = [a.id, b.id].sort().join('|') + '|' + dayKey(new Date(a.start_time));
                    if (!seen.has(pairId)) {
                        seen.add(pairId);
                        out.push({ a, b });
                    }
                }
            }
        }
    }
    return out;
}

/** Libellé jour relatif pour badges (Aujourd’hui / Demain / mercredi…) */
export function relativeDayBadge(start: Date, now = new Date()) {
    const s = new Date(start);
    s.setHours(0, 0, 0, 0);
    const n = new Date(now);
    n.setHours(0, 0, 0, 0);
    const diff = Math.round((s.getTime() - n.getTime()) / (24 * 60 * 60 * 1000));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return 'Demain';
    if (diff === -1) return 'Hier';
    return s.toLocaleDateString('fr-FR', { weekday: 'long' });
}

/** Texte countdown lisible pour la carte héros */
export function formatCountdown(ms: number): string | null {
    if (ms <= 0) return null;
    const minutes = Math.ceil(ms / 60_000);
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
}

const priorityRank: Record<DashboardNotifPriority, number> = {
    urgent: 0,
    warning: 1,
    info: 2,
};

function sortNotifications(list: DashboardNotification[]): DashboardNotification[] {
    return [...list].sort((x, y) => priorityRank[x.priority] - priorityRank[y.priority]);
}

export function useDashboardSignals(scheduleItems: ScheduleItem[], familyMembers: FamilyChild[]) {
    return useMemo(() => {
        const now = Date.now();
        const notifications: DashboardNotification[] = [];

        const overlaps = findOverlappingPairs(scheduleItems);
        for (let i = 0; i < overlaps.length; i++) {
            const { a, b } = overlaps[i];
            const ra = formatRangeShort(new Date(a.start_time), new Date(a.end_time));
            const rb = formatRangeShort(new Date(b.start_time), new Date(b.end_time));
            notifications.push({
                id: `overlap-${i}-${a.id}-${b.id}`,
                priority: 'urgent',
                title: 'Activités qui se chevauchent',
                subtitle: `${a.title} (${ra}) et ${b.title} (${rb}) — même créneau.`,
            });
        }

        const upcoming = scheduleItems
            .filter((e) => new Date(e.start_time).getTime() > now)
            .sort((x, y) => new Date(x.start_time).getTime() - new Date(y.start_time).getTime());

        const next = upcoming[0];
        if (next) {
            const startMs = new Date(next.start_time).getTime();
            const delta = startMs - now;
            const cd = formatCountdown(delta);
            if (delta > 0 && delta <= 45 * 60_000 && cd) {
                notifications.push({
                    id: `imminent-${next.id}-${next.participantLabel}`,
                    priority: 'urgent',
                    title: `${next.title} dans ${cd}`,
                    subtitle: `${next.participantLabel} · ${formatRangeShort(new Date(next.start_time), new Date(next.end_time))}${next.location ? ` · ${next.location}` : ''}`,
                });
            } else if (delta > 45 * 60_000 && delta <= 24 * 60 * 60_000) {
                notifications.push({
                    id: `soon-${next.id}-${next.participantLabel}`,
                    priority: 'info',
                    title: `Rappel : ${next.title}`,
                    subtitle: `${relativeDayBadge(new Date(next.start_time))} à ${formatTimeShort(new Date(next.start_time))} · ${next.participantLabel}`,
                });
            }
        }

        const docChild = familyMembers[0];
        if (docChild) {
            notifications.push({
                id: `doc-${docChild.id}`,
                priority: 'warning',
                title: 'Document à compléter',
                subtitle: `Certificat médical (${docChild.firstname}) — renouvellement à prévoir.`,
            });
        }

        const sorted = sortNotifications(notifications);
        const urgentCount = sorted.filter((n) => n.priority === 'urgent').length;
        const badgeCount = sorted.length;

        const proactiveBanners: ProactiveBanner[] = [];

        if (overlaps.length > 0) {
            const { a, b } = overlaps[0];
            proactiveBanners.push({
                id: 'banner-overlap',
                variant: 'danger',
                title: 'Attention : créneaux qui se chevauchent',
                description: `${a.title} et ${b.title} sont prévus au même moment. Anticipez le trajet ou contactez les clubs.`,
                action: { label: 'Voir le planning', to: '/club/planning' },
            });
        }

        if (next) {
            const delta = new Date(next.start_time).getTime() - now;
            const cd = formatCountdown(delta);
            if (delta > 0 && delta <= 45 * 60_000 && cd) {
                proactiveBanners.push({
                    id: 'banner-imminent',
                    variant: 'accent',
                    title: `Dans ${cd} · ${next.title}`,
                    description: `${next.participantLabel}${next.location ? ` · ${next.location}` : ''} — préparez sac et trajet.`,
                    action: { label: 'Itinéraire', to: mapsHref(next.location) },
                });
            }
        }

        if (docChild) {
            const endMonth = new Date(now);
            endMonth.setMonth(endMonth.getMonth() + 1, 0);
            const deadline = endMonth.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            proactiveBanners.push({
                id: 'banner-doc',
                variant: 'warning',
                title: 'Document à vérifier',
                description: `Certificat médical de ${docChild.firstname} — pensez à le renouveler avant le ${deadline}.`,
                action: { label: 'Téléverser', to: '/club/famille' },
            });
        }

        return {
            notifications: sorted,
            /** Nombre affiché sur la cloche (priorise l’alerte) */
            notificationBadgeCount: badgeCount > 9 ? '9+' : String(badgeCount || 0),
            urgentNotificationCount: urgentCount,
            proactiveBanners,
            /** Chevauchements détectés (pour masquer d’autres messages si besoin) */
            hasOverlaps: overlaps.length > 0,
        };
    }, [scheduleItems, familyMembers]);
}

function formatTimeShort(d: Date) {
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatRangeShort(start: Date, end: Date) {
    return `${formatTimeShort(start)}–${formatTimeShort(end)}`;
}

function mapsHref(location: string | null | undefined): string {
    if (!location?.trim()) return '/club/planning';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.trim())}`;
}
