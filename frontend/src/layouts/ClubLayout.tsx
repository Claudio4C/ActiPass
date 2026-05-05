import React, { useState, useEffect } from 'react'
import { Link, Outlet, useLocation, useParams } from 'react-router-dom'
import {
  LayoutDashboard, CalendarDays, Zap, Baby, Users2, Car,
  Bell, CreditCard, Sparkles, FileText, UserPlus,
  ArrowLeft, Dumbbell, User, Music,
  Moon, Sun, LogOut, MapPin, Phone, Mail, Globe,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { cn } from '../lib/utils'
import type { RoleType } from '../types'

// ─── types ───────────────────────────────────────────────────────────────────

interface OrgDetails {
  id: string
  name: string
  type?: 'club' | 'association' | 'independant'
  description?: string
  city?: string
  address?: string
  phone?: string
  email?: string
  website?: string
  myRole?: { name: string; type: RoleType }
}

// ─── org type meta ───────────────────────────────────────────────────────────

const ORG_META = {
  club: { label: 'Sport · Club', Icon: Dumbbell, bg: 'bg-accent/15', text: 'text-accent' },
  association: { label: 'Musique · Association', Icon: Music, bg: 'bg-cat-music/15', text: 'text-cat-music' },
  independant: { label: 'Coach indépendant', Icon: User, bg: 'bg-primary/15', text: 'text-primary' },
} as const

// ─── sidebar nav ─────────────────────────────────────────────────────────────

const makeNav = (orgId: string) => [
  { path: `/club/${orgId}`,               icon: LayoutDashboard, label: 'Espace membre',          end: true },
  { path: `/club/${orgId}/planning`,      icon: CalendarDays,    label: 'Planning' },
  { path: `/club/${orgId}/events`,        icon: Zap,             label: 'Événements' },
  { path: `/club/${orgId}/famille`,       icon: Baby,            label: 'Ma famille' },
  { path: `/club/${orgId}/coaches`,       icon: Users2,          label: 'Coachs' },
  { path: `/club/${orgId}/deplacements`,  icon: Car,             label: 'Déplacements' },
  { path: `/club/${orgId}/notifications`, icon: Bell,            label: 'Notifications', badge: 0 },
  { path: `/club/${orgId}/abonnements`,   icon: CreditCard,      label: 'Abonnements & paiements' },
  { path: `/club/${orgId}/fidelite`,      icon: Sparkles,        label: 'Fidélité' },
  { path: `/club/${orgId}/documents`,     icon: FileText,        label: 'Documents' },
  { path: `/club/${orgId}/inviter`,       icon: UserPlus,        label: 'Inviter' },
]

// ─── layout ─────────────────────────────────────────────────────────────────

const ClubLayout: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const location = useLocation()
  const { user, logout } = useAuth()

  const [org,       setOrg]       = useState<OrgDetails | null>(null)
  const [weekCount, setWeekCount] = useState(0)
  const [isDark,    setIsDark]    = useState(() =>
    typeof window !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const root = document.documentElement
    isDark ? root.classList.add('dark') : root.classList.remove('dark')
    localStorage.setItem('theme', isDark ? 'dark' : 'light')
  }, [isDark])

  useEffect(() => {
    if (!orgId) { return }
    const load = async () => {
      try {
        const [orgResp, eventsData] = await Promise.all([
          api.get<{ organisation: OrgDetails; myRole: { name: string; type: RoleType } }>(
            `/organisations/${orgId}`, undefined, { useCache: true, cacheTTL: 300000 },
          ),
          api.get<{ start_time: string }[]>(
            `/organisations/${orgId}/events`,
            { status: 'published' },
            { useCache: true, cacheTTL: 60000 },
          ),
        ])
        setOrg({ ...orgResp.organisation, myRole: orgResp.myRole })

        const now = new Date()
        const dow = now.getDay()
        const mon = new Date(now)
        mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1))
        mon.setHours(0, 0, 0, 0)
        const sun = new Date(mon)
        sun.setDate(mon.getDate() + 6)
        sun.setHours(23, 59, 59, 999)
        setWeekCount(
          Array.isArray(eventsData)
            ? eventsData.filter(e => { const d = new Date(e.start_time); return d >= mon && d <= sun }).length
            : 0,
        )
      } catch { /* silently fail */ }
    }
    load()
  }, [orgId])

  const isActive = (path: string, end?: boolean) =>
    end ? location.pathname === path : location.pathname.startsWith(path)

  const meta =
    (org?.type && org.type in ORG_META
      ? ORG_META[org.type as keyof typeof ORG_META]
      : null) ?? ORG_META.club
  const OrgIcon = meta.Icon
  const nav = makeNav(orgId ?? '')

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const SidebarContent = () => (
    <nav className="p-2 space-y-0.5">
      {nav.map(({ path, icon: Icon, label, badge, end }) => {
        const active = isActive(path, end)
        return (
          <Link
            key={path}
            to={path}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span className="flex-1">{label}</span>
            {badge !== undefined && badge > 0 && (
              <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center shrink-0">
                {badge}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Hero card — contenu, pas full-width ───────────────────────── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/70 rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/30">
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-primary-foreground/10 rounded-full blur-3xl" />
          <div className="relative">

            {/* Back link */}
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-foreground/80 hover:text-primary-foreground transition-opacity mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" /> Retour au tableau de bord
            </Link>

            {/* Org identity */}
            <div className="flex items-start gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center shrink-0', meta.bg)}>
                <OrgIcon className={cn('w-6 h-6 shrink-0', meta.text)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary-foreground/80">
                  {meta.label}
                </p>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground mt-1 truncate">
                  {org?.name ?? '…'}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-primary-foreground/90 mt-2">
                  {org?.city && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0" />{org.city}</span>}
                  {org?.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 shrink-0" />{org.phone}</span>}
                  {org?.email && <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 shrink-0" />{org.email}</span>}
                  {org?.website && <span className="inline-flex items-center gap-1.5"><Globe className="w-3.5 h-3.5 shrink-0" />{org.website}</span>}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-primary-foreground/20">
              <div>
                <p className="text-xs text-primary-foreground/80">Membres famille</p>
                <p className="font-display text-2xl font-bold text-primary-foreground">1</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/80">Cours / sem</p>
                <p className="font-display text-2xl font-bold text-primary-foreground">{weekCount}</p>
              </div>
              <div>
                <p className="text-xs text-primary-foreground/80">Statut</p>
                <p className="font-display text-base font-bold text-primary-foreground mt-1">✓ À jour</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Sidebar + content ─────────────────────────────────────────── */}
        <div className="flex gap-6 items-start">

          {/* Sidebar desktop */}
          <aside className="w-56 shrink-0 hidden md:block">
            <div className="bg-card border border-border rounded-2xl overflow-hidden sticky top-6">
              {/* User mini-header + actions */}
              <div className="px-3 py-3 border-b border-border flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{org?.myRole?.name ?? 'Membre'}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => setIsDark(d => !d)}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    aria-label="Toggle theme"
                  >
                    {isDark ? <Sun className="w-3 h-3 shrink-0" /> : <Moon className="w-3 h-3 shrink-0" />}
                  </button>
                  <button
                    onClick={() => logout()}
                    className="w-6 h-6 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    aria-label="Déconnexion"
                  >
                    <LogOut className="w-3 h-3 shrink-0" />
                  </button>
                </div>
              </div>
              <SidebarContent />
            </div>
          </aside>

          {/* Page content */}
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  )
}

export default ClubLayout
