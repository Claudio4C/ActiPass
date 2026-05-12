import React, { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Baby, Calendar, MapPin, CheckCircle, ArrowLeft, AlertCircle, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { api } from '../../lib/api'

interface EventItem {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string | null;
  location: string | null;
  registration_required: boolean;
  capacity?: number | null;
  organisation: { id: string; name: string };
  is_registered: boolean;
  membership_id: string;
}

interface ChildSummary {
  id: string;
  firstname: string;
  lastname: string;
  birthdate: string | null;
  relationship: string;
  organisations: { id: string; name: string }[];
  events: EventItem[];
}

const AVATAR_COLORS = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const fmtDay = (date: Date) =>
  date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3)

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const fmtMonthYear = (date: Date) =>
  date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

function getWeekDays(refDate: Date): Date[] {
  const monday = new Date(refDate)
  monday.setDate(refDate.getDate() - ((refDate.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const FamilyDashboardPage: React.FC = () => {
  const [children, setChildren] = useState<ChildSummary[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null)

  const [weekRef, setWeekRef] = useState(new Date())
  const [activeDay, setActiveDay] = useState<Date>(new Date())

  const weekDays = getWeekDays(weekRef)

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }

  const load = useCallback(async () => {
    try {
      setError(null)
      api.clearCache('/family/dashboard')
      const data = await api.get<{ children: ChildSummary[] }>('/family/dashboard')
      setChildren(data.children)
      if (data.children.length > 0 && !selected) {
        setSelected(data.children[0].id)
      }
    } catch {
      setError('Impossible de charger le planning.')
    } finally {
      setLoading(false)
    }
  }, [selected])

  useEffect(() => { load() }, [])

  const handleRegister = async (child: ChildSummary, event: EventItem) => {
    setActionLoading(event.id)
    // Mise à jour optimiste
    setChildren((prev) =>
      prev.map((c) =>
        c.id !== child.id ? c : {
          ...c,
          events: c.events.map((e) =>
            e.id !== event.id ? e : { ...e, is_registered: !e.is_registered },
          ),
        },
      ),
    )
    try {
      if (event.is_registered) {
        await api.delete(`/family/children/${child.id}/events/${event.id}/register`)
        showToast(`Inscription de ${child.firstname} annulée.`, 'success')
      } else {
        await api.post(`/family/children/${child.id}/events/${event.id}/register`, {})
        showToast(`${child.firstname} est inscrit(e) à "${event.title}" !`, 'success')
      }
      // Sync silencieuse en arrière-plan
      api.clearCache('/family/dashboard')
      const data = await api.get<{ children: ChildSummary[] }>('/family/dashboard', undefined, { useCache: false })
      setChildren(data.children)
    } catch (e) {
      // Rollback optimiste
      setChildren((prev) =>
        prev.map((c) =>
          c.id !== child.id ? c : {
            ...c,
            events: c.events.map((ev) =>
              ev.id !== event.id ? ev : { ...ev, is_registered: event.is_registered },
            ),
          },
        ),
      )
      showToast(e instanceof Error ? e.message : 'Erreur lors de l\'inscription.', 'error')
    } finally {
      setActionLoading(null)
    }
  }

  const prevWeek = () => {
    const d = new Date(weekRef)
    d.setDate(d.getDate() - 7)
    setWeekRef(d)
  }
  const nextWeek = () => {
    const d = new Date(weekRef)
    d.setDate(d.getDate() + 7)
    setWeekRef(d)
  }

  const current = selected ? children.find((c) => c.id === selected) ?? null : null

  const allEvents: (EventItem & { childId: string; childName: string })[] = current
    ? current.events.map((e) => ({ ...e, childId: current.id, childName: current.firstname }))
    : children.flatMap((c) => c.events.map((e) => ({ ...e, childId: c.id, childName: c.firstname })))
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const dayEvents = allEvents.filter((e) => isSameDay(new Date(e.start_time), activeDay))

  const eventCountByDay = weekDays.map((day) => ({
    date: day,
    count: allEvents.filter((e) => isSameDay(new Date(e.start_time), day)).length,
  }))

  return (
    <div className="space-y-6">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 transition-all animate-in fade-in slide-in-from-bottom-2 ${
          toast.type === 'success'
            ? 'bg-[hsl(160,84%,39%)] text-white'
            : 'bg-destructive text-white'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/club/famille"
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Planning famille</h1>
          <p className="text-sm text-muted-foreground mt-1">Inscrivez vos enfants aux événements de leur club</p>
        </div>
      </div>

      {/* Erreur */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <AlertCircle className="w-4 h-4 shrink-0 text-destructive mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      ) : children.length === 0 ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <Baby className="w-7 h-7 text-primary" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">Aucun enfant enregistré</h2>
          <p className="text-sm text-muted-foreground">Créez les profils de vos enfants pour gérer leur planning.</p>
          <Link
            to="/club/famille"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
          >
            Gérer ma famille →
          </Link>
        </div>
      ) : children.every((c) => c.organisations.length === 0) ? (
        <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 flex items-center justify-center">
            <Building2 className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="font-display text-lg font-bold text-foreground">
            {children.length === 1 ? `${children[0].firstname} n'est inscrit dans aucun club` : 'Vos enfants ne sont inscrits dans aucun club'}
          </h2>
          <p className="text-sm text-muted-foreground">
            Inscrivez-les dans un club pour voir leurs événements et gérer leurs présences.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/clubs"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
            >
              <Building2 className="w-4 h-4 shrink-0" />
              Trouver un club
            </Link>
            <Link
              to="/club/famille"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all"
            >
              Gérer ma famille
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filtres enfants */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelected(null)}
              className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border transition-colors ${
                selected === null ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/40'
              }`}
            >
              Tous
            </button>
            {children.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-full text-xs font-semibold border transition-colors ${
                  selected === c.id ? 'border-transparent text-white' : 'bg-card text-foreground border-border hover:border-primary/40'
                }`}
                style={selected === c.id ? { backgroundColor: avatarColor(c.firstname), borderColor: avatarColor(c.firstname) } : {}}
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                  style={{ backgroundColor: selected === c.id ? 'rgba(255,255,255,0.3)' : avatarColor(c.firstname) }}
                >
                  {c.firstname.charAt(0)}
                </span>
                {c.firstname}
              </button>
            ))}
          </div>

          {/* Navigateur de semaine */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <button onClick={prevWeek} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95">
                <ChevronLeft className="w-4 h-4 shrink-0" />
              </button>
              <span className="text-sm font-semibold text-foreground capitalize">{fmtMonthYear(weekRef)}</span>
              <button onClick={nextWeek} className="w-8 h-8 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95">
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Day picker */}
            <div className="grid grid-cols-7 gap-1">
              {eventCountByDay.map(({ date, count }) => {
                const isToday = isSameDay(date, new Date())
                const isActive = isSameDay(date, activeDay)
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => setActiveDay(date)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl transition-all active:scale-95 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                        : isToday
                        ? 'bg-primary/10 text-primary border border-primary/30'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className={`text-[10px] font-bold uppercase ${isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {fmtDay(date)}
                    </span>
                    <span className="font-display text-base font-bold">{date.getDate()}</span>
                    {count > 0 && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary-foreground' : 'bg-primary'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Événements du jour */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
              {activeDay.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>

            {dayEvents.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Aucun événement ce jour</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dayEvents.map((event) => {
                  const child = children.find((c) => c.id === event.childId)!
                  const isLoading = actionLoading === event.id

                  return (
                    <div
                      key={`${event.id}-${event.childId}`}
                      className={`bg-card border rounded-2xl p-4 transition-colors ${
                        event.is_registered ? 'border-[hsl(160,84%,39%)]/40' : 'border-border'
                      }`}
                    >
                      <div className="flex gap-4">
                        {/* Date */}
                        <div className="shrink-0 text-center w-10">
                          <p className="text-[10px] text-muted-foreground uppercase font-bold">
                            {new Date(event.start_time).toLocaleDateString('fr-FR', { month: 'short' })}
                          </p>
                          <p className="font-display text-2xl font-bold text-primary leading-tight">
                            {new Date(event.start_time).getDate()}
                          </p>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-display font-bold text-foreground leading-tight">{event.title}</p>
                                {!event.registration_required && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                                    Libre
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {fmtTime(event.start_time)}
                                {event.end_time ? ` – ${fmtTime(event.end_time)}` : ''}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1.5">
                                {event.location && (
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <MapPin className="w-3 h-3 shrink-0" />{event.location}
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">{event.organisation.name}</span>
                                {selected === null && (
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: avatarColor(event.childName) }}
                                  >
                                    {event.childName}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Bouton inscription — seulement si required */}
                            {event.registration_required ? (
                              <button
                                onClick={() => handleRegister(child, event)}
                                disabled={isLoading}
                                className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                                  event.is_registered
                                    ? 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,39%)] border border-[hsl(160,84%,39%)]/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30'
                                    : 'bg-primary text-primary-foreground hover:opacity-90 shadow-md shadow-primary/20'
                                }`}
                              >
                                {isLoading ? (
                                  <span className="w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0" />
                                ) : event.is_registered ? (
                                  <><CheckCircle className="w-3.5 h-3.5 shrink-0" /><span>Inscrit ✓</span></>
                                ) : (
                                  <><Calendar className="w-3.5 h-3.5 shrink-0" /><span>S'inscrire</span></>
                                )}
                              </button>
                            ) : (
                              <span className="shrink-0 text-[10px] font-bold text-muted-foreground px-2.5 py-1 rounded-full border border-border">
                                Accès libre
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default FamilyDashboardPage
