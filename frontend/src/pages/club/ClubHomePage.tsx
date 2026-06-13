import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, CalendarDays, Trophy, QrCode, Clock, AlertCircle, Archive, LogOut, ShieldOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'

// ─── Types ────────────────────────────────────────────────────────────────────

interface MyMembership {
  id: string
  status: 'pending' | 'active' | 'banned' | 'suspended' | 'expired' | 'resigned'
  license_number: string | null
  joined_at: string
  left_at: string | null
  role: { id: string; name: string; type: string }
  organisation: { id: string; name: string; logo_url: string | null }
}

interface CurrentSeason {
  id: string
  name: string
  starts_at: string
  ends_at: string
  is_active: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtShortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

const STATUS_LABEL: Record<string, string> = {
  active: 'Actif',
  pending: 'En attente',
  expired: 'Expiré',
  banned: 'Refusé',
  suspended: 'Suspendu',
  resigned: 'Démissionnaire',
}

const STATUS_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  active: CheckCircle2,
  pending: Clock,
  expired: Archive,
  banned: AlertCircle,
  suspended: ShieldOff,
  resigned: LogOut,
}

const STATUS_COLOR: Record<string, string> = {
  active: 'text-[hsl(160,84%,39%)]',
  pending: 'text-amber-600',
  expired: 'text-muted-foreground',
  banned: 'text-destructive',
  suspended: 'text-amber-600',
  resigned: 'text-muted-foreground',
}

// ─── membre card (dark gradient) ────────────────────────────────────────────

const MemberCard: React.FC<{
  orgName: string
  userName: string
  licenseNumber: string | null
  seasonName: string | null
}> = ({ orgName, userName, licenseNumber, seasonName }) => (
  <div className="relative overflow-hidden bg-gradient-to-br from-slate-800 via-slate-850 to-slate-900 rounded-3xl p-6 text-white shadow-xl">
    <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
    <div className="relative">
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">CARTE DE MEMBRE</p>
          <p className="font-display text-lg font-bold text-white mt-1">{orgName}</p>
        </div>
        <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
          <QrCode className="w-8 h-8 text-white/70 shrink-0" />
        </div>
      </div>

      <div className="mb-5">
        <p className="text-[10px] text-white/50 uppercase tracking-wider">Titulaire</p>
        <p className="font-display text-2xl font-bold text-white mt-0.5">{userName}</p>
      </div>

      <div className="flex items-center gap-8">
        <div>
          <p className="text-[9px] text-white/50 uppercase tracking-wider">N° adhérent</p>
          <p className="text-sm font-mono font-semibold text-white/90 mt-0.5">
            {licenseNumber ?? '—'}
          </p>
        </div>
        {seasonName && (
          <div>
            <p className="text-[9px] text-white/50 uppercase tracking-wider">Saison</p>
            <p className="text-sm font-semibold text-white/90 mt-0.5">{seasonName}</p>
          </div>
        )}
      </div>
    </div>
  </div>
)

// ─── stat card ───────────────────────────────────────────────────────────────

const StatCard: React.FC<{
  icon: React.ReactNode
  value: string
  label: string
}> = ({ icon, value, label }) => (
  <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
    <div className="w-8 h-8">{icon}</div>
    <p className="font-display text-xl font-bold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
)

// ─── main ────────────────────────────────────────────────────────────────────

const ClubHomePage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const { user } = useAuth()

  const [membership, setMembership] = useState<MyMembership | null>(null)
  const [season, setSeason]         = useState<CurrentSeason | null>(null)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (!orgId) { return }
    Promise.all([
      api.get<MyMembership>(`/organisations/${orgId}/my-membership`, undefined, { useCache: true, cacheTTL: 30000 })
        .catch(() => null),
      api.get<CurrentSeason | null>(`/organisations/${orgId}/seasons/current`, undefined, { useCache: true, cacheTTL: 60000 })
        .catch(() => null),
    ]).then(([ms, s]) => {
      setMembership(ms)
      setSeason(s)
    }).finally(() => setLoading(false))
  }, [orgId])

  const orgName = membership?.organisation.name ?? (() => {
    try {
      const stored = localStorage.getItem('selectedOrganisation')
      if (stored) {
        const parsed = JSON.parse(stored) as { id: string; name: string }
        if (parsed.id === orgId) { return parsed.name }
      }
    } catch { /* noop */ }
    return 'Mon Club'
  })()

  const fullName = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Membre'

  const status      = membership?.status ?? 'pending'
  const StatusIcon  = STATUS_ICON[status] ?? Clock
  const statusColor = STATUS_COLOR[status] ?? 'text-muted-foreground'
  const statusLabel = STATUS_LABEL[status] ?? status

  const renewalDate = season?.ends_at
    ? fmtShortDate(season.ends_at)
    : membership?.left_at
      ? fmtShortDate(membership.left_at)
      : '—'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-foreground">Espace membre</h2>
        <p className="text-sm text-muted-foreground mt-1">Votre carte de membre numérique</p>
      </div>

      {/* Member card */}
      <MemberCard
        orgName={orgName}
        userName={fullName}
        licenseNumber={membership?.license_number ?? null}
        seasonName={season?.name ?? null}
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          icon={<StatusIcon className={cn('w-6 h-6 shrink-0', statusColor)} />}
          value={statusLabel}
          label="Statut"
        />
        <StatCard
          icon={<CalendarDays className="w-6 h-6 text-primary shrink-0" />}
          value={renewalDate}
          label="Renouvellement"
        />
        <StatCard
          icon={<Trophy className="w-6 h-6 text-destructive shrink-0" />}
          value="—"
          label="Présences"
        />
      </div>
    </div>
  )
}

export default ClubHomePage
