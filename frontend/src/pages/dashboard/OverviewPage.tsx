import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  CalendarDays,
  Zap,
  MapPin,
  Clock,
  TrendingUp,
} from 'lucide-react';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Event, EventType } from '../../types';

// ─── helpers ────────────────────────────────────────────────────────────────

const EVENT_TYPE_META: Record<EventType, { label: string; color: string }> = {
  training: { label: 'Entraînement', color: 'text-primary bg-primary/10' },
  match:    { label: 'Match',        color: 'text-destructive bg-destructive/10' },
  meeting:  { label: 'Réunion',      color: 'text-cat-music bg-cat-music/10' },
  workshop: { label: 'Atelier',      color: 'text-accent bg-accent/10' },
  other:    { label: 'Autre',        color: 'text-muted-foreground bg-muted' },
};

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

// ─── sub-components ─────────────────────────────────────────────────────────

const StatChip: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  value: number | string;
  label: string;
  href?: string;
}> = ({ icon: Icon, value, label }) => (
  <div className="bg-card border border-border rounded-2xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary shrink-0" />
      </div>
    </div>
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const TodayEventCard: React.FC<{ event: Event }> = ({ event }) => {
  const meta = EVENT_TYPE_META[event.event_type];
  return (
    <div className="flex items-start gap-4 bg-card border border-primary/20 bg-primary/5 rounded-2xl p-4">
      <div className="shrink-0 w-12 h-12 rounded-xl bg-primary flex flex-col items-center justify-center font-display font-bold text-primary-foreground">
        <span className="text-xs leading-none">{fmtTime(event.start_time)}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 mb-1">
          <h4 className="font-display font-bold text-foreground text-sm truncate flex-1">
            {event.title}
          </h4>
          <span className={cn('shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full', meta.color)}>
            {meta.label}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {event.location && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" /> {event.location}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3 h-3 shrink-0" />
            {fmtTime(event.start_time)} – {fmtTime(event.end_time)}
          </span>
          {event.capacity && (
            <span className="inline-flex items-center gap-1">
              <Zap className="w-3 h-3 shrink-0" />
              {event.current_registrations ?? 0}/{event.capacity} inscrits
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

const OverviewPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>();

  const [memberCount,  setMemberCount]  = useState<number | null>(null);
  const [events,       setEvents]       = useState<Event[]>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    if (!organisationId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [membersData, eventsData] = await Promise.all([
          api.get<{ id: string }[]>(
            `/organisations/${organisationId}/members`,
            undefined,
            { useCache: true, cacheTTL: 60000 },
          ),
          api.get<Event[]>(
            `/organisations/${organisationId}/events`,
            { status: 'published' },
            { useCache: true, cacheTTL: 60000 },
          ),
        ]);
        setMemberCount(Array.isArray(membersData) ? membersData.length : 0);
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } catch {
        setMemberCount(0);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [organisationId]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const weekEnd = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 7);
    return d;
  }, [today]);

  const todayEvents = useMemo(() =>
    events
      .filter(e => isSameDay(new Date(e.start_time), today))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [events, today]);

  const weekEvents = useMemo(() =>
    events.filter(e => {
      const d = new Date(e.start_time);
      return d >= today && d < weekEnd;
    }),
    [events, today, weekEnd]);

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <div>
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
          {todayLabel}
        </p>
        <h1 className="font-display text-2xl font-bold text-foreground mt-0.5">Vue d'ensemble</h1>
        <p className="text-sm text-muted-foreground mt-1">Tableau de bord de votre organisation.</p>
      </div>

      {/* ── Stats cards ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatChip
          icon={Users}
          value={memberCount ?? 0}
          label="Membres"
        />
        <StatChip
          icon={CalendarDays}
          value={todayEvents.length}
          label="Cours du jour"
        />
        <StatChip
          icon={TrendingUp}
          value={weekEvents.length}
          label="Cette semaine"
        />
      </div>

      {/* ── Cours du jour ───────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            Cours du jour
          </p>
          {todayEvents.length > 0 && (
            <span className="text-[11px] font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10">
              {todayEvents.length}
            </span>
          )}
        </div>

        {todayEvents.length > 0 ? (
          <div className="space-y-3">
            {todayEvents.map(event => (
              <TodayEventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 text-center">
            <div className="w-10 h-10 mx-auto rounded-xl bg-muted flex items-center justify-center mb-3">
              <CalendarDays className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
            <p className="text-sm text-muted-foreground">Pas d'événements aujourd'hui.</p>
          </div>
        )}
      </section>

      {/* ── À venir cette semaine ───────────────────────────────────────────── */}
      {weekEvents.filter(e => !isSameDay(new Date(e.start_time), today)).length > 0 && (
        <section>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
            À venir cette semaine
          </p>
          <div className="space-y-2">
            {weekEvents
              .filter(e => !isSameDay(new Date(e.start_time), today))
              .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
              .slice(0, 4)
              .map(event => {
                const meta = EVENT_TYPE_META[event.event_type];
                const d = new Date(event.start_time);
                return (
                  <div
                    key={event.id}
                    className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-3"
                  >
                    <span className={cn('text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0', meta.color)}>
                      {meta.label}
                    </span>
                    <p className="font-semibold text-sm text-foreground flex-1 truncate">{event.title}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })} · {fmtTime(event.start_time)}
                    </span>
                  </div>
                );
              })}
          </div>
        </section>
      )}

    </div>
  );
};

const ProtectedOverviewPage: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager', 'treasurer']}>
    <OverviewPage />
  </RoleBasedRoute>
);

export default ProtectedOverviewPage;
