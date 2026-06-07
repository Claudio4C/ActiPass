import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  FileText, CheckCircle2, Clock, AlertCircle,
  CreditCard, ChevronRight, Loader2, ArrowLeft, ShieldCheck,
  LogOut, X, ShieldOff, Archive, Upload, Heart, User,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { api } from '../../lib/api'
import { useRequiredDocuments } from '../../hooks/useRequiredDocuments'
import { useMemberDocuments } from '../../hooks/useMemberDocuments'

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

const DOC_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  medical:        Heart,
  identity:       User,
  administrative: FileText,
  other:          FileText,
}

const ClubDocumentsPage: React.FC = () => {
  const { orgId } = useParams<{ orgId: string }>()
  const navigate = useNavigate()
  const [membership, setMembership] = useState<MyMembership | null>(null)
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [showLeave, setShowLeave]   = useState(false)

  // ── Documents ───────────────────────────────────────────────────────────────
  const { items: requiredDocs, loading: loadingDocs } = useRequiredDocuments(orgId)
  const {
    items: myDocs,
    loading: loadingMyDocs,
    refetch: refetchDocs,
    getSignedUrl,
  } = useMemberDocuments(orgId, 'mine')

  const [progress, setProgress]             = useState<Record<string, number>>({})
  const [uploading, setUploading]           = useState<Record<string, boolean>>({})
  const [uploadNotice, setUploadNotice]     = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [pendingFile, setPendingFile]       = useState<Record<string, File>>({})
  const [selectedName, setSelectedName]     = useState<Record<string, string>>({})
  // FIX 2 — immediate local state after upload (before API refetch resolves)
  const [localPendingDocs, setLocalPendingDocs] = useState<Record<string, boolean>>({})
  // FIX 8 — show drop zone for expiring_soon docs on demand
  const [renewingDoc, setRenewingDoc]       = useState<Record<string, boolean>>({})
  // FIX 6 — refresh key for reliable polling
  const [refreshKey, setRefreshKey]         = useState(0)
  const cardRef = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    if (!uploadNotice) { return undefined }
    const id = window.setTimeout(() => setUploadNotice(null), 4000)
    return () => clearTimeout(id)
  }, [uploadNotice])

  // FIX 6 — trigger refetch when refreshKey changes
  useEffect(() => { void refetchDocs() }, [refreshKey, refetchDocs])

  const forceRefresh = useCallback(() => setRefreshKey((k) => k + 1), [])

  // FIX 6 — poll every 20s
  useEffect(() => {
    const interval = setInterval(forceRefresh, 20000)
    return () => clearInterval(interval)
  }, [forceRefresh])

  // FIX 2 — clear localPendingDocs once the real API data confirms pending
  useEffect(() => {
    if (Object.keys(localPendingDocs).length === 0) { return }
    setLocalPendingDocs((prev) => {
      const pendingIds = new Set(
        myDocs
          .filter((d) => d.status === 'pending')
          .map((d) => d.required_document_id),
      )
      const next = { ...prev }
      let changed = false
      for (const id of Object.keys(next)) {
        if (pendingIds.has(id)) { delete next[id]; changed = true }
      }
      return changed ? next : prev
    })
  }, [myDocs, localPendingDocs])

  // FIX 5 — scroll + flash visual on card error
  const scrollToCard = useCallback((requiredDocId: string) => {
    setTimeout(() => {
      const el = cardRef.current[requiredDocId]
      if (!el) { return }
      const y = el.getBoundingClientRect().top + window.scrollY - 80
      window.scrollTo({ top: y, behavior: 'smooth' })
      el.classList.add('ring-2', 'ring-destructive', 'ring-offset-2')
      setTimeout(() => el.classList.remove('ring-2', 'ring-destructive', 'ring-offset-2'), 2000)
    }, 100)
  }, [])

  const handleFileSelect = useCallback((file: File, requiredDocId: string) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      scrollToCard(requiredDocId)
      setUploadNotice({ type: 'error', message: 'Format non supporté — PDF, JPG, PNG ou WEBP uniquement.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      scrollToCard(requiredDocId)
      setUploadNotice({ type: 'error', message: 'Fichier trop lourd — 5 Mo maximum.' })
      return
    }
    setPendingFile((p) => ({ ...p, [requiredDocId]: file }))
    setSelectedName((n) => ({ ...n, [requiredDocId]: file.name }))
  }, [scrollToCard])

  const clearPending = useCallback((requiredDocId: string) => {
    setPendingFile((p) => { const n = { ...p }; delete n[requiredDocId]; return n })
    setSelectedName((n) => { const c = { ...n }; delete c[requiredDocId]; return c })
  }, [])

  // FIX 2 — set local pending immediately, refetch in background
  const handleUpload = useCallback(async (requiredDocId: string) => {
    const file = pendingFile[requiredDocId]
    if (!file) { return }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('requiredDocumentId', requiredDocId)

    setUploading((u) => ({ ...u, [requiredDocId]: true }))
    setProgress((p) => ({ ...p, [requiredDocId]: 0 }))

    try {
      await api.getInstance().post(
        `/organisations/${orgId}/members/me/documents`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (ev) => {
            if (ev.total) {
              setProgress((p) => ({ ...p, [requiredDocId]: Math.round((ev.loaded / ev.total!) * 100) }))
            }
          },
        },
      )
      // FIX 2 — immediately update UI before refetch
      setLocalPendingDocs((p) => ({ ...p, [requiredDocId]: true }))
      setProgress((p) => ({ ...p, [requiredDocId]: 0 }))
      setUploading((u) => ({ ...u, [requiredDocId]: false }))
      clearPending(requiredDocId)
      setUploadNotice({ type: 'success', message: 'Document envoyé — en attente de validation.' })
      void refetchDocs() // background sync
    } catch {
      setUploading((u) => ({ ...u, [requiredDocId]: false }))
      setProgress((p) => ({ ...p, [requiredDocId]: 0 }))
      setUploadNotice({ type: 'error', message: 'Erreur lors de l\'envoi. Veuillez réessayer.' })
    }
  }, [orgId, pendingFile, refetchDocs, clearPending])

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

  const msCfg      = STATUS_CONFIG.membership[membership.status] ?? STATUS_CONFIG.membership.banned
  const paymentCfg = STATUS_CONFIG.payment[membership.payment_status]
  const MsIcon     = msCfg.icon

  const membershipStep = membership.status === 'active' ? 'done' : membership.status === 'pending' ? 'current' : 'upcoming'
  const paymentStep    = membership.payment_status === 'paid' ? 'done' : membership.payment_status === 'pending' ? 'current' : 'upcoming'

  const isActive = membership.status === 'active'

  // ── Conformité — UNIQUEMENT les docs obligatoires comptent ────────────────────
  const requiredOnly = requiredDocs.filter((rd) => rd.required)

  // Use required_document_id (FK) — always present; required_document.id may be absent on older responses
  const approvedRequiredIds = new Set(
    myDocs
      .filter((d) => d.status === 'approved' && (!d.expires_at || new Date(d.expires_at) > new Date()))
      .map((d) => d.required_document_id),
  )

  const allApproved = requiredOnly.length > 0 && requiredOnly.every((rd) => approvedRequiredIds.has(rd.id))

  // FIX 7 — only required docs drive the badge / step status
  const rejectedRequired = requiredOnly.filter((rd) => {
    const doc = myDocs.find((d) => d.required_document_id === rd.id)
    return doc?.status === 'rejected'
  })
  const missingRequired = requiredOnly.filter((rd) => {
    const doc = myDocs.find((d) => d.required_document_id === rd.id)
    return !doc
  })
  const pendingRequired = requiredOnly.filter(
    (rd) => localPendingDocs[rd.id] || myDocs.some((d) => d.required_document_id === rd.id && d.status === 'pending'),
  )

  const hasRejected = rejectedRequired.length > 0
  const hasPending  = pendingRequired.length > 0

  const docsStepStatus: 'done' | 'current' | 'upcoming' =
    allApproved ? 'done' : hasPending || hasRejected || missingRequired.length > 0 ? 'current' : 'upcoming'

  const docsBadge = allApproved
    ? { label: 'Documents validés',       icon: CheckCircle2, cls: 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,32%)] border-[hsl(160,84%,39%)]/20' }
    : hasRejected
      ? { label: 'Document(s) refusé(s)',   icon: AlertCircle,  cls: 'bg-destructive/10 text-destructive border-destructive/20' }
      : hasPending
        ? { label: 'En cours de validation', icon: Clock,        cls: 'bg-amber-500/10 text-amber-700 border-amber-500/20' }
        : { label: 'Documents manquants',    icon: AlertCircle,  cls: 'bg-destructive/10 text-destructive border-destructive/20' }

  // Dynamic description listing problem docs by name
  const docsDescription = (() => {
    if (allApproved) { return 'Tous vos documents obligatoires sont validés.' }
    const parts: string[] = []
    if (rejectedRequired.length > 0) {
      parts.push(`Refusé${rejectedRequired.length > 1 ? 's' : ''} : ${rejectedRequired.map((d) => d.name).join(', ')}`)
    }
    if (missingRequired.length > 0) {
      parts.push(`Manquant${missingRequired.length > 1 ? 's' : ''} : ${missingRequired.map((d) => d.name).join(', ')}`)
    }
    if (pendingRequired.length > 0) {
      parts.push(`En attente : ${pendingRequired.map((d) => d.name).join(', ')}`)
    }
    return parts.length > 0 ? parts.join(' · ') : 'Certificat médical, pièce d\'identité selon les exigences du club.'
  })()

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
            description={docsDescription}
            status={docsStepStatus}
            badge={docsBadge}
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
            <div className={cn('flex items-center gap-1.5 text-sm font-semibold', docsBadge.cls.split(' ').filter((c: string) => c.startsWith('text-')).join(' '))}>
              <FileText className="w-4 h-4 shrink-0" />
              {docsBadge.label}
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

      {/* ── Mes documents ─────────────────────────────────────────── */}
      {(isActive || membership.status === 'pending') && (
        <section className="space-y-4">

          {/* FIX 4 — barre de progression ou banner "tout conforme" (obligatoires uniquement) */}
          {!loadingDocs && requiredOnly.length > 0 && (() => {
            const validatedCount = requiredOnly.filter((rd) => approvedRequiredIds.has(rd.id)).length
            const allConform = validatedCount === requiredOnly.length
            if (allConform) {
              return (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-emerald-800">Dossier complet ✓</p>
                    <p className="text-xs text-emerald-700/80 mt-0.5">Tous vos documents sont validés et à jour.</p>
                  </div>
                </div>
              )
            }
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Mes documents</p>
                  <p className="text-xs text-muted-foreground">{validatedCount}/{requiredOnly.length} obligatoires conformes</p>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${(validatedCount / requiredOnly.length) * 100}%` }}
                  />
                </div>
              </div>
            )
          })()}

          {/* Notice upload */}
          {uploadNotice && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium',
                uploadNotice.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              {uploadNotice.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              {uploadNotice.message}
            </div>
          )}

          {/* Loading — spinner uniquement sur le chargement initial (pas les polls de fond) */}
          {(loadingDocs || (loadingMyDocs && myDocs.length === 0)) && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Aucun document requis */}
          {!loadingDocs && !loadingMyDocs && requiredDocs.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              Aucun document requis pour ce club pour l'instant.
            </div>
          )}

          {/* Cards — affichées dès qu'on a des données ; les polls de fond ne causent plus de flash */}
          {!loadingDocs && (!loadingMyDocs || myDocs.length > 0) && requiredDocs.map((rd) => {
            const myDoc = myDocs
              .filter((d) => d.required_document_id === rd.id)
              .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0]

            const DocIcon = DOC_ICON[rd.category] ?? FileText

            // FIX 3 — single source of truth for the card state
            const effectiveStatus = (() => {
              if (localPendingDocs[rd.id]) { return 'pending' as const }
              if (!myDoc) {
                return rd.required ? 'missing' as const : 'optional_missing' as const
              }
              if (myDoc.status === 'rejected') { return 'rejected' as const }
              if (myDoc.status === 'pending') { return 'pending' as const }
              if (myDoc.status === 'approved') {
                if (myDoc.expires_at && new Date(myDoc.expires_at) < new Date()) { return 'expired' as const }
                const dl = myDoc.expires_at
                  ? Math.ceil((new Date(myDoc.expires_at).getTime() - Date.now()) / 86400000)
                  : null
                if (dl !== null && dl < 30) { return 'expiring_soon' as const }
                return 'approved' as const
              }
              return 'missing' as const
            })()

            const daysLeft = myDoc?.expires_at
              ? Math.ceil((new Date(myDoc.expires_at).getTime() - Date.now()) / 86400000)
              : null

            // FIX 8 — drop zone visibility
            const showDropZone = effectiveStatus === 'missing'
              || effectiveStatus === 'optional_missing'
              || effectiveStatus === 'rejected'
              || effectiveStatus === 'expired'
              || (effectiveStatus === 'expiring_soon' && !!renewingDoc[rd.id])

            const cardCls = cn(
              'bg-card border rounded-2xl p-4 space-y-3 transition-all',
              effectiveStatus === 'rejected'
                ? 'border-destructive/40'
                : effectiveStatus === 'missing'
                  ? 'border-destructive/20'
                  : 'border-border',
            )

            return (
              <div
                key={rd.id}
                ref={(el) => { cardRef.current[rd.id] = el }}
                className={cardCls}
              >

                {/* Header */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <DocIcon className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground">{rd.name}</p>
                    {rd.description && (
                      <p className="text-[11px] text-muted-foreground">{rd.description}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                      rd.required ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {rd.required ? 'Obligatoire' : 'Optionnel'}
                  </span>
                </div>

                {/* approved */}
                {effectiveStatus === 'approved' && myDoc && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700">
                      <CheckCircle2 className="w-3 h-3 shrink-0" /> Validé
                    </span>
                    {myDoc.expires_at && (
                      <span className="text-[10px] font-semibold text-muted-foreground">
                        Expire le {fmtDate(myDoc.expires_at)}
                      </span>
                    )}
                    <button type="button" onClick={async () => { const u = await getSignedUrl(myDoc.id); if (u) { window.open(u, '_blank', 'noopener,noreferrer') } }} className="text-xs font-semibold text-primary hover:underline active:scale-95 transition-transform">Voir →</button>
                  </div>
                )}

                {/* expiring_soon */}
                {effectiveStatus === 'expiring_soon' && myDoc && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700">
                        <Clock className="w-3 h-3 shrink-0" /> Expire dans {daysLeft} jour{daysLeft !== 1 ? 's' : ''}
                      </span>
                      <button type="button" onClick={async () => { const u = await getSignedUrl(myDoc.id); if (u) { window.open(u, '_blank', 'noopener,noreferrer') } }} className="text-xs font-semibold text-primary hover:underline active:scale-95 transition-transform">Voir →</button>
                    </div>
                    {!renewingDoc[rd.id] && (
                      <button
                        type="button"
                        onClick={() => setRenewingDoc((r) => ({ ...r, [rd.id]: true }))}
                        className="w-full h-10 rounded-xl border border-amber-500/30 bg-amber-500/5 text-amber-700 text-xs font-bold active:scale-95 transition-transform"
                      >
                        Renouveler ce document
                      </button>
                    )}
                  </div>
                )}

                {/* expired */}
                {effectiveStatus === 'expired' && myDoc && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-destructive/10 text-destructive">
                    <AlertCircle className="w-3 h-3 shrink-0" /> Expiré le {fmtDate(myDoc.expires_at!)}
                  </span>
                )}

                {/* pending */}
                {effectiveStatus === 'pending' && (
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 animate-pulse">
                      <Clock className="w-3 h-3 shrink-0" /> En cours de validation
                    </span>
                    {myDoc && (
                      <>
                        <p className="text-[10px] text-muted-foreground">Déposé le {fmtDate(myDoc.uploaded_at)}</p>
                        <button type="button" onClick={async () => { const u = await getSignedUrl(myDoc.id); if (u) { window.open(u, '_blank', 'noopener,noreferrer') } }} className="text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-transform">Voir →</button>
                      </>
                    )}
                  </div>
                )}

                {/* rejected — motif + call-to-action explicite */}
                {effectiveStatus === 'rejected' && myDoc && (
                  <div className="rounded-xl bg-destructive/5 border border-destructive/30 p-3 space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                      <p className="text-xs font-bold text-destructive">Document refusé — envoyez-en un nouveau ↓</p>
                    </div>
                    {myDoc.rejection_reason && (
                      <p className="text-[11px] text-destructive/80 pl-5">Motif : {myDoc.rejection_reason}</p>
                    )}
                  </div>
                )}

                {/* optional_missing — neutre, pas d'urgence */}
                {effectiveStatus === 'optional_missing' && (
                  <p className="text-[11px] text-muted-foreground italic">
                    Document optionnel — vous pouvez le fournir si vous le souhaitez.
                  </p>
                )}

                {/* Zone de dépôt */}
                {showDropZone && (
                  uploading[rd.id] ? (
                    <div className="space-y-2 p-4 bg-muted/30 rounded-2xl">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Upload en cours…</span>
                        <span>{progress[rd.id] ?? 0}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-border overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${progress[rd.id] ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ) : selectedName[rd.id] ? (
                    /* AMÉL. 1 — file selected, waiting for explicit send */
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/20">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-primary truncate flex-1">
                          {selectedName[rd.id]}
                        </span>
                        <button
                          type="button"
                          onClick={() => clearPending(rd.id)}
                          className="text-muted-foreground hover:text-foreground active:scale-95 transition-transform shrink-0"
                          aria-label="Annuler"
                        >
                          <X className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleUpload(rd.id)}
                        className="w-full h-9 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
                      >
                        Envoyer ce document
                      </button>
                    </div>
                  ) : (
                    <label className="block border-2 border-dashed border-border rounded-2xl p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png,.webp"
                        onChange={(e) => {
                          const f = e.target.files?.[0]
                          if (f) { handleFileSelect(f, rd.id) }
                          e.target.value = ''
                        }}
                      />
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground group-hover:text-primary transition-colors mb-2 shrink-0" />
                      <p className="text-xs font-semibold text-foreground">
                        {effectiveStatus === 'rejected'
                          ? 'Renvoyer un document corrigé'
                          : effectiveStatus === 'optional_missing'
                            ? 'Fournir ce document (optionnel)'
                            : 'Choisir un fichier'}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">PDF, JPG, PNG ou WEBP · 5 Mo max</p>
                    </label>
                  )
                )}
              </div>
            )
          })}
        </section>
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
