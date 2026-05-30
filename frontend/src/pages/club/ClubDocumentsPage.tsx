import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FileText, CheckCircle2, Clock, AlertCircle,
  CreditCard, ChevronRight, Loader2, ArrowLeft, ShieldCheck,
  LogOut, X, ShieldOff, Archive,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { api } from '../../lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type MembershipStatus = 'pending' | 'active' | 'banned' | 'suspended' | 'expired' | 'resigned'

interface MyMembership {
  id: string
  status: MembershipStatus
  docs_status: 'missing' | 'in_review' | 'validated'
  payment_status: 'not_paid' | 'pending' | 'paid' | 'overdue'
  is_paid: boolean
  validated: boolean
  joined_at: string
  comment?: string | null
  role: { id: string; name: string; type: string }
  organisation: { id: string; name: string; logo_url: string | null }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const STATUS_CONFIG = {
  membership: {
    pending: { label: 'En attente de validation', icon: Clock, cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
    active: { label: 'Adhésion active', icon: CheckCircle2, cls: 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)] border-[hsl(160,84%,39%)]/20' },
    banned: { label: 'Adhésion refusée', icon: AlertCircle, cls: 'bg-destructive/10 text-destructive border-destructive/20' },
    suspended: { label: 'Compte suspendu', icon: ShieldOff, cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' },
    expired: { label: 'Adhésion expirée', icon: Archive, cls: 'bg-muted text-muted-foreground border-border' },
    resigned: { label: 'Vous avez quitté ce club', icon: LogOut, cls: 'bg-muted text-muted-foreground border-border' },
  } as Record<MembershipStatus, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }>,
  docs: {
    missing: { label: 'Documents manquants', icon: AlertCircle, cls: 'bg-destructive/10 text-destructive' },
    in_review: { label: 'Documents en révision', icon: Clock, cls: 'bg-amber-500/10 text-amber-700' },
    validated: { label: 'Documents validés', icon: CheckCircle2, cls: 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)]' },
  },
  payment: {
    not_paid: { label: 'Non payé', icon: AlertCircle, cls: 'bg-destructive/10 text-destructive' },
    pending: { label: 'En attente', icon: Clock, cls: 'bg-amber-500/10 text-amber-700' },
    paid: { label: 'Payé', icon: CheckCircle2, cls: 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)]' },
    overdue: { label: 'En retard', icon: AlertCircle, cls: 'bg-destructive/10 text-destructive' },
  },
}

// ─── Step card ────────────────────────────────────────────────────────────────

