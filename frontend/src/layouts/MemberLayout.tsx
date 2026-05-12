import React, { useState, useEffect, useCallback } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'
import {
  CalendarDays, LayoutDashboard, Users2, User, Bell,
  Moon, Sun, LogOut, Menu, Home, Baby, Building2, Plus,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useCurrentOrganisation } from '../hooks/useCurrentOrganisation'
import { cn } from '../lib/utils'

// ─── top tabs ────────────────────────────────────────────────────────────────

const TABS = [
  { path: '/club/members',    icon: LayoutDashboard, label: 'Mon activité'  },
  { path: '/club/planning',   icon: CalendarDays,    label: 'Planning' },
  { path: '/club/professeurs', icon: Users2,          label: 'Coachs'   },
  { path: '/account/profile', icon: User,            label: 'Profil'   },
] as const

// ─── layout ─────────────────────────────────────────────────────────────────

const MemberLayout: React.FC = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const { organisation } = useCurrentOrganisation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {return false}
    const stored = window.localStorage.getItem('theme')
    if (stored) {return stored === 'dark'}
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    isDarkMode ? root.classList.add('dark') : root.classList.remove('dark')
    window.localStorage.setItem('theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  // close on click outside
  useEffect(() => {
    if (!isMenuOpen) {return}
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('#member-user-menu')) {closeMenu()}
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isMenuOpen, closeMenu])

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : 'U'

  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem('user_avatar_url'),
  )
  useEffect(() => {
    const handler = () => setAvatarUrl(localStorage.getItem('user_avatar_url'))
    window.addEventListener('avatar:updated', handler)
    return () => window.removeEventListener('avatar:updated', handler)
  }, [])

  return (
    <div className="min-h-screen bg-background transition-colors">

      {/* ── Top nav header ─────────────────────────────────────────────────── */}
      <header className="border-b border-border bg-background sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">

          {/* Left: logo + org name */}
          <Link to="/club/members" className="flex items-center gap-2.5 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
              <CalendarDays className="w-4 h-4 text-primary-foreground shrink-0" />
            </div>
            <span className="font-display font-bold text-foreground hidden sm:block truncate max-w-[180px]">
              {organisation?.name || 'Mon Club Sport'}
            </span>
          </Link>

          {/* Center: tabs */}
          <nav className="flex items-center gap-1">
            {TABS.map(({ path, icon: Icon, label }) => {
              const active = isActive(path)
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Right: theme + notifications + user */}
          <div className="flex items-center gap-1.5">
            {/* Dark mode */}
            <button
              onClick={() => setIsDarkMode(d => !d)}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {isDarkMode
                ? <Sun className="w-4 h-4 shrink-0" />
                : <Moon className="w-4 h-4 shrink-0" />}
            </button>

            {/* Notifications */}
            <Link
              to="/club/notifications"
              className="relative w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
            >
              <Bell className="w-4 h-4 shrink-0" />
            </Link>

            {/* User avatar menu */}
            <div id="member-user-menu" className="relative">
              <button
                onClick={() => setIsMenuOpen(p => !p)}
                className="flex items-center gap-1.5 rounded-full border border-border bg-card pl-1 pr-2 py-1 hover:border-primary/30 transition active:scale-95"
              >
                <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
                  {avatarUrl
                    ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold">{initials}</div>
                  }
                </div>
                <Menu className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-50">
                  {user && (
                    <div className="px-4 py-3 border-b border-border bg-muted/40 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
                        {avatarUrl
                          ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                          : <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{initials}</div>
                        }
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                    </div>
                  )}
                  <nav className="py-1 text-sm">
                    <Link
                      to="/home"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                    >
                      <Home className="w-4 h-4 text-primary shrink-0" /> Accueil
                    </Link>
                    <Link
                      to="/club/members"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary shrink-0" /> Mon activité
                    </Link>
                    <Link
                      to="/club/famille"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                    >
                      <Baby className="w-4 h-4 text-primary shrink-0" /> Ma famille
                    </Link>
                    <Link
                      to="/clubs"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                    >
                      <Building2 className="w-4 h-4 text-primary shrink-0" /> Découvrir des clubs
                    </Link>
                    <div className="border-t border-border my-1" />
                    <Link
                      to="/account/profile"
                      onClick={closeMenu}
                      className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="w-4 h-4 text-muted-foreground shrink-0" /> Mon profil
                    </Link>
                    <button
                      onClick={async () => { closeMenu(); await logout() }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/5 transition-colors"
                    >
                      <LogOut className="w-4 h-4 shrink-0" /> Déconnexion
                    </button>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

export default MemberLayout
