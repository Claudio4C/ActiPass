import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  CheckCircle2, XCircle, Users, ChevronRight,
  Loader2, Phone, Mail, Calendar, ArrowLeft, UserCheck,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useMemberships } from '../../hooks/useMemberships'
import type { MembershipRequest } from '../../hooks/useMemberships'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const getAge = (birthdate: string | null | undefined) => {
  if (!birthdate) { return null }
  return Math.floor((Date.now() - new Date(birthdate).getTime()) / (365.25 * 24 * 3600 * 1000))
}

const roleBadgeCls = (type: string) => {
  switch (type) {
    case 'club_manager': return 'bg-primary/10 text-primary'
    case 'treasurer': return 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)]'
    case 'coach': return 'bg-amber-500/10 text-amber-700'
    default: return 'bg-muted text-muted-foreground'
  }
}

const docsBadge = (s: string) => {
  if (s === 'validated') { return { label: 'Docs validés', cls: 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)]' } }
  if (s === 'in_review') { return { label: 'En révision', cls: 'bg-amber-500/10 text-amber-700' } }
  return { label: 'Docs manquants', cls: 'bg-destructive/10 text-destructive' }
}

// ─── Group by decision date ───────────────────────────────────────────────────

const decisionLabel = (iso: string): string => {
  const d = new Date(iso)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.getTime() === today.getTime()) { return "Aujourd'hui" }
  if (d.getTime() === yesterday.getTime()) { return 'Hier' }
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86400000)
  if (diffDays < 7) {
    return d.toLocaleDateString('fr-FR', { weekday: 'long' }).replace(/^\w/, (c) => c.toUpperCase())
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })
}

const groupByDate = (items: MembershipRequest[]) => {
  const groups = new Map<string, MembershipRequest[]>()
  items.forEach((item) => {
    const label = decisionLabel(item.updated_at ?? item.joined_at)
    if (!groups.has(label)) { groups.set(label, []) }
    groups.get(label)!.push(item)
  })
  return [...groups.entries()].map(([label, rows]) => ({ label, rows }))
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Avatar: React.FC<{ user: MembershipRequest['user']; size?: 'sm' | 'md' }> = ({ user, size = 'md' }) => {
  const cls = size === 'sm' ? 'w-8 h-8 text-sm' : 'w-11 h-11 text-base'
  const initials = `${user.firstname[0] ?? ''}${user.lastname[0] ?? ''}`.toUpperCase()
  return user.avatar_url ? (
    <img src={user.avatar_url} alt={user.firstname} className={cn(cls, 'rounded-full object-cover shrink-0')} />
  ) : (
    <div
      className={cn(cls, 'rounded-full flex items-center justify-center font-display font-bold text-white shrink-0')}
      style={{ backgroundColor: avatarColor(user.firstname) }}
    >
      {initials}
    </div>
  )
}

// ─── Pending card ─────────────────────────────────────────────────────────────

const PendingCard: React.FC<{
  req: MembershipRequest
  selected: boolean
  onSelect: () => void
  onApprove: () => void
  onReject: () => void
  acting: boolean
}> = ({ req, selected, onSelect, onApprove, onReject, acting }) => {
  const age = getAge(req.user.birthdate)
  const docs = docsBadge(req.docs_status)
  return (
    <div
      className={cn(
        'bg-card border rounded-2xl p-4 transition-all',
        selected ? 'border-primary ring-1 ring-primary/30' : 'border-border hover:border-primary/20',
      )}
    >
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="mt-1 w-4 h-4 rounded accent-primary shrink-0 cursor-pointer"
        />
        <Avatar user={req.user} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-bold text-foreground text-sm">
              {req.user.firstname} {req.user.lastname}
            </p>
            {age !== null && (
              <span className="text-[10px] text-muted-foreground">{age} ans</span>
            )}
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', roleBadgeCls(req.role.type))}>
              {req.role.name}
            </span>
            <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', docs.cls)}>
              {docs.label}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5">
            <a
              href={`mailto:${req.user.email}`}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <Mail className="w-3 h-3 shrink-0" /> {req.user.email}
            </a>
            {req.user.phone && (
              <a
                href={`tel:${req.user.phone}`}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Phone className="w-3 h-3 shrink-0" /> {req.user.phone}
              </a>
            )}
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3 shrink-0" /> Demande le {fmtDate(req.joined_at)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-border">
        <button
          onClick={onApprove}
          disabled={acting}
          className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)] font-bold text-xs rounded-xl hover:bg-[hsl(160,84%,39%)]/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
          Approuver
        </button>
        <button
          onClick={onReject}
          disabled={acting}
          className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 bg-destructive/10 text-destructive font-bold text-xs rounded-xl hover:bg-destructive/15 active:scale-95 transition-all disabled:opacity-50"
        >
          {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
          Refuser
        </button>
        <Link
          to={`/dashboard/${window.location.pathname.split('/')[2]}/members`}
          className="h-9 w-9 inline-flex items-center justify-center text-muted-foreground hover:text-foreground border border-border rounded-xl transition-colors shrink-0"
        >
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>
    </div>
  )
}

