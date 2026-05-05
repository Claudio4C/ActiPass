import React, { useState, useEffect, useMemo } from 'react';
import { Clock, MapPin, User, Dumbbell, Music, Trophy, Users, Bookmark } from 'lucide-react';
import { useCurrentOrganisation } from '../../hooks/useCurrentOrganisation';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Event, EventType } from '../../types';

// ─── meta ────────────────────────────────────────────────────────────────────

const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

const EVENT_META: Record<EventType, {
  Icon: React.ComponentType<{ className?: string }>;
  bg: string;
  text: string;
}> = {
  training: { Icon: Dumbbell, bg: 'bg-accent/15',     text: 'text-accent' },
  match:    { Icon: Trophy,   bg: 'bg-destructive/10', text: 'text-destructive' },
  meeting:  { Icon: Users,    bg: 'bg-primary/10',     text: 'text-primary' },
  workshop: { Icon: Music,    bg: 'bg-cat-music/10',   text: 'text-cat-music' },
  other:    { Icon: Bookmark, bg: 'bg-muted',          text: 'text-muted-foreground' },
};

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth()    === b.getMonth()    &&
  a.getDate()     === b.getDate();

const getWeekDays = (): Date[] => {
  const now = new Date();
  const dow = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

// ─── event card (weekly column cell) ─────────────────────────────────────────

const WeekCard: React.FC<{ event: Event; isToday: boolean }> = ({ event, isToday }) => {
  const meta = EVENT_META[event.event_type];
  const Icon = meta.Icon;
  const coachInitials = event.created_by
    ? `${event.created_by.firstname[0]}${event.created_by.lastname[0]}`.toUpperCase()
    : null;

  return (
    <div className={cn(
      'bg-card border rounded-2xl p-3 space-y-2.5 cursor-pointer active:scale-[0.99] transition-all hover:shadow-sm',
      isToday ? 'border-primary/25' : 'border-border',
    )}>
      {/* Icon + time */}
      <div className="flex items-center justify-between">
        <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0', meta.bg, meta.text)}>
          <Icon className="w-4 h-4 shrink-0" />
        </div>
        <span className="text-xs font-bold text-foreground tabular-nums">{fmtTime(event.start_time)}</span>
      </div>

      {/* Title */}
      <p className="font-display font-bold text-sm text-foreground leading-snug">{event.title}</p>

      {/* Details */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3 shrink-0" />
          <span className="tabular-nums">{fmtTime(event.start_time)} – {fmtTime(event.end_time)}</span>
        </div>
        {event.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.location}</span>
          </div>
        )}
        {event.created_by && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <User className="w-3 h-3 shrink-0" />
            <span className="truncate">{event.created_by.firstname} {event.created_by.lastname}</span>
          </div>
        )}
      </div>

      {/* Coach avatar */}
      {coachInitials && (
        <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">
          {coachInitials}
        </div>
      )}
    </div>
  );
};

// ─── main ────────────────────────────────────────────────────────────────────

const PlanningPage: React.FC = () => {
  const { organisation } = useCurrentOrganisation();
  const orgId = organisation?.id;

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

  const weekDays = useMemo(() => getWeekDays(), []);
  const today    = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);
  const todayIdx = weekDays.findIndex(d => isSameDay(d, today));

  const eventsByDay = useMemo(() =>
    weekDays.map(day =>
      events
        .filter(e => isSameDay(new Date(e.start_time), day))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    ),
    [events, weekDays],
  );

  const weekCount = eventsByDay.reduce((acc, evts) => acc + evts.length, 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">Mon planning</h1>
        <p className="text-muted-foreground mt-1">
          {weekCount > 0
            ? `${weekCount} activité${weekCount > 1 ? 's' : ''} cette semaine.`
            : 'Toutes vos activités de la semaine.'}
        </p>
      </div>

      {/* Weekly grid */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="grid grid-cols-7 gap-3 min-w-[700px]">
            {weekDays.map((day, i) => {
              const dayEvts = eventsByDay[i];
              const isToday = i === todayIdx;
              return (
                <div key={i}>
                  {/* Column header — même hauteur pour tous les jours */}
                  <div className="text-center mb-3">
                    <p className={cn('text-[11px] font-bold uppercase tracking-wider', isToday ? 'text-primary' : 'text-muted-foreground')}>
                      {DAYS_SHORT[i]}
                    </p>
                  </div>

                  {dayEvts.length === 0 ? (
                    <p className="text-center text-xl text-muted-foreground/40 font-light select-none pt-1">—</p>
                  ) : (
                    <div className="space-y-3">
                      {dayEvts.map(ev => (
                        <WeekCard key={ev.id} event={ev} isToday={isToday} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Global empty state */}
      {!loading && events.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-muted flex items-center justify-center mb-3">
            <Clock className="w-6 h-6 text-muted-foreground shrink-0" />
          </div>
          <p className="font-display font-bold text-foreground mb-1">Aucun cours cette semaine</p>
          <p className="text-sm text-muted-foreground">
            {orgId
              ? "Les prochains créneaux apparaîtront ici dès leur publication."
              : "Sélectionnez une organisation depuis l'accueil."}
          </p>
        </div>
      )}

    </div>
  );
};

export default PlanningPage;
