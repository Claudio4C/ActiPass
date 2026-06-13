import React, { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  CalendarRange, CalendarDays, Plus, Zap, Lock, Trash2,
  CheckCircle2, Clock, X, AlertCircle, Loader2, Mail,
} from 'lucide-react'
import { api } from '../../lib/api'
import { cn } from '../../lib/utils'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'

// ─── Types ────────────────────────────────────────────────────────────────────

interface RenewalLog {
  sent_at: string
  members_count: number
}

interface Season {
  id: string
  name: string
  starts_at: string
  ends_at: string
  is_active: boolean
  created_at: string
  active_members_count: number
  expired_members_count: number
  last_renewal_log: RenewalLog | null
}

type SeasonState = 'active' | 'upcoming' | 'closed'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })

const getSeasonState = (s: Season): SeasonState => {
  if (s.is_active) { return 'active' }
  if (new Date(s.starts_at) > new Date()) { return 'upcoming' }
  return 'closed'
}

const suggestSeasonName = (): string => {
  const y = new Date().getFullYear()
  return `${y}-${y + 1}`
}

// ─── Badge ────────────────────────────────────────────────────────────────────

const StateBadge: React.FC<{ state: SeasonState }> = ({ state }) => {
  if (state === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
        Active
      </span>
    )
  }
  if (state === 'upcoming') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
        <Clock className="w-3 h-3 shrink-0" />
        À venir
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
      <Lock className="w-3 h-3 shrink-0" />
      Clôturée
    </span>
  )
}

// ─── Modal Nouvelle saison ────────────────────────────────────────────────────

