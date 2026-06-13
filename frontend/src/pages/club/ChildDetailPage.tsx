import React, { useEffect, useState, useCallback } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Heart, FileCheck, Building2,
  Plus, X, CheckCircle, Loader2, UserPlus,
  FileText, ShieldCheck, Upload, AlertCircle, CheckCircle2, Clock,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { api } from '../../lib/api'
import AvatarUpload from '../../components/AvatarUpload'

// ─── Health score ─────────────────────────────────────────────────────────────

const calcHealthScore = (h: {
  blood_type: string | null; allergies: string[]; no_known_allergies?: boolean;
  treatments: string[]; no_known_treatments?: boolean;
  emergency_contact_name: string | null; emergency_contact_phone: string | null;
}) => [
  !!h.blood_type,
  h.allergies?.length > 0 || !!h.no_known_allergies,
  h.treatments?.length > 0 || !!h.no_known_treatments,
  !!h.emergency_contact_name,
  !!h.emergency_contact_phone,
].filter(Boolean).length

const HealthBadge: React.FC<{ score: number }> = ({ score }) => {
  if (score >= 5) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-[hsl(160,84%,39%)]/15 text-[hsl(160,84%,39%)] shrink-0">
        <CheckCircle className="w-3 h-3 shrink-0" />
        Complet
      </span>
    )
  }
  if (score >= 3) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-700 shrink-0">
        En cours
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700 shrink-0">
      À compléter
    </span>
  )
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface Child {
  id: string; firstname: string; lastname: string;
  birthdate: string | null; gender: string | null; phone: string | null;
  avatar_url: string | null; relationship: string; is_primary_contact: boolean;
  memberships: Array<{ id: string; organisation: { id: string; name: string; type: string }; role: { name: string }; status: string }>;
}

interface HealthInfo {
  blood_type: string | null;
  allergies: string[];
  no_known_allergies: boolean;
  treatments: string[];
  no_known_treatments: boolean;
  medical_notes: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
}

interface Authorization {
  type: string; title: string; description: string;
  id: string | null; is_signed: boolean; signed_at: string | null;
}

interface ChildMemberDocument {
  id: string
  required_document_id: string
  organisation_id: string
  original_name: string
  mime_type: string
  size_bytes: number
  status: 'pending' | 'approved' | 'rejected'
  uploaded_at: string
  expires_at: string | null
  rejection_reason: string | null
  required_document: {
    id: string
    name: string
    category: string
    expires_after_months: number | null
  }
  organisation: { id: string; name: string }
}

interface RequiredDoc {
  id: string
  name: string
  description: string | null
  required: boolean
  category: string
  expires_after_months: number | null
}

type Tab = 'profil' | 'sante' | 'autorisations' | 'documents' | 'clubs'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

// ─── Tag input ────────────────────────────────────────────────────────────────

const TagInput: React.FC<{
  values: string[]; onChange: (v: string[]) => void; placeholder: string;
}> = ({ values, onChange, placeholder }) => {
  const [input, setInput] = useState('')
  const add = () => {
    const v = input.trim()
    if (v && !values.includes(v)) { onChange([...values, v]) }
    setInput('')
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            {v}
            <button onClick={() => onChange(values.filter((x) => x !== v))} className="shrink-0">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1 h-9 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={add}
          disabled={!input.trim()}
          className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 shrink-0" />
        </button>
      </div>
    </div>
  )
}

// ─── ClubDocumentSection ──────────────────────────────────────────────────────

