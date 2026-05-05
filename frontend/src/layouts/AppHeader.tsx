import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { LogOut, User, Moon, Sun, Home, Menu } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/utils'

interface AppHeaderProps {
  badge?: string;
  badgeClass?: string;
  logoClass?: string;
  LogoIcon?: React.ComponentType<{ className?: string }>;
  extra?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({ badge, extra }) => {
  const { user, logout, isLoading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') {return false}
    const stored = window.localStorage.getItem('theme')
    if (stored) {return stored === 'dark'}
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const root = document.documentElement
    if (isDarkMode) {
      root.classList.add('dark')
      window.localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      window.localStorage.setItem('theme', 'light')
    }
  }, [isDarkMode])

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
    <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Left: Logo + badge + extra */}
        <div className="flex items-center gap-3">
          <Link to="/home" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="text-primary-foreground font-display font-bold text-sm">I</span>
            </div>
            <span className="font-display font-bold text-foreground text-lg">Actipass</span>
          </Link>
          {badge && (
            <span className="text-[11px] font-bold text-primary px-2.5 py-1 rounded-full bg-primary/10 hidden sm:inline">
              {badge}
            </span>
          )}
          {extra}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsDarkMode(d => !d)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors active:scale-95 transition-transform"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
          </button>

          {user && (
            <span className="hidden sm:block text-sm text-muted-foreground font-medium">
              {user.firstName}
            </span>
          )}

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsMenuOpen(p => !p)}
              className="flex items-center gap-2 rounded-full border border-border bg-card px-1.5 py-1 shadow-sm hover:border-primary/30 transition active:scale-95 transition-transform"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">
                {initials}
              </div>
              <Menu className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-50">
                {user && (
                  <div className="px-4 py-3 border-b border-border bg-muted/50">
                    <p className="text-sm font-semibold text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                )}
                <nav className="py-1 text-sm">
                  <Link
                    to="/home"
                    onClick={closeMenu}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors',
                    )}
                  >
                    <Home className="w-4 h-4 text-primary shrink-0" />
                    Accueil
                  </Link>
                  <Link
                    to="/account/profile"
                    onClick={closeMenu}
                    className="flex items-center gap-3 px-4 py-2.5 text-foreground hover:bg-muted transition-colors"
                  >
                    <User className="w-4 h-4 text-muted-foreground shrink-0" />
                    Mon profil
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
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default AppHeader
