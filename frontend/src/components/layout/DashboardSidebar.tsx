import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, Calendar, ClipboardCheck, Euro,
  FileText, Settings, Menu, X, MessageSquare, UserCog,
} from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import type { Membership, RoleType } from '../../types'

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number | null;
  roles: RoleType[];
}

interface DashboardSidebarProps {
  organisationId: string;
}

const DashboardSidebar: React.FC<DashboardSidebarProps> = ({ organisationId }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [membership, setMembership] = useState<Membership | null>(null)
  const [orgInfo, setOrgInfo] = useState<{ name: string; logo_url: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    () => localStorage.getItem('user_avatar_url'),
  )
  useEffect(() => {
    const handler = () => setAvatarUrl(localStorage.getItem('user_avatar_url'))
    window.addEventListener('avatar:updated', handler)
    return () => window.removeEventListener('avatar:updated', handler)
  }, [])

  useEffect(() => {
    if (!user?.id || !organisationId) {return}
    const load = async () => {
      try {
        setLoading(true)
        const data = await api.get<{
          organisation: { id: string; name: string; logo_url?: string | null };
          myRole: { id: string; name: string; type: RoleType; level: number };
        }>(`/organisations/${organisationId}`, undefined, { useCache: true, cacheTTL: 60000 })
        setMembership({
          id: `${organisationId}-${user.id}`,
          organisationId,
          role: data.myRole,
          joined_at: new Date().toISOString(),
        })
        setOrgInfo({ name: data.organisation.name, logo_url: data.organisation.logo_url ?? null })
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [organisationId, user?.id])

  const currentRole: RoleType = membership?.role?.type || 'member'

  const menuItems: MenuItem[] = [
    { icon: LayoutDashboard, label: "Vue d'ensemble", path: `/dashboard/${organisationId}/overview`,       roles: ['club_owner', 'club_manager', 'treasurer'] },
    { icon: Users,           label: 'Membres',         path: `/dashboard/${organisationId}/members`,        roles: ['club_owner', 'club_manager'] },
    { icon: Calendar,        label: 'Événements',      path: `/dashboard/${organisationId}/events`,         roles: ['club_owner', 'club_manager'] },
    { icon: ClipboardCheck,  label: 'Présences',       path: `/dashboard/${organisationId}/attendance`,     roles: ['club_owner', 'club_manager'] },
    { icon: Euro,            label: 'Finances',        path: `/dashboard/${organisationId}/payments`,       roles: ['club_owner', 'club_manager', 'treasurer'] },
    { icon: FileText,        label: 'Documents',       path: `/dashboard/${organisationId}/documents`,      roles: ['club_owner', 'club_manager'] },
    { icon: MessageSquare,   label: 'Communication',   path: `/dashboard/${organisationId}/communication`,  roles: ['club_owner', 'club_manager'] },
    { icon: UserCog,         label: 'Équipe',          path: `/dashboard/${organisationId}/settings/team`,  roles: ['club_owner', 'club_manager'] },
    { icon: Settings,        label: 'Paramètres',      path: `/dashboard/${organisationId}/settings`,       roles: ['club_owner', 'club_manager'] },
  ].filter(item => item.roles.includes(currentRole))

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(`${path}/`)

  if (loading) {
    return (
      <div className="w-64 shrink-0 bg-card border-r border-border flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setIsMobileOpen(o => !o)}
        className="lg:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shadow-sm"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40',
          'w-64 shrink-0 bg-card border-r border-border',
          'transform transition-transform duration-300 ease-in-out',
          'flex flex-col',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Logo / home link */}
        <Link
          to="/home"
          className="flex items-center gap-3 px-5 py-4 border-b border-border hover:bg-muted transition-colors"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden shrink-0">
            {orgInfo?.logo_url ? (
              <img
                src={orgInfo.logo_url}
                alt={orgInfo.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-display font-bold text-sm">
                  {orgInfo?.name?.[0]?.toUpperCase() ?? 'I'}
                </span>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-foreground text-sm leading-none truncate">
              {orgInfo?.name ?? 'Actipass'}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Dashboard</p>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          {menuItems.map(({ path, icon: Icon, label, badge }) => {
            const active = isActive(path)
            return (
              <Link
                key={path}
                to={path}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge !== undefined && badge !== null && badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User footer */}
        <div className="px-4 py-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden shrink-0">
              {avatarUrl
                ? <img src={avatarUrl} alt={user?.firstName ?? 'U'} className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'U'}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {membership?.role?.name || 'Membre'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setIsMobileOpen(false)} />
      )}
    </>
  )
}

export default DashboardSidebar
