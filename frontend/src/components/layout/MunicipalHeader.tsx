import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, LogOut, User, Moon, Sun, Menu, Search, Download, Calendar } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { MUNICIPALITY } from '../../data/municipal/mockData'

const MunicipalHeader: React.FC = () => {
  const { user, logout, isLoading } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const menuRef = useRef<HTMLDivElement | null>(null)

  const [isDarkMode, setIsDarkMode] = useState(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark'),
  )

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

  const closeMenu = useCallback(() => setIsMenuOpen(false), [])

  useEffect(() => {
    if (!isMenuOpen) { return }
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) { closeMenu() }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isMenuOpen, closeMenu])

  const initials = useMemo(() => {
    const f = user?.firstName?.charAt(0) ?? ''
    const l = user?.lastName?.charAt(0) ?? ''
    return (f + l || user?.email?.charAt(0) || 'U').toUpperCase()
  }, [user])

  const handleLogout = async () => {
    setIsLoggingOut(true)
    closeMenu()
    try { await logout() } finally { setIsLoggingOut(false) }
  }

  return (
    <header className="h-16 border-b border-border bg-background/95 backdrop-blur-sm flex items-center gap-3 px-4 sm:px-6 sticky top-0 z-10">
      <div className="hidden md:flex flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="search"
          placeholder="Rechercher une asso, une salle…"
          className="w-full h-10 pl-9 pr-4 rounded-xl bg-muted border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-xl border border-border bg-card text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>30 derniers jours</span>
        </div>
        <button
          type="button"
          className="hidden sm:inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          Exporter
        </button>

        <button
          type="button"
          onClick={() => setIsDarkMode(d => !d)}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Thème"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          type="button"
          className="relative w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setIsMenuOpen(p => !p)}
            className="flex items-center gap-2 rounded-full border border-border bg-card px-1.5 py-1 shadow-sm hover:border-primary/30 transition"
          >
            <div className="w-8 h-8 rounded-full bg-[hsl(280,70%,55%)] flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <Menu className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-card shadow-xl overflow-hidden z-20">
              <div className="px-4 py-3 border-b border-border bg-muted/50">
                <p className="text-sm font-semibold text-foreground truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate">{MUNICIPALITY.name}</p>
              </div>
              <nav className="py-1 text-sm">
                <Link to="/account/profile" onClick={closeMenu} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted">
                  <User className="w-4 h-4 text-muted-foreground" />
                  Mon profil
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut || isLoading}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-destructive hover:bg-destructive/5 disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? 'Déconnexion…' : 'Déconnexion'}
                </button>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default MunicipalHeader
