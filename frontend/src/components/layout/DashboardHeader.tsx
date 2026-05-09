import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, LogOut, User, Moon, Sun, Menu, ChevronRight, Settings } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import type { Organisation } from '../../types'

interface DashboardHeaderProps {
  organisationId: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ organisationId }) => {
  const { user, logout, isLoading } = useAuth()
  const [organisation, setOrganisation] = useState<(Organisation & { logo_url?: string | null }) | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem('user_avatar_url'),
  )
  useEffect(() => {
    const handler = () => setAvatarUrl(localStorage.getItem('user_avatar_url'))
    window.addEventListener('avatar:updated', handler)
    return () => window.removeEventListener('avatar:updated', handler)
  }, [])
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {return false}
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<{ organisation: Organisation & { logo_url?: string | null } }>(
          `/organisations/${organisationId}`,
          undefined,
          { useCache: true, cacheTTL: 300000 },
        )
        setOrganisation(data.organisation)
      } catch {
        // silently fail — name stays null
      }
    }
    load()
  }, [organisationId])

  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  useEffect(() => {
    if (!isMenuOpen) {return}
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {closeMenu()}
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isMenuOpen, closeMenu])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    closeMenu()
    try {
      await logout()
    } catch (e) {
      console.error('Logout failed:', e)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const initials = useMemo(() => {
    const f = user?.firstName?.charAt(0) ?? ''
    const l = user?.lastName?.charAt(0) ?? ''
    return (f + l || user?.email?.charAt(0) || 'U').toUpperCase()
  }, [user])

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 sticky top-0 z-10 transition-colors">
      {/* Left: Ikivio / Org breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
            <span className="text-primary-foreground font-display font-bold text-xs">I</span>
          </div>
          <span className="font-display font-bold text-muted-foreground text-sm hidden sm:inline">
            Actipass
          </span>
        </Link>
        <ChevronRight className="w-4 h-4 text-muted-foreground hidden sm:block shrink-0" />
        <div className="flex items-center gap-2 min-w-0">
          {organisation?.logo_url ? (
            <img
              src={organisation.logo_url}
              alt={organisation.name}
              className="w-7 h-7 rounded-lg object-cover shrink-0 border border-border"
            />
          ) : null}
          <h1 className="font-display text-base font-bold text-foreground truncate">
            {organisation?.name ?? 'Organisation'}
          </h1>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5">
        {/* Dark mode toggle */}
        <button
          onClick={() => setIsDarkMode(d => !d)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:scale-95 transition-transform"
          aria-label={isDarkMode ? 'Activer le thème clair' : 'Activer le thème sombre'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
        </button>

        {/* Notifications */}
        <Link
          to={`/dashboard/${organisationId}/notifications`}
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:scale-95 transition-transform"
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </Link>

        {/* User menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(p => !p)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-1.5 py-1 shadow-sm hover:border-primary/30 transition active:scale-95 transition-transform"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{initials}</div>
              }
            </div>
            <Menu className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeMenu} />
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-20">
                {user && (
                  <div className="px-4 py-3 border-b border-border bg-muted/50 flex items-center gap-3">
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
                    to="/account/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    Mon profil
                  </Link>
                  <Link
                    to="/accounts"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
                    Changer d'organisation
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut || isLoading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4 shrink-0" />
                    {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
                  </button>
                </nav>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default DashboardHeader