const CreateModal: React.FC<{
  orgId: string
  onCreated: () => void
  onClose: () => void
}> = ({ orgId, onCreated, onClose }) => {
  const [form, setForm]     = useState({ name: suggestSeasonName(), starts_at: '', ends_at: '' })
  const [creating, setCreating] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const handleCreate = async () => {
    if (!form.name.trim() || !form.starts_at || !form.ends_at) {
      setError('Tous les champs sont obligatoires.')
      return
    }
    if (new Date(form.ends_at) <= new Date(form.starts_at)) {
      setError('La date de fin doit être postérieure à la date de début.')
      return
    }
    setCreating(true)
    setError(null)
    try {
      await api.post(`/organisations/${orgId}/seasons`, {
        name:      form.name.trim(),
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at:   new Date(form.ends_at).toISOString(),
      })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création.')
      setCreating(false)
    }
  }

  const inputCls = 'w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-colors'

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <CalendarRange className="w-5 h-5 text-primary shrink-0" />
            </div>
            <h3 className="font-display text-base font-bold text-foreground">Nouvelle saison</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
              Nom de la saison *
            </label>
            <input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="2025-2026"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
                Date de début *
              </label>
              <input
                type="date"
                value={form.starts_at}
                onChange={(e) => set('starts_at', e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">
                Date de fin *
              </label>
              <input
                type="date"
                value={form.ends_at}
                onChange={(e) => set('ends_at', e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={creating}
            className="flex-1 h-10 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 h-10 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {creating ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
            {creating ? 'Création…' : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Clôture ────────────────────────────────────────────────────────────

const CloseModal: React.FC<{
  season: Season
  orgId: string
  onClosed: () => void
  onClose: () => void
}> = ({ season, orgId, onClosed, onClose }) => {
  const [confirmed, setConfirmed] = useState(false)
  const [closing, setClosing]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const handleClose = async () => {
    setClosing(true)
    setError(null)
    try {
      await api.post(`/organisations/${orgId}/seasons/${season.id}/close`, {
        send_renewal_email: false,
      })
      onClosed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la clôture.')
      setClosing(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5 text-amber-700 shrink-0" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Clôturer la saison</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{season.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <p className="text-sm font-semibold text-amber-800">Attention</p>
          </div>
          <p className="text-xs text-amber-700/90 pl-5">
            Cette action va expirer tous les membres actifs de cette saison.
            Ils devront renouveler leur adhésion pour la prochaine saison.
          </p>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setConfirmed((c) => !c)}
            className={cn(
              'w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
              confirmed ? 'bg-destructive border-destructive' : 'border-border',
            )}
          >
            {confirmed && <CheckCircle2 className="w-3 h-3 text-white shrink-0" />}
          </div>
          <p className="text-xs text-foreground">
            Je comprends que cette action est irréversible et que tous les membres actifs seront expirés.
          </p>
        </label>

        {error && (
          <div className="rounded-xl bg-destructive/5 border border-destructive/20 px-3 py-2">
            <p className="text-xs text-destructive">{error}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={closing}
            className="flex-1 h-10 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95 disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleClose}
            disabled={!confirmed || closing}
            className="flex-1 h-10 bg-destructive text-white rounded-xl text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {closing ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Lock className="w-4 h-4 shrink-0" />}
            {closing ? 'Clôture…' : 'Clôturer la saison'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const AdminSeasonsPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const [seasons, setSeasons]           = useState<Season[]>([])
  const [loading, setLoading]           = useState(true)
  const [showCreate, setShowCreate]     = useState(false)
  const [closeTarget, setCloseTarget]   = useState<Season | null>(null)
  const [activating, setActivating]     = useState<string | null>(null)
  const [deleting, setDeleting]         = useState<string | null>(null)
  const [renewing, setRenewing]         = useState<string | null>(null)
  const [notice, setNotice]             = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showNotice = (type: 'success' | 'error', message: string) => {
    setNotice({ type, message })
    setTimeout(() => setNotice(null), 4000)
  }

  const load = useCallback(async () => {
    if (!organisationId) { return }
    try {
      const data = await api.get<Season[]>(`/organisations/${organisationId}/seasons`, undefined, { useCache: false })
      setSeasons(data)
    } catch {
      showNotice('error', 'Impossible de charger les saisons.')
    } finally {
      setLoading(false)
    }
  }, [organisationId])

  useEffect(() => { void load() }, [load])

  const handleActivate = async (seasonId: string) => {
    if (!organisationId) { return }
    setActivating(seasonId)
    try {
      const res = await api.post<{ activated: string; memberships_linked: number }>(
        `/organisations/${organisationId}/seasons/${seasonId}/activate`,
      )
      showNotice('success', `Saison activée — ${res.memberships_linked} adhésion(s) rattachée(s).`)
      await load()
    } catch (e) {
      showNotice('error', e instanceof Error ? e.message : 'Erreur lors de l\'activation.')
    } finally {
      setActivating(null)
    }
  }

  const handleSendRenewal = async (seasonId: string) => {
    if (!organisationId) { return }
    setRenewing(seasonId)
    try {
      const res = await api.post<{ sent: number; season_name: string }>(
        `/organisations/${organisationId}/seasons/${seasonId}/send-renewal`,
      )
      showNotice('success', `Invitations envoyées à ${res.sent} membre${res.sent !== 1 ? 's' : ''}.`)
      await load()
    } catch (e) {
      showNotice('error', e instanceof Error ? e.message : 'Erreur lors de l\'envoi.')
    } finally {
      setRenewing(null)
    }
  }

  const handleDelete = async (seasonId: string) => {
    if (!organisationId) { return }
    setDeleting(seasonId)
    try {
      await api.delete(`/organisations/${organisationId}/seasons/${seasonId}`)
      showNotice('success', 'Saison supprimée.')
      await load()
    } catch (e) {
      showNotice('error', e instanceof Error ? e.message : 'Impossible de supprimer cette saison.')
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Gestion des saisons</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Créez et gérez les saisons sportives de votre club.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/25 shrink-0"
        >
          <Plus className="w-4 h-4 shrink-0" />
          Nouvelle saison
        </button>
      </div>

      {/* Notice */}
      {notice && (
        <div
          className={cn(
            'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium',
            notice.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
              : 'border-destructive/30 bg-destructive/10 text-destructive',
          )}
        >
          {notice.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {notice.message}
        </div>
      )}

      {/* Empty state */}
      {seasons.length === 0 && (
        <div className="border-2 border-dashed border-border rounded-2xl p-10 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
            <CalendarDays className="w-7 h-7 text-primary shrink-0" />
          </div>
          <div className="space-y-1">
            <p className="font-display font-bold text-foreground">Aucune saison créée</p>
            <p className="text-sm text-muted-foreground">
              Créez votre première saison pour commencer à rattacher vos adhésions.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 shrink-0" />
            Créer une saison
          </button>
        </div>
      )}

      {/* Season list */}
      <div className="space-y-3">
        {seasons.map((season) => {
          const state = getSeasonState(season)
          const isActivating = activating === season.id
          const isDeleting   = deleting === season.id

          const isRenewing = renewing === season.id

          return (
            <div
              key={season.id}
              className={cn(
                'bg-card border rounded-2xl p-4',
                state === 'active' ? 'border-emerald-500/30' : 'border-border',
              )}
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">

                {/* Info */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <p className="font-display font-bold text-foreground">{season.name}</p>
                    <StateBadge state={state} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Du {fmtDate(season.starts_at)} au {fmtDate(season.ends_at)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold text-foreground">{season.active_members_count}</span> membre{season.active_members_count !== 1 ? 's' : ''} actif{season.active_members_count !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">

                  {/* Activer — uniquement si inactive */}
                  {state !== 'active' && (
                    <button
                      onClick={() => void handleActivate(season.id)}
                      disabled={isActivating}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isActivating
                        ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        : <Zap className="w-3 h-3 shrink-0" />}
                      Activer
                    </button>
                  )}

                  {/* Clôturer — uniquement si active */}
                  {state === 'active' && (
                    <button
                      onClick={() => setCloseTarget(season)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 active:scale-95 transition-all"
                    >
                      <Lock className="w-3 h-3 shrink-0" />
                      Clôturer
                    </button>
                  )}

                  {/* Supprimer — uniquement si aucun membership */}
                  {season.active_members_count === 0 && state !== 'active' && (
                    <button
                      onClick={() => void handleDelete(season.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isDeleting
                        ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                        : <Trash2 className="w-3 h-3 shrink-0" />}
                      Supprimer
                    </button>
                  )}
                </div>
              </div>

              {/* Renouvellement — saisons clôturées avec membres expirés */}
              {state === 'closed' && season.expired_members_count > 0 && (
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">{season.expired_members_count}</span> membre{season.expired_members_count !== 1 ? 's' : ''} à renouveler
                    </p>
                    {season.last_renewal_log && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Dernier envoi : {fmtDate(season.last_renewal_log.sent_at)} · {season.last_renewal_log.members_count} membre{season.last_renewal_log.members_count !== 1 ? 's' : ''} contacté{season.last_renewal_log.members_count !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => void handleSendRenewal(season.id)}
                    disabled={isRenewing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                  >
                    {isRenewing
                      ? <Loader2 className="w-3 h-3 animate-spin shrink-0" />
                      : <Mail className="w-3 h-3 shrink-0" />}
                    {isRenewing ? 'Envoi…' : 'Envoyer les invitations de renouvellement'}
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modals */}
      {showCreate && organisationId && (
        <CreateModal
          orgId={organisationId}
          onCreated={async () => { setShowCreate(false); showNotice('success', 'Saison créée.'); await load() }}
          onClose={() => setShowCreate(false)}
        />
      )}

      {closeTarget && organisationId && (
        <CloseModal
          season={closeTarget}
          orgId={organisationId}
          onClosed={async () => { setCloseTarget(null); showNotice('success', `Saison "${closeTarget.name}" clôturée.`); await load() }}
          onClose={() => setCloseTarget(null)}
        />
      )}
    </div>
  )
}

const ProtectedAdminSeasonsPage: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager']}>
    <AdminSeasonsPage />
  </RoleBasedRoute>
)

export default ProtectedAdminSeasonsPage
