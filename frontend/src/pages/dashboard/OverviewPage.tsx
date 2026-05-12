import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, CalendarDays, Zap, MapPin, Clock, TrendingUp,
  CheckCircle, Circle, ChevronRight, Building2,
} from 'lucide-react';
import RoleBasedRoute from '../../components/shared/RoleBasedRoute';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import type { Event, EventType } from '../../types';

// ─── Confetti (CDN) ──────────────────────────────────────────────────────────

type ConfettiFn = (opts?: Record<string, unknown>) => void
const loadConfetti = (): Promise<ConfettiFn> =>
  new Promise((resolve) => {
    if ((window as unknown as { confetti?: ConfettiFn }).confetti) {
      resolve((window as unknown as { confetti: ConfettiFn }).confetti); return
    }
    const s = document.createElement('script')
    s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.2/dist/confetti.browser.min.js'
    s.onload = () => resolve((window as unknown as { confetti: ConfettiFn }).confetti)
    document.head.appendChild(s)
  })

// ─── ManagerGettingStartedCard ────────────────────────────────────────────────

interface OrgResponse {
  organisation: OrgFull;
  myRole: { name: string; type: string };
}

interface OrgFull {
  id: string; name: string; description: string | null;
  city: string | null; status: string; logo_url: string | null;
}

const ManagerGettingStartedCard: React.FC<{
  organisationId: string;
  hasEvents: boolean;
}> = ({ organisationId, hasEvents }) => {
  const [org, setOrg] = useState<OrgFull | null>(null)
  const [hidden, setHidden] = useState(() =>
    localStorage.getItem('ikivio_welcome_seen') === 'done',
  )
  const celebrationFired = useRef(false)

  const fetchOrg = useCallback(async () => {
    try {
      const data = await api.get<OrgResponse>(
        `/organisations/${organisationId}`, undefined, { useCache: false },
      )
      setOrg(data.organisation)
    } catch {}
  }, [organisationId])

  // Chargement initial + polling 60s + refresh au focus
  useEffect(() => { fetchOrg() }, [fetchOrg])
  useEffect(() => {
    const id = setInterval(fetchOrg, 60000)
    window.addEventListener('focus', fetchOrg)
    return () => { clearInterval(id); window.removeEventListener('focus', fetchOrg) }
  }, [fetchOrg])

  // Confetti quand le statut passe à 'active' — une seule fois (persisté en localStorage)
  useEffect(() => {
    if (!org || celebrationFired.current || org.status !== 'active') { return }
    if (localStorage.getItem('ikivio_welcome_seen') === 'done') { return }
    celebrationFired.current = true
    loadConfetti().then((confetti) => {
      const fire = (opts: Record<string, unknown>) =>
        confetti({ colors: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'], ...opts })
      fire({ particleCount: 60, spread: 60, origin: { y: 0.65 } })
      setTimeout(() => fire({ particleCount: 40, spread: 90, origin: { y: 0.4 } }), 350)
      setTimeout(() => {
        localStorage.setItem('ikivio_welcome_seen', 'done')
        localStorage.removeItem('ikivio_onboarding_type')
        setHidden(true)
      }, 2500)
    })
  }, [org])

  if (hidden) { return null }

  const isApproved = org?.status === 'active'

  const steps = [
    { id: 'account',     label: 'Créer votre compte',       done: true,              cta: '',           href: '' },
    { id: 'club',        label: 'Créer votre club',         done: true,              cta: '',           href: '' },
    { id: 'description', label: 'Compléter la description', done: !!org?.description, cta: 'Compléter →', href: `/dashboard/${organisationId}/settings` },
    { id: 'logo',        label: 'Uploader un logo',         done: !!org?.logo_url,   cta: 'Ajouter →',  href: `/dashboard/${organisationId}/settings` },
    { id: 'events',      label: 'Ajouter vos créneaux',     done: hasEvents,         cta: 'Créer →',    href: `/dashboard/${organisationId}/events/create` },
    { id: 'validation',  label: 'Validation Ikivio',        done: !!isApproved,      cta: '',           href: '' },
  ]

  const completedCount = steps.filter((s) => s.done).length
  const totalCount = steps.length
  const pct = Math.round((completedCount / totalCount) * 100)
  // L'étape "validation" ne devient jamais l'étape "active" affichée avec ChevronRight
  const activeIndex = steps.findIndex((s) => !s.done && s.id !== 'validation')

  return (
    <div className={`bg-card border border-border rounded-2xl overflow-hidden transition-all ${isApproved ? 'border-[hsl(160,84%,39%)]/40' : ''}`}>

      {/* Header */}
      <div className="px-5 pt-5 pb-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-primary shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-0.5">
              Guide de démarrage
            </p>
            <h2 className="font-display text-base font-bold text-foreground">
              Finalisez votre club · {completedCount}/{totalCount}
            </h2>
          </div>
        </div>
        <div className="w-full bg-border rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${isApproved ? 'bg-[hsl(160,84%,39%)]' : 'bg-primary'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="divide-y divide-border">
        {steps.map((step, index) => {
          const isActive = index === activeIndex

          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 px-5 py-3.5 transition-colors ${isActive ? 'bg-primary/5' : ''}`}
            >
              {/* Icône ou pill "En attente" */}
              <div className="shrink-0">
                {step.id === 'validation' && !step.done ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 animate-pulse whitespace-nowrap">
                    En attente · 24-48h
                  </span>
                ) : step.done ? (
                  <CheckCircle className="w-5 h-5 text-[hsl(160,84%,39%)] shrink-0" />
                ) : isActive ? (
                  <ChevronRight className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-border shrink-0" />
                )}
              </div>

              {/* Label */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold leading-tight ${
                  step.done
                    ? 'line-through text-muted-foreground'
                    : isActive
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>

              {/* CTA pill */}
              {isActive && step.cta && step.href && (
                <Link
                  to={step.href}
                  className="shrink-0 inline-flex items-center px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-full hover:opacity-90 active:scale-95 transition-all shadow-sm shadow-primary/20 whitespace-nowrap"
                >
                  {step.cta}
                </Link>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-border">
        {org && !isApproved ? (
          <p className="text-[11px] text-muted-foreground text-center">
            Notre équipe vérifie votre dossier. Vous recevrez un email de confirmation.
          </p>
        ) : (
          <button
            onClick={() => {
              localStorage.setItem('ikivio_welcome_seen', 'done')
              setHidden(true)
            }}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Masquer pour l'instant
          </button>
        )}
      </div>
    </div>
  )
}

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

      {/* ── Checklist de démarrage gérant ────────────────────────────────────── */}
      {organisationId && (
        <ManagerGettingStartedCard
          organisationId={organisationId}
          hasEvents={events.length > 0}
        />
      )}

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