const StepCard: React.FC<{
  step: number
  title: string
  description: string
  status: 'done' | 'current' | 'upcoming'
  badge: { label: string; cls: string; icon: React.ComponentType<{ className?: string }> }
}> = ({ step, title, description, status, badge }) => {
  const Icon = badge.icon
  const circleCls = cn(
    'w-9 h-9 rounded-full flex items-center justify-center font-display font-bold text-sm shrink-0',
    status === 'done' ? 'bg-[hsl(160,84%,39%)] text-white'
      : status === 'current' ? 'bg-primary text-primary-foreground'
        : 'bg-muted text-muted-foreground',
  )
  const wrapperCls = cn(
    'bg-card border rounded-2xl p-4 flex items-start gap-4',
    status === 'current' ? 'border-primary/30 ring-1 ring-primary/20' : 'border-border',
  )
  return (
    <div className={wrapperCls}>
      <div className={circleCls}>
        {status === 'done' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : step}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-display font-semibold text-foreground text-sm">{title}</p>
          <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1', badge.cls)}>
            <Icon className="w-3 h-3 shrink-0" /> {badge.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
    </div>
  )
}

// ─── Leave modal ──────────────────────────────────────────────────────────────

const LeaveModal: React.FC<{
  orgName: string
  onConfirm: () => Promise<void>
  onClose: () => void
}> = ({ orgName, onConfirm, onClose }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-destructive shrink-0" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-foreground">Quitter le club</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{orgName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          Êtes-vous sûr de vouloir quitter <span className="font-semibold text-foreground">{orgName}</span> ?
          Votre statut passera à <span className="font-semibold text-foreground">Démissionnaire</span> et
          vous perdrez l'accès aux activités et plannings de ce club.
        </p>
        <p className="text-xs text-muted-foreground bg-muted rounded-xl p-3">
          Pour rejoindre à nouveau le club, vous devrez soumettre une nouvelle demande d'adhésion.
        </p>
        {error && (
          <p className="text-xs text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors active:scale-95"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-destructive text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <LogOut className="w-4 h-4 shrink-0" />}
            {loading ? 'En cours…' : 'Quitter le club'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ClubDocumentsPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [membership, setMembership] = useState<MyMembership | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showLeave, setShowLeave]   = useState(false)

  useEffect(() => {
    if (!orgId) { return }
    api.get<MyMembership>(`/organisations/${orgId}/my-membership`, undefined, { useCache: false })
      .then(setMembership)
      .catch(() => setError('Vous n\'êtes pas membre de cette organisation.'))
      .finally(() => setLoading(false))
  }, [orgId])

  const handleLeave = async () => {
    if (!orgId) { return }
    await api.post(`/organisations/${orgId}/leave`)
    api.clearCache(`/organisations/${orgId}/my-membership`)
    api.clearCache('/organisations')
    navigate('/clubs')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !membership) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Link to={`/club/${orgId}`} className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4 shrink-0" />
          </Link>
          <h1 className="font-display text-2xl font-bold text-foreground">Mes documents</h1>
        </div>
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive shrink-0" />
          </div>
          <p className="font-display font-bold text-foreground">Adhésion introuvable</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const msCfg       = STATUS_CONFIG.membership[membership.status] ?? STATUS_CONFIG.membership.banned
  const docsCfg     = STATUS_CONFIG.docs[membership.docs_status]
  const paymentCfg  = STATUS_CONFIG.payment[membership.payment_status]
  const MsIcon      = msCfg.icon

  const membershipStep = membership.status === 'active' ? 'done' : membership.status === 'pending' ? 'current' : 'upcoming'
  const docsStep       = membership.docs_status === 'validated' ? 'done' : membership.docs_status === 'in_review' ? 'current' : 'upcoming'
  const paymentStep    = membership.payment_status === 'paid' ? 'done' : membership.payment_status === 'pending' ? 'current' : 'upcoming'

  const isActive = membership.status === 'active'

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to={`/club/${membership.organisation.id}`}
          className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95 shrink-0"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-2xl font-bold text-foreground">Mon adhésion</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{membership.organisation.name}</p>
        </div>
      </div>

      {/* Hero status */}
      <div className={cn('border rounded-2xl p-5 flex items-center gap-4', msCfg.cls)}>
        <div className="w-12 h-12 rounded-2xl bg-current/10 flex items-center justify-center shrink-0">
          <MsIcon className="w-6 h-6 shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-base">{msCfg.label}</p>
          <p className="text-sm opacity-80 mt-0.5">
            {membership.role.name} · Depuis le {fmtDate(membership.joined_at)}
          </p>
          {membership.status === 'pending' && (
            <p className="text-xs opacity-70 mt-1">Un gestionnaire du club va traiter votre demande sous peu.</p>
          )}
          {(membership.status === 'banned' || membership.status === 'suspended') && membership.comment && (
            <p className="text-xs opacity-70 mt-1">Motif : {membership.comment}</p>
          )}
          {membership.status === 'resigned' && (
            <p className="text-xs opacity-70 mt-1">Vous pouvez soumettre une nouvelle demande d'adhésion à tout moment.</p>
          )}
        </div>
        {membership.validated && (
          <ShieldCheck className="w-6 h-6 shrink-0 opacity-60" />
        )}
      </div>

      {/* Étapes — uniquement si actif ou en cours */}
      {(isActive || membership.status === 'pending') && (
        <section className="space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Votre parcours d'adhésion</p>

          <StepCard
            step={1}
            title="Adhésion au club"
            description="Votre demande est en cours d'examen par les gestionnaires du club."
            status={membershipStep}
            badge={msCfg}
          />
          <StepCard
            step={2}
            title="Documents justificatifs"
            description="Certificat médical, licence, pièce d'identité selon les exigences du club."
            status={docsStep}
            badge={docsCfg}
          />
          <StepCard
            step={3}
            title="Paiement de la cotisation"
            description="Réglez votre adhésion annuelle pour bénéficier de tous les services."
            status={paymentStep}
            badge={paymentCfg}
          />
        </section>
      )}

      {/* Info boxes (actif uniquement) */}
      {isActive && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Documents</p>
            <div className={cn('flex items-center gap-1.5 text-sm font-semibold', docsCfg.cls.split(' ').filter(c => c.startsWith('text-')).join(' '))}>
              <FileText className="w-4 h-4 shrink-0" />
              {docsCfg.label}
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Cotisation</p>
            <div className={cn('flex items-center gap-1.5 text-sm font-semibold', paymentCfg.cls.split(' ').filter(c => c.startsWith('text-')).join(' '))}>
              <CreditCard className="w-4 h-4 shrink-0" />
              {paymentCfg.label}
            </div>
          </div>
        </div>
      )}

      {/* Contact gestionnaire */}
      <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-primary shrink-0" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Besoin d'aide ?</p>
          <p className="text-xs text-muted-foreground mt-0.5">Contactez un gestionnaire du club pour plus d'informations.</p>
        </div>
        <Link to={`/club/${membership.organisation.id}`} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
          <ChevronRight className="w-4 h-4 shrink-0" />
        </Link>
      </div>

      {/* Quitter le club — uniquement si actif */}
      {isActive && (
        <div className="bg-card border border-destructive/20 rounded-2xl p-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
            <LogOut className="w-4 h-4 text-destructive shrink-0" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Quitter le club</p>
            <p className="text-xs text-muted-foreground mt-0.5">Vous perdrez l'accès aux activités de ce club.</p>
          </div>
          <button
            onClick={() => setShowLeave(true)}
            className="px-3 py-1.5 border border-destructive/30 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/5 transition-colors active:scale-95 shrink-0"
          >
            Quitter
          </button>
        </div>
      )}

      {showLeave && (
        <LeaveModal
          orgName={membership.organisation.name}
          onConfirm={handleLeave}
          onClose={() => setShowLeave(false)}
        />
      )}
    </div>
  )
}

export default ClubDocumentsPage
