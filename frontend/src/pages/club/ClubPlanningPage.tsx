import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, MapPin, User, Dumbbell, Music, Trophy, Users, Bookmark, Download } from 'lucide-react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Event, EventType } from '../../types';

// ─── meta ────────────────────────────────────────────────────────────────────

const EVENT_META: Record<EventType, {
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
}> = {
  training: { label: 'Entraînement', Icon: Dumbbell, bg: 'bg-accent/15',     text: 'text-accent' },
  match:    { label: 'Match',        Icon: Trophy,   bg: 'bg-destructive/10', text: 'text-destructive' },
  meeting:  { label: 'Réunion',      Icon: Users,    bg: 'bg-primary/10',     text: 'text-primary' },
  workshop: { label: 'Atelier',      Icon: Music,    bg: 'bg-cat-music/10',   text: 'text-cat-music' },
  other:    { label: 'Autre',        Icon: Bookmark, bg: 'bg-muted',          text: 'text-muted-foreground' },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const fmtDayShort = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase().replace('.', '');

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const getWeekBounds = () => {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);
  return { monday, sunday };
};

// ─── event row ───────────────────────────────────────────────────────────────

const EventRow: React.FC<{ event: Event; isToday: boolean; isLast: boolean }> = ({ event, isToday, isLast }) => {
  const meta = EVENT_META[event.event_type];
  const Icon = meta.Icon;
  const coachInitials = event.created_by
    ? `${event.created_by.firstname[0]}${event.created_by.lastname[0]}`.toUpperCase()
    : null;

  return (
    <div className={cn(
      'flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors cursor-pointer',
      !isLast && 'border-b border-border',
    )}>
      {/* Day + time */}
      <div className="w-14 shrink-0 text-right">
        <p className={cn('text-[10px] font-bold uppercase tracking-wide', isToday ? 'text-primary' : 'text-muted-foreground')}>
          {fmtDayShort(event.start_time)}
        </p>
        <p className={cn('font-display text-xl font-bold leading-none mt-0.5 tabular-nums', isToday ? 'text-primary' : 'text-foreground')}>
          {fmtTime(event.start_time)}
        </p>
      </div>

      {/* Category icon */}
      <div className={cn('w-9 h-9 rounded-full flex items-center justify-center shrink-0', meta.bg, meta.text)}>
        <Icon className="w-4 h-4 shrink-0" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-foreground leading-snug">{event.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <Clock className="w-3 h-3 shrink-0" />{fmtTime(event.start_time)}–{fmtTime(event.end_time)}
          </span>
          {event.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3 shrink-0" />{event.location}
            </span>
          )}
          {event.created_by && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <User className="w-3 h-3 shrink-0" />{event.created_by.firstname} {event.created_by.lastname}
            </span>
          )}
        </div>
      </div>

      {/* Coach avatar */}
      {coachInitials ? (
        <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
          {coachInitials}
        </div>
      ) : (
        <div className="w-9 h-9 shrink-0" />
      )}
    </div>
  );
};

// ─── main ────────────────────────────────────────────────────────────────────

const ClubPlanningPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>();
  const [events,  setEvents]  = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) { setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.get<Event[]>(
          `/organisations/${orgId}/events`,
          { status: 'published' },
          { useCache: true, cacheTTL: 60000 },
        );
        setEvents(Array.isArray(data) ? data : []);
      } catch {
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [orgId]);

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const { monday, sunday } = useMemo(() => getWeekBounds(), []);

  const weekEvents = useMemo(() =>
    events
      .filter(e => { const d = new Date(e.start_time); return d >= monday && d <= sunday; })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [events, monday, sunday],
  );

  const laterEvents = useMemo(() =>
    events
      .filter(e => new Date(e.start_time) > sunday)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 8),
    [events, sunday],
  );

  const weekLabel = `${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} – ${sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-foreground">Planning du club</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? 'Chargement…'
              : weekEvents.length === 0
              ? `Aucun créneau · ${weekLabel}`
              : `${weekEvents.length} créneau${weekEvents.length > 1 ? 'x' : ''} cette semaine · ${weekLabel}`}
          </p>
        </div>
        <button className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-muted-foreground border border-border rounded-xl px-3 py-2 hover:bg-muted transition-colors active:scale-95">
          <Download className="w-3.5 h-3.5 shrink-0" /> .ics
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {weekEvents.length > 0 ? (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              {weekEvents.map((ev, i) => (
                <EventRow
                  key={ev.id}
                  event={ev}
                  isToday={isSameDay(new Date(ev.start_time), today)}
                  isLast={i === weekEvents.length - 1}
                />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center">
              <div className="w-12 h-12 mx-auto rounded-xl bg-muted flex items-center justify-center mb-3">
                <Clock className="w-6 h-6 text-muted-foreground shrink-0" />
              </div>
              <p className="font-display font-bold text-foreground mb-1">Aucun cours cette semaine</p>
              <p className="text-sm text-muted-foreground">Les prochains créneaux apparaîtront ici dès leur publication.</p>
            </div>
          )}

          {laterEvents.length > 0 && (
            <section>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">À venir</p>
              <div className="bg-card border border-border rounded-2xl overflow-hidden">
                {laterEvents.map((ev, i) => (
                  <EventRow key={ev.id} event={ev} isToday={false} isLast={i === laterEvents.length - 1} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default ClubPlanningPage;
