import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Users, Building2, UserPlus, Plus, ChevronRight, Dumbbell, Music, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { cn } from '../lib/utils'
import type { RoleType } from '../types'
import GettingStartedCard from '../components/GettingStartedCard'

type Organisation = {
  id: string;
  name: string;
  roleType: RoleType;
  roleName: string;
  type: 'club' | 'association' | 'independant';
  logo_url?: string | null;
};

const getRoleDashboardPath = (roleType: RoleType, orgId: string) => {
  if (roleType === 'club_owner' || roleType === 'club_manager' || roleType === 'treasurer') {
    return `/dashboard/${orgId}/overview`
  }
  // members & coaches → espace membre spécifique au club
  return `/club/${orgId}`
}

const ROLE_LABELS: Partial<Record<RoleType, string>> = {
  club_owner: 'Propriétaire',
  club_manager: 'Gestionnaire',
  treasurer: 'Trésorier',
  coach: 'Coach',
  member: 'Membre',
}

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [organisations, setOrganisations] = useState<Organisation[]>([])
  const [loading, setLoading] = useState(true)

  // Purement synchrone — ikivio_onboarding_type est la source de vérité
  const [showChecklist] = useState(() => {
    const type = localStorage.getItem('ikivio_onboarding_type')
    const done = localStorage.getItem('ikivio_welcome_seen') === 'done'
    return (type === 'parent' || type === 'member') && !done
  })

  useEffect(() => {
    const load = async () => {
      try {
        const data = await api.get<
          Array<{
            organisation: { id: string; name: string; type: 'club' | 'association' | null; logo_url?: string | null };
            role: { name: string; type: RoleType };
          }>
        >('/organisations/my', {}, { useCache: false })

        setOrganisations(
          data.map(item => ({
            id: item.organisation.id,
            name: item.organisation.name,
            type: item.organisation.type || 'club',
            roleType: item.role.type,
            roleName: ROLE_LABELS[item.role.type] ?? item.role.name,
            logo_url: item.organisation.logo_url ?? null,
          })),
        )
      } catch {
        setOrganisations([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleOrgSelect = (org: Organisation) => {
    const storedRole =
      org.roleType === 'club_owner' || org.roleType === 'club_manager' || org.roleType === 'treasurer'
        ? 'gestionnaire'
        : org.roleType === 'coach'
          ? 'coach'
          : 'membre'

    // Vider tout le cache API au switch d'organisation pour éviter les données obsolètes
    api.clearCache()

    localStorage.setItem(
      'selectedOrganisation',
      JSON.stringify({ id: org.id, name: org.name, type: org.type, role: storedRole }),
    )
    window.dispatchEvent(new Event('organisation:updated'))
    navigate(getRoleDashboardPath(org.roleType, org.id))
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const isManagerWithoutOrg = !loading
    && organisations.length === 0
    && localStorage.getItem('ikivio_onboarding_type') === 'manager'

  return (
    <div className="space-y-6">
      {/* Guide de démarrage — affiché tant que l'onboarding n'est pas terminé */}
      {showChecklist && <GettingStartedCard />}

      {/* Banner manager sans organisation */}
      {isManagerWithoutOrg && (
        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5 text-amber-700 shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-sm text-foreground">Créez votre organisation</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vous n'avez pas encore de club — c'est parti en 2 minutes.</p>
          </div>
          <button
            onClick={() => navigate('/onboarding')}
            className="shrink-0 inline-flex items-center gap-1.5 bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-full active:scale-95 transition-transform"
          >
            Créer <ArrowRight className="w-3.5 h-3.5 shrink-0" />
          </button>
        </div>
      )}

      {/* Hero card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/85 rounded-3xl p-6 text-primary-foreground shadow-xl shadow-primary/30">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-primary-foreground/10 rounded-full blur-2xl" />
        <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-primary-foreground/5 rounded-full blur-2xl" />
        <div className="relative">
          <p className="text-[11px] uppercase tracking-wider font-bold text-primary-foreground/70">
            {today}
          </p>
          <h1 className="font-display text-2xl font-bold mt-1">
            Bonjour, {user?.firstName || 'Utilisateur'} 👋
          </h1>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Gérez vos clubs, associations et activités depuis un seul endroit.
          </p>
          <div className="flex flex-wrap gap-2 mt-5">
            <Link
              to="/club"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary text-sm font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform"
            >
              <Users className="w-4 h-4 shrink-0" />
              Mon activité
            </Link>
            <Link
              to="/club/famille"
              className="inline-flex items-center gap-2 bg-primary-foreground/15 text-primary-foreground text-sm font-bold px-3.5 py-2.5 rounded-full active:scale-95 transition-transform border border-primary-foreground/20"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              Ma famille
            </Link>
            <Link
              to="/clubs"
              className="inline-flex items-center gap-2 bg-primary-foreground/15 text-primary-foreground text-sm font-bold px-3.5 py-2.5 rounded-full active:scale-95 transition-transform border border-primary-foreground/20"
            >
              <Plus className="w-4 h-4 shrink-0" />
              Clubs
            </Link>
          </div>
        </div>
      </div>

      {/* Mes associations */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
            Mes associations
          </p>
          {organisations.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {organisations.length} club{organisations.length > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : organisations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {organisations.map(org => {
              const isAdmin = org.roleType === 'club_owner' || org.roleType === 'club_manager' || org.roleType === 'treasurer'
              const OrgIcon = org.type === 'association' ? Music : org.type === 'independant' ? Users : Dumbbell
              const iconBg = org.type === 'association' ? 'bg-cat-music/15 text-cat-music' : org.type === 'independant' ? 'bg-primary/15 text-primary' : 'bg-accent/15 text-accent'

              return (
                <button
                  key={org.id}
                  onClick={() => handleOrgSelect(org)}
                  className="text-left bg-card border border-border rounded-2xl p-4 flex items-center gap-3 active:scale-[0.99] transition-all hover:border-primary/20 hover:shadow-sm group"
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className={cn('w-full h-full flex items-center justify-center', iconBg)}>
                        <OrgIcon className="w-5 h-5 shrink-0" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground text-sm truncate">{org.name}</p>
                    <p className={cn('text-[10px] font-bold mt-1 px-1.5 py-0.5 rounded-full inline-block', isAdmin ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
                      {org.roleName}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </button>
              )
            })}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-3xl p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary shrink-0" />
            </div>
            <h2 className="font-display text-lg font-bold text-foreground">Pas encore de club</h2>
            <p className="text-sm text-muted-foreground">
              Vous n'êtes membre d'aucune organisation. Créez ou rejoignez un espace pour commencer.
            </p>
            <div className="flex flex-wrap gap-3 justify-center pt-2">
              <Link
                to="/accounts?intent=create-organisation"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-4 py-2.5 rounded-full active:scale-95 transition-transform"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Créer un espace
              </Link>
              <Link
                to="/accounts?intent=join-organisation"
                className="inline-flex items-center gap-2 bg-muted text-foreground text-sm font-semibold px-4 py-2.5 rounded-full active:scale-95 transition-transform border border-border"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                Rejoindre un club
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* ── Dev-only: reset onboarding ─────────────────────────────────────── */}
      {import.meta.env.DEV && (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-1 items-end">
          {(['parent', 'member', 'manager'] as const).map((type) => (
            <button
              key={type}
              onClick={() => {
                localStorage.removeItem('ikivio_welcome_seen')
                localStorage.removeItem('ikivio_onboarding_page_done')
                localStorage.setItem('ikivio_onboarding_type', type)
                window.location.reload()
              }}
              className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-colors"
            >
              ↺ {type}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default HomePage