// ─── Recent row — compact, sans date répétée ──────────────────────────────────

const RecentRow: React.FC<{ req: MembershipRequest }> = ({ req }) => (
  <div className="flex items-center gap-3 py-2">
    <Avatar user={req.user} size="sm" />
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate leading-tight">
        {req.user.firstname} {req.user.lastname}
      </p>
      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block mt-0.5', roleBadgeCls(req.role.type))}>
        {req.role.name}
      </span>
    </div>
    <span
      className={cn(
        'text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0',
        req.status === 'active'
          ? 'bg-[hsl(160,84%,39%)]/15 text-[hsl(160,84%,32%)]'
          : 'bg-destructive/10 text-destructive',
      )}
    >
      {req.status === 'active' ? '✓ Approuvé' : '✗ Refusé'}
    </span>
  </div>
)

// ─── Reject modal ─────────────────────────────────────────────────────────────

const RejectModal: React.FC<{
  name: string
  onConfirm: (reason: string) => void
  onCancel: () => void
  loading: boolean
}> = ({ name, onConfirm, onCancel, loading }) => {
  const [reason, setReason] = useState('')
  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onCancel} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border p-6 space-y-4">
          <div>
            <h3 className="font-display font-bold text-lg text-foreground">Refuser l'adhésion</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Vous allez refuser la demande de <strong>{name}</strong>. Un motif est facultatif.
            </p>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Motif du refus (optionnel)…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={() => onConfirm(reason)}
              disabled={loading}
              className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-bold inline-flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-transform disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
              Confirmer le refus
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ msg: { variant: 'success' | 'error'; text: string } | null }> = ({ msg }) => {
  if (!msg) { return null }
  return (
    <div
      className={cn(
        'fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg font-semibold text-sm flex items-center gap-2 border',
        msg.variant === 'success'
          ? 'bg-[hsl(160,84%,39%)]/10 border-[hsl(160,84%,39%)]/30 text-[hsl(160,84%,32%)]'
          : 'bg-destructive/10 border-destructive/30 text-destructive',
      )}
    >
      {msg.variant === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0" />
        : <XCircle className="w-4 h-4 shrink-0" />}
      {msg.text}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const AdminRequests: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()
  const { pending, recent, decide, bulkApprove, loading } = useMemberships(organisationId)

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [actingId, setActingId] = useState<string | null>(null)
  const [rejectTarget, setRejectTarget] = useState<MembershipRequest | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)
  const [toast, setToast] = useState<{ variant: 'success' | 'error'; text: string } | null>(null)

  const showToast = (variant: 'success' | 'error', text: string) => {
    setToast({ variant, text })
    setTimeout(() => setToast(null), 3500)
  }

  const toggleSelect = (id: string) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) { n.delete(id) } else { n.add(id) }
      return n
    })

  const toggleAll = () =>
    setSelected(selected.size === pending.length ? new Set() : new Set(pending.map((r) => r.id)))

  const handleApprove = async (req: MembershipRequest) => {
    setActingId(req.id)
    try {
      await decide(req.id, 'approve')
      setSelected((s) => { const n = new Set(s); n.delete(req.id); return n })
      showToast('success', `${req.user.firstname} ${req.user.lastname} approuvé·e !`)
    } catch {
      showToast('error', "Erreur lors de l'approbation")
    } finally {
      setActingId(null)
    }
  }

  const handleReject = async (reason: string) => {
    if (!rejectTarget) { return }
    setActingId(rejectTarget.id)
    try {
      await decide(rejectTarget.id, 'reject', reason || undefined)
      setSelected((s) => { const n = new Set(s); n.delete(rejectTarget.id); return n })
      showToast('success', `Adhésion de ${rejectTarget.user.firstname} refusée.`)
      setRejectTarget(null)
    } catch {
      showToast('error', 'Erreur lors du refus')
    } finally {
      setActingId(null)
    }
  }

  const handleBulkApprove = async () => {
    if (selected.size === 0) { return }
    setBulkLoading(true)
    try {
      await bulkApprove([...selected])
      const count = selected.size
      setSelected(new Set())
      showToast('success', `${count} adhésion${count > 1 ? 's' : ''} approuvée${count > 1 ? 's' : ''} !`)
    } catch {
      showToast('error', "Erreur lors de l'approbation groupée")
    } finally {
      setBulkLoading(false)
    }
  }

  const groups = groupByDate(recent)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/dashboard/${organisationId}/members`}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground">Demandes d'adhésion</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gérez les demandes d'inscription à votre organisation.</p>
        </div>
        {pending.length > 0 && (
          <span className="shrink-0 w-7 h-7 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center">
            {pending.length}
          </span>
        )}
      </div>

      {/* Loading initial */}
      {loading && (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <>
          {/* ── En attente ── */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
                En attente de validation
                {pending.length > 0 && (
                  <span className="ml-2 text-foreground">{pending.length}</span>
                )}
              </p>
              {pending.length > 1 && (
                <button
                  onClick={toggleAll}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {selected.size === pending.length ? 'Tout déselectionner' : 'Tout sélectionner'}
                </button>
              )}
            </div>

            {pending.length === 0 ? (
              <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-primary shrink-0" />
                </div>
                <p className="font-display font-bold text-foreground">Aucune demande en attente</p>
                <p className="text-sm text-muted-foreground">
                  Les nouvelles demandes d'adhésion apparaîtront ici.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pending.map((req) => (
                  <PendingCard
                    key={req.id}
                    req={req}
                    selected={selected.has(req.id)}
                    onSelect={() => toggleSelect(req.id)}
                    onApprove={() => handleApprove(req)}
                    onReject={() => setRejectTarget(req)}
                    acting={actingId === req.id}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Récentes décisions — groupées par date ── */}
          {groups.length > 0 && (
            <section>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-3">
                Récentes décisions
              </p>
              <div className="bg-card border border-border rounded-2xl px-4 py-2 space-y-1">
                {groups.map(({ label, rows }, gi) => (
                  <div key={label}>
                    {/* Séparateur entre groupes */}
                    {gi > 0 && <div className="border-t border-border my-2" />}
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 pt-1 pb-0.5">
                      {label}
                    </p>
                    {rows.map((req) => <RecentRow key={req.id} req={req} />)}
                  </div>
                ))}
              </div>
            </section>
          )}

          {groups.length === 0 && pending.length === 0 && (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-muted flex items-center justify-center">
                <Users className="w-6 h-6 text-muted-foreground shrink-0" />
              </div>
              <p className="font-display font-bold text-foreground">Aucune adhésion</p>
              <p className="text-sm text-muted-foreground">
                Les demandes d'adhésion et les décisions récentes apparaîtront ici.
              </p>
            </div>
          )}
        </>
      )}

      {/* ── Bulk action bar ── */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-card border border-border rounded-2xl px-5 py-3 shadow-xl">
          <span className="text-sm font-semibold text-foreground">
            {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleBulkApprove}
            disabled={bulkLoading}
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground text-sm font-bold px-4 py-2 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
          >
            {bulkLoading
              ? <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            Approuver {selected.size}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Annuler
          </button>
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          name={`${rejectTarget.user.firstname} ${rejectTarget.user.lastname}`}
          onConfirm={handleReject}
          onCancel={() => setRejectTarget(null)}
          loading={actingId === rejectTarget.id}
        />
      )}

      <Toast msg={toast} />
    </div>
  )
}

const ProtectedAdminRequests: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager']}>
    <AdminRequests />
  </RoleBasedRoute>
)

export default ProtectedAdminRequests