const ClubDocumentSection: React.FC<{
  childId: string
  membership: { id: string; organisation: { id: string; name: string } }
  childDocs: ChildMemberDocument[]
  localPending: Record<string, boolean>
  uploadProgress: Record<string, number>
  uploading: Record<string, boolean>
  onUpload: (file: File, requiredDocId: string, orgId: string, compositeKey: string) => void
  onGetSignedUrl: (docId: string) => Promise<string | null>
  refetch: () => void
}> = ({
  membership, childDocs, localPending, uploadProgress, uploading,
  onUpload, onGetSignedUrl,
}) => {
  const [requiredDocs, setRequiredDocs] = useState<RequiredDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<RequiredDoc[]>(`/organisations/${membership.organisation.id}/required-documents`)
      .then(setRequiredDocs)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [membership.organisation.id])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    )
  }

  if (requiredDocs.length === 0) {
    return (
      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold mb-2">
          {membership.organisation.name}
        </p>
        <p className="text-xs text-muted-foreground">Aucun document requis pour ce club.</p>
      </div>
    )
  }

  const validatedCount = requiredDocs.filter((rd) => {
    const doc = childDocs.find(
      (d) =>
        d.required_document_id === rd.id &&
        d.organisation_id === membership.organisation.id &&
        d.status === 'approved' &&
        (!d.expires_at || new Date(d.expires_at) > new Date()),
    )
    return !!doc
  }).length

  const allConform = validatedCount === requiredDocs.length

  return (
    <div className="space-y-3">
      {/* Header club */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          </div>
          <p className="text-sm font-display font-bold text-foreground">
            {membership.organisation.name}
          </p>
        </div>
        <span className="text-xs text-muted-foreground">{validatedCount}/{requiredDocs.length} conformes</span>
      </div>

      {/* Barre de progression ou banner conforme */}
      {allConform ? (
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <p className="text-xs font-bold text-emerald-800">Dossier complet pour {membership.organisation.name} ✓</p>
        </div>
      ) : (
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: requiredDocs.length ? `${(validatedCount / requiredDocs.length) * 100}%` : '0%' }}
          />
        </div>
      )}

      {/* Cards documents */}
      {requiredDocs.map((requiredDoc) => {
        const compositeKey = `${membership.organisation.id}-${requiredDoc.id}`
        const myDoc = childDocs
          .filter(
            (d) =>
              d.required_document_id === requiredDoc.id &&
              d.organisation_id === membership.organisation.id,
          )
          .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0]

        const effectiveStatus = (() => {
          if (localPending[compositeKey]) { return 'pending' as const }
          if (!myDoc) { return requiredDoc.required ? 'missing' as const : 'optional_missing' as const }
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

        const showDropZone = ['missing', 'optional_missing', 'rejected', 'expired'].includes(effectiveStatus)

        return (
          <div
            key={requiredDoc.id}
            className={cn(
              'bg-card border rounded-2xl p-4 space-y-3 transition-all',
              effectiveStatus === 'rejected'
                ? 'border-destructive/40'
                : effectiveStatus === 'missing'
                  ? 'border-destructive/20'
                  : 'border-border',
            )}
          >
            {/* Header doc */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {requiredDoc.category === 'medical' ? (
                  <Heart className="w-4 h-4" />
                ) : requiredDoc.category === 'identity' ? (
                  <User className="w-4 h-4" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-foreground">{requiredDoc.name}</p>
                {requiredDoc.description && (
                  <p className="text-[11px] text-muted-foreground">{requiredDoc.description}</p>
                )}
              </div>
              <span
                className={cn(
                  'text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0',
                  requiredDoc.required
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground',
                )}
              >
                {requiredDoc.required ? 'Obligatoire' : 'Optionnel'}
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
                <button
                  type="button"
                  onClick={async () => {
                    const u = await onGetSignedUrl(myDoc.id)
                    if (u) { window.open(u, '_blank', 'noopener,noreferrer') }
                  }}
                  className="text-xs font-semibold text-primary hover:underline active:scale-95 transition-transform"
                >
                  Voir →
                </button>
              </div>
            )}

            {/* expiring_soon */}
            {effectiveStatus === 'expiring_soon' && myDoc && (
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-700">
                  <Clock className="w-3 h-3 shrink-0" /> Expire dans {daysLeft} jour{daysLeft !== 1 ? 's' : ''}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const u = await onGetSignedUrl(myDoc.id)
                    if (u) { window.open(u, '_blank', 'noopener,noreferrer') }
                  }}
                  className="text-xs font-semibold text-primary hover:underline active:scale-95 transition-transform"
                >
                  Voir →
                </button>
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
                    <button
                      type="button"
                      onClick={async () => {
                        const u = await onGetSignedUrl(myDoc.id)
                        if (u) { window.open(u, '_blank', 'noopener,noreferrer') }
                      }}
                      className="text-xs font-semibold text-muted-foreground hover:text-foreground active:scale-95 transition-transform"
                    >
                      Voir →
                    </button>
                  </>
                )}
              </div>
            )}

            {/* rejected */}
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

            {/* optional_missing */}
            {effectiveStatus === 'optional_missing' && (
              <p className="text-[11px] text-muted-foreground italic">
                Document optionnel — vous pouvez le fournir si vous le souhaitez.
              </p>
            )}

            {/* Zone de dépôt */}
            {showDropZone && (
              uploading[compositeKey] ? (
                <div className="space-y-2 p-4 bg-muted/30 rounded-2xl">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Upload en cours…</span>
                    <span>{uploadProgress[compositeKey] ?? 0}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${uploadProgress[compositeKey] ?? 0}%` }}
                    />
                  </div>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-border rounded-2xl p-5 text-center cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-all group">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) { onUpload(f, requiredDoc.id, membership.organisation.id, compositeKey) }
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
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const ChildDetailPage: React.FC = () => {
  const { childId } = useParams<{ childId: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const goBack = () => {
    const from = (location.state as { from?: string } | null)?.from
    if (from) { navigate(from) } else { navigate(-1) }
  }

  const [child, setChild] = useState<Child | null>(null)
  const [authorizations, setAuthorizations] = useState<Authorization[]>([])
  const [organisations, setOrganisations] = useState<Array<{ id: string; name: string; type: string }>>([])

  const [tab, setTab] = useState<Tab>('profil')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [editForm, setEditForm] = useState({ firstname: '', lastname: '', birthdate: '', gender: 'male' as string, phone: '', avatar_url: '' })
  const [healthForm, setHealthForm] = useState<HealthInfo>({ blood_type: null, allergies: [], no_known_allergies: false, treatments: [], no_known_treatments: false, medical_notes: null, emergency_contact_name: null, emergency_contact_phone: null, emergency_contact_relation: null })
  const [enrollOrgId, setEnrollOrgId] = useState('')
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [enrollError, setEnrollError] = useState<string | null>(null)

  // ── Documents état ────────────────────────────────────────────────────────
  const [childDocs, setChildDocs] = useState<ChildMemberDocument[]>([])
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [localPending, setLocalPending] = useState<Record<string, boolean>>({})
  const [docUploadNotice, setDocUploadNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  useEffect(() => {
    if (!docUploadNotice) { return undefined }
    const id = window.setTimeout(() => setDocUploadNotice(null), 4000)
    return () => clearTimeout(id)
  }, [docUploadNotice])

  const showSuccess = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(null), 3000) }

  const refetchChildDocs = useCallback(async () => {
    if (!childId) { return }
    const docs = await api.get<ChildMemberDocument[]>(
      `/family/children/${childId}/documents`,
      undefined,
      { useCache: false },
    ).catch(() => [])
    setChildDocs(docs)
  }, [childId])

  const loadAll = useCallback(async () => {
    if (!childId) { return }
    try {
      setLoading(true)
      setError(null)
      const [kids, healthData, authData, orgsRaw] = await Promise.all([
        api.get<Child[]>('/family/children', undefined, { useCache: false }),
        api.get<HealthInfo>(`/family/children/${childId}/health`),
        api.get<Authorization[]>(`/family/children/${childId}/authorizations`),
        api.get<Array<{ organisation: { id: string; name: string; type: string } }>>('/users/me/organisations').catch(() => []),
      ])
      const found = kids.find((c) => c.id === childId)
      if (!found) { setError('Enfant introuvable.'); return }
      setChild(found)
      setEditForm({ firstname: found.firstname, lastname: found.lastname, birthdate: found.birthdate ? found.birthdate.slice(0, 10) : '', gender: found.gender || 'male', phone: found.phone || '', avatar_url: found.avatar_url || '' })
      setHealthForm(healthData)
      setAuthorizations(authData)
      const seenIds = new Set<string>()
      setOrganisations(orgsRaw.map((o) => o.organisation).filter((o) => { if (seenIds.has(o.id)) return false; seenIds.add(o.id); return true }))
    } catch {
      setError('Impossible de charger les données.')
    } finally {
      setLoading(false)
    }
  }, [childId])

  useEffect(() => { loadAll() }, [loadAll])

  // Charger les documents enfant indépendamment (pas bloquant pour le reste)
  useEffect(() => {
    if (!childId) { return }
    setLoadingDocs(true)
    api.get<ChildMemberDocument[]>(`/family/children/${childId}/documents`)
      .then(setChildDocs)
      .catch(() => {})
      .finally(() => setLoadingDocs(false))
  }, [childId])

  const handleChildUpload = useCallback(async (
    file: File,
    requiredDocId: string,
    orgId: string,
    compositeKey: string,
  ) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setDocUploadNotice({ type: 'error', message: 'Format non supporté — PDF, JPG, PNG ou WEBP uniquement.' })
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocUploadNotice({ type: 'error', message: 'Fichier trop lourd — 5 Mo maximum.' })
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('requiredDocumentId', requiredDocId)
    formData.append('organisationId', orgId)

    setUploading((u) => ({ ...u, [compositeKey]: true }))
    setUploadProgress((p) => ({ ...p, [compositeKey]: 0 }))

    try {
      await api.getInstance().post(
        `/family/children/${childId}/documents`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (ev) => {
            if (ev.total) {
              setUploadProgress((p) => ({ ...p, [compositeKey]: Math.round((ev.loaded / ev.total!) * 100) }))
            }
          },
        },
      )
      setLocalPending((p) => ({ ...p, [compositeKey]: true }))
      setUploadProgress((p) => ({ ...p, [compositeKey]: 0 }))
      setUploading((u) => ({ ...u, [compositeKey]: false }))
      setDocUploadNotice({ type: 'success', message: 'Document envoyé — en attente de validation.' })
      void refetchChildDocs()
    } catch {
      setUploading((u) => ({ ...u, [compositeKey]: false }))
      setUploadProgress((p) => ({ ...p, [compositeKey]: 0 }))
      setDocUploadNotice({ type: 'error', message: "Erreur lors de l'envoi. Veuillez réessayer." })
    }
  }, [childId, refetchChildDocs])

  const getChildSignedUrl = useCallback(async (docId: string): Promise<string | null> => {
    try {
      const res = await api.get<{ url: string }>(
        `/family/children/${childId}/documents/${docId}/signed-url`,
        undefined,
        { useCache: false },
      )
      return res.url
    } catch {
      setDocUploadNotice({ type: 'error', message: "Impossible d'ouvrir le fichier." })
      return null
    }
  }, [childId])

  const saveProfil = async () => {
    if (!childId) { return }
    setSaving(true)
    try {
      await api.put(`/family/children/${childId}`, editForm)
      await loadAll()
      showSuccess('Profil mis à jour !')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const saveHealth = async () => {
    if (!childId) { return }
    setSaving(true)
    try {
      const { blood_type, allergies, no_known_allergies, treatments, no_known_treatments, medical_notes, emergency_contact_name, emergency_contact_phone, emergency_contact_relation } = healthForm
      await api.put(`/family/children/${childId}/health`, { blood_type, allergies, no_known_allergies, treatments, no_known_treatments, medical_notes, emergency_contact_name, emergency_contact_phone, emergency_contact_relation })
      showSuccess('Fiche santé sauvegardée !')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  const toggleAuthorization = async (auth: Authorization) => {
    if (!childId) { return }
    setSaving(true)
    setAuthorizations((prev) =>
      prev.map((a) =>
        a.type === auth.type
          ? { ...a, is_signed: !a.is_signed, signed_at: !a.is_signed ? new Date().toISOString() : null }
          : a,
      ),
    )
    try {
      if (auth.is_signed) {
        await api.delete(`/family/children/${childId}/authorizations/${auth.type}/sign`)
      } else {
        await api.post(`/family/children/${childId}/authorizations/${auth.type}/sign`, {})
      }
      api.clearCache(`/family/children/${childId}/authorizations`)
      const updated = await api.get<Authorization[]>(
        `/family/children/${childId}/authorizations`,
        undefined,
        { useCache: false },
      )
      setAuthorizations(updated)
      showSuccess(auth.is_signed ? 'Autorisation retirée.' : 'Autorisation signée ! ✓')
    } catch (e) {
      setAuthorizations((prev) =>
        prev.map((a) =>
          a.type === auth.type ? { ...a, is_signed: auth.is_signed, signed_at: auth.signed_at } : a,
        ),
      )
      setError(e instanceof Error ? e.message : 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  const enroll = async () => {
    if (!childId || !enrollOrgId) { return }
    setSaving(true)
    setEnrollError(null)
    try {
      await api.post(`/family/children/${childId}/memberships`, { organisation_id: enrollOrgId })
      setShowEnrollModal(false)
      setEnrollOrgId('')
      await loadAll()
      showSuccess('Inscription au club réussie !')
    } catch (e) {
      setEnrollError(e instanceof Error ? e.message : "Erreur lors de l'inscription.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!child) {
    return (
      <div className="space-y-4">
        <button onClick={goBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 shrink-0" /> Retour
        </button>
        <p className="text-destructive">Enfant introuvable.</p>
      </div>
    )
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profil',        label: 'Profil',        icon: <User className="w-4 h-4 shrink-0" /> },
    { id: 'sante',         label: 'Santé',         icon: <Heart className="w-4 h-4 shrink-0" /> },
    { id: 'autorisations', label: 'Autorisations', icon: <FileCheck className="w-4 h-4 shrink-0" /> },
    { id: 'documents',     label: 'Documents',     icon: <FileText className="w-4 h-4 shrink-0" /> },
    { id: 'clubs',         label: 'Clubs',         icon: <Building2 className="w-4 h-4 shrink-0" /> },
  ]

  const enrolledIds = new Set(child.memberships.map((m) => m.organisation.id))
  const availableOrgs = organisations.filter((o) => !enrolledIds.has(o.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={goBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors active:scale-95"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">
            {child.firstname} {child.lastname}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {child.gender === 'male' ? 'Garçon' : child.gender === 'female' ? 'Fille' : 'Enfant'}
            {child.birthdate && ` · ${Math.floor((Date.now() - new Date(child.birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365))} ans`}
          </p>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto shrink-0 text-destructive/60 hover:text-destructive">
            <X className="w-4 h-4 shrink-0" />
          </button>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-[hsl(160,84%,39%)]/30 bg-[hsl(160,84%,39%)]/5 p-4">
          <CheckCircle className="w-4 h-4 shrink-0 text-[hsl(160,84%,39%)]" />
          <p className="text-sm font-semibold text-[hsl(160,84%,39%)]">{successMsg}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-2xl p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t.id
                ? 'bg-card text-foreground shadow-sm border border-border'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab: Profil ── */}
      {tab === 'profil' && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
          <h2 className="font-display text-base font-bold text-foreground">Informations personnelles</h2>

          <div className="flex justify-center pb-2">
            <AvatarUpload
              currentUrl={editForm.avatar_url || null}
              name={`${editForm.firstname} ${editForm.lastname}`}
              color="hsl(217,91%,60%)"
              shape="circle"
              size="lg"
              onUpload={async (url) => {
                setEditForm((f) => ({ ...f, avatar_url: url }))
                await api.put(`/family/children/${childId}`, { avatar_url: url })
                showSuccess('Photo mise à jour !')
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Prénom</label>
              <input
                value={editForm.firstname}
                onChange={(e) => setEditForm((f) => ({ ...f, firstname: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Nom</label>
              <input
                value={editForm.lastname}
                onChange={(e) => setEditForm((f) => ({ ...f, lastname: e.target.value }))}
                className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Date de naissance</label>
            <input
              type="date"
              value={editForm.birthdate}
              onChange={(e) => setEditForm((f) => ({ ...f, birthdate: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Genre</label>
            <div className="flex gap-2">
              {[{ v: 'male', l: 'Garçon' }, { v: 'female', l: 'Fille' }, { v: 'prefer_not_to_say', l: 'Non précisé' }].map(({ v, l }) => (
                <button
                  key={v}
                  onClick={() => setEditForm((f) => ({ ...f, gender: v }))}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-colors ${
                    editForm.gender === v ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:border-primary/40'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Téléphone</label>
            <input
              value={editForm.phone}
              onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="Optionnel"
              className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <button
            onClick={saveProfil}
            disabled={saving}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {saving ? 'Enregistrement…' : 'Sauvegarder'}
          </button>
        </div>
      )}

      {/* ── Tab: Santé ── */}
      {tab === 'sante' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Fiche santé</p>
            <HealthBadge score={calcHealthScore(healthForm)} />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-foreground">Groupe sanguin</h2>
            <div className="flex flex-wrap gap-2">
              {BLOOD_TYPES.map((bt) => (
                <button
                  key={bt}
                  onClick={() => setHealthForm((h) => ({ ...h, blood_type: h.blood_type === bt ? null : bt }))}
                  className={`px-3 py-1.5 rounded-xl text-sm font-bold border-2 transition-colors ${
                    healthForm.blood_type === bt ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-foreground hover:border-primary/40'
                  }`}
                >
                  {bt}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-foreground">Allergies</h2>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={healthForm.no_known_allergies}
                onChange={(e) => setHealthForm((h) => ({
                  ...h,
                  no_known_allergies: e.target.checked,
                  allergies: e.target.checked ? [] : h.allergies,
                }))}
                className="w-4 h-4 rounded border-border accent-primary shrink-0"
              />
              <span className="text-sm text-muted-foreground">Aucune allergie connue</span>
            </label>
            {!healthForm.no_known_allergies && (
              <>
                <p className="text-xs text-muted-foreground">Alimentaires, médicamenteuses, environnementales…</p>
                <TagInput
                  values={healthForm.allergies}
                  onChange={(v) => setHealthForm((h) => ({ ...h, allergies: v }))}
                  placeholder="Ex : arachides, pénicilline…"
                />
              </>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-foreground">Traitements en cours</h2>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={healthForm.no_known_treatments}
                onChange={(e) => setHealthForm((h) => ({
                  ...h,
                  no_known_treatments: e.target.checked,
                  treatments: e.target.checked ? [] : h.treatments,
                }))}
                className="w-4 h-4 rounded border-border accent-primary shrink-0"
              />
              <span className="text-sm text-muted-foreground">Aucun traitement en cours</span>
            </label>
            {!healthForm.no_known_treatments && (
              <>
                <p className="text-xs text-muted-foreground">Médicaments ou suivis médicaux réguliers</p>
                <TagInput
                  values={healthForm.treatments}
                  onChange={(v) => setHealthForm((h) => ({ ...h, treatments: v }))}
                  placeholder="Ex : Ventoline, Doliprane…"
                />
              </>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-foreground">Notes médicales</h2>
            <textarea
              value={healthForm.medical_notes ?? ''}
              onChange={(e) => setHealthForm((h) => ({ ...h, medical_notes: e.target.value || null }))}
              placeholder="Informations importantes pour les encadrants…"
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-display text-base font-bold text-foreground">Contact d'urgence</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Nom</label>
                <input
                  value={healthForm.emergency_contact_name ?? ''}
                  onChange={(e) => setHealthForm((h) => ({ ...h, emergency_contact_name: e.target.value || null }))}
                  placeholder="Ex : Marie Dupont"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Téléphone</label>
                <input
                  value={healthForm.emergency_contact_phone ?? ''}
                  onChange={(e) => setHealthForm((h) => ({ ...h, emergency_contact_phone: e.target.value || null }))}
                  placeholder="06 00 00 00 00"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Lien de parenté</label>
                <input
                  value={healthForm.emergency_contact_relation ?? ''}
                  onChange={(e) => setHealthForm((h) => ({ ...h, emergency_contact_relation: e.target.value || null }))}
                  placeholder="Ex : Conjoint·e, Grand-parent…"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
          </div>

          <button
            onClick={saveHealth}
            disabled={saving}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {saving ? 'Enregistrement…' : 'Sauvegarder la fiche santé'}
          </button>
        </div>
      )}

      {/* ── Tab: Autorisations ── */}
      {tab === 'autorisations' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Signez les autorisations parentales pour votre enfant. Votre signature est horodatée et enregistrée de façon sécurisée.
          </p>
          {authorizations.map((auth) => (
            <div
              key={auth.type}
              className={`bg-card border rounded-2xl p-5 transition-colors ${
                auth.is_signed ? 'border-[hsl(160,84%,39%)]/30' : 'border-border'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    auth.is_signed ? 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,39%)]' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <FileCheck className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground">{auth.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{auth.description}</p>
                  {auth.is_signed && auth.signed_at && (
                    <p className="text-xs text-[hsl(160,84%,39%)] font-semibold mt-1.5">
                      ✓ Signé le {new Date(auth.signed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => toggleAuthorization(auth)}
                  disabled={saving}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95 disabled:opacity-50 ${
                    auth.is_signed
                      ? 'border-2 border-destructive/40 text-destructive hover:bg-destructive/5'
                      : 'bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20'
                  }`}
                >
                  {auth.is_signed ? 'Retirer ma signature' : 'Signer cette autorisation'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Documents ── */}
      {tab === 'documents' && (
        <div className="space-y-4">
          {/* Header */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Documents administratifs
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Documents requis par les clubs de {child.firstname}
            </p>
          </div>

          {/* Notice upload */}
          {docUploadNotice && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-medium',
                docUploadNotice.type === 'success'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
                  : 'border-destructive/30 bg-destructive/10 text-destructive',
              )}
            >
              {docUploadNotice.type === 'success'
                ? <CheckCircle2 className="w-4 h-4 shrink-0" />
                : <AlertCircle className="w-4 h-4 shrink-0" />}
              {docUploadNotice.message}
            </div>
          )}

          {/* Aucun club */}
          {child.memberships.length === 0 && (
            <div className="bg-card border border-dashed border-border rounded-2xl p-8 text-center space-y-2">
              <FileText className="w-8 h-8 mx-auto text-muted-foreground/40" />
              <p className="text-sm font-semibold text-foreground">Aucun club</p>
              <p className="text-xs text-muted-foreground">
                {child.firstname} doit être inscrit dans un club pour avoir des documents à fournir.
              </p>
            </div>
          )}

          {/* Chargement initial */}
          {loadingDocs && child.memberships.length > 0 && (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Un bloc par club */}
          {!loadingDocs && child.memberships.map((membership) => (
            <ClubDocumentSection
              key={membership.id}
              childId={childId!}
              membership={membership}
              childDocs={childDocs}
              localPending={localPending}
              uploadProgress={uploadProgress}
              uploading={uploading}
              onUpload={handleChildUpload}
              onGetSignedUrl={getChildSignedUrl}
              refetch={refetchChildDocs}
            />
          ))}
        </div>
      )}

      {/* ── Tab: Clubs ── */}
      {tab === 'clubs' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              Inscriptions ({child.memberships.length})
            </p>
            {availableOrgs.length > 0 && (
              <button
                onClick={() => { setShowEnrollModal(true); setEnrollOrgId(''); setEnrollError(null) }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-semibold hover:opacity-90 active:scale-95 transition-all"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                Inscrire dans un club
              </button>
            )}
          </div>

          {child.memberships.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-10 text-center space-y-3">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-base font-bold text-foreground">Non inscrit</h2>
              <p className="text-sm text-muted-foreground">{child.firstname} n'est inscrit dans aucun club.</p>
              {availableOrgs.length > 0 && (
                <button
                  onClick={() => { setShowEnrollModal(true); setEnrollOrgId(''); setEnrollError(null) }}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all"
                >
                  <UserPlus className="w-4 h-4 shrink-0" />
                  Inscrire dans un club
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {child.memberships.map((m) => (
                <div key={m.id} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5 text-primary shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm">{m.organisation.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{m.role.name}</p>
                  </div>
                  <span
                    className={`shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                      m.status === 'active' ? 'bg-[hsl(160,84%,39%)]/10 text-[hsl(160,84%,39%)]' : 'bg-amber-500/10 text-amber-700'
                    }`}
                  >
                    {m.status === 'active' ? 'Actif' : 'En attente'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal — Inscription club */}
      {showEnrollModal && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-foreground">Inscrire {child.firstname}</h2>
              <button onClick={() => setShowEnrollModal(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4 shrink-0" />
              </button>
            </div>
            {enrollError && <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2">{enrollError}</p>}
            <div>
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold block mb-1.5">Sélectionner un club</label>
              <select
                value={enrollOrgId}
                onChange={(e) => setEnrollOrgId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              >
                <option value="">Choisir un club…</option>
                {availableOrgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowEnrollModal(false)} className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-semibold text-foreground hover:bg-muted active:scale-95 transition-all">
                Annuler
              </button>
              <button
                onClick={enroll}
                disabled={saving || !enrollOrgId}
                className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? 'Inscription…' : 'Inscrire'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChildDetailPage
