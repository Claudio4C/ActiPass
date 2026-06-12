import React, { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileText, CheckCircle2, Clock, X, Check,
  Plus, Trash2, Eye, ChevronDown, ChevronUp,
  FilePlus2, Edit3, ImageIcon, Loader2,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import RoleBasedRoute from '../../components/shared/RoleBasedRoute'
import { useRequiredDocuments } from '../../hooks/useRequiredDocuments'
import { useMemberDocuments } from '../../hooks/useMemberDocuments'
import { useClubCompliance } from '../../hooks/useClubCompliance'

// ─── Types ────────────────────────────────────────────────────────────────────

type DocStatus = 'validated' | 'pending' | 'missing' | 'rejected' | 'expired'
type DocCategory = 'identity' | 'medical' | 'administrative' | 'other'

interface RequiredDoc {
  id: string
  name: string
  description: string
  required: boolean
  expires_after_months?: number
  category: DocCategory
}

interface SubmittedDoc {
  id: string
  memberName: string
  memberInitials: string
  docType: string
  fileName: string
  sizeKo: number
  isImage: boolean
  submittedAt: string
}

interface MemberCompliance {
  id: string
  name: string
  initials: string
  documents: { type: string; status: DocStatus }[]
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_REQUIRED: RequiredDoc[] = [
  { id: '1', name: 'Certificat médical', description: 'Non contre-indication à la pratique sportive (moins d\'un an)', required: true, expires_after_months: 12, category: 'medical' },
  { id: '2', name: 'Photo d\'identité', description: 'Photo récente au format JPG/PNG', required: true, category: 'identity' },
  { id: '3', name: 'Pièce d\'identité', description: 'CNI ou passeport en cours de validité', required: true, category: 'identity' },
  { id: '4', name: 'Attestation d\'assurance', description: 'Attestation RC (optionnel si assurance incluse)', required: false, category: 'administrative' },
]

const MOCK_SUBMITTED: SubmittedDoc[] = [
  { id: 's1', memberName: 'Sophie Martin', memberInitials: 'SM', docType: 'Certificat médical', fileName: 'certif-martin.pdf', sizeKo: 1230, isImage: false, submittedAt: '2026-05-28T10:30:00Z' },
  { id: 's2', memberName: 'Lucas Bernard', memberInitials: 'LB', docType: 'Photo d\'identité', fileName: 'photo-bernard.jpg', sizeKo: 820, isImage: true, submittedAt: '2026-05-27T14:15:00Z' },
  { id: 's3', memberName: 'Sophie Martin', memberInitials: 'SM', docType: 'Pièce d\'identité', fileName: 'cni-martin.pdf', sizeKo: 2100, isImage: false, submittedAt: '2026-05-28T10:32:00Z' },
]

const MOCK_COMPLIANCE: MemberCompliance[] = [
  { id: 'm1', name: 'Sophie Martin', initials: 'SM', documents: [
    { type: 'Certificat médical', status: 'pending' },
    { type: 'Photo d\'identité', status: 'validated' },
    { type: 'Pièce d\'identité', status: 'pending' },
  ]},
  { id: 'm2', name: 'Lucas Bernard', initials: 'LB', documents: [
    { type: 'Certificat médical', status: 'validated' },
    { type: 'Photo d\'identité', status: 'pending' },
    { type: 'Pièce d\'identité', status: 'validated' },
  ]},
  { id: 'm3', name: 'Emma Dupont', initials: 'ED', documents: [
    { type: 'Certificat médical', status: 'missing' },
    { type: 'Photo d\'identité', status: 'validated' },
    { type: 'Pièce d\'identité', status: 'missing' },
  ]},
  { id: 'm4', name: 'Thomas Leroy', initials: 'TL', documents: [
    { type: 'Certificat médical', status: 'validated' },
    { type: 'Photo d\'identité', status: 'validated' },
    { type: 'Pièce d\'identité', status: 'validated' },
  ]},
]

const PRESETS: Omit<RequiredDoc, 'id'>[] = [
  { name: 'Certificat médical', description: 'Non contre-indication (moins d\'un an)', category: 'medical', required: true, expires_after_months: 12 },
  { name: 'Photo d\'identité', description: 'Photo récente JPG/PNG', category: 'identity', required: true },
  { name: 'Pièce d\'identité', description: 'CNI ou passeport', category: 'identity', required: true },
  { name: 'Attestation d\'assurance', description: 'Attestation RC', category: 'administrative', required: false },
  { name: 'Formulaire CERFA/B3', description: 'Formulaire fédéral', category: 'administrative', required: true },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
  'hsl(217,91%,60%)', 'hsl(280,70%,60%)', 'hsl(25,95%,53%)',
  'hsl(160,84%,39%)', 'hsl(340,75%,55%)',
]
const avatarColor = (s: string) => AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

const fmtSize = (ko: number) =>
  ko >= 1000 ? `${(ko / 1000).toFixed(1)} Mo` : `${ko} Ko`

const PILL_CLS: Record<DocStatus, { label: string; cls: string; tone: 'danger' | 'warn' | 'success' | 'neutral' }> = {
  validated: { label: 'Validé',     cls: 'bg-emerald-500/5 text-emerald-700 border-emerald-500/20',   tone: 'success' },
  pending:   { label: 'En attente', cls: 'bg-amber-500/5 text-amber-700 border-amber-500/20',         tone: 'warn' },
  missing:   { label: 'Manquant',   cls: 'bg-destructive/5 text-destructive border-destructive/20',   tone: 'danger' },
  rejected:  { label: 'Refusé',     cls: 'bg-destructive/5 text-destructive border-destructive/20',   tone: 'danger' },
  expired:   { label: 'Expiré',     cls: 'bg-muted text-muted-foreground border-border',              tone: 'neutral' },
}

const CAT_LABEL: Record<DocCategory, string> = {
  medical: 'Médical', identity: 'Identité', administrative: 'Administratif', other: 'Autre',
}

// ─── Tab — Paramètres ─────────────────────────────────────────────────────────

const TabSettings: React.FC<{
  docs: RequiredDoc[]
  onAdd: (d: Omit<RequiredDoc, 'id'>) => void
  onToggle: (id: string) => void
  onDelete: (id: string) => void
}> = ({ docs, onAdd, onToggle, onDelete }) => {
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]     = useState<string | null>(null)
  const [name, setName]         = useState('')
  const [desc, setDesc]         = useState('')
  const [cat, setCat]           = useState<DocCategory>('other')
  const [req, setReq]           = useState(true)
  const [months, setMonths]     = useState('')

  const resetForm = () => { setName(''); setDesc(''); setCat('other'); setReq(true); setMonths(''); setEditId(null); setShowForm(false) }

  const submit = () => {
    if (!name.trim()) { return }
    onAdd({ name: name.trim(), description: desc.trim(), category: cat, required: req, expires_after_months: months ? Number(months) : undefined })
    resetForm()
  }

  return (
    <div className="space-y-4">
      {/* Présets */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Présets standards</p>
          <p className="text-xs text-muted-foreground mt-0.5">Ajoutez en un clic les documents les plus courants.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const exists = docs.some((d) => d.name.toLowerCase() === p.name.toLowerCase())
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => !exists && onAdd(p)}
                disabled={exists}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition-all active:scale-95',
                  exists
                    ? 'bg-muted border-transparent text-muted-foreground cursor-not-allowed opacity-60'
                    : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-primary/5',
                )}
              >
                {exists
                  ? <CheckCircle2 className="w-3 h-3 shrink-0 text-emerald-600" />
                  : <Plus className="w-3 h-3 shrink-0" />}
                {p.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Liste documents requis */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Documents configurés</p>
          <p className="text-xs text-muted-foreground">{docs.length} type{docs.length !== 1 ? 's' : ''} de document{docs.length !== 1 ? 's' : ''}</p>
        </div>

        {docs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 m-3 text-center text-xs text-muted-foreground">
            Aucun document requis configuré 📄
          </div>
        ) : (
          <ul className="divide-y divide-border p-2 space-y-0">
            {docs.map((doc) => (
              <li key={doc.id} className="bg-card border border-border rounded-2xl p-3 mb-2 last:mb-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4 shrink-0" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{doc.name}</p>
                      <span className={cn(
                        'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                        doc.required ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
                      )}>
                        {doc.required ? 'Obligatoire' : 'Optionnel'}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {CAT_LABEL[doc.category]}
                      </span>
                      {doc.expires_after_months && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700">
                          Valide {doc.expires_after_months} mois
                        </span>
                      )}
                    </div>
                    {doc.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{doc.description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggle(doc.id)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform shrink-0"
                    title={doc.required ? 'Rendre optionnel' : 'Rendre obligatoire'}
                  >
                    <Edit3 className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(doc.id)}
                    className="w-8 h-8 rounded-full bg-destructive/10 text-destructive flex items-center justify-center active:scale-95 transition-transform shrink-0"
                    title="Supprimer"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Formulaire ajout personnalisé */}
        {showForm && (
          <div className="mx-3 mb-3 p-4 rounded-2xl border border-border bg-muted/30 space-y-3">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">Nouveau document</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Nom</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex : Autorisation parentale"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Catégorie</label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value as DocCategory)}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                >
                  <option value="medical">Médical</option>
                  <option value="identity">Identité</option>
                  <option value="administrative">Administratif</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Description (optionnel)</label>
                <input
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Ex : Signé par un médecin"
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground block mb-1">Validité (mois, optionnel)</label>
                <input
                  type="number"
                  value={months}
                  onChange={(e) => setMonths(e.target.value)}
                  placeholder="Ex : 12"
                  min={1}
                  className="w-full h-10 px-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={req} onChange={(e) => setReq(e.target.checked)} className="rounded border-border text-primary focus:ring-primary" />
                <span className="text-sm font-medium text-foreground">Obligatoire</span>
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={resetForm} className="h-9 px-4 rounded-xl border border-border text-sm font-semibold text-foreground hover:bg-muted transition-colors">Annuler</button>
                <button type="button" onClick={submit} disabled={!name.trim()} className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all active:scale-95">Ajouter</button>
              </div>
            </div>
          </div>
        )}

        {/* Bouton ajout dashed */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="w-full h-11 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 text-primary text-xs font-bold inline-flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all"
          >
            <FilePlus2 className="w-4 h-4 shrink-0" />
            {showForm ? 'Annuler la saisie' : 'Ajouter un document personnalisé'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab — À valider ──────────────────────────────────────────────────────────

const TabToReview: React.FC<{
  docs: SubmittedDoc[]
  onValidate: (id: string) => void
  onReject: (id: string, reason: string) => void
  onView?: (id: string) => Promise<void>
}> = ({ docs, onValidate, onReject, onView }) => {
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [reason, setReason]           = useState('')

  const confirmReject = (id: string) => {
    onReject(id, reason)
    setRejectingId(null)
    setReason('')
  }

  if (docs.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground font-medium">
        Aucun document à valider 🎉
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="px-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
          {docs.length} document{docs.length !== 1 ? 's' : ''} en attente
        </p>
      </div>
      <ul className="space-y-2">
        {docs.map((doc) => (
          <li key={doc.id} className="bg-card border border-border rounded-2xl p-3">
            <div className="flex items-start gap-3">
              {/* File icon */}
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {doc.isImage
                  ? <ImageIcon className="w-5 h-5 shrink-0" />
                  : <FileText className="w-5 h-5 shrink-0" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{doc.docType}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {doc.memberName} · {doc.fileName} · {fmtSize(doc.sizeKo)}
                </p>
                <p className="text-[10px] text-muted-foreground">Envoyé le {fmtDate(doc.submittedAt)}</p>
              </div>
              {/* Voir */}
              <button
                type="button"
                onClick={() => void onView?.(doc.id)}
                className="w-8 h-8 rounded-full bg-muted flex items-center justify-center active:scale-95 transition-transform shrink-0"
                title="Aperçu"
              >
                <Eye className="w-4 h-4 shrink-0 text-muted-foreground" />
              </button>
            </div>

            {/* Actions valider / refuser */}
            {rejectingId !== doc.id && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setRejectingId(doc.id); setReason('') }}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-destructive/10 text-destructive text-xs font-bold active:scale-95 transition-transform"
                >
                  <X className="w-3.5 h-3.5 shrink-0" /> Refuser
                </button>
                <button
                  type="button"
                  onClick={() => onValidate(doc.id)}
                  className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold active:scale-95 transition-transform"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" /> Valider
                </button>
              </div>
            )}

            {/* Form refus inline */}
            {rejectingId === doc.id && (
              <div className="mt-3 space-y-2">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Motif du refus (visible par le membre)…"
                  rows={2}
                  maxLength={300}
                  className="w-full text-xs p-2.5 rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary/30 resize-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectingId(null)}
                    className="py-2 rounded-xl bg-muted text-foreground text-xs font-bold active:scale-95 transition-transform"
                  >
                    Annuler
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmReject(doc.id)}
                    disabled={reason.trim().length < 5}
                    className={cn(
                      'py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform',
                      reason.trim().length >= 5
                        ? 'bg-destructive text-destructive-foreground'
                        : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50',
                    )}
                  >
                    Confirmer le refus
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground text-center">
                  {reason.trim().length}/5 caractères minimum · visible par le membre
                </p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── Tab — Conformité ─────────────────────────────────────────────────────────

const TabCompliance: React.FC<{ members: MemberCompliance[] }> = ({ members }) => {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set())
  const [filter, setFilter]   = useState<'all' | 'incomplete'>('all')

  const toggle = (id: string) =>
    setOpenIds((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const isCompliant = (m: MemberCompliance) => m.documents.every((d) => d.status === 'validated')
  const compliantCount = members.filter(isCompliant).length
  const pendingCount   = members.filter((m) => m.documents.some((d) => d.status === 'pending')).length
  const problemCount   = members.filter((m) => m.documents.some((d) => ['missing', 'rejected', 'expired'].includes(d.status))).length

  const displayed = filter === 'incomplete' ? members.filter((m) => !isCompliant(m)) : members

  const KPI_CARDS = [
    { label: 'Membres',        value: members.length,  tone: 'neutral'  as const, hint: 'au total' },
    { label: 'Conformes',      value: compliantCount,  tone: 'success'  as const, hint: 'docs validés' },
    { label: 'En attente',     value: pendingCount,    tone: 'warn'     as const, hint: 'à valider' },
    { label: 'Problèmes',      value: problemCount,    tone: 'danger'   as const, hint: 'manquants / refusés' },
  ]

  const kpiCls = {
    neutral: 'bg-muted text-foreground border-border',
    success: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    warn:    'bg-amber-500/10 text-amber-700 border-amber-500/20',
    danger:  'bg-destructive/10 text-destructive border-destructive/20',
  }

  return (
    <div className="space-y-4">
      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {KPI_CARDS.map((k) => (
          <div key={k.label} className={cn('border rounded-2xl p-4', kpiCls[k.tone])}>
            <p className="font-display text-2xl font-bold">{k.value}</p>
            <p className="text-[11px] font-bold uppercase tracking-wider mt-0.5">{k.label}</p>
            <p className="text-[10px] opacity-70 mt-0.5">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Filtre */}
      <div className="flex gap-2">
        {(['all', 'incomplete'] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'h-8 px-4 rounded-full text-xs font-semibold border transition-colors active:scale-95',
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:bg-muted',
            )}
          >
            {f === 'all' ? 'Tous les membres' : 'Non conformes uniquement'}
          </button>
        ))}
      </div>

      {/* Accordéon */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {displayed.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 m-3 text-center text-sm text-muted-foreground font-medium">
            Tous les membres sont conformes 🎉
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {displayed.map((m) => {
              const open = openIds.has(m.id)
              const compliant = isCompliant(m)
              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => toggle(m.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/40 transition-colors text-left"
                  >
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white shrink-0"
                      style={{ backgroundColor: avatarColor(m.initials) }}
                    >
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{m.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.documents.map((d) => {
                          const cfg = PILL_CLS[d.status]
                          return (
                            <span key={d.type} className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border', cfg.cls)}>
                              {d.type} · {cfg.label}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={cn(
                        'text-[10px] font-bold px-2 py-1 rounded-full',
                        compliant
                          ? 'bg-emerald-500/10 text-emerald-700'
                          : 'bg-destructive/10 text-destructive',
                      )}>
                        {compliant ? 'Conforme' : 'Non conforme'}
                      </span>
                      {open
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    </div>
                  </button>

                  {open && (
                    <div className="px-4 pb-4 border-t border-border bg-muted/20">
                      <ul className="space-y-2 pt-3">
                        {m.documents.map((d) => {
                          const cfg = PILL_CLS[d.status]
                          return (
                            <li key={d.type} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span className="text-sm font-medium text-foreground">{d.type}</span>
                              </div>
                              <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-lg border', cfg.cls)}>
                                {cfg.label}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                      {!compliant && (
                        <button type="button" className="mt-3 text-xs font-semibold text-primary hover:underline active:scale-95 transition-transform">
                          Envoyer un rappel →
                        </button>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type Tab = 'settings' | 'review' | 'compliance'

const AdminDocumentsPage: React.FC = () => {
  const { organisationId } = useParams<{ organisationId: string }>()

  const [activeTab, setActiveTab] = useState<Tab>('settings')

  const reqDocs      = useRequiredDocuments(organisationId)
  const memberDocs   = useMemberDocuments(organisationId, 'all', 'pending')
  const compliance   = useClubCompliance(organisationId)

  // Map RequiredDocument (API) → RequiredDoc (component shape)
  const requiredDocs: RequiredDoc[] = reqDocs.items.map((d) => ({
    id:                   d.id,
    name:                 d.name,
    description:          d.description ?? '',
    required:             d.required,
    category:             d.category,
    expires_after_months: d.expires_after_months ?? undefined,
  }))

  const pendingCount = memberDocs.views.length

  const TABS: { id: Tab; label: string; badge?: number; tone?: 'danger' }[] = [
    { id: 'settings',   label: 'Paramètres' },
    { id: 'review',     label: 'À valider', badge: pendingCount || 0, tone: 'danger' },
    { id: 'compliance', label: 'Conformité' },
  ]

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    if (tab === 'review')      { void memberDocs.refetch() }
    if (tab === 'compliance')  { void compliance.refetch() }
    if (tab === 'settings')    { void reqDocs.refetch() }
  }

  const handleView = async (docId: string) => {
    const url = await memberDocs.getSignedUrl(docId)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const isLoading = reqDocs.loading || memberDocs.loading || compliance.loading

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Documents</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configurez les pièces requises, validez les soumissions et suivez la conformité des membres.
        </p>
      </div>

      {/* Sub-tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-2xl max-w-sm">
        {TABS.map(({ id, label, badge, tone }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleTabChange(id)}
            className={cn(
              'relative py-2 rounded-xl text-xs font-bold transition-all active:scale-95',
              activeTab === id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
            {badge != null && badge > 0 && (
              <span className={cn(
                'absolute top-1 right-2 min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center',
                tone === 'danger' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground',
              )}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Global loader */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Content */}
      {!isLoading && activeTab === 'settings' && (
        <TabSettings
          docs={requiredDocs}
          onAdd={(d) => void reqDocs.create({
            name:                d.name,
            description:         d.description || undefined,
            required:            d.required,
            category:            d.category,
            expiresAfterMonths:  d.expires_after_months,
          })}
          onToggle={(id) => {
            const doc = requiredDocs.find((d) => d.id === id)
            if (doc) { void reqDocs.update(id, { required: !doc.required }) }
          }}
          onDelete={(id) => void reqDocs.remove(id)}
        />
      )}
      {!isLoading && activeTab === 'review' && (
        <TabToReview
          docs={memberDocs.views}
          onValidate={(id) => void memberDocs.review(id, 'approve')}
          onReject={(id, reason) => void memberDocs.review(id, 'reject', reason)}
          onView={handleView}
        />
      )}
      {!isLoading && activeTab === 'compliance' && (
        <TabCompliance members={compliance.views} />
      )}
    </div>
  )
}

const ProtectedAdminDocumentsPage: React.FC = () => (
  <RoleBasedRoute allowedRoles={['club_owner', 'club_manager']}>
    <AdminDocumentsPage />
  </RoleBasedRoute>
)

export default ProtectedAdminDocumentsPage
